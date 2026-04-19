import { initDB, Transaction, BudgetConfig } from './schema';

export async function saveTransaction(tx: Transaction) {
  const db = await initDB();
  return db.put('transactions', tx);
}

export async function getTransactionsByWeek(week: string) {
  const db = await initDB();
  return db.getAllFromIndex('transactions', 'by-week', week);
}

export async function getTransactionsByMonth(month: string) {
  const db = await initDB();
  return db.getAllFromIndex('transactions', 'by-month', month);
}

export async function deleteTransaction(id: string) {
  const db = await initDB();
  return db.delete('transactions', id);
}

export async function saveConfig(config: BudgetConfig) {
  const db = await initDB();
  return db.put('config', config, 'default');
}

export async function getConfig(): Promise<BudgetConfig | undefined> {
  const db = await initDB();
  return db.get('config', 'default');
}
