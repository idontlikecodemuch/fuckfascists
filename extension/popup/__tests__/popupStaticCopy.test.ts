import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { extCopy } from '../../copy';

const html = readFileSync(resolve(__dirname, '../popup.html'), 'utf8');
const renderCardSource = readFileSync(resolve(__dirname, '../renderCard.ts'), 'utf8');
const normalizedHtml = html.replace(/\s+/g, ' ');

describe('extension popup static copy', () => {
  it('keeps HTML fallbacks aligned with extCopy', () => {
    expect(html).toContain(`<title>${extCopy.appName}</title>`);
    expect(html).toContain(`<span class="app-title">${extCopy.appName}</span>`);
    expect(html).toContain(extCopy.cleanState);
    expect(html).toContain(extCopy.donationUnavail);
    expect(normalizedHtml).toContain(`> ${extCopy.avoidBtn} <`);
    expect(html).toContain(extCopy.snoozeBtn);
    expect(html).toContain(extCopy.avoidedTitle);
    expect(html).toContain(extCopy.avoidedSub);
    expect(html).toContain(extCopy.weeklyTitle);
    expect(html).toContain(extCopy.weeklyBiz);
    expect(html).toContain(extCopy.weeklyPlat);
  });

  it('does not reintroduce stale popup defaults', () => {
    expect(html).not.toContain('No flagged entities detected on this page.');
    expect(html).not.toContain('Donation data temporarily unavailable.');
    expect(html).not.toContain('★ AVOIDED');
    expect(html).not.toContain('This one counts.');
  });

  it('does not render dynamic extension data through innerHTML', () => {
    expect(renderCardSource).not.toContain('.innerHTML');
  });
});
