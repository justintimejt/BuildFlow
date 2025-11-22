import { useState } from 'react';
import { NodeTypeConfig } from '../../nodes/nodeTypes';

interface ComponentItemProps {
  nodeType: NodeTypeConfig;
}

export function ComponentItem({ nodeType }: ComponentItemProps) {
  const [isDragging, setIsDragging] = useState(false);

  const Icon = nodeType.icon;
  const colorValue = getColorValue(nodeType.color);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData('application/node-type', nodeType.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`
        flex items-center gap-3 p-3 mb-2 rounded-lg border-2 cursor-grab active:cursor-grabbing
        transition-all hover:shadow-md
        ${isDragging ? 'opacity-50 border-blue-400' : 'border-gray-200 bg-white hover:border-gray-300'}
      `}
    >
      <div style={{ color: colorValue, fontSize: '1.25rem', display: 'inline-flex' }}>
        <Icon />
      </div>
      <span className="text-sm font-medium text-gray-700">{nodeType.label}</span>
    </div>
  );
}

function getColorValue(color: string): string {
  const colorMap: Record<string, string> = {
    blue: '#3b82f6',
    green: '#10b981',
    orange: '#f97316',
    yellow: '#eab308',
    purple: '#a855f7',
    teal: '#14b8a6',
    red: '#ef4444',
    gray: '#6b7280',
    indigo: '#6366f1',
    pink: '#ec4899',
    cyan: '#06b6d4',
    amber: '#f59e0b'
  };
  return colorMap[color] || '#6b7280';
}

