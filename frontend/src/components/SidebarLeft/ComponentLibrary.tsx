import { NODE_TYPES } from '../../nodes/nodeTypes';
import { ComponentItem } from './ComponentItem';

export function ComponentLibrary() {
  return (
    <div className="h-full bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Components</h2>
      <div className="space-y-2">
        {NODE_TYPES.map((nodeType) => (
          <ComponentItem key={nodeType.id} nodeType={nodeType} />
        ))}
      </div>
    </div>
  );
}

