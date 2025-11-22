import { useState, useCallback } from 'react';
import type { Node, Edge, Project } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { PROJECT_VERSION } from '../utils/constants';
import { getDefaultNodeName } from '../nodes/nodeConfig';

export const useProject = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const addNode = useCallback((type: string, position: { x: number; y: number }) => {
    const newNode: Node = {
      id: uuidv4(),
      type,
      position,
      data: {
        name: getDefaultNodeName(type),
        description: '',
        attributes: {}
      }
    };
    setNodes(prev => [...prev, newNode]);
    return newNode.id;
  }, []);

  const updateNode = useCallback((nodeId: string, updates: Partial<Node['data']>) => {
    setNodes(prev =>
      prev.map(node =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...updates } }
          : node
      )
    );
  }, []);

  const updateNodePosition = useCallback((nodeId: string, position: { x: number; y: number }) => {
    setNodes(prev =>
      prev.map(node =>
        node.id === nodeId
          ? { ...node, position }
          : node
      )
    );
  }, []);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes(prev => prev.filter(node => node.id !== nodeId));
    setEdges(prev => prev.filter(edge => edge.source !== nodeId && edge.target !== nodeId));
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  }, [selectedNodeId]);

  const addEdge = useCallback((source: string, target: string) => {
    setEdges(prev => {
      // Check if edge already exists
      const exists = prev.some(
        e => (e.source === source && e.target === target) ||
             (e.source === target && e.target === source)
      );
      if (exists) return prev;

      const newEdge: Edge = {
        id: uuidv4(),
        source,
        target,
        type: 'smoothstep'
      };
      return [...prev, newEdge];
    });
  }, []);

  const deleteEdge = useCallback((edgeId: string) => {
    setEdges(prev => prev.filter(edge => edge.id !== edgeId));
  }, []);

  const loadProject = useCallback((project: Project) => {
    setNodes(project.nodes || []);
    setEdges(project.edges || []);
    setSelectedNodeId(null);
  }, []);

  const getProject = useCallback((): Project => {
    return {
      version: PROJECT_VERSION,
      nodes,
      edges,
      updatedAt: new Date().toISOString()
    };
  }, [nodes, edges]);

  const clearProject = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setSelectedNodeId(null);
  }, []);

  type DiagramOperation =
    | { op: "add_node"; payload: { type: string; position: { x: number; y: number }; data?: Partial<Node['data']> } }
    | { op: "update_node"; payload: { id: string; data: Partial<Node['data']> } }
    | { op: "delete_node"; payload: { id: string } }
    | { op: "add_edge"; payload: { source: string; target: string; type?: string } }
    | { op: "delete_edge"; payload: { id: string } };

  const applyOperations = useCallback((ops: DiagramOperation[]) => {
    for (const op of ops) {
      switch (op.op) {
        case "add_node":
          const newNode: Node = {
            id: uuidv4(),
            type: op.payload.type,
            position: op.payload.position,
            data: {
              name: getDefaultNodeName(op.payload.type),
              description: '',
              attributes: {},
              ...op.payload.data
            }
          };
          setNodes(prev => [...prev, newNode]);
          break;
        case "update_node":
          setNodes(prev =>
            prev.map(node =>
              node.id === op.payload.id
                ? { ...node, data: { ...node.data, ...op.payload.data } }
                : node
            )
          );
          break;
        case "delete_node":
          setNodes(prev => prev.filter(node => node.id !== op.payload.id));
          setEdges(prev => prev.filter(edge => edge.source !== op.payload.id && edge.target !== op.payload.id));
          if (selectedNodeId === op.payload.id) {
            setSelectedNodeId(null);
          }
          break;
        case "add_edge":
          setEdges(prev => {
            const exists = prev.some(
              e => (e.source === op.payload.source && e.target === op.payload.target) ||
                   (e.source === op.payload.target && e.target === op.payload.source)
            );
            if (exists) return prev;
            const newEdge: Edge = {
              id: uuidv4(),
              source: op.payload.source,
              target: op.payload.target,
              type: op.payload.type || 'smoothstep'
            };
            return [...prev, newEdge];
          });
          break;
        case "delete_edge":
          setEdges(prev => prev.filter(edge => edge.id !== op.payload.id));
          break;
      }
    }
  }, [selectedNodeId]);

  return {
    nodes,
    edges,
    selectedNodeId,
    setSelectedNodeId,
    addNode,
    updateNode,
    updateNodePosition,
    deleteNode,
    addEdge,
    deleteEdge,
    loadProject,
    getProject,
    clearProject,
    applyOperations
  };
};

