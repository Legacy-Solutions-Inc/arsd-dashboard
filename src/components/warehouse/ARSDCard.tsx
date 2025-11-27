import React from 'react';

interface ARSDCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function ARSDCard({ children, className = '', onClick }: ARSDCardProps) {
  return (
    <div
      className={`glass-card ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

