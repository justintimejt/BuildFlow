import { useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
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
    setEdges(projectEdges);
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
  }, []);

  // Nodes are already in React Flow format with type set

  return (
    <div className="w-full h-full" ref={reactFlowWrapper} id="canvas-container">
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
        className="bg-gray-100"
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}

