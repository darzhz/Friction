import React, { useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Scan, Plus, ArrowRight } from 'lucide-react';
import { useBudgetStore } from '../store/budgetStore';
import { useTransactionStore } from '../store/transactionStore';
import { computeWeeklyState, getTransactionsThisWeek, getTransactionsToday } from '../engine/budgetEngine';
import { motion, Variants } from 'framer-motion';
import { BauhausMarquee } from '../components/Marquee';

interface HomeProps {
  onScanRequest: () => void;
  onAddExpense: () => void;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', damping: 25, stiffness: 500 } as any
  }
};

const Home: React.FC<HomeProps> = ({ onScanRequest, onAddExpense }) => {
  const { config, loadConfig } = useBudgetStore();
  const { transactions, loadRecent } = useTransactionStore();

  useEffect(() => {
    loadConfig();
    loadRecent();
  }, [loadConfig, loadRecent]);

  // Derived state
  const cascade = config.profile.computed;
  
  // Calculate spent this week and today using engine utilities
  const transactionsThisWeek = getTransactionsThisWeek(transactions);
  const spentThisWeek = transactionsThisWeek.reduce((sum, t) => sum + t.amount, 0);

  const transactionsToday = getTransactionsToday(transactions);
  const spentToday = transactionsToday.reduce((sum, t) => sum + t.amount, 0);

  const weeklyState = computeWeeklyState(cascade, spentThisWeek);

  return (
    <Layout>
      <BauhausMarquee />
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto py-12 px-4 space-y-12"
      >
        {/* Hero Section / Budget Widget */}
        <motion.section variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-6">
            <h2 className="text-4xl sm:text-6xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.9]">
              Discipline <br />
              <span className="text-bauhaus-red text-6xl sm:text-8xl lg:text-9xl">Through</span> <br />
              Awareness
            </h2>
            <div className="flex gap-4">
              <Button onClick={onScanRequest} className="h-16 px-4 lg:px-8 text-sm lg:text-xl">
                <Scan className="mr-2" /> Scan to Pay
              </Button>
              <Button 
                variant="outline" 
                className="h-16 px-4 text-sm lg:px-8 lg:text-xl"
                onClick={onAddExpense}
              >
                <Plus className="mr-2" /> Add Expense
              </Button>
            </div>
          </div>

          <Card 
            title="Weekly Budget" 
            decoration="circle" 
            decorationColor="yellow"
            className="bg-bauhaus-blue text-white border-white"
          >
            {cascade.weeklyBudget > 0 ? (
              <div className="space-y-8">
                <div>
                  <p className="text-bauhaus-yellow font-bold uppercase tracking-widest text-sm mb-1">Remaining to spend</p>
                  <p className="text-6xl font-black tracking-tighter">₹{weeklyState.remaining}</p>
                </div>

                <div className="space-y-4">
                  {/* Daily Progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between font-bold uppercase text-[10px] tracking-widest text-white/60">
                      <span>Today's Pace</span>
                      <span>₹{spentToday} / ₹{cascade.dailyBudget}</span>
                    </div>
                    <div className="h-2 w-full border border-white/30 rounded-none flex overflow-hidden bg-white/5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (spentToday / (cascade.dailyBudget || 1)) * 100)}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`${spentToday > cascade.dailyBudget ? 'bg-bauhaus-red' : 'bg-bauhaus-white'} h-full`} 
                      />
                    </div>
                  </div>

                  {/* Weekly Progress */}
                  <div className="space-y-2">
                    <div className="h-8 w-full border-2 border-white rounded-none flex overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (spentThisWeek / (cascade.weeklyBudget || 1)) * 100)}%` }}
                        transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
                        className="bg-bauhaus-yellow h-full border-r-2 border-white" 
                      />
                    </div>
                    <div className="flex justify-between font-bold uppercase text-xs tracking-widest text-white/80">
                      <span>Weekly Spent: ₹{spentThisWeek}</span>
                      <span>Limit: ₹{cascade.weeklyBudget}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/10 border-2 border-white/20">
                    <p className="text-xs uppercase tracking-widest text-bauhaus-yellow opacity-80">Suggested / Day</p>
                    <p className="text-2xl font-black">₹{weeklyState.suggestedDaily}</p>
                  </div>
                  <div className="p-4 bg-white/10 border-2 border-white/20">
                    <p className="text-xs uppercase tracking-widest text-bauhaus-yellow opacity-80">Days Left</p>
                    <p className="text-2xl font-black">{weeklyState.daysLeft}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center space-y-6">
                <p className="uppercase font-black text-2xl tracking-tighter">Budget Not Set</p>
                <p className="text-sm opacity-80 uppercase tracking-widest">Setup your income and expenses to unlock your weekly budget.</p>
                <Button 
                  onClick={() => { window.history.pushState({}, '', '/settings'); window.dispatchEvent(new Event('popstate')); }}
                  variant="yellow" 
                  className="w-full"
                >
                  Setup Profile
                </Button>
              </div>
            )}
          </Card>
        </motion.section>

        {/* Info Grid */}
        <motion.section variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card title="Fixed Expenses" decoration="square" decorationColor="red">
            <p className="text-sm text-gray-500 mb-4">Recurring costs accounted for before your weekly budget.</p>
            <p className="text-3xl font-black">₹{cascade.fixedTotal}</p>
            <p className="text-xs uppercase font-bold tracking-widest mt-2 text-bauhaus-red">Accounted for</p>
          </Card>

          <Card title="Savings Goal" decoration="triangle" decorationColor="blue">
            <p className="text-sm text-gray-500 mb-4">{config.profile.savingsGoal.targetLabel || 'Set a savings goal in settings'}</p>
            <p className="text-3xl font-black">₹{cascade.savingsLocked}</p>
            <p className="text-xs uppercase font-bold tracking-widest mt-2 text-bauhaus-blue">Monthly target</p>
          </Card>

          <Card title="Total Spendable" decoration="circle" decorationColor="yellow">
            <p className="text-sm text-gray-500 mb-4">Income left after fixed costs and savings.</p>
            <p className="text-3xl font-black">₹{cascade.spendable}</p>
            <p className="text-xs uppercase font-bold tracking-widest mt-2 text-bauhaus-yellow">Monthly pool</p>
          </Card>
        </motion.section>

        {/* Recent Transactions */}
        <motion.section variants={itemVariants} className="space-y-6">
          <div className="flex justify-between items-end border-b-4 border-bauhaus-black pb-2">
            <h3 className="text-4xl font-black uppercase tracking-tighter">Recent Spends</h3>
            <Button variant="ghost" className="text-xs">View All <ArrowRight className="ml-1 w-4 h-4" /></Button>
          </div>
          
          <div className="space-y-4">
            {transactions.length === 0 ? (
              <div className="p-8 border-2 border-dashed border-bauhaus-black text-center text-gray-500 uppercase font-bold tracking-widest">
                No transactions yet. Start by scanning a QR.
              </div>
            ) : (
              transactions.slice(0, 5).map((tx, idx) => (
                <motion.div 
                  key={tx.id} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + (idx * 0.1) }}
                  className="flex justify-between items-center p-4 bg-white border-2 border-bauhaus-black shadow-bauhaus-sm"
                >
                  <div>
                    <p className="font-black uppercase tracking-tight">{tx.payee}</p>
                    <p className="text-xs text-gray-500 uppercase tracking-widest">{new Date(tx.timestamp).toLocaleDateString()} • {tx.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black">₹{tx.amount}</p>
                    <p className={`text-[10px] uppercase font-bold tracking-widest ${tx.confirmed ? 'text-green-600' : 'text-bauhaus-red'}`}>
                      {tx.confirmed ? '✓ Confirmed' : '⚠ Pending'}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.section>
      </motion.div>
    </Layout>
  );
};

export default Home;
