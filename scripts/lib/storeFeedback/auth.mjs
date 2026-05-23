import { readFile } from 'node:fs/promises';
import { createSign } from 'node:crypto';

export function base64url(input) {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(String(input));
  return buffer
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function jwtEncode(header, payload, signer) {
  const head = base64url(JSON.stringify(header));
  const body = base64url(JSON.stringify(payload));
  const signingInput = `${head}.${body}`;
  return `${signingInput}.${base64url(signer(signingInput))}`;
}

function derToJose(signature) {
  let offset = 0;
  if (signature[offset++] !== 0x30) throw new Error('Invalid ECDSA signature');
  const sequenceLength = signature[offset++];
  if (sequenceLength + 2 !== signature.length) throw new Error('Invalid ECDSA sequence length');
  if (signature[offset++] !== 0x02) throw new Error('Invalid ECDSA r marker');
  const rLength = signature[offset++];
  const r = signature.subarray(offset, offset + rLength);
  offset += rLength;
  if (signature[offset++] !== 0x02) throw new Error('Invalid ECDSA s marker');
  const sLength = signature[offset++];
  const s = signature.subarray(offset, offset + sLength);

  return Buffer.concat([normalizeEcInt(r), normalizeEcInt(s)]);
}

function normalizeEcInt(bytes) {
  let value = bytes;
  while (value.length > 32 && value[0] === 0) value = value.subarray(1);
  if (value.length > 32) throw new Error('Invalid ES256 integer length');
  if (value.length === 32) return value;
  return Buffer.concat([Buffer.alloc(32 - value.length), value]);
}

async function readSecret(env, names) {
  for (const name of names) {
    const value = env[name];
    if (value) return value;
  }
  return null;
}

export function hasAppleConfig(env) {
  return Boolean(
    (env.APP_STORE_CONNECT_KEY_ID || env.ASC_KEY_ID) &&
    (env.APP_STORE_CONNECT_ISSUER_ID || env.ASC_ISSUER_ID) &&
    (
      env.APP_STORE_CONNECT_PRIVATE_KEY ||
      env.APP_STORE_CONNECT_PRIVATE_KEY_BASE64 ||
      env.APP_STORE_CONNECT_PRIVATE_KEY_PATH ||
      env.ASC_PRIVATE_KEY_PATH
    )
  );
}

export async function appleJwt(env) {
  const keyId = await readSecret(env, ['APP_STORE_CONNECT_KEY_ID', 'ASC_KEY_ID']);
  const issuerId = await readSecret(env, ['APP_STORE_CONNECT_ISSUER_ID', 'ASC_ISSUER_ID']);
  const privateKey = await applePrivateKey(env);
  if (!keyId || !issuerId || !privateKey) {
    throw new Error('Missing App Store Connect credentials. See docs/STORE_FEEDBACK_AUTOMATION.md.');
  }

  const now = Math.floor(Date.now() / 1000);
  return jwtEncode(
    { alg: 'ES256', kid: keyId, typ: 'JWT' },
    { iss: issuerId, iat: now - 30, exp: now + 20 * 60, aud: 'appstoreconnect-v1' },
    (input) => {
      const sign = createSign('sha256');
      sign.update(input);
      sign.end();
      return derToJose(sign.sign(privateKey));
    },
  );
}

async function applePrivateKey(env) {
  if (env.APP_STORE_CONNECT_PRIVATE_KEY) {
    return env.APP_STORE_CONNECT_PRIVATE_KEY.replace(/\\n/g, '\n');
  }
  if (env.APP_STORE_CONNECT_PRIVATE_KEY_BASE64) {
    return Buffer.from(env.APP_STORE_CONNECT_PRIVATE_KEY_BASE64, 'base64').toString('utf8');
  }
  const keyPath = env.APP_STORE_CONNECT_PRIVATE_KEY_PATH || env.ASC_PRIVATE_KEY_PATH;
  return keyPath ? readFile(keyPath, 'utf8') : null;
}

export function hasGoogleConfig(env) {
  return Boolean(
    (env.GOOGLE_PLAY_PACKAGE_NAME || env.ANDROID_PACKAGE_NAME) &&
    (env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON || env.GOOGLE_PLAY_SERVICE_ACCOUNT_KEY_PATH || env.GOOGLE_APPLICATION_CREDENTIALS)
  );
}

export async function googleAccessToken(env, scopes) {
  const account = await googleServiceAccount(env);
  if (!account.client_email || !account.private_key) {
    throw new Error('Google service account JSON must include client_email and private_key.');
  }
  const now = Math.floor(Date.now() / 1000);
  const assertion = jwtEncode(
    { alg: 'RS256', typ: 'JWT' },
    {
      iss: account.client_email,
      scope: scopes.join(' '),
      aud: 'https://oauth2.googleapis.com/token',
      iat: now - 30,
      exp: now + 60 * 60,
    },
    (input) => {
      const sign = createSign('RSA-SHA256');
      sign.update(input);
      sign.end();
      return sign.sign(account.private_key);
    },
  );

  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion,
  });
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Google OAuth failed (${res.status}): ${JSON.stringify(json)}`);
  return json.access_token;
}

async function googleServiceAccount(env) {
  if (env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON);
  }
  const keyPath = env.GOOGLE_PLAY_SERVICE_ACCOUNT_KEY_PATH || env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!keyPath) throw new Error('Missing Google Play service account key path.');
  return JSON.parse(await readFile(keyPath, 'utf8'));
}
