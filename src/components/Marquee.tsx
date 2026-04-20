import React from 'react';
import { motion } from 'framer-motion';
import { useTransactionStore } from '../store/transactionStore';
import { useBudgetStore } from '../store/budgetStore';

const QUOTES = [
  "MONEY CAN'T BUY HAPPINESS, BUT IT BUYS BETTER MISERY.",
  "MY WALLET IS LIKE AN ONION. OPENING IT MAKES ME CRY.",
  "I'M SO POOR I CAN'T EVEN PAY ATTENTION.",
  "A BANK LENDS MONEY IF YOU PROVE YOU DON'T NEED IT.",
  "STOP SPENDING MONEY YOU DON'T HAVE ON THINGS YOU DON'T NEED."
];

const INSULTS = [
  "PUT THE PHONE DOWN. YOU ARE BROKE.",
  "IS THAT SHAWARMA WORTH BANKRUPTCY?",
  "YOUR SAVINGS ACCOUNT IS LAUGHING AT YOU.",
  "STOP. SPENDING. NOW. YOU ADDICT.",
  "YOU ARE ONE CHAI AWAY FROM THE STREETS.",
  "ERROR 404: DISCIPLINE NOT FOUND.",
  "LOOK AT YOU, SPENDING LIKE A BILLIONAIRE WITH A HUNDREDAIRE BANK ACCOUNT."
];

export const BauhausMarquee: React.FC = () => {
  const { transactions } = useTransactionStore();
  const { config } = useBudgetStore();

  const weeklyBudget = config.profile.computed.weeklyBudget || 1;
  const spentThisWeek = transactions
    .filter(t => t.confirmed)
    .reduce((s, t) => s + t.amount, 0);

  const spentPct = (spentThisWeek / weeklyBudget) * 100;

  // Reactive logic
  let bgColor = 'bg-bauhaus-black';
  let speed = 40; // Seconds for full loop
  let content = QUOTES;

  if (spentPct >= 90) {
    bgColor = 'bg-red-700';
    speed = 25; // Aggressive speed
    content = INSULTS;
  } else if (spentPct >= 70) {
    bgColor = 'bg-orange-500';
    speed = 25; // Anxious speed
    content = [...QUOTES.slice(0, 2), ...INSULTS.slice(0, 2)];
  }

  const totalSpent = transactions.filter(t => t.confirmed).reduce((s, t) => s + t.amount, 0);
  const avgSpend = transactions.length > 0 ? Math.round(totalSpent / 30) : 0;

  const statsItems = [
    `WEEKLY BURN: ₹${spentThisWeek}`,
    `AVG DAILY: ₹${avgSpend}`,
    `BUDGET USED: ${Math.round(spentPct)}%`
  ];

  const allItems = [...content, ...statsItems];

  return (
    <div className={`${bgColor} py-2 border-y-2 border-bauhaus-black overflow-hidden flex whitespace-nowrap transition-colors duration-500`}>
      <motion.div 
        animate={{ x: [0, -2000] }}
        transition={{ 
          repeat: Infinity, 
          duration: speed, 
          ease: "linear" 
        }}
        className="flex gap-10 items-center"
      >
        {[...allItems, ...allItems, ...allItems].map((item, i) => (
          <React.Fragment key={i}>
            <span className="text-white font-black text-sm uppercase tracking-tighter">
              {item}
            </span>
            <div className="flex space-x-2 shrink-0">
              <div className="w-4 h-4 rounded-full bg-white opacity-20" />
              <div className="w-4 h-4 bg-white opacity-20" />
              <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[14px] border-b-white opacity-20" />
            </div>
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
};

