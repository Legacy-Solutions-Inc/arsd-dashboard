import React from "react";

export interface Project {
  id: string;
  title: string;
  type: string;
  location: string;
  client: string;
  contractor: string;
  contractAmount: number;
  progress: number;
  status: string;
  startDate: string;
  endDate: string;
  description: string;
  image: string;
  features: string[];
}

/** Displays a featured project card. */
export function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="p-4 sm:p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border flex flex-col items-center text-center">
      <img src={project.image} alt={project.title} className="w-14 h-14 sm:w-16 sm:h-16 mb-4 rounded-full mx-auto" />
      <h3 className="text-lg sm:text-xl font-semibold mb-2 text-arsd-red">{project.title}</h3>
      <div className="mb-2 text-xs sm:text-sm text-gray-500">{project.type} | {project.location}</div>
      <div className="mb-2 text-xs sm:text-sm text-gray-600">Client: <span className="font-medium">{project.client}</span></div>
      <div className="mb-2 text-xs sm:text-sm text-gray-600">Contractor: <span className="font-medium">{project.contractor}</span></div>
      <div className="mb-2 text-xs sm:text-sm text-gray-600">Contract Amount: <span className="font-bold text-green-600">₱{project.contractAmount.toLocaleString()}</span></div>
      <div className="mb-2 text-xs sm:text-sm text-gray-600">Progress: <span className="font-bold text-blue-600">{project.progress}%</span></div>
      <div className="mb-2 text-xs sm:text-sm text-gray-600">Status: <span className="font-bold text-orange-600">{project.status}</span></div>
      <div className="mb-2 text-xs sm:text-sm text-gray-600">Start: {project.startDate} | End: {project.endDate}</div>
      <p className="text-gray-600 mb-2 text-xs sm:text-sm">{project.description}</p>
      <ul className="list-disc pl-4 sm:pl-5 text-gray-500 text-xs sm:text-sm mb-2 text-left">
        {project.features.map((f, i) => (
          <li key={i}>{f}</li>
        ))}
      </ul>
    </div>
  );
}
