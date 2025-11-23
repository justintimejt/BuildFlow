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
    <div className="mb-0.5">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-white hover:bg-white/10 rounded-md transition-all duration-200 group"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <FaChevronDown className="w-3 h-3 text-white/70 group-hover:text-white transition-colors" />
          ) : (
            <FaChevronRight className="w-3 h-3 text-white/70 group-hover:text-white transition-colors" />
          )}
          <span className="text-white">{categoryLabel}</span>
        </div>
        <span className="text-xs text-white/50 font-normal">{nodes.length}</span>
      </button>
      {isExpanded && (
        <div className="ml-6 mt-0.5 space-y-0.5">
          {nodes.map((nodeType) => (
            <ComponentItem key={nodeType.id} nodeType={nodeType} />
          ))}
        </div>
      )}
    </div>
  );
}

