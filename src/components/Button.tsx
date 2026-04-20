import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'yellow' | 'outline' | 'ghost';
  shape?: 'square' | 'pill';
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  shape = 'square', 
  className = '', 
  children, 
  ...props 
}) => {
  const variants = {
    primary: 'bg-bauhaus-red text-white hover:bg-bauhaus-red/90',
    secondary: 'bg-bauhaus-blue text-white hover:bg-bauhaus-blue/90',
    yellow: 'bg-bauhaus-yellow text-bauhaus-black hover:bg-bauhaus-yellow/90',
    outline: 'bg-white text-bauhaus-black hover:bg-gray-100',
    ghost: 'border-none shadow-none text-bauhaus-black hover:bg-bauhaus-muted',
  };

  const shapes = {
    square: 'rounded-none',
    pill: 'rounded-full',
  };

  // Omit conflicting props from standard button attributes that framer-motion overrides
  const { onAnimationStart, onDrag, onDragEnd, onDragStart, ...motionSafeProps } = props as any;

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98, y: 2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 10 } as any}
      className={`bauhaus-button ${variants[variant]} ${shapes[shape]} ${className}`}
      {...motionSafeProps}
    >
      {children}
    </motion.button>
  );
};
