import { getBarcodeToastPresentation } from '../barcodeToastPresentation';

describe('getBarcodeToastPresentation', () => {
  it.each([
    ['unsupported', 'TRY THAT AGAIN', 'No UPC read. Back up and hold steady.', 'scan-outline'],
    ['not_in_database', 'UPC NOT ON FILE', 'No product record yet. Coverage is growing.', 'document-outline'],
    ['lookup_unavailable', 'LOOKUP PAUSED', 'Couldn’t reach product data. Try again shortly.', 'cloud-offline-outline'],
  ] as const)('maps %s to its approved copy and icon', (kind, title, body, icon) => {
    expect(getBarcodeToastPresentation({ kind, label: '012345678905' })).toMatchObject({
      title,
      body,
      icon,
    });
  });

  it('uses the scanned product label in the found title', () => {
    expect(getBarcodeToastPresentation({
      kind: 'no_match',
      label: 'Kirkland Signature Organic Extra Virgin Olive Oil',
      productName: 'Kirkland Signature Organic Extra Virgin Olive Oil',
      parentCompanyName: 'Costco Wholesale',
    })).toMatchObject({
      title: 'KIRKLAND SIGNATURE ORGANIC EXTRA VIRGIN OLIVE OIL FOUND',
      titleSubject: 'KIRKLAND SIGNATURE ORGANIC EXTRA VIRGIN OLIVE OIL',
      titleStatus: ' FOUND',
      body: 'Costco Wholesale not matched to FEC records yet.',
      icon: 'cube-outline',
    });
  });

  it('falls back to a generic parent-company line when no owner candidate exists', () => {
    expect(getBarcodeToastPresentation({
      kind: 'no_match',
      label: 'Sea Salt Crackers',
      productName: 'Sea Salt Crackers',
    }).body).toBe('Parent company not matched to FEC records yet.');
  });
});
