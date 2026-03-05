import {
  makeFecCommitteeUrl,
  formatDonationAmount,
  formatActiveCycles,
  formatCycleLabel,
} from '../cache';

describe('makeFecCommitteeUrl', () => {
  it('builds the correct FEC committee URL', () => {
    expect(makeFecCommitteeUrl('C00000059')).toBe('https://www.fec.gov/data/committee/C00000059/');
  });
});

describe('formatDonationAmount', () => {
  it('formats millions with one decimal', () => {
    expect(formatDonationAmount(1_200_000)).toBe('$1.2M');
  });

  it('formats thousands rounded', () => {
    expect(formatDonationAmount(380_000)).toBe('$380K');
  });

  it('formats sub-thousand with locale string', () => {
    expect(formatDonationAmount(500)).toBe('$500');
  });
});

describe('formatActiveCycles', () => {
  it('joins cycles with commas', () => {
    expect(formatActiveCycles([2016, 2018, 2020, 2022, 2024])).toBe('2016, 2018, 2020, 2022, 2024');
  });

  it('returns empty string for empty array', () => {
    expect(formatActiveCycles([])).toBe('');
  });
});

describe('formatCycleLabel', () => {
  it('formats 2024 as "2023–24"', () => {
    expect(formatCycleLabel(2024)).toBe('2023–24');
  });

  it('formats 2022 as "2021–22"', () => {
    expect(formatCycleLabel(2022)).toBe('2021–22');
  });

  it('formats 2016 as "2015–16"', () => {
    expect(formatCycleLabel(2016)).toBe('2015–16');
  });

  it('formats 2020 as "2019–20"', () => {
    expect(formatCycleLabel(2020)).toBe('2019–20');
  });
});
