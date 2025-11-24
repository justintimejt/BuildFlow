import { StoredProject } from '../../utils/storage';
import { ProjectCard } from './ProjectCard';

interface ProjectGridProps {
  projects: StoredProject[];
  onOpen: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
  onRename: (id: string, newName: string) => void;
  onExport: (id: string) => void;
}

export function ProjectGrid({
  projects,
  onOpen,
  onDelete,
  onRename,
  onExport
}: ProjectGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-8 p-6">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onOpen={onOpen}
          onDelete={onDelete}
          onRename={onRename}
          onExport={onExport}
        />
      ))}
    </div>
  );
}

