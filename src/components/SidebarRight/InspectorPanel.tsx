import { useState, useEffect } from 'react';
import { useProjectContext } from '../../contexts/ProjectContext';
import { getNodeTypeConfig } from '../../nodes/nodeTypes';

interface InspectorPanelProps {
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
}

export function InspectorPanel({ selectedNodeId, selectedEdgeId }: InspectorPanelProps) {
  const { nodes, edges, updateNode, deleteNode, updateEdge, deleteEdge } = useProjectContext();
  const selectedNode = nodes.find(n => n.id === selectedNodeId);
  const selectedEdge = edges.find(e => e.id === selectedEdgeId);
  const nodeType = selectedNode ? getNodeTypeConfig(selectedNode.type) : null;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [attributes, setAttributes] = useState<Record<string, string | number>>({});

  // Edge style state
  const [edgeType, setEdgeType] = useState<string>('smoothstep');
  const [edgeStyle, setEdgeStyle] = useState<string>('solid');

  useEffect(() => {
    if (selectedNode) {
      setName(selectedNode.data.name || '');
      setDescription(selectedNode.data.description || '');
      setAttributes(selectedNode.data.attributes || {} as Record<string, string | number>);
    }
  }, [selectedNode]);

  useEffect(() => {
    if (selectedEdge) {
      setEdgeType(selectedEdge.type || 'smoothstep');
      const dashArray = selectedEdge.style?.strokeDasharray || '0';
      if (dashArray === '0') {
        setEdgeStyle('solid');
      } else if (dashArray === '5,5') {
        setEdgeStyle('dashed');
      } else if (dashArray === '2,2') {
        setEdgeStyle('dotted');
      } else {
        setEdgeStyle('solid');
      }
    }
  }, [selectedEdge]);

  // Show edge properties if edge is selected
  if (selectedEdge && !selectedNode) {
    const sourceNode = nodes.find(n => n.id === selectedEdge.source);
    const targetNode = nodes.find(n => n.id === selectedEdge.target);

    const handleEdgeTypeChange = (type: string) => {
      setEdgeType(type);
      updateEdge(selectedEdgeId!, { type: type as any });
    };

    const handleEdgeStyleChange = (style: string) => {
      setEdgeStyle(style);
      let strokeDasharray = '0';
      if (style === 'dashed') {
        strokeDasharray = '5,5';
      } else if (style === 'dotted') {
        strokeDasharray = '2,2';
      }
      updateEdge(selectedEdgeId!, {
        style: {
          ...selectedEdge.style,
          strokeDasharray
        }
      });
    };

    const handleDeleteEdge = () => {
      if (window.confirm('Are you sure you want to delete this connection?')) {
        deleteEdge(selectedEdgeId!);
      }
    };

    return (
      <div className="h-full bg-gray-50 border-l border-gray-200 p-4 overflow-y-auto">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Edge Properties</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="edge-source" className="block text-sm font-medium text-gray-700 mb-1">
              Source Node
            </label>
            <input
              id="edge-source"
              type="text"
              value={sourceNode?.data.name || selectedEdge.source}
              disabled
              aria-label="Source Node"
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="edge-target" className="block text-sm font-medium text-gray-700 mb-1">
              Target Node
            </label>
            <input
              id="edge-target"
              type="text"
              value={targetNode?.data.name || selectedEdge.target}
              disabled
              aria-label="Target Node"
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="edge-type" className="block text-sm font-medium text-gray-700 mb-1">
              Line Shape
            </label>
            <select
              id="edge-type"
              value={edgeType}
              onChange={(e) => handleEdgeTypeChange(e.target.value)}
              aria-label="Line Shape"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="smoothstep">Smooth (Rounded)</option>
              <option value="step">Square (Right-Angled)</option>
              <option value="straight">Straight</option>
              <option value="bezier">Bezier (Curved)</option>
            </select>
          </div>

          <div>
            <label htmlFor="edge-style" className="block text-sm font-medium text-gray-700 mb-1">
              Line Style
            </label>
            <select
              id="edge-style"
              value={edgeStyle}
              onChange={(e) => handleEdgeStyleChange(e.target.value)}
              aria-label="Line Style"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
            </select>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={handleDeleteEdge}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Delete Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedNode || !nodeType) {
    return (
      <div className="h-full bg-gray-50 border-l border-gray-200 p-4 flex items-center justify-center">
        <p className="text-gray-500 text-sm">Select a node or connection to edit its properties</p>
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
    <div className="h-full bg-gray-50 border-l border-gray-200 p-4 overflow-y-auto">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div style={{ color: colorValue, fontSize: '1.25rem', display: 'inline-flex' }}>
            <Icon />
          </div>
          <h2 className="text-lg font-semibold text-gray-800">Node Properties</h2>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="node-name" className="block text-sm font-medium text-gray-700 mb-1">
            Node Name *
          </label>
          <input
            id="node-name"
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter node name"
          />
        </div>

        <div>
          <label htmlFor="node-type" className="block text-sm font-medium text-gray-700 mb-1">
            Node Type
          </label>
          <input
            id="node-type"
            type="text"
            value={nodeType.label}
            disabled
            aria-label="Node Type"
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
          />
        </div>

        <div>
          <label htmlFor="node-description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="node-description"
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
                  aria-label={`Attribute key for ${key}`}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                  placeholder="Key"
                />
                <input
                  type="text"
                  value={value}
                  onChange={(e) => handleAttributeChange(key, e.target.value)}
                  aria-label={`Attribute value for ${key}`}
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

