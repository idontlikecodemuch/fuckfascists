import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { appleJwt, hasAppleConfig } from './auth.mjs';
import { ensureDir, filterSince, includedMap, redactEmail, related } from './common.mjs';

const API = 'https://api.appstoreconnect.apple.com/v1';

export { hasAppleConfig };

export async function pullAppleFeedback({ env, args, outDir }) {
  const appId = args['apple-app-id'] || env.APP_STORE_CONNECT_APP_ID || env.ASC_APP_ID || env.TESTFLIGHT_APP_ID;
  if (!appId) throw new Error('Missing APP_STORE_CONNECT_APP_ID / ASC_APP_ID / TESTFLIGHT_APP_ID.');
  const token = await appleJwt(env);
  const records = [];

  if (args['apple-screenshots'] !== false) {
    const screenshots = await listScreenshotFeedback(appId, token, args);
    records.push(...await normalizeScreenshotFeedback(screenshots, token, outDir, args));
  }
  if (args['apple-crashes'] !== false) {
    const crashes = await listCrashFeedback(appId, token, args);
    records.push(...await normalizeCrashFeedback(crashes, token, outDir, args));
  }

  return filterSince(records, args.since);
}

async function listScreenshotFeedback(appId, token, args) {
  const params = {
    include: 'build,tester',
    limit: String(Math.min(Number(args.limit || 200), 200)),
    sort: args.sort || '-createdDate',
    'fields[betaFeedbackScreenshotSubmissions]': [
      'createdDate', 'comment', 'email', 'deviceModel', 'osVersion', 'locale',
      'timeZone', 'architecture', 'connectionType', 'pairedAppleWatch',
      'appUptimeInMilliseconds', 'diskBytesAvailable', 'diskBytesTotal',
      'batteryPercentage', 'screenWidthInPoints', 'screenHeightInPoints',
      'appPlatform', 'devicePlatform', 'deviceFamily', 'buildBundleId',
      'screenshots', 'build', 'tester',
    ].join(','),
    'fields[builds]': 'version,uploadedDate,expirationDate,expired,processingState,buildAudienceType',
    'fields[betaTesters]': 'firstName,lastName,email,inviteType,state',
  };
  if (args['apple-filter-build']) params['filter[build]'] = args['apple-filter-build'];
  if (args['apple-filter-os']) params['filter[osVersion]'] = args['apple-filter-os'];
  return apiPages(`${API}/apps/${appId}/betaFeedbackScreenshotSubmissions`, params, token);
}

async function listCrashFeedback(appId, token, args) {
  const ids = await apiPages(`${API}/apps/${appId}/relationships/betaFeedbackCrashSubmissions`, {
    limit: String(Math.min(Number(args.limit || 200), 200)),
  }, token);
  const rows = [];
  for (const item of ids.data) {
    const params = {
      include: 'build,tester',
      'fields[betaFeedbackCrashSubmissions]': [
        'createdDate', 'comment', 'email', 'deviceModel', 'osVersion', 'locale',
        'timeZone', 'architecture', 'connectionType', 'pairedAppleWatch',
        'appUptimeInMilliseconds', 'diskBytesAvailable', 'diskBytesTotal',
        'batteryPercentage', 'screenWidthInPoints', 'screenHeightInPoints',
        'appPlatform', 'devicePlatform', 'deviceFamily', 'buildBundleId',
        'crashLog', 'build', 'tester',
      ].join(','),
      'fields[builds]': 'version,uploadedDate,expirationDate,expired,processingState,buildAudienceType',
      'fields[betaTesters]': 'firstName,lastName,email,inviteType,state',
    };
    rows.push(await apiJson(`${API}/betaFeedbackCrashSubmissions/${item.id}`, params, token));
  }
  return {
    data: rows.map((r) => r.data).filter(Boolean),
    included: rows.flatMap((r) => r.included || []),
  };
}

async function normalizeScreenshotFeedback(response, token, outDir, args) {
  const included = includedMap(response.included || []);
  const records = [];
  for (const item of response.data || []) {
    const attrs = item.attributes || {};
    const build = related(included, item.relationships?.build);
    const tester = related(included, item.relationships?.tester);
    const attachments = await screenshotAttachments(item.id, attrs.screenshots || [], token, outDir, args);
    records.push(baseAppleRecord({
      item,
      attrs,
      build,
      tester,
      kind: 'screenshot-feedback',
      attachments,
      includeRaw: args.raw !== false,
    }));
  }
  return records;
}

async function normalizeCrashFeedback(response, token, outDir, args) {
  const included = includedMap(response.included || []);
  const records = [];
  for (const item of response.data || []) {
    const attrs = item.attributes || {};
    const build = related(included, item.relationships?.build);
    const tester = related(included, item.relationships?.tester);
    const attachments = [];
    if (args['download-crash-logs']) {
      const logPath = await downloadCrashLog(item.id, token, outDir);
      if (logPath) attachments.push({ kind: 'crash-log', path: logPath });
    }
    records.push(baseAppleRecord({
      item,
      attrs,
      build,
      tester,
      kind: 'crash-feedback',
      attachments,
      includeRaw: args.raw !== false,
    }));
  }
  return records;
}

function baseAppleRecord({ item, attrs, build, tester, kind, attachments, includeRaw }) {
  return {
    id: `testflight:${kind}:${item.id}`,
    source: 'testflight',
    kind,
    createdAt: attrs.createdDate || null,
    comment: attrs.comment || null,
    appVersion: build?.attributes?.version || null,
    buildVersion: build?.attributes?.version || null,
    platform: attrs.appPlatform || attrs.devicePlatform || 'IOS',
    device: {
      model: attrs.deviceModel || null,
      osVersion: attrs.osVersion || null,
      family: attrs.deviceFamily || null,
      architecture: attrs.architecture || null,
      screenWidth: attrs.screenWidthInPoints || null,
      screenHeight: attrs.screenHeightInPoints || null,
    },
    tester: {
      email: redactEmail(attrs.email || tester?.attributes?.email),
      inviteType: tester?.attributes?.inviteType || null,
      state: tester?.attributes?.state || null,
    },
    diagnostics: {
      appUptimeInMilliseconds: attrs.appUptimeInMilliseconds || null,
      batteryPercentage: attrs.batteryPercentage || null,
      diskBytesAvailable: attrs.diskBytesAvailable || null,
      diskBytesTotal: attrs.diskBytesTotal || null,
      connectionType: attrs.connectionType || null,
      locale: attrs.locale || null,
      timeZone: attrs.timeZone || null,
    },
    attachments,
    raw: includeRaw ? item : undefined,
  };
}

async function screenshotAttachments(id, screenshots, token, outDir, args) {
  const attachments = [];
  for (let i = 0; i < screenshots.length; i++) {
    const url = imageUrl(screenshots[i]);
    if (!url) {
      attachments.push({ kind: 'screenshot', metadata: screenshots[i] });
      continue;
    }
    if (!args['download-screenshots']) {
      attachments.push({ kind: 'screenshot', url });
      continue;
    }
    const file = path.join(outDir, 'screenshots', `${id}-${i + 1}.jpg`);
    await downloadFile(url, token, file);
    attachments.push({ kind: 'screenshot', path: path.relative(outDir, file) });
  }
  return attachments;
}

function imageUrl(screenshot) {
  const asset = screenshot?.imageAsset || screenshot?.attributes?.imageAsset || screenshot;
  const template = asset?.templateUrl || asset?.url;
  if (!template) return null;
  return template
    .replace(/\{w\}/g, String(asset.width || 1284))
    .replace(/\{h\}/g, String(asset.height || 2778))
    .replace(/\{f\}/g, 'jpg');
}

async function downloadCrashLog(id, token, outDir) {
  const res = await apiJson(`${API}/betaFeedbackCrashSubmissions/${id}/crashLog`, {
    'fields[betaCrashLogs]': 'logText',
  }, token);
  const logText = res.data?.attributes?.logText;
  if (!logText) return null;
  const file = path.join(outDir, 'crashlogs', `${id}.crash`);
  await ensureDir(path.dirname(file));
  await writeFile(file, logText);
  return path.relative(outDir, file);
}

async function downloadFile(url, token, file) {
  let res = await fetch(url, { headers: { authorization: `Bearer ${token}` } });
  if (res.status === 401 || res.status === 403) res = await fetch(url);
  if (!res.ok) throw new Error(`Apple asset download failed (${res.status}) ${url}`);
  await ensureDir(path.dirname(file));
  await writeFile(file, Buffer.from(await res.arrayBuffer()));
}

async function apiPages(url, params, token) {
  const data = [];
  const included = [];
  let next = withParams(url, params);
  while (next) {
    const json = await apiJson(next, null, token);
    data.push(...(json.data || []));
    included.push(...(json.included || []));
    next = json.links?.next || null;
  }
  return { data, included };
}

async function apiJson(url, params, token) {
  const res = await fetch(params ? withParams(url, params) : url, {
    headers: { authorization: `Bearer ${token}`, accept: 'application/json' },
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(`Apple API failed (${res.status}): ${text}`);
  return json;
}

function withParams(url, params) {
  if (!params) return url;
  const parsed = new URL(url);
  for (const [key, value] of Object.entries(params)) parsed.searchParams.set(key, value);
  return parsed.toString();
}
