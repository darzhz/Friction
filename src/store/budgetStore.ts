import { create } from 'zustand';
import { BudgetConfig, FinancialProfile } from '../db/schema';
import * as queries from '../db/queries';
import { computeCascade } from '../engine/budgetEngine';

interface BudgetState {
  config: BudgetConfig;
  isLoading: boolean;
  
  loadConfig: () => Promise<void>;
  updateConfig: (config: Partial<BudgetConfig>) => Promise<void>;
  updateProfile: (profile: Partial<FinancialProfile>) => Promise<void>;
}

const DEFAULT_CONFIG: BudgetConfig = {
  profile: {
    monthlyIncome: 0,
    incomeDay: 1,
    savingsGoal: {
      targetAmount: 0,
      targetLabel: '',
      monthlyContribution: 0,
      lockedIn: false,
    },
    fixedExpenses: [],
    variableCategories: [],
    computed: {
      income: 0,
      fixedTotal: 0,
      savingsLocked: 0,
      spendable: 0,
      weeklyBudget: 0,
      dailyBudget: 0,
    },
  },
  warningPct: 85,
  preferredUPI: 'default',
};

export const useBudgetStore = create<BudgetState>((set, get) => ({
  config: DEFAULT_CONFIG,
  isLoading: false,

  loadConfig: async () => {
    set({ isLoading: true });
    const config = await queries.getConfig();
    if (config) {
      set({ config, isLoading: false });
    } else {
      await queries.saveConfig(DEFAULT_CONFIG);
      set({ config: DEFAULT_CONFIG, isLoading: false });
    }
  },

  updateConfig: async (newConfig: Partial<BudgetConfig>) => {
    const updated = { ...get().config, ...newConfig };
    await queries.saveConfig(updated);
    set({ config: updated });
  },

  updateProfile: async (newProfile: Partial<FinancialProfile>) => {
    const currentProfile = get().config.profile;
    const mergedProfile = { ...currentProfile, ...newProfile };
    
    // Recompute cascade
    const cascade = computeCascade(mergedProfile);
    mergedProfile.computed = {
      income: cascade.income,
      fixedTotal: cascade.fixedTotal,
      savingsLocked: cascade.savingsLocked,
      spendable: cascade.spendable,
      weeklyBudget: cascade.weeklyBudget,
      dailyBudget: cascade.dailyBudget,
    };

    const updatedConfig = { ...get().config, profile: mergedProfile };
    await queries.saveConfig(updatedConfig);
    set({ config: updatedConfig });
  },
}));
