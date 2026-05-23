import { googleAccessToken, hasGoogleConfig } from './auth.mjs';
import { filterSince } from './common.mjs';

const ANDROID_PUBLISHER_SCOPE = 'https://www.googleapis.com/auth/androidpublisher';
const API = 'https://androidpublisher.googleapis.com/androidpublisher/v3';

export { hasGoogleConfig };

export async function pullGooglePlayFeedback({ env, args }) {
  const packageName = args['google-package'] || env.GOOGLE_PLAY_PACKAGE_NAME || env.ANDROID_PACKAGE_NAME;
  if (!packageName) throw new Error('Missing GOOGLE_PLAY_PACKAGE_NAME / ANDROID_PACKAGE_NAME.');
  const token = await googleAccessToken(env, [ANDROID_PUBLISHER_SCOPE]);
  const reviews = await listReviews(packageName, token, args);
  return filterSince(reviews.map((review) => normalizeReview(review, packageName, args)), args.since);
}

async function listReviews(packageName, token, args) {
  const rows = [];
  let pageToken = args['google-page-token'] || null;
  const maxResults = String(Math.min(Number(args.limit || 100), 100));

  do {
    const url = new URL(`${API}/applications/${encodeURIComponent(packageName)}/reviews`);
    url.searchParams.set('maxResults', maxResults);
    if (pageToken) url.searchParams.set('token', pageToken);
    if (args.translation) url.searchParams.set('translationLanguage', args.translation);

    const res = await fetch(url, {
      headers: { authorization: `Bearer ${token}`, accept: 'application/json' },
    });
    const text = await res.text();
    const json = text ? JSON.parse(text) : {};
    if (!res.ok) throw new Error(`Google Play reviews failed (${res.status}): ${text}`);
    rows.push(...(json.reviews || []));
    pageToken = json.tokenPagination?.nextPageToken || null;
  } while (pageToken && args['all-pages']);

  return rows;
}

function normalizeReview(review, packageName, args) {
  const comments = review.comments || [];
  const latestUserComment = [...comments].reverse().find((comment) => comment.userComment)?.userComment || {};
  const timestamp = latestUserComment.lastModified
    ? new Date(Number(latestUserComment.lastModified.seconds || 0) * 1000).toISOString()
    : null;

  return {
    id: `google-play:review:${review.reviewId}`,
    source: 'google-play',
    kind: 'production-review',
    createdAt: timestamp,
    packageName,
    comment: latestUserComment.text || null,
    rating: latestUserComment.starRating || null,
    appVersion: latestUserComment.appVersionName || null,
    buildVersion: latestUserComment.appVersionCode ? String(latestUserComment.appVersionCode) : null,
    platform: 'ANDROID',
    device: {
      model: latestUserComment.device || null,
      osVersion: latestUserComment.androidOsVersion ? String(latestUserComment.androidOsVersion) : null,
      manufacturer: latestUserComment.deviceMetadata?.manufacturer || null,
      productName: latestUserComment.deviceMetadata?.productName || null,
      ramMb: latestUserComment.deviceMetadata?.ramMb || null,
      screenDensityDpi: latestUserComment.deviceMetadata?.screenDensityDpi || null,
    },
    tester: {
      email: null,
      displayName: args['include-google-author'] ? review.authorName || null : null,
    },
    attachments: [],
    raw: args.raw !== false ? review : undefined,
  };
}
