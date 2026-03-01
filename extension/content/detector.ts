/**
 * Content script — runs at document_idle on every page.
 *
 * Extracts the current hostname and sends it to the service worker for
 * domain lookup. The content script itself stores nothing — all state lives
 * in the service worker's session store or chrome.storage.local.
 *
 * The tab ID is not available directly in content scripts; the service worker
 * reads it from the message sender object. We include it here for type safety
 * when the message contract is read in isolation, but the SW always uses
 * sender.tab.id as the authoritative source.
 */

import type { CheckDomainMsg } from '../types';

const hostname = location.hostname;
if (hostname) {
  const msg: CheckDomainMsg = {
    type: 'CHECK_DOMAIN',
    hostname,
    tabId: -1, // service worker overwrites with sender.tab.id
  };

  chrome.runtime.sendMessage(msg).catch(() => {
    // SW may not be awake yet — silently ignore. The SW wakes on the next user
    // interaction (popup open), so no flag is missed in practice.
  });
}
