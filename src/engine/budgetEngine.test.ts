import { describe, it, expect } from 'vitest';
import { computeSpendImpact, computeCascade, computeWeeklyState } from './budgetEngine';
import { FinancialProfile } from '../db/schema';

describe('budgetEngine', () => {
  const weeklyLimit = 1000;

  it('should return safe status when well within budget', () => {
    const impact = computeSpendImpact(100, 200, weeklyLimit);
    expect(impact.status).toBe('safe');
    expect(impact.remaining).toBe(800);
    expect(impact.afterSpend).toBe(700);
    expect(impact.frictionDelay).toBe(0);
  });

  describe('computeCascade', () => {
    it('should compute spendable income correctly', () => {
      const profile: FinancialProfile = {
        monthlyIncome: 50000,
        incomeDay: 1,
        savingsGoal: {
          targetAmount: 100000,
          targetLabel: 'Goal',
          monthlyContribution: 5000,
          lockedIn: true,
        },
        fixedExpenses: [
          { id: '1', label: 'Rent', amount: 15000, dueDay: 1, category: 'rent', autoPaid: true },
          { id: '2', label: 'Internet', amount: 1000, dueDay: 5, category: 'utility', autoPaid: false },
        ],
        variableCategories: [],
        computed: { income: 0, fixedTotal: 0, savingsLocked: 0, spendable: 0, weeklyBudget: 0, dailyBudget: 0 }
      };

      const cascade = computeCascade(profile);
      expect(cascade.fixedTotal).toBe(16000);
      expect(cascade.savingsLocked).toBe(5000);
      expect(cascade.spendable).toBe(29000);
      expect(cascade.weeklyBudget).toBe(Math.round(29000 / 4.33));
    });
  });

  describe('computeWeeklyState', () => {
    it('should compute suggested daily spend', () => {
      const cascade = {
        income: 50000,
        fixedTotal: 16000,
        savingsLocked: 5000,
        spendable: 29000,
        weeklyBudget: 6700,
        dailyBudget: 967
      };

      // Mock date to a Wednesday (3) -> 4 days left
      const originalDate = global.Date;
      const mockDate = new Date('2024-04-17'); // Wednesday
      global.Date = class extends originalDate {
        constructor() { super(); return mockDate; }
        getDay() { return 3; }
      } as any;

      const state = computeWeeklyState(cascade, 2700);
      expect(state.remaining).toBe(4000);
      expect(state.daysLeft).toBe(4);
      expect(state.suggestedDaily).toBe(1000);

      global.Date = originalDate;
    });
  });
});
