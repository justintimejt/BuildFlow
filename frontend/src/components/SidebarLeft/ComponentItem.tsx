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
        flex items-center gap-2.5 px-2.5 py-2 rounded-md border cursor-grab active:cursor-grabbing
        transition-all duration-200
        ${isDragging ? 'opacity-50 border-white/30 bg-white/10' : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'}
      `}
    >
      <div style={{ color: colorValue, fontSize: '0.875rem', display: 'inline-flex' }}>
        <Icon />
      </div>
      <span className="text-xs font-normal text-white/70">{nodeType.label}</span>
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

