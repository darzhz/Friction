import { differenceInMonths } from 'date-fns';

/**
 * Computes the required monthly contribution to reach a target amount by a target date.
 */
export function computeMonthlyContribution(
  targetAmount: number,
  alreadySaved: number,
  targetDate?: number, // timestamp
): number {
  const remaining = targetAmount - alreadySaved;
  if (remaining <= 0) return 0;

  const monthsLeft = targetDate
    ? Math.max(1, differenceInMonths(new Date(targetDate), new Date()))
    : 12; // default to 1 year if no date

  return Math.ceil(remaining / monthsLeft);
}

export type SavingsStatus = 'on_track' | 'behind' | 'ahead';

export interface SavingsProgress {
  percent: number;
  status: SavingsStatus;
}

/**
 * Calculates progress and status for a savings goal.
 */
export function savingsProgress(
  targetAmount: number,
  alreadySaved: number,
): SavingsProgress {
  if (targetAmount === 0) return { percent: 100, status: 'on_track' };
  const percent = Math.round((alreadySaved / targetAmount) * 100);
  
  // Basic status for now, can be expanded with pace logic
  return { 
    percent: Math.min(100, percent), 
    status: 'on_track' 
  };
}
