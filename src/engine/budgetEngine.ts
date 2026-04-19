import { FinancialProfile } from '../db/schema';

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

export function computeCascade(profile: FinancialProfile): BudgetCascade {
  const fixedTotal = profile.fixedExpenses.reduce((s, e) => s + e.amount, 0);
  const savingsLocked = profile.savingsGoal.lockedIn
    ? profile.savingsGoal.monthlyContribution
    : 0;
  const spendable = profile.monthlyIncome - fixedTotal - savingsLocked;

  return {
    income:        profile.monthlyIncome,
    fixedTotal,
    savingsLocked,
    spendable,
    weeklyBudget:  Math.round(spendable / 4.33),
    dailyBudget:   Math.round(spendable / 30),
  };
}

export function computeWeeklyState(
  cascade: BudgetCascade,
  spentThisWeek: number,
): WeeklyState {
  const today = new Date().getDay();            // 0 = Sunday
  // If we consider Monday as start of week, logic might differ. 
  // Let's assume standard Sunday=0. Days left in week (including today): 
  // Sun(0): 7, Mon(1): 6, Tue(2): 5, Wed(3): 4, Thu(4): 3, Fri(5): 2, Sat(6): 1
  const daysLeft = 7 - today;

  return {
    cascade,
    spentThisWeek,
    remaining:      cascade.weeklyBudget - spentThisWeek,
    daysLeft,
    suggestedDaily: Math.round((cascade.weeklyBudget - spentThisWeek) / daysLeft),
  };
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
