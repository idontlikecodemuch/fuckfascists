import type { BarcodeNotice } from '../hooks/useBarcodeSearch';
import { mapCopy } from '../../../copy/map';
import { theme } from '../../../design/tokens';

export interface BarcodeToastPresentation {
  title: string;
  /** Optional split title treatment: cyan subject + yellow status. */
  titleSubject?: string;
  titleStatus?: string;
  body: string;
  icon: 'scan-outline' | 'document-outline' | 'cloud-offline-outline' | 'cube-outline';
  color: string;
}

export function getBarcodeToastPresentation(notice: BarcodeNotice): BarcodeToastPresentation {
  switch (notice.kind) {
    case 'unsupported':
      return {
        title: mapCopy.barcodeUnsupportedTitle,
        body: mapCopy.barcodeUnsupportedBody,
        icon: 'scan-outline',
        color: theme.colors.rewardYellow,
      };
    case 'not_in_database':
      return {
        title: mapCopy.barcodeNotInDatabaseTitle,
        body: mapCopy.barcodeNotInDatabaseBody,
        icon: 'document-outline',
        color: theme.colors.highlightBlue,
      };
    case 'lookup_unavailable':
      return {
        title: mapCopy.barcodeLookupFailedTitle,
        body: mapCopy.barcodeLookupFailedBody,
        icon: 'cloud-offline-outline',
        color: theme.colors.dangerRed,
      };
    case 'no_match':
    default:
      const productName = notice.productName?.trim() || notice.label;
      return {
        title: mapCopy.barcodeNoMatchTitle(productName),
        titleSubject: productName.toUpperCase(),
        titleStatus: ' FOUND',
        body: mapCopy.barcodeNoMatchBody(notice.parentCompanyName),
        icon: 'cube-outline',
        color: theme.colors.successGreen,
      };
  }
}
