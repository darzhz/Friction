import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { UPIPayload } from '../engine/upiParser';
import { computeSpendImpact, getTransactionsThisWeek } from '../engine/budgetEngine';
import { useBudgetStore } from '../store/budgetStore';
import { buildRedirectLink, performRedirect } from '../engine/upiRedirect';
import { useTransactionStore } from '../store/transactionStore';
import { AlertCircle, ShieldCheck, Zap, Skull, User, AtSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

interface PaymentGateProps {
  payload: UPIPayload;
  onCancel: () => void;
  onSuccess: () => void;
}

const PaymentGate: React.FC<PaymentGateProps> = ({ payload, onCancel, onSuccess }) => {
  const { config } = useBudgetStore();
  const { setPendingConfirm, addTransaction, transactions } = useTransactionStore();
  const [countdown, setCountdown] = useState(0);
  const [canPay, setCanPay] = useState(false);
  const [localAmount, setLocalAmount] = useState(payload.am);
  const [localPa, setLocalPa] = useState(payload.pa);
  const [localPn, setLocalPn] = useState(payload.pn);

  // Derive spent this week from store using engine utility
  const transactionsThisWeek = getTransactionsThisWeek(transactions);
  const spentThisWeek = transactionsThisWeek.reduce((sum, t) => sum + t.amount, 0);

  const impact = computeSpendImpact(localAmount, spentThisWeek, config.profile.computed.weeklyBudget);

  // Savings impact logic
  const monthlySavingsContribution = config.profile.savingsGoal.monthlyContribution;
  const overspend = impact.afterSpend < 0 ? Math.abs(impact.afterSpend) : 0;
  const savingsRemaining = Math.max(0, monthlySavingsContribution - overspend);
  const savingsPct = monthlySavingsContribution > 0 ? (savingsRemaining / monthlySavingsContribution) * 100 : 0;

  useEffect(() => {
    if (impact.frictionDelay > 0) {
      setCountdown(Math.ceil(impact.frictionDelay / 1000));
      setCanPay(false);
      
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanPay(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    } else {
      setCanPay(true);
    }
  }, [impact.frictionDelay]);

  const handlePay = async () => {
    if (!localPa) {
      alert("Please enter a valid Payee VPA");
      return;
    }

    const now = new Date();
    // Log the transaction as pending
    const transaction = {
      id: crypto.randomUUID(),
      amount: localAmount,
      payee: localPn || 'Unknown',
      vpa: localPa,
      category: 'other',
      timestamp: now.getTime(),
      week: format(now, "yyyy-'W'ww"),
      month: format(now, "yyyy-MM"),
      confirmed: false,
    };
    
    await addTransaction(transaction);
    setPendingConfirm(transaction);
    
    // Update payload with local values for redirect
    const updatedPayload: UPIPayload = { 
      ...payload, 
      am: localAmount,
      pa: localPa,
      pn: localPn || 'Manual Entry'
    };
    const link = buildRedirectLink(updatedPayload, config.preferredUPI);
    console.log("Redirecting to final UPI link:", link);
    performRedirect(link);
    onSuccess();
  };

  const statusConfig = {
    safe: {
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: <ShieldCheck className="w-6 h-6" />,
      text: 'Within Budget',
      description: 'You have plenty left for the week.'
    },
    warning: {
      color: 'bg-bauhaus-yellow/20 text-bauhaus-yellow border-bauhaus-yellow/30',
      icon: <Zap className="w-6 h-6" />,
      text: 'Nearing Limit',
      description: 'This spend will put you close to your limit.'
    },
    over: {
      color: 'bg-bauhaus-red/10 text-bauhaus-red border-bauhaus-red/20',
      icon: <AlertCircle className="w-6 h-6" />,
      text: 'Over Budget',
      description: `This spend exceeds your weekly limit by ₹${Math.abs(impact.afterSpend)}.`
    }
  };

  const status = statusConfig[impact.status];

  return (
    <Layout>
      <div className="max-w-xl mx-auto py-12 px-4 space-y-8">
        <motion.h2 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-4xl font-black uppercase tracking-tighter border-b-4 border-bauhaus-black pb-4"
        >
          Payment Checkpoint
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        >
          <Card decoration="triangle" decorationColor={impact.status === 'over' ? 'red' : 'yellow'}>
            <div className="space-y-6 text-center">
              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Paying To</p>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-bauhaus-white border-2 border-bauhaus-black">
                    <User className="w-5 h-5 opacity-40" />
                    <input 
                      placeholder="Payee Name (Optional)"
                      value={localPn}
                      onChange={(e) => setLocalPn(e.target.value)}
                      className="bg-transparent border-none w-full font-black uppercase tracking-tight focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-bauhaus-white border-2 border-bauhaus-black">
                    <AtSign className="w-5 h-5 opacity-40" />
                    <input 
                      placeholder="Payee VPA (e.g. name@upi)"
                      value={localPa}
                      onChange={(e) => setLocalPa(e.target.value)}
                      className="bg-transparent border-none w-full font-mono text-sm focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="py-8 border-y-2 border-bauhaus-black border-dashed flex items-center justify-center gap-2">
                <span className="text-4xl font-black">₹</span>
                <input 
                  type="number"
                  // Keep the display empty if the value is 0
                  value={localAmount === 0 ? '' : localAmount}
                  onChange={(e) => {
                    const val = e.target.value;
                    // Set to 0 if empty to maintain the number type, otherwise convert to Number
                    setLocalAmount(val === '' ? 0 : Number(val));
                  }}
                  className="text-6xl font-black tracking-tighter bg-transparent border-none w-full text-center focus:outline-none"
                  placeholder="0"
                />
              </div>

              <motion.div 
                key={impact.status}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`p-4 border-2 flex items-start gap-4 text-left ${status.color}`}
              >
                <div className="mt-1">{status.icon}</div>
                <div>
                  <p className="font-black uppercase tracking-tight">{status.text}</p>
                  <p className="text-sm opacity-80">{status.description}</p>
                </div>
              </motion.div>

              {/* Savings Impact Bar */}
              {monthlySavingsContribution > 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-2 p-4 bg-bauhaus-white border-2 border-bauhaus-black"
                >
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest">Monthly Savings Impact</p>
                    {savingsRemaining <= 0 && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex items-center gap-1 text-bauhaus-red"
                      >
                        <Skull className="w-4 h-4" />
                        <span className="text-[10px] font-black italic">SAVING IS DEAD</span>
                      </motion.div>
                    )}
                  </div>
                  <div className="h-4 w-full bg-gray-200 border-2 border-bauhaus-black overflow-hidden flex">
                    <motion.div 
                      initial={{ width: '100%' }}
                      animate={{ width: `${savingsPct}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`h-full ${savingsRemaining <= 0 ? 'bg-bauhaus-red' : 'bg-bauhaus-blue'}`}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest opacity-60">
                    <span>Remaining: ₹{savingsRemaining}</span>
                    <span>Goal: ₹{monthlySavingsContribution}</span>
                  </div>
                </motion.div>
              )}

              <div className="space-y-4 pt-4">
                <Button 
                  onClick={handlePay}
                  disabled={!canPay}
                  className="w-full h-16 text-xl relative overflow-hidden"
                  variant={impact.status === 'over' ? 'primary' : 'secondary'}
                >
                  <AnimatePresence mode="wait">
                    {!canPay ? (
                      <motion.span 
                        key="waiting"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex items-center justify-center gap-2"
                      >
                        Wait {countdown}s...
                      </motion.span>
                    ) : (
                      <motion.span 
                        key="ready"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                      >
                        Pay with {config.preferredUPI === 'default' ? 'UPI' : config.preferredUPI}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
                <Button onClick={onCancel} variant="ghost" className="w-full">
                  Cancel & Reconsider
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        <AnimatePresence>
          {impact.status === 'over' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 bg-bauhaus-black text-white text-xs font-bold uppercase tracking-widest text-center overflow-hidden"
            >
              Friction is enabled for this transaction
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
};

export default PaymentGate;
