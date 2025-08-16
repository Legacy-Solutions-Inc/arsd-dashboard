import React from "react";

interface Project {
  id: string;
  name: string;
  client: string;
  location: string;
  status: string;
}

interface ProjectListProps {
  projects: Project[];
  onSelect: (projectId: string) => void;
}

export default function ProjectList({ projects, onSelect }: ProjectListProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h2 className="text-lg font-bold mb-4">Projects</h2>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b">
            <th className="py-2">Project ID</th>
            <th className="py-2">Name</th>
            <th className="py-2">Client</th>
            <th className="py-2">Location</th>
            <th className="py-2">Status</th>
            <th className="py-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.id} className="border-b hover:bg-gray-50">
              <td className="py-2 font-medium">{project.id}</td>
              <td className="py-2">{project.name}</td>
              <td className="py-2">{project.client}</td>
              <td className="py-2">{project.location}</td>
              <td className="py-2">
                <span className={`px-2 py-1 rounded text-xs ${
                  project.status === "active"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}>
                  {project.status}
                </span>
              </td>
              <td className="py-2">
                <button
                  className="px-3 py-1 bg-arsd-red text-white rounded hover:bg-arsd-red/80 text-xs"
                  onClick={() => onSelect(project.id)}
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
