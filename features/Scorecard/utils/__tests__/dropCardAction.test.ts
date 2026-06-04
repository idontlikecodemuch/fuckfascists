import { getDropCardAction } from '../dropCardAction';

const base = {
  hasDropped: true,
  dropDataLoading: false,
  existingCardUri: null,
  dropGrandTotal: 0,
  minAvoids: 1,
};

describe('getDropCardAction', () => {
  it('loads an existing archived drop card before treating purged raw data as empty', () => {
    expect(getDropCardAction({
      ...base,
      existingCardUri: 'file://scorecards/Those-I-FCKd-May-30-26.jpg',
      dropGrandTotal: 0,
    })).toBe('load-existing');
  });

  it('captures when the scored week still has enough raw avoid data', () => {
    expect(getDropCardAction({
      ...base,
      dropGrandTotal: 3,
    })).toBe('capture');
  });

  it('cancels the pending drop only when no card exists and the scored week is empty', () => {
    expect(getDropCardAction(base)).toBe('cancel-empty');
  });
});
