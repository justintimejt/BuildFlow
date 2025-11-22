import { useState } from 'react';
import { FaChevronDown, FaChevronRight } from 'react-icons/fa';
import { ComponentItem } from './ComponentItem';
import { NodeTypeConfig } from '../../nodes/nodeTypes';

interface CategoryFolderProps {
  categoryId: string;
  categoryLabel: string;
  nodes: NodeTypeConfig[];
}

export function CategoryFolder({ categoryId, categoryLabel, nodes }: CategoryFolderProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="mb-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-2 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded transition-colors"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <FaChevronDown className="w-3 h-3 text-gray-500" />
          ) : (
            <FaChevronRight className="w-3 h-3 text-gray-500" />
          )}
          <span>{categoryLabel}</span>
        </div>
        <span className="text-xs text-gray-500">{nodes.length}</span>
      </button>
      {isExpanded && (
        <div className="ml-4 mt-1 space-y-1">
          {nodes.map((nodeType) => (
            <ComponentItem key={nodeType.id} nodeType={nodeType} />
          ))}
        </div>
      )}
    </div>
  );
}

