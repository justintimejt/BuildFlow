import { FaFolderOpen, FaCopy, FaTrash } from 'react-icons/fa';

interface QuickActionsOverlayProps {
  onOpen: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function QuickActionsOverlay({ onOpen, onDuplicate, onDelete }: QuickActionsOverlayProps) {
  return (
    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center rounded-t-lg transition-opacity duration-200">
      <div className="flex gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-light tracking-tight shadow-lg"
          title="Open project"
        >
          <FaFolderOpen />
          Open
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 font-medium shadow-lg"
          title="Duplicate project"
        >
          <FaCopy />
          Duplicate
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 font-medium shadow-lg"
          title="Delete project"
        >
          <FaTrash />
          Delete
        </button>
      </div>
    </div>
  );
}

