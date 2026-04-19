import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { UPIPayload } from '../engine/upiParser';
import { computeSpendImpact } from '../engine/budgetEngine';
import { useBudgetStore } from '../store/budgetStore';
import { buildRedirectLink, performRedirect } from '../engine/upiRedirect';
import { useTransactionStore } from '../store/transactionStore';
import { AlertCircle, ShieldCheck, Zap } from 'lucide-react';

interface PaymentGateProps {
  payload: UPIPayload;
  onCancel: () => void;
  onSuccess: () => void;
}

const PaymentGate: React.FC<PaymentGateProps> = ({ payload, onCancel, onSuccess }) => {
  const { config } = useBudgetStore();
  const { setPendingConfirm, addTransaction } = useTransactionStore();
  const [countdown, setCountdown] = useState(0);
  const [canPay, setCanPay] = useState(false);
  const [localAmount, setLocalAmount] = useState(payload.am);

  // For simulation, let's assume spentThisWeek is from the store or derived
  const spentThisWeek = 0; // In a real app, derive this
  const impact = computeSpendImpact(localAmount, spentThisWeek, config.profile.computed.weeklyBudget);

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
    // Log the transaction as pending
    const transaction = {
      id: crypto.randomUUID(),
      amount: localAmount,
      payee: payload.pn,
      vpa: payload.pa,
      category: 'other',
      timestamp: Date.now(),
      week: '2024-W16', // Real app: format(new Date(), "yyyy-'W'ww")
      month: '2024-04',
      confirmed: false,
    };
    
    await addTransaction(transaction);
    setPendingConfirm(transaction);
    
    // Update payload with localAmount for redirect
    const updatedPayload = { ...payload, am: localAmount };
    const link = buildRedirectLink(updatedPayload, config.preferredUPI);
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
        <h2 className="text-4xl font-black uppercase tracking-tighter border-b-4 border-bauhaus-black pb-4">
          Payment Checkpoint
        </h2>

        <Card decoration="triangle" decorationColor={impact.status === 'over' ? 'red' : 'yellow'}>
          <div className="space-y-6 text-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Paying To</p>
              <p className="text-3xl font-black uppercase tracking-tight">{payload.pn}</p>
              <p className="text-sm font-mono text-gray-400">{payload.pa}</p>
            </div>

            <div className="py-8 border-y-2 border-bauhaus-black border-dashed flex items-center justify-center gap-2">
              <span className="text-4xl font-black">₹</span>
              <input 
                type="number"
                value={localAmount}
                onChange={(e) => setLocalAmount(Number(e.target.value))}
                className="text-6xl font-black tracking-tighter bg-transparent border-none w-48 text-center focus:outline-none"
              />
            </div>

            <div className={`p-4 border-2 flex items-start gap-4 text-left ${status.color}`}>
              <div className="mt-1">{status.icon}</div>
              <div>
                <p className="font-black uppercase tracking-tight">{status.text}</p>
                <p className="text-sm opacity-80">{status.description}</p>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <Button 
                onClick={handlePay}
                disabled={!canPay}
                className="w-full h-16 text-xl"
                variant={impact.status === 'over' ? 'primary' : 'secondary'}
              >
                {canPay ? `Pay with ${config.preferredUPI === 'default' ? 'UPI' : config.preferredUPI}` : `Wait ${countdown}s...`}
              </Button>
              <Button onClick={onCancel} variant="ghost" className="w-full">
                Cancel & Reconsider
              </Button>
            </div>
          </div>
        </Card>

        {impact.status === 'over' && (
          <div className="p-4 bg-bauhaus-black text-white text-xs font-bold uppercase tracking-widest text-center">
            Friction is enabled for this transaction
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PaymentGate;
