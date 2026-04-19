import React from 'react';

interface ARSDTableProps {
  children: React.ReactNode;
  className?: string;
}

export function ARSDTable({ children, className = '' }: ARSDTableProps) {
  return (
    <div className={`bg-card border border-border rounded-lg overflow-x-auto ${className}`}>
      <table className="w-full">
        {children}
      </table>
    </div>
  );
}
