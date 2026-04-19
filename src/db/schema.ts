import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { UPIApp } from '../engine/upiRedirect';

export type Category =
  | 'food'
  | 'transport'
  | 'groceries'
  | 'subscriptions'
  | 'utilities'
  | 'shopping'
  | 'other';

export type FixedCategory = 'rent' | 'emi' | 'insurance' | 'subscription' | 'utility' | 'other';

export interface FixedExpense {
  id: string;
  label: string;
  amount: number;
  dueDay: number;
  category: FixedCategory;
  autoPaid: boolean;
}

export interface VariableCategory {
  id: string;
  label: string;
  monthlyEnvelope: number;
  color: string;
  rollover: boolean;
}

export interface SavingsGoal {
  targetAmount: number;
  targetLabel: string;
  targetDate?: number;
  monthlyContribution: number;
  lockedIn: boolean;
}

export interface FinancialProfile {
  monthlyIncome: number;
  incomeDay: number;
  savingsGoal: SavingsGoal;
  fixedExpenses: FixedExpense[];
  variableCategories: VariableCategory[];
  computed: {
    income: number;
    fixedTotal: number;
    savingsLocked: number;
    spendable: number;
    weeklyBudget: number;
    dailyBudget: number;
  };
}

export interface Transaction {
  id: string;
  amount: number;
  payee: string;
  vpa: string;
  category: Category | string; // Can be a variable category label
  note?: string;
  timestamp: number;
  week: string; // "2025-W17"
  month: string; // "2025-04"
  confirmed: boolean;
  type?: 'manual' | 'auto';
}

export interface BudgetConfig {
  profile: FinancialProfile;
  warningPct: number;
  preferredUPI: UPIApp;
}

interface FrictionDB extends DBSchema {
  transactions: {
    key: string;
    value: Transaction;
    indexes: {
      'by-week': string;
      'by-month': string;
      'by-timestamp': number;
    };
  };
  config: {
    key: string;
    value: BudgetConfig;
  };
}

const DB_NAME = 'friction-db';
const DB_VERSION = 1;

export async function initDB(): Promise<IDBPDatabase<FrictionDB>> {
  return openDB<FrictionDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const txStore = db.createObjectStore('transactions', { keyPath: 'id' });
      txStore.createIndex('by-week', 'week');
      txStore.createIndex('by-month', 'month');
      txStore.createIndex('by-timestamp', 'timestamp');

      db.createObjectStore('config');
    },
  });
}
