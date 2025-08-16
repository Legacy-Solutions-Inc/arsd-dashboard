import React from "react";

export interface Milestone {
  year: string;
  title: string;
  description: string;
}

/** Timeline milestone card for company history. */
export function MilestoneCard({ milestone }: { milestone: Milestone }) {
  return (
    <div className="flex gap-6">
      <div className="flex-shrink-0">
        <div className="w-16 h-16 bg-arsd-red text-white rounded-full flex items-center justify-center font-bold">
          {milestone.year}
        </div>
      </div>
      <div className="flex-grow">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{milestone.title}</h3>
        <p className="text-gray-600">{milestone.description}</p>
      </div>
    </div>
  );
}
