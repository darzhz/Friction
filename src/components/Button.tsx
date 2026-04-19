import React from 'react';

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

  return (
    <button
      className={`bauhaus-button ${variants[variant]} ${shapes[shape]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
