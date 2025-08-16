"use client";

import { projects } from "./data/projectsData";

export default function DashboardPage() {
  const router = useRouter();
  const handleSelectProject = (projectId: string) => {
    router.push(`/dashboard/projects/${projectId}`);
  };
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold mb-4">Project Overview</h1>
      {/* Summary Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <h1 className="text-2xl font-bold mb-4">TO BE DISCUSSED</h1>
      </div>
      {/* Project List Section */}
      <ProjectList projects={projects} onSelect={handleSelectProject} />
    </div>
  );
}
import ProjectList from "./sections/ProjectList";
import { useRouter } from "next/navigation";
