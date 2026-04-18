import React from "react";

interface SectionEyebrowProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionEyebrow({ children, className }: SectionEyebrowProps) {
  return (
    <p className={`text-xs uppercase tracking-widest font-semibold text-arsd-red ${className ?? ""}`}>
      {children}
    </p>
  );
}
