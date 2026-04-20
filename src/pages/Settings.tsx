import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useBudgetStore } from '../store/budgetStore';
import { Save, Plus, Trash2 } from 'lucide-react';
import { FixedCategory } from '../db/schema';

const Settings: React.FC = () => {
  const { config, updateProfile } = useBudgetStore();
  const [profile, setProfile] = useState(config.profile);

  const handleSave = async () => {
    await updateProfile(profile);
    alert('Settings saved!');
  };

  const addFixedExpense = () => {
    const newExpense = {
      id: crypto.randomUUID(),
      label: 'New Expense',
      amount: 0,
      dueDay: 1,
      category: 'other' as FixedCategory,
      autoPaid: false
    };
    setProfile({
      ...profile,
      fixedExpenses: [...profile.fixedExpenses, newExpense]
    });
  };

  const removeFixedExpense = (id: string) => {
    setProfile({
      ...profile,
      fixedExpenses: profile.fixedExpenses.filter(e => e.id !== id)
    });
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-12">
        <div className="flex justify-between items-end border-b-4 border-bauhaus-black pb-4">
          <h2 className="text-5xl font-black uppercase tracking-tighter">Settings</h2>
          <Button onClick={handleSave} variant="primary" className="h-12 px-6">
            <Save className="mr-2 w-4 h-4" /> Save All
          </Button>
        </div>

        <section className="space-y-8">
          {/* Income & Savings */}
          <Card title="💰 Income & Savings" decoration="circle" decorationColor="blue">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-widest">Monthly Income (₹)</label>
               <input 
                type="number" 
                placeholder="₹25000"
                // If the value is 0, show an empty string so the user doesn't see a leading zero
                value={profile.monthlyIncome === 0 ? '' : profile.monthlyIncome}
                onChange={(e) => {
                  const val = e.target.value;
                  setProfile({ 
                    ...profile, 
                    // If the user clears the input, set state back to 0
                    monthlyIncome: val === '' ? 0 : Number(val) 
                  });
                }}            
                className="w-full p-3 border-2 border-bauhaus-black rounded-none focus:outline-none focus:ring-2 focus:ring-bauhaus-blue"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-widest">Income Day</label>
                <select 
                  value={profile.incomeDay}
                  onChange={(e) => setProfile({ ...profile, incomeDay: Number(e.target.value) })}
                  className="w-full p-3 border-2 border-bauhaus-black rounded-none focus:outline-none"
                >
                  {[...Array(31)].map((_, i) => (
                    <option key={i+1} value={i+1}>{i+1}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-8 p-4 bg-bauhaus-blue/5 border-2 border-bauhaus-blue border-dashed space-y-4">
              <p className="font-bold uppercase tracking-tight text-bauhaus-blue">Savings Goal</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input 
                  placeholder="What are you saving for?"
                  value={profile.savingsGoal.targetLabel}
                  onChange={(e) => setProfile({ 
                    ...profile, 
                    savingsGoal: { ...profile.savingsGoal, targetLabel: e.target.value } 
                  })}
                  className="w-full p-2 border-2 border-bauhaus-black text-sm"
                />
                <input 
                  type="number"
                  placeholder="Target Amount"
                  // If the value is 0, show an empty string so the placeholder can be seen
                  value={profile.savingsGoal.targetAmount === 0 ? '' : profile.savingsGoal.targetAmount}
                  onChange={(e) => {
                    const val = e.target.value;
                    setProfile({ 
                      ...profile, 
                      savingsGoal: { 
                        ...profile.savingsGoal, 
                        // Reset to 0 when empty to satisfy the TypeScript number type
                        targetAmount: val === '' ? 0 : Number(val) 
                      } 
                    });
                  }}
                  className="w-full p-2 border-2 border-bauhaus-black text-sm focus:outline-none focus:ring-2 focus:ring-bauhaus-blue"
                />
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="lockSavings"
                  checked={profile.savingsGoal.lockedIn}
                  onChange={(e) => setProfile({ 
                    ...profile, 
                    savingsGoal: { ...profile.savingsGoal, lockedIn: e.target.checked } 
                  })}
                />
                <label htmlFor="lockSavings" className="text-xs font-bold uppercase tracking-widest">Lock monthly contribution before budgeting</label>
              </div>
            </div>
          </Card>

          {/* Fixed Expenses */}
          <Card title="🔒 Fixed Expenses" decoration="square" decorationColor="red">
            <div className="space-y-4 mt-4">
              {profile.fixedExpenses.map((expense) => (
                <div key={expense.id} className="flex flex-wrap md:flex-nowrap gap-2 items-center p-3 bg-bauhaus-white border-2 border-bauhaus-black">
                  <input 
                    className="flex-1 min-w-[120px] p-1 border-b-2 border-bauhaus-black bg-transparent font-bold uppercase text-sm"
                    value={expense.label}
                    onChange={(e) => {
                      const updated = profile.fixedExpenses.map(fe => fe.id === expense.id ? { ...fe, label: e.target.value } : fe);
                      setProfile({ ...profile, fixedExpenses: updated });
                    }}
                  />
                  <input 
                    type="number"
                    className="w-24 p-1 border-b-2 border-bauhaus-black bg-transparent text-sm focus:outline-none"
                    placeholder='₹1000'
                    // Show empty string instead of 0 for a better editing experience
                    value={expense.amount === 0 ? '' : expense.amount}
                    onChange={(e) => {
                      const val = e.target.value;
                      const updated = profile.fixedExpenses.map(fe => 
                        fe.id === expense.id 
                          ? { ...fe, amount: val === '' ? 0 : Number(val) } 
                          : fe
                      );
                      setProfile({ ...profile, fixedExpenses: updated });
                    }}
                  />
                  <select 
                    className="p-1 border-b-2 border-bauhaus-black bg-transparent text-xs uppercase font-bold"
                    value={expense.category}
                    onChange={(e) => {
                      const updated = profile.fixedExpenses.map(fe => fe.id === expense.id ? { ...fe, category: e.target.value as FixedCategory } : fe);
                      setProfile({ ...profile, fixedExpenses: updated });
                    }}
                  >
                    <option value="rent">Rent</option>
                    <option value="emi">EMI</option>
                    <option value="utility">Utility</option>
                    <option value="subscription">Sub</option>
                    <option value="other">Other</option>
                  </select>
                  <Button 
                    onClick={() => removeFixedExpense(expense.id)}
                    variant="ghost" 
                    className="p-1 text-bauhaus-red border-none shadow-none hover:bg-bauhaus-red/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button onClick={addFixedExpense} variant="outline" className="w-full border-dashed text-xs py-2">
                <Plus className="mr-2 w-3 h-3" /> Add Fixed Expense
              </Button>
            </div>
          </Card>
        </section>
      </div>
    </Layout>
  );
};

export default Settings;
