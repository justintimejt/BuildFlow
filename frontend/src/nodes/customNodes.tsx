import { Handle, Position, NodeProps } from '@xyflow/react';
import { getNodeTypeConfig } from './nodeTypes';

export interface CustomNodeData extends Record<string, unknown> {
  type: string;
  name: string;
  description?: string;
  attributes?: Record<string, string | number>;
}

export function CustomNode(props: NodeProps) {
  const { data, selected } = props;
  const nodeData = data as CustomNodeData;
  const nodeType = getNodeTypeConfig(nodeData.type);
  const Icon = nodeType?.icon;
  const colorClass = nodeType?.color || 'gray';

  return (
    <div
      className={`px-4 py-3 shadow-2xl rounded-lg border-2 min-w-[150px] bg-white/5 backdrop-blur-sm ${
        selected ? 'border-white/30' : 'border-white/10'
      } transition-all duration-200`}
    >
      <Handle 
        type="target" 
        position={Position.Top} 
        className="w-3 h-3 !bg-white/20 !border-white/30 react-flow-handle-dark"
        style={{ border: '2px solid rgba(255, 255, 255, 0.3)' }}
      />
      <div className="flex items-center gap-2 mb-1">
        {Icon && (
          <div style={{ color: getColorValue(colorClass), fontSize: '1.25rem', display: 'inline-flex' }}>
            <Icon />
          </div>
        )}
        <div className="font-semibold text-sm text-white">{nodeData.name || 'Unnamed'}</div>
      </div>
      {nodeData.description && (
        <div className="text-xs text-white/70 mt-1 line-clamp-2">
          {nodeData.description}
        </div>
      )}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="w-3 h-3 !bg-white/20 !border-white/30 react-flow-handle-dark"
        style={{ border: '2px solid rgba(255, 255, 255, 0.3)' }}
      />
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

