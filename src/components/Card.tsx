import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  decoration?: 'circle' | 'square' | 'triangle';
  decorationColor?: 'red' | 'blue' | 'yellow';
  className?: string;
}

export const Card: React.FC<CardProps> = ({ 
  title, 
  children, 
  decoration = 'circle', 
  decorationColor = 'red',
  className = '' 
}) => {
  const colors = {
    red: 'bg-bauhaus-red',
    blue: 'bg-bauhaus-blue',
    yellow: 'bg-bauhaus-yellow',
  };

  const Decoration = () => {
    switch (decoration) {
      case 'square':
        return (
          <motion.div 
            initial={{ rotate: -45, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className={`w-4 h-4 rounded-none ${colors[decorationColor]}`} 
          />
        );
      case 'triangle':
        return (
          <motion.div 
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 12, delay: 0.2 }}
            className={`w-4 h-4 ${colors[decorationColor]}`} 
            style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} 
          />
        );
      case 'circle':
      default:
        return (
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 12, delay: 0.2 }}
            className={`w-4 h-4 rounded-full ${colors[decorationColor]}`} 
          />
        );
    }
  };

  return (
    <div className={`bauhaus-card p-6 relative ${className}`}>
      <div className="absolute top-4 right-4">
        <Decoration />
      </div>
      {title && (
        <h3 className="text-xl font-black uppercase tracking-tighter mb-4">
          {title}
        </h3>
      )}
      <div>{children}</div>
    </div>
  );
};
