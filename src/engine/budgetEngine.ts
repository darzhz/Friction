import { getDaysInMonth, startOfWeek, isSameDay, isWithinInterval, endOfWeek } from 'date-fns';
import { FinancialProfile, Transaction } from '../db/schema';

export type BudgetStatus = 'safe' | 'warning' | 'over';

export interface BudgetCascade {
  income:          number;
  fixedTotal:      number;
  savingsLocked:   number;
  spendable:       number;   // income - fixed - savings
  weeklyBudget:    number;
  dailyBudget:     number;
}

export interface WeeklyState {
  cascade:         BudgetCascade;
  spentThisWeek:   number;
  remaining:       number;
  daysLeft:        number;
  suggestedDaily:  number;   // remaining / daysLeft — pace indicator
}

export interface SpendImpact {
  remaining: number;
  afterSpend: number;
  percentOfWeekly: number;
  status: BudgetStatus;
  frictionDelay: number; // ms, 0 for safe, 3000 for over
}

export function computeCascade(profile: FinancialProfile, date: Date = new Date()): BudgetCascade {
  const fixedTotal = profile.fixedExpenses.reduce((s, e) => s + e.amount, 0);
  const savingsLocked = profile.savingsGoal.lockedIn
    ? profile.savingsGoal.monthlyContribution
    : 0;
  const spendable = profile.monthlyIncome - fixedTotal - savingsLocked;

  const daysInMonth = getDaysInMonth(date);

  return {
    income:        profile.monthlyIncome,
    fixedTotal,
    savingsLocked,
    spendable,
    weeklyBudget:  Math.round((spendable * 7) / daysInMonth),
    dailyBudget:   Math.round(spendable / daysInMonth),
  };
}

export function computeWeeklyState(
  cascade: BudgetCascade,
  spentThisWeek: number,
  date: Date = new Date()
): WeeklyState {
  const end = endOfWeek(date, { weekStartsOn: 1 }); // Assuming Monday start
  const today = date;
  
  // Calculate days left in week (including today)
  const msInDay = 24 * 60 * 60 * 1000;
  const daysLeft = Math.ceil((end.getTime() - today.getTime() + 1) / msInDay);

  return {
    cascade,
    spentThisWeek,
    remaining:      cascade.weeklyBudget - spentThisWeek,
    daysLeft:       Math.max(1, daysLeft),
    suggestedDaily: Math.round((cascade.weeklyBudget - spentThisWeek) / Math.max(1, daysLeft)),
  };
}

/**
 * Filters transactions to only include those in the current week.
 */
export function getTransactionsThisWeek(transactions: Transaction[], date: Date = new Date()): Transaction[] {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });

  return transactions.filter(t => {
    const txDate = new Date(t.timestamp);
    return t.confirmed && isWithinInterval(txDate, { start, end });
  });
}

/**
 * Filters transactions to only include those from today.
 */
export function getTransactionsToday(transactions: Transaction[], date: Date = new Date()): Transaction[] {
  return transactions.filter(t => {
    const txDate = new Date(t.timestamp);
    return t.confirmed && isSameDay(txDate, date);
  });
}

/**
 * Computes the impact of a potential spend on the weekly budget.
 */
export function computeSpendImpact(
  amount: number,
  spentThisWeek: number,
  weeklyLimit: number
): SpendImpact {
  const remaining = weeklyLimit - spentThisWeek;
  const afterSpend = remaining - amount;
  const percentOfWeekly = weeklyLimit > 0 ? Math.round((amount / weeklyLimit) * 100) : 0;

  let status: BudgetStatus = 'safe';
  if (afterSpend < 0) {
    status = 'over';
  } else if (afterSpend < weeklyLimit * 0.15) {
    status = 'warning';
  }

  return {
    remaining,
    afterSpend,
    percentOfWeekly,
    status,
    frictionDelay: status === 'over' ? 3000 : 0,
  };
}
