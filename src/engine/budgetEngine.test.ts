import { describe, it, expect } from 'vitest';
import { computeSpendImpact, computeCascade, computeWeeklyState, getTransactionsThisWeek, getTransactionsToday } from './budgetEngine';
import { FinancialProfile, Transaction } from '../db/schema';

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
    it('should compute spendable income correctly for a 30-day month (April)', () => {
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

      const aprilDate = new Date('2024-04-15');
      const cascade = computeCascade(profile, aprilDate);
      expect(cascade.fixedTotal).toBe(16000);
      expect(cascade.savingsLocked).toBe(5000);
      expect(cascade.spendable).toBe(29000);
      
      // April has 30 days
      expect(cascade.dailyBudget).toBe(Math.round(29000 / 30));
      expect(cascade.weeklyBudget).toBe(Math.round((29000 * 7) / 30));
    });

    it('should compute correctly for a 31-day month (May)', () => {
      const profile: FinancialProfile = {
        monthlyIncome: 31000,
        incomeDay: 1,
        savingsGoal: { targetAmount: 0, targetLabel: '', monthlyContribution: 0, lockedIn: false },
        fixedExpenses: [],
        variableCategories: [],
        computed: { income: 0, fixedTotal: 0, savingsLocked: 0, spendable: 0, weeklyBudget: 0, dailyBudget: 0 }
      };

      const mayDate = new Date('2024-05-15');
      const cascade = computeCascade(profile, mayDate);
      expect(cascade.spendable).toBe(31000);
      expect(cascade.dailyBudget).toBe(1000);
      expect(cascade.weeklyBudget).toBe(7000);
    });
  });

  describe('computeWeeklyState', () => {
    it('should compute suggested daily spend correctly', () => {
      const cascade = {
        income: 50000,
        fixedTotal: 16000,
        savingsLocked: 5000,
        spendable: 29000,
        weeklyBudget: 7000,
        dailyBudget: 1000
      };

      // Mock date to a Wednesday (2024-04-17)
      const wednesday = new Date('2024-04-17'); 

      const state = computeWeeklyState(cascade, 2000, wednesday);
      expect(state.remaining).toBe(5000);
      expect(state.daysLeft).toBe(5);
      expect(state.suggestedDaily).toBe(1000);
    });
  });

  describe('transaction filtering', () => {
    const transactions: Transaction[] = [
      { id: '1', amount: 100, payee: 'A', vpa: 'a', category: 'other', timestamp: new Date('2024-04-15').getTime(), confirmed: true, week: '', month: '' }, // Monday
      { id: '2', amount: 200, payee: 'B', vpa: 'b', category: 'other', timestamp: new Date('2024-04-17').getTime(), confirmed: true, week: '', month: '' }, // Wednesday
      { id: '3', amount: 300, payee: 'C', vpa: 'c', category: 'other', timestamp: new Date('2024-04-22').getTime(), confirmed: true, week: '', month: '' }, // Next Monday
      { id: '4', amount: 400, payee: 'D', vpa: 'd', category: 'other', timestamp: new Date('2024-04-17').getTime(), confirmed: false, week: '', month: '' }, // Unconfirmed
    ];

    it('getTransactionsThisWeek should filter by week and confirmation', () => {
      const wednesday = new Date('2024-04-17');
      const filtered = getTransactionsThisWeek(transactions, wednesday);
      expect(filtered).toHaveLength(2);
      expect(filtered.map(t => t.id)).toContain('1');
      expect(filtered.map(t => t.id)).toContain('2');
    });

    it('getTransactionsToday should filter by day and confirmation', () => {
      const wednesday = new Date('2024-04-17');
      const filtered = getTransactionsToday(transactions, wednesday);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('2');
    });
  });
});
