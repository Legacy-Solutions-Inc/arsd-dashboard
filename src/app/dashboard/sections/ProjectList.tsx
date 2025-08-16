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

const ProjectList: React.FC<ProjectListProps> = ({ projects, onSelect }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center mb-6 gap-2">
        <span className="inline-flex items-center justify-center bg-arsd-red/10 rounded-full p-2">
          <svg width="28" height="28" fill="none" stroke="#B91C1C" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/></svg>
        </span>
        <h2 className="text-2xl font-bold text-arsd-red tracking-wide">Projects</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left border-separate border-spacing-y-2">
          <thead>
            <tr className="">
              <th className="py-3 px-4 text-xs font-semibold text-gray-500">Project ID</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-500">Name</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-500">Client</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-500">Location</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-500">Status</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-500">Action</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr
                key={project.id}
                className="bg-white rounded-lg shadow-sm transition-all duration-150 hover:shadow-md hover:bg-yellow-50"
              >
                <td className="py-3 px-4 font-semibold text-arsd-red text-sm rounded-l-lg">{project.id}</td>
                <td className="py-3 px-4 text-gray-900 text-sm">{project.name}</td>
                <td className="py-3 px-4 text-gray-900 text-sm">{project.client}</td>
                <td className="py-3 px-4 text-gray-900 text-sm">{project.location}</td>
                <td className="py-3 px-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                    project.status === "active"
                      ? "bg-green-100 text-green-700 border border-green-300"
                      : "bg-gray-100 text-gray-700 border border-gray-300"
                  }`}>
                    {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                  </span>
                </td>
                <td className="py-3 px-4 rounded-r-lg">
                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-arsd-red text-white rounded-lg hover:bg-yellow-400 hover:text-arsd-red font-semibold text-xs shadow transition-all duration-150"
                    onClick={() => onSelect(project.id)}
                  >
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 12l-6 6V6z"/></svg>
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProjectList;
