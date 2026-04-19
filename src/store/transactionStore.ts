import { create } from 'zustand';
import { Transaction } from '../db/schema';
import * as queries from '../db/queries';

interface TransactionState {
  transactions: Transaction[];
  pendingConfirm: Transaction | null;
  isLoading: boolean;
  
  loadRecent: () => Promise<void>;
  addTransaction: (tx: Transaction) => Promise<void>;
  confirmTransaction: (id: string) => Promise<void>;
  discardTransaction: (id: string) => Promise<void>;
  setPendingConfirm: (tx: Transaction | null) => void;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  pendingConfirm: null,
  isLoading: false,

  loadRecent: async () => {
    set({ isLoading: true });
    // For now, load all and we'll filter in the component or store
    // Ideally we'd load by week/month
    const db = await (await import('../db/schema')).initDB();
    const all = await db.getAll('transactions');
    set({ transactions: all.sort((a, b) => b.timestamp - a.timestamp), isLoading: false });
  },

  addTransaction: async (tx: Transaction) => {
    await queries.saveTransaction(tx);
    set((state) => ({ 
      transactions: [tx, ...state.transactions].sort((a, b) => b.timestamp - a.timestamp) 
    }));
  },

  confirmTransaction: async (id: string) => {
    const tx = get().transactions.find(t => t.id === id);
    if (tx) {
      const updated = { ...tx, confirmed: true };
      await queries.saveTransaction(updated);
      set((state) => ({
        transactions: state.transactions.map(t => t.id === id ? updated : t)
      }));
    }
    set({ pendingConfirm: null });
  },

  discardTransaction: async (id: string) => {
    await queries.deleteTransaction(id);
    set((state) => ({
      transactions: state.transactions.filter(t => t.id !== id),
      pendingConfirm: null // Ensure this is cleared
    }));
    sessionStorage.removeItem('pending_transaction');
  },

  setPendingConfirm: (tx: Transaction | null) => {
    set({ pendingConfirm: tx });
    if (tx) {
      sessionStorage.setItem('pending_transaction', JSON.stringify(tx));
    } else {
      sessionStorage.removeItem('pending_transaction');
    }
  }
}));
