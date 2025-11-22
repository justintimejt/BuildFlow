import { useState, useCallback } from 'react';
import { Node, Edge, Project } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { PROJECT_VERSION } from '../utils/constants';
import { getDefaultNodeName } from '../nodes/nodeConfig';

export const useProject = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

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
    // Clear edge selection if the deleted node was part of the selected edge
    setSelectedEdgeId(prev => {
      if (!prev) return null;
      const edge = edges.find(e => e.id === prev);
      if (edge && (edge.source === nodeId || edge.target === nodeId)) {
        return null;
      }
      return prev;
    });
  }, [selectedNodeId, edges]);

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
    if (selectedEdgeId === edgeId) {
      setSelectedEdgeId(null);
    }
  }, [selectedEdgeId]);

  const updateEdge = useCallback((edgeId: string, updates: Partial<Edge>) => {
    setEdges(prev =>
      prev.map(edge =>
        edge.id === edgeId
          ? { ...edge, ...updates }
          : edge
      )
    );
  }, []);

  const loadProject = useCallback((project: Project) => {
    setNodes(project.nodes || []);
    setEdges(project.edges || []);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
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
    setSelectedEdgeId(null);
  }, []);

  return {
    nodes,
    edges,
    selectedNodeId,
    setSelectedNodeId,
    selectedEdgeId,
    setSelectedEdgeId,
    addNode,
    updateNode,
    updateNodePosition,
    deleteNode,
    addEdge,
    updateEdge,
    deleteEdge,
    loadProject,
    getProject,
    clearProject
  };
};

