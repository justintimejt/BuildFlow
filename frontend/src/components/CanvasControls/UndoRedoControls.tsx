import { FaUndo, FaRedo } from 'react-icons/fa';
import { useProjectContext } from '../../contexts/ProjectContext';

export function UndoRedoControls() {
  const { undo, redo, canUndo, canRedo } = useProjectContext();

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={undo}
        disabled={!canUndo}
        className="w-8 h-8 flex items-center justify-center 
                   rounded-md hover:bg-gray-100 transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed
                   focus:outline-none focus:ring-2 focus:ring-indigo-500"
        title="Undo (Ctrl+Z)"
        aria-label="Undo"
      >
        <FaUndo className="w-4 h-4 text-gray-700" />
      </button>
      
      <button
        onClick={redo}
        disabled={!canRedo}
        className="w-8 h-8 flex items-center justify-center 
                   rounded-md hover:bg-gray-100 transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed
                   focus:outline-none focus:ring-2 focus:ring-indigo-500"
        title="Redo (Ctrl+Y)"
        aria-label="Redo"
      >
        <FaRedo className="w-4 h-4 text-gray-700" />
      </button>
    </div>
  );
}

