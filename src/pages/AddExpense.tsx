import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useTransactionStore } from '../store/transactionStore';
import { Category } from '../db/schema';

interface AddExpenseProps {
  onCancel: () => void;
  onSuccess: () => void;
}

const AddExpense: React.FC<AddExpenseProps> = ({ onCancel, onSuccess }) => {
  const { addTransaction } = useTransactionStore();
  const [amount, setAmount] = useState('');
  const [payee, setPayee] = useState('');
  const [category, setCategory] = useState<Category>('other');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    await addTransaction({
      id: crypto.randomUUID(),
      amount: Number(amount),
      payee,
      vpa: 'manual',
      category,
      timestamp: now.getTime(),
      week: `${now.getFullYear()}-W${Math.ceil(now.getDate() / 7)}`, // Simplified
      month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      confirmed: true,
      type: 'manual'
    });
    onSuccess();
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto py-12 px-4">
        <Card title="Add Manual Expense" decoration="circle" decorationColor="red">
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <input 
              type="number"
              placeholder="Amount (₹)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-3 border-2 border-bauhaus-black"
              required
            />
            <input 
              type="text"
              placeholder="Payee (e.g. Grocery Store)"
              value={payee}
              onChange={(e) => setPayee(e.target.value)}
              className="w-full p-3 border-2 border-bauhaus-black"
              required
            />
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full p-3 border-2 border-bauhaus-black"
            >
              <option value="food">Food</option>
              <option value="transport">Transport</option>
              <option value="groceries">Groceries</option>
              <option value="subscriptions">Subscriptions</option>
              <option value="utilities">Utilities</option>
              <option value="shopping">Shopping</option>
              <option value="other">Other</option>
            </select>
            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>
              <Button type="submit" variant="primary" className="flex-1">Log Expense</Button>
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  );
};

export default AddExpense;
