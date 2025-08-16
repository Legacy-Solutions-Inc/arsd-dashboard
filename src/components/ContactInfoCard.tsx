import React from "react";

export interface ContactInfo {
  icon: React.ReactNode;
  title: string;
  details: string[];
}

/** Card for displaying contact information. */
export function ContactInfoCard({ info }: { info: ContactInfo }) {
  return (
    <div className="text-center hover:shadow-lg transition-shadow bg-white rounded-lg">
      <div className="flex justify-center mb-4">{info.icon}</div>
      <div className="text-xl text-gray-900 font-bold">{info.title}</div>
      <div className="space-y-2 mt-2">
        {info.details.map((detail, idx) => (
          <p key={idx} className="text-gray-600 text-sm">{detail}</p>
        ))}
      </div>
    </div>
  );
}
