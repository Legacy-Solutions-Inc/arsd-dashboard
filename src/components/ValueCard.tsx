import React from "react";

export interface Value {
  icon: React.ReactNode;
  title: string;
  description: string;
}

/** Displays a core value card. */
export function ValueCard({ value }: { value: Value }) {
  return (
    <div className="text-center">
      <div className="flex justify-center mb-4">{value.icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-3">{value.title}</h3>
      <p className="text-gray-600">{value.description}</p>
    </div>
  );
}
