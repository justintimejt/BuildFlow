import { UndoRedoControls } from './UndoRedoControls';
import { CompactLayoutOptimizer } from './CompactLayoutOptimizer';

export function CanvasControls() {
  return (
    <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm 
                    border border-gray-200 rounded-lg shadow-md p-1.5">
      <UndoRedoControls />
      <div className="w-px h-6 bg-gray-300" />
      <CompactLayoutOptimizer />
    </div>
  );
}

