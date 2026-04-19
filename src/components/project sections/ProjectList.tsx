"use client";
import { useMemo } from "react";
import {
  getStatusBadgeStyling,
  formatStatus,
  calculateProjectListMetrics,
  Project,
} from "@/utils/project-list-utils";
import { ArrowRight } from "lucide-react";

interface ProjectListProps {
  projects: Project[];
  onSelect: (projectId: string) => void;
}

const ProjectList: React.FC<ProjectListProps> = ({ projects, onSelect }) => {
  useMemo(() => calculateProjectListMetrics(projects), [projects]);

  return (
    <div className="bg-card rounded-lg border border-border">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
        <span className="inline-flex items-center justify-center rounded-md bg-primary/10 text-primary p-1.5">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="3" y="7" width="18" height="13" rx="2" />
            <path d="M16 3v4M8 3v4M3 11h18" />
          </svg>
        </span>
        <h2 className="text-h3 font-semibold text-foreground">Projects</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-muted/40 border-b border-border">
            <tr>
              <th className="py-2.5 px-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Project ID</th>
              <th className="py-2.5 px-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Name</th>
              <th className="py-2.5 px-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Client</th>
              <th className="py-2.5 px-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Location</th>
              <th className="py-2.5 px-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Status</th>
              <th className="py-2.5 px-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project: Project) => (
              <tr
                key={project.id}
                className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
              >
                <td className="py-3 px-4 font-mono text-sm text-primary nums">{project.id}</td>
                <td className="py-3 px-4 text-foreground text-sm">{project.name}</td>
                <td className="py-3 px-4 text-foreground text-sm">{project.client}</td>
                <td className="py-3 px-4 text-foreground text-sm">{project.location}</td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${getStatusBadgeStyling(project.status)}`}>
                    {formatStatus(project.status)}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <button
                    className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium hover:bg-[hsl(var(--arsd-red-hover))] transition-colors"
                    onClick={() => onSelect(project.id)}
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
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
