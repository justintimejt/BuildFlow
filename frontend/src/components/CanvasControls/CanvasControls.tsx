import { UndoRedoControls } from './UndoRedoControls';
import { CompactLayoutOptimizer } from './CompactLayoutOptimizer';

export function CanvasControls() {
  return (
    <div className="flex items-center gap-1.5 bg-white/5 backdrop-blur-sm 
                    border border-white/10 rounded-lg shadow-2xl p-1.5">
      <UndoRedoControls />
      <div className="w-px h-6 bg-white/10" />
      <CompactLayoutOptimizer />
    </div>
  );
}

