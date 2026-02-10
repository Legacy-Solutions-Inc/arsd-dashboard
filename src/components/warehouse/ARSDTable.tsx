import React from 'react';

interface ARSDTableProps {
  children: React.ReactNode;
  className?: string;
}

export function ARSDTable({ children, className = '' }: ARSDTableProps) {
  return (
    <div className={`glass-table overflow-x-auto rounded-2xl ${className}`}>
      <table className="w-full">
        {children}
      </table>
    </div>
  );
}

