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
      <div className="h-full bg-black/0 border-r border-white/10 relative backdrop-blur-sm">
        <button
          onClick={toggleCollapse}
          className="absolute top-4 right-0 translate-x-1/2 z-10 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full p-2 shadow-2xl hover:bg-white/10 transition-all duration-200"
          aria-label="Expand sidebar"
        >
          <FaChevronRight className="w-3 h-3 text-white/70" />
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
    <div className="h-full bg-black/0 border-r border-white/10 overflow-y-auto relative backdrop-blur-sm">
      <div className="sticky top-0 bg-black/0 border-b border-white/10 px-4 py-3 z-10 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Components</h2>
        <button
          onClick={toggleCollapse}
            className="p-1.5 hover:bg-white/10 rounded transition-all duration-200"
          aria-label="Collapse sidebar"
        >
            <FaChevronLeft className="w-3.5 h-3.5 text-white/70" />
        </button>
        </div>
      </div>
      <div className="p-3 space-y-0.5">
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

