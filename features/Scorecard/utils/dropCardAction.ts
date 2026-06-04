export type DropCardAction = 'idle' | 'load-existing' | 'capture' | 'cancel-empty';

interface DropCardActionInput {
  hasDropped: boolean;
  dropDataLoading: boolean;
  existingCardUri: string | null;
  dropGrandTotal: number | null;
  minAvoids: number;
}

export function getDropCardAction({
  hasDropped,
  dropDataLoading,
  existingCardUri,
  dropGrandTotal,
  minAvoids,
}: DropCardActionInput): DropCardAction {
  if (!hasDropped || dropDataLoading) return 'idle';
  if (existingCardUri) return 'load-existing';
  if (dropGrandTotal == null) return 'idle';
  return dropGrandTotal >= minAvoids ? 'capture' : 'cancel-empty';
}
