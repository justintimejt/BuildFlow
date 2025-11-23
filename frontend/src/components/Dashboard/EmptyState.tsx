import { FaFolderOpen, FaPlus } from 'react-icons/fa';

interface EmptyStateProps {
  onCreateClick: () => void;
}

export function EmptyState({ onCreateClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-16 px-4">
      <div className="text-center max-w-md">
        <FaFolderOpen className="mx-auto text-6xl text-white/30 mb-4" />
        <h2 className="text-2xl font-light tracking-tight text-white mb-2">No projects yet</h2>
        <p className="text-white/70 mb-6">
          Get started by creating your first project. You can start from scratch or use a template.
        </p>
        <button
          onClick={onCreateClick}
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition-all duration-200 font-light tracking-tight shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <FaPlus />
          Create New Project
        </button>
      </div>
    </div>
  );
}

