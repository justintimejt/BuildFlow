import { useState } from 'react';
import { NODE_TYPES, NODE_CATEGORIES } from '../../nodes/nodeTypes';
import { CategoryFolder } from './CategoryFolder';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface ComponentLibraryProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function ComponentLibrary({ isCollapsed = false, onToggleCollapse }: ComponentLibraryProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  
  // Use prop if provided, otherwise use internal state
  const collapsed = onToggleCollapse !== undefined ? isCollapsed : internalCollapsed;
  const toggleCollapse = onToggleCollapse || (() => setInternalCollapsed(!internalCollapsed));

  if (collapsed) {
    return (
      <div className="h-full bg-gray-50 border-r border-gray-200 relative">
        <button
          onClick={toggleCollapse}
          className="absolute top-4 right-0 translate-x-1/2 z-10 bg-white border border-gray-200 rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors"
          aria-label="Expand sidebar"
        >
          <FaChevronRight className="w-3 h-3 text-gray-600" />
        </button>
      </div>
    );
  }

  // Group nodes by category
  const nodesByCategory = NODE_CATEGORIES.map(category => ({
    ...category,
    nodes: NODE_TYPES.filter(node => node.category === category.id)
  })).filter(category => category.nodes.length > 0);

  return (
    <div className="h-full bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto relative">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Components</h2>
        <button
          onClick={toggleCollapse}
          className="p-1 hover:bg-gray-200 rounded transition-colors"
          aria-label="Collapse sidebar"
        >
          <FaChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
      </div>
      <div className="space-y-1">
        {nodesByCategory.map((category) => (
          <CategoryFolder
            key={category.id}
            categoryId={category.id}
            categoryLabel={category.label}
            nodes={category.nodes}
          />
        ))}
      </div>
    </div>
  );
}

