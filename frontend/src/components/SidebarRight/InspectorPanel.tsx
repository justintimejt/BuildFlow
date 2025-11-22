import { useState, useEffect } from 'react';
import { useProjectContext } from '../../contexts/ProjectContext';
import { getNodeTypeConfig } from '../../nodes/nodeTypes';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface InspectorPanelProps {
  selectedNodeId: string | null;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function InspectorPanel({ selectedNodeId, isCollapsed = false, onToggleCollapse }: InspectorPanelProps) {
  const { nodes, updateNode, deleteNode } = useProjectContext();
  const selectedNode = nodes.find(n => n.id === selectedNodeId);
  const nodeType = selectedNode ? getNodeTypeConfig(selectedNode.type) : null;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [attributes, setAttributes] = useState<Record<string, string | number>>({});
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  
  // Use prop if provided, otherwise use internal state
  const collapsed = onToggleCollapse !== undefined ? isCollapsed : internalCollapsed;
  const toggleCollapse = onToggleCollapse || (() => setInternalCollapsed(!internalCollapsed));

  useEffect(() => {
    if (selectedNode) {
      setName(selectedNode.data.name || '');
      setDescription(selectedNode.data.description || '');
      setAttributes(selectedNode.data.attributes || {} as Record<string, string | number>);
    }
  }, [selectedNode]);

  if (collapsed) {
    return (
      <div className="h-full bg-gray-50 border-l border-gray-200 relative">
        <button
          onClick={toggleCollapse}
          className="absolute top-4 left-0 -translate-x-1/2 z-10 bg-white border border-gray-200 rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors"
          aria-label="Expand sidebar"
        >
          <FaChevronLeft className="w-3 h-3 text-gray-600" />
        </button>
      </div>
    );
  }

  if (!selectedNode || !nodeType) {
    return (
      <div className="h-full bg-gray-50 border-l border-gray-200 p-4 flex items-center justify-center relative">
        <button
          onClick={toggleCollapse}
          className="absolute top-4 left-4 p-1 hover:bg-gray-200 rounded transition-colors"
          aria-label="Collapse sidebar"
        >
          <FaChevronRight className="w-4 h-4 text-gray-600" />
        </button>
        <p className="text-gray-500 text-sm">Select a node to edit its properties</p>
      </div>
    );
  }

  const handleNameChange = (value: string) => {
    setName(value);
    if (value.trim()) {
      updateNode(selectedNodeId!, { name: value });
    }
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    updateNode(selectedNodeId!, { description: value });
  };

  const handleAttributeChange = (key: string, value: string) => {
    const newAttributes = { ...attributes, [key]: value };
    setAttributes(newAttributes);
    updateNode(selectedNodeId!, { attributes: newAttributes });
  };

  const handleAddAttribute = () => {
    const newKey = `attribute_${Object.keys(attributes).length + 1}`;
    handleAttributeChange(newKey, '');
  };

  const handleRemoveAttribute = (key: string) => {
    const newAttributes = { ...attributes };
    delete newAttributes[key];
    setAttributes(newAttributes);
    updateNode(selectedNodeId!, { attributes: newAttributes });
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this node?')) {
      deleteNode(selectedNodeId!);
    }
  };

  const Icon = nodeType.icon;
  const colorValue = getColorValue(nodeType.color);

  return (
    <div className="h-full bg-gray-50 border-l border-gray-200 p-4 overflow-y-auto relative">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div style={{ color: colorValue, fontSize: '1.25rem', display: 'inline-flex' }}>
              <Icon />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">Node Properties</h2>
          </div>
          <button
            onClick={toggleCollapse}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            aria-label="Collapse sidebar"
          >
            <FaChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Node Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter node name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Node Type
          </label>
          <input
            type="text"
            value={nodeType.label}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter description..."
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Custom Attributes
            </label>
            <button
              onClick={handleAddAttribute}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              + Add
            </button>
          </div>
          <div className="space-y-2">
            {Object.entries(attributes).map(([key, value]) => (
              <div key={key} className="flex gap-2">
                <input
                  type="text"
                  value={key}
                  onChange={(e) => {
                    const newAttributes = { ...attributes };
                    delete newAttributes[key];
                    newAttributes[e.target.value] = value;
                    setAttributes(newAttributes);
                    updateNode(selectedNodeId!, { attributes: newAttributes });
                  }}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                  placeholder="Key"
                />
                <input
                  type="text"
                  value={value}
                  onChange={(e) => handleAttributeChange(key, e.target.value)}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                  placeholder="Value"
                />
                <button
                  onClick={() => handleRemoveAttribute(key)}
                  className="px-2 py-1 text-sm text-red-600 hover:text-red-800"
                >
                  ×
                </button>
              </div>
            ))}
            {Object.keys(attributes).length === 0 && (
              <p className="text-sm text-gray-500">No custom attributes</p>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={handleDelete}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Delete Node
          </button>
        </div>
      </div>
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

