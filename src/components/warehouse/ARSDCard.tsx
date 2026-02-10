import React from 'react';

interface ARSDCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'neutral';
}

export function ARSDCard({ children, className = '', onClick, variant = 'default' }: ARSDCardProps) {
  const baseClass = variant === 'neutral' ? 'glass-card-neutral' : 'glass-card';
  return (
    <div
      className={`${baseClass} ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

