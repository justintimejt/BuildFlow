import { useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  Node,
  useNodesState,
  useEdgesState,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  NodeTypes,
  ReactFlowInstance
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { CustomNode } from '../../nodes/customNodes';
import { useProjectContext } from '../../contexts/ProjectContext';
import { useReactFlowContext } from '../../contexts/ReactFlowContext';
import { CanvasControls } from '../CanvasControls';
import type { Edge } from '@xyflow/react';

interface CanvasProps {
  onNodeSelect: (nodeId: string | null) => void;
  selectedNodeId: string | null;
}

const nodeTypes: NodeTypes = {
  custom: CustomNode
};

export function Canvas({ onNodeSelect, selectedNodeId }: CanvasProps) {
  const { nodes: projectNodes, edges: projectEdges, addNode, addEdge, deleteNode, deleteEdge, updateNodePosition } = useProjectContext();
  const { setReactFlowInstance } = useReactFlowContext();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);

  // Sync with project state
  useEffect(() => {
    setNodes(projectNodes.map(n => ({ 
      ...n, 
      type: 'custom',
      selected: n.id === selectedNodeId,
      data: {
        ...n.data,
        type: n.type // Preserve original node type in data for CustomNode
      }
    })));
  }, [projectNodes, selectedNodeId, setNodes]);

  useEffect(() => {
    // Apply default styles to edges: smooth, dashed, and animated
    const styledEdges: Edge[] = projectEdges.map(edge => {
      // Convert our custom Edge to React Flow Edge format
      const reactFlowEdge: Edge = {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: 'bezier', // Use bezier curves for smooth, flexible, curvy lines
        animated: true, // Enable animation
        label: edge.label,
        style: {
          strokeDasharray: '8,4', // Dashed line pattern
          stroke: 'rgba(255, 255, 255, 0.6)', // White with 60% opacity for dark theme
          strokeWidth: 2,
          ...(edge.style || {}), // Allow overrides from our custom Edge type
        },
        markerEnd: 'arrowclosed', // Simple string format for React Flow
      };
      return reactFlowEdge;
    });
    setEdges(styledEdges);
  }, [projectEdges, setEdges]);

  const onConnect: OnConnect = useCallback(
    (params) => {
      if (params.source && params.target) {
        addEdge(params.source, params.target);
      }
    },
    [addEdge]
  );

  const onNodesChangeHandler: OnNodesChange = useCallback(
    (changes) => {
      onNodesChange(changes as any);
      changes.forEach((change) => {
        if (change.type === 'remove') {
          deleteNode(change.id);
        } else if (change.type === 'position' && change.position && change.dragging === false) {
          // Update position in project state when dragging ends
          updateNodePosition(change.id, change.position);
        }
      });
    },
    [onNodesChange, deleteNode, updateNodePosition]
  );

  const onEdgesChangeHandler: OnEdgesChange = useCallback(
    (changes) => {
      onEdgesChange(changes as any);
      changes.forEach((change) => {
        if (change.type === 'remove') {
          deleteEdge(change.id);
        }
      });
    },
    [onEdgesChange, deleteEdge]
  );

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onNodeSelect(node.id);
    },
    [onNodeSelect]
  );

  const onPaneClick = useCallback(() => {
    onNodeSelect(null);
  }, [onNodeSelect]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/node-type');
      if (!type || !reactFlowWrapper.current || !reactFlowInstance.current) {
        return;
      }

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.current.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top
      });

      addNode(type, position);
    },
    [addNode]
  );

  const onInit = useCallback((instance: any) => {
    reactFlowInstance.current = instance;
    setReactFlowInstance(instance);
  }, [setReactFlowInstance]);

  // Nodes are already in React Flow format with type set
  // Use useEffect to ensure dimensions are set after mount
  useEffect(() => {
    if (reactFlowWrapper.current) {
      const rect = reactFlowWrapper.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        // Force a re-render if dimensions are zero
        setTimeout(() => {
          if (reactFlowWrapper.current) {
            reactFlowWrapper.current.style.width = '100%';
            reactFlowWrapper.current.style.height = '100%';
          }
        }, 0);
      }
    }
  }, []);

  return (
    <div 
      className="w-full h-full" 
      ref={reactFlowWrapper} 
      id="canvas-container"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChangeHandler}
        onEdgesChange={onEdgesChangeHandler}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onInit={onInit}
        nodeTypes={nodeTypes}
        fitView
        style={{ backgroundColor: '#1d1d1d' }}
      >
        <Background color="#999999" gap={16} />
        <Controls 
          className="react-flow-controls-dark"
        />
        <MiniMap 
          className="react-flow-minimap-dark"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(4px)',
            borderRadius: '0.5rem'
          }}
          nodeColor={(node) => {
            if (node.selected) {
              return 'rgba(255, 255, 255, 0.8)';
            }
            return 'rgba(255, 255, 255, 0.3)';
          }}
          maskColor="rgba(0, 0, 0, 0.5)"
        />
        {/* Canvas Controls - positioned in top-left corner */}
        <Panel position="top-left" className="m-2">
          <CanvasControls />
        </Panel>
      </ReactFlow>
    </div>
  );
}

