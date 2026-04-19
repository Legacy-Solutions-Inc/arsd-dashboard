import React from 'react';

interface ARSDCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'neutral';
}

export function ARSDCard({ children, className = '', onClick, variant = 'default' }: ARSDCardProps) {
  const baseClass =
    variant === 'neutral'
      ? 'bg-card border border-border rounded-lg p-6 shadow-xs'
      : 'bg-card border border-border rounded-lg p-6 shadow-xs transition-colors duration-150 hover:border-foreground/15';
  return (
    <div
      className={`${baseClass} ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
