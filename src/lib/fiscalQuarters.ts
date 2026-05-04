/**
 * Fiscal Quarter Utilities
 * Fiscal year starts in July:
 *   Q1 = Jul–Sep, Q2 = Oct–Dec, Q3 = Jan–Mar, Q4 = Apr–Jun
 */

export type FiscalQuarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export function getFiscalQuarterMonths(quarter: FiscalQuarter): number[] {
  switch (quarter) {
    case 'Q1': return [7, 8, 9];
    case 'Q2': return [10, 11, 12];
    case 'Q3': return [1, 2, 3];
    case 'Q4': return [4, 5, 6];
  }
}

export function getCurrentFiscalQuarter(): FiscalQuarter {
  const month = new Date().getMonth() + 1;
  if (month >= 7 && month <= 9) return 'Q1';
  if (month >= 10 && month <= 12) return 'Q2';
  if (month >= 1 && month <= 3) return 'Q3';
  return 'Q4';
}

export function getQuarterLabel(quarter: FiscalQuarter): string {
  switch (quarter) {
    case 'Q1': return 'Q1 (Jul – Sep)';
    case 'Q2': return 'Q2 (Oct – Dec)';
    case 'Q3': return 'Q3 (Jan – Mar)';
    case 'Q4': return 'Q4 (Apr – Jun)';
  }
}

export function getQuarterShortLabel(quarter: FiscalQuarter): string {
  switch (quarter) {
    case 'Q1': return 'Jul–Sep';
    case 'Q2': return 'Oct–Dec';
    case 'Q3': return 'Jan–Mar';
    case 'Q4': return 'Apr–Jun';
  }
}

export function getCurrentFiscalYear(): number {
  const now = new Date();
  const month = now.getMonth() + 1;
  // If Jul-Dec, FY is current year. If Jan-Jun, FY started last year.
  return month >= 7 ? now.getFullYear() : now.getFullYear() - 1;
}

/**
 * Returns the start and end date strings (YYYY-MM-DD) for a given fiscal quarter
 * in the current fiscal year.
 */
export function getQuarterDateRange(quarter: FiscalQuarter): { start: string; end: string } {
  const fiscalYear = getCurrentFiscalYear();
  const months = getFiscalQuarterMonths(quarter);

  // Q1/Q2 are in the fiscal start year, Q3/Q4 are in fiscal start year + 1
  const calendarYear = (quarter === 'Q1' || quarter === 'Q2') ? fiscalYear : fiscalYear + 1;

  const startMonth = months[0];
  const endMonth = months[months.length - 1];
  const lastDay = new Date(calendarYear, endMonth, 0).getDate();

  const start = `${calendarYear}-${String(startMonth).padStart(2, '0')}-01`;
  const end = `${calendarYear}-${String(endMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  return { start, end };
}

/**
 * Filter ratings by a fiscal quarter. Returns ratings whose date_received
 * falls within the quarter's months in the current fiscal year.
 */
export function filterRatingsByQuarter<T extends { date_received: string }>(
  ratings: T[],
  quarter: FiscalQuarter
): T[] {
  const months = getFiscalQuarterMonths(quarter);
  const fiscalYear = getCurrentFiscalYear();
  const calendarYear = (quarter === 'Q1' || quarter === 'Q2') ? fiscalYear : fiscalYear + 1;

  return ratings.filter(r => {
    const [rYear, rMonth] = r.date_received.split('-').map(Number);
    return rYear === calendarYear && months.includes(rMonth);
  });
}
