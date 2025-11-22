import { useNavigate } from 'react-router-dom';
import { FaFolderOpen, FaPlus } from 'react-icons/fa';

export function EmptyState() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-full py-16 px-4">
      <div className="text-center max-w-md">
        <FaFolderOpen className="mx-auto text-6xl text-gray-300 mb-4" />
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">No projects yet</h2>
        <p className="text-gray-500 mb-6">
          Get started by creating your first project. You can start from scratch or use a template.
        </p>
        <button
          onClick={() => navigate('/project/new')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <FaPlus />
          Create New Project
        </button>
      </div>
    </div>
  );
}

