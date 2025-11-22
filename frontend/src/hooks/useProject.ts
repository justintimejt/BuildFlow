import { useState, useCallback, useRef } from 'react';
import type { Node, Edge, Project } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { PROJECT_VERSION } from '../utils/constants';
import { getDefaultNodeName } from '../nodes/nodeConfig';
import { optimizeLayout, type LayoutAlgorithm } from '../utils/layoutAlgorithms';

interface HistoryState {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
}

const MAX_HISTORY_SIZE = 50;

export const useProject = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  // History management
  const [undoStack, setUndoStack] = useState<HistoryState[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryState[]>([]);
  const isUndoRedoOperation = useRef(false);

  // Save current state to history
  const saveState = useCallback(() => {
    if (isUndoRedoOperation.current) {
      return; // Don't save state during undo/redo operations
    }
    
    const currentState: HistoryState = {
      nodes: JSON.parse(JSON.stringify(nodes)), // Deep copy
      edges: JSON.parse(JSON.stringify(edges)), // Deep copy
      selectedNodeId
    };
    
    setUndoStack(prev => {
      const newStack = [...prev, currentState];
      // Limit history size
      if (newStack.length > MAX_HISTORY_SIZE) {
        return newStack.slice(-MAX_HISTORY_SIZE);
      }
      return newStack;
    });
    
    // Clear redo stack when a new action is performed
    setRedoStack([]);
  }, [nodes, edges, selectedNodeId]);

  // Restore state from history
  const restoreState = useCallback((state: HistoryState) => {
    isUndoRedoOperation.current = true;
    setNodes(state.nodes);
    setEdges(state.edges);
    setSelectedNodeId(state.selectedNodeId);
    // Reset flag after state update
    setTimeout(() => {
      isUndoRedoOperation.current = false;
    }, 0);
  }, []);

  // Undo function
  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    
    const currentState: HistoryState = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
      selectedNodeId
    };
    
    const previousState = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, currentState]);
    
    restoreState(previousState);
  }, [undoStack, nodes, edges, selectedNodeId, restoreState]);

  // Redo function
  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    
    const currentState: HistoryState = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
      selectedNodeId
    };
    
    const nextState = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, currentState]);
    
    restoreState(nextState);
  }, [redoStack, nodes, edges, selectedNodeId, restoreState]);

  const canUndo = undoStack.length > 0;
  const canRedo = redoStack.length > 0;

  const addNode = useCallback((type: string, position: { x: number; y: number }) => {
    saveState();
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
  }, [saveState]);

  const updateNode = useCallback((nodeId: string, updates: Partial<Node['data']>) => {
    saveState();
    setNodes(prev =>
      prev.map(node =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...updates } }
          : node
      )
    );
  }, [saveState]);

  // Track the last node that was being dragged to batch position updates
  const lastDraggedNodeRef = useRef<string | null>(null);
  const dragStartStateRef = useRef<HistoryState | null>(null);

  const updateNodePosition = useCallback((nodeId: string, position: { x: number; y: number }) => {
    // Canvas calls this when dragging ends (dragging === false)
    // Save state before the first position update of a drag session
    if (lastDraggedNodeRef.current !== nodeId) {
      // This is a new drag session - save the state before drag started
      if (lastDraggedNodeRef.current === null && dragStartStateRef.current === null) {
        // First drag in this session - save state
        dragStartStateRef.current = {
          nodes: JSON.parse(JSON.stringify(nodes)),
          edges: JSON.parse(JSON.stringify(edges)),
          selectedNodeId
        };
      }
      lastDraggedNodeRef.current = nodeId;
    }
    
    setNodes(prev =>
      prev.map(node =>
        node.id === nodeId
          ? { ...node, position }
          : node
      )
    );
    
    // Save state after position update completes (when drag ends)
    // Use a small delay to ensure state update is complete
    if (dragStartStateRef.current) {
      const stateToSave = dragStartStateRef.current;
      dragStartStateRef.current = null;
      lastDraggedNodeRef.current = null;
      
      // Save to history after a brief delay to ensure state is updated
      setTimeout(() => {
        setUndoStack(prev => {
          const newStack = [...prev, stateToSave];
          if (newStack.length > MAX_HISTORY_SIZE) {
            return newStack.slice(-MAX_HISTORY_SIZE);
          }
          return newStack;
        });
        setRedoStack([]);
      }, 10);
    }
  }, [nodes, edges, selectedNodeId]);

  const deleteNode = useCallback((nodeId: string) => {
    saveState();
    setNodes(prev => prev.filter(node => node.id !== nodeId));
    setEdges(prev => prev.filter(edge => edge.source !== nodeId && edge.target !== nodeId));
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  }, [selectedNodeId, saveState]);

  const addEdge = useCallback((source: string, target: string) => {
    saveState();
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
        type: 'bezier',
        animated: true,
        style: {
          strokeDasharray: '8,4',
          stroke: '#6366f1',
          strokeWidth: 2,
        },
      };
      return [...prev, newEdge];
    });
  }, [saveState]);

  const deleteEdge = useCallback((edgeId: string) => {
    saveState();
    setEdges(prev => prev.filter(edge => edge.id !== edgeId));
  }, [saveState]);

  const loadProject = useCallback((project: Project) => {
    // Clear history when loading a new project
    setUndoStack([]);
    setRedoStack([]);
    
    // Validate and fix nodes to ensure they all have valid positions
    const validatedNodes = (project.nodes || []).map(node => {
      // Ensure position exists and is valid
      if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
        return {
          ...node,
          position: { x: Math.random() * 400, y: Math.random() * 400 }
        };
      }
      return node;
    });
    
    setNodes(validatedNodes);
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
    saveState();
    setNodes([]);
    setEdges([]);
    setSelectedNodeId(null);
  }, [saveState]);

  type DiagramOperation =
    | { op: "add_node"; payload: { type: string; position?: { x: number; y: number }; data?: Partial<Node['data']>; id?: string; name?: string }; metadata?: { x: number; y: number } }
    | { op: "update_node"; payload: { id: string; data: Partial<Node['data']> } }
    | { op: "delete_node"; payload: { id: string } }
    | { op: "add_edge"; payload: { source: string; target: string; type?: string; id?: string; data?: { label?: string } } }
    | { op: "delete_edge"; payload: { id: string } };

  // Helper function to calculate topological levels for hierarchical layout
  const calculateNodeLevels = useCallback((nodes: Node[], edges: Edge[]): Map<string, number> => {
    const levels = new Map<string, number>();
    
    // Initialize all nodes to level -1 (unassigned)
    nodes.forEach(node => levels.set(node.id, -1));
    
    // Find nodes with no incoming edges (level 0)
    const nodesWithIncoming = new Set(edges.map(e => e.target));
    nodes.forEach(node => {
      if (!nodesWithIncoming.has(node.id)) {
        levels.set(node.id, 0);
      }
    });
    
    // If no nodes are level 0, assign all to level 0
    if (Array.from(levels.values()).every(level => level !== 0)) {
      nodes.forEach(node => levels.set(node.id, 0));
    }
    
    // Calculate levels iteratively
    let changed = true;
    while (changed) {
      changed = false;
      edges.forEach(edge => {
        const sourceLevel = levels.get(edge.source) ?? -1;
        const targetLevel = levels.get(edge.target) ?? -1;
        if (sourceLevel >= 0 && targetLevel < sourceLevel + 1) {
          levels.set(edge.target, sourceLevel + 1);
          changed = true;
        }
      });
    }
    
    // Assign remaining unassigned nodes to max level + 1
    const maxLevel = Math.max(...Array.from(levels.values()));
    nodes.forEach(node => {
      if (levels.get(node.id) === -1) {
        levels.set(node.id, maxLevel + 1);
      }
    });
    
    return levels;
  }, []);

  const applyOperations = useCallback((ops: DiagramOperation[]) => {
    // Save state before applying operations (batch operation)
    if (ops.length > 0) {
      saveState();
    }
    
    // First pass: add all nodes and edges
    const nodesWithoutPositions: string[] = [];
    
    for (const op of ops) {
      switch (op.op) {
        case "add_node":
          // Extract position from metadata if not in payload
          let position: { x: number; y: number } | null = null;
          if (op.payload.position) {
            position = op.payload.position;
          } else if (op.metadata && typeof op.metadata.x === 'number' && typeof op.metadata.y === 'number') {
            position = { x: op.metadata.x, y: op.metadata.y };
          }
          
          // Extract type, name, and ID
          const nodeType = op.payload.type || (op.payload.data as any)?.type || 'default';
          const nodeName = op.payload.name || op.payload.data?.name || getDefaultNodeName(nodeType);
          const nodeId = op.payload.id || uuidv4();
          
          // If position wasn't provided, add node with temporary position, then we'll layout later
          if (!position) {
            nodesWithoutPositions.push(nodeId);
            setNodes(prev => {
              const currentMaxY = prev.length > 0 ? Math.max(...prev.map(n => n.position.y)) : 0;
              const startY = currentMaxY === 0 ? 100 : currentMaxY + 200;
              
              const newNode: Node = {
                id: nodeId,
                type: nodeType,
                position: { x: 400, y: startY }, // Temporary position
                data: {
                  name: nodeName,
                  description: op.payload.data?.description || '',
                  attributes: op.payload.data?.attributes || {},
                  ...op.payload.data
                }
              };
              
              const validatedPrev = prev.map(node => {
                if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
                  return { ...node, position: { x: 400, y: 100 } };
                }
                return node;
              });
              
              return [...validatedPrev, newNode];
            });
          } else {
            // Position was provided, use it
            const newNode: Node = {
              id: nodeId,
              type: nodeType,
              position,
              data: {
                name: nodeName,
                description: op.payload.data?.description || '',
                attributes: op.payload.data?.attributes || {},
                ...op.payload.data
              }
            };
            
            // Ensure newNode has valid position before adding
            if (!newNode.position || typeof newNode.position.x !== 'number' || typeof newNode.position.y !== 'number') {
              newNode.position = { x: 400, y: 100 };
            }
            
            setNodes(prev => {
              // Also validate existing nodes to prevent errors
              const validatedPrev = prev.map(node => {
                if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
                  return { ...node, position: { x: 400, y: 100 } };
                }
                return node;
              });
              return [...validatedPrev, newNode];
            });
          }
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
              id: op.payload.id || uuidv4(),
              source: op.payload.source,
              target: op.payload.target,
              type: 'bezier', // Use bezier curves for smooth, flexible, curvy lines
              label: op.payload.data?.label,
              animated: true,
              style: {
                strokeDasharray: '8,4',
                stroke: '#6366f1',
                strokeWidth: 2,
              },
            };
            return [...prev, newEdge];
          });
          break;
        case "delete_edge":
          setEdges(prev => prev.filter(edge => edge.id !== op.payload.id));
          break;
      }
    }
    
    // After all operations, do hierarchical layout for nodes without positions
    if (nodesWithoutPositions.length > 0) {
      // Use setTimeout to ensure all state updates are complete, then do layout
      setTimeout(() => {
        setEdges(currentEdges => {
          setNodes(currentNodes => {
            // Calculate levels for all nodes
            const levels = calculateNodeLevels(currentNodes, currentEdges);
            
            // Group nodes by level
            const nodesByLevel = new Map<number, Node[]>();
            currentNodes.forEach(node => {
              const level = levels.get(node.id) ?? 0;
              if (!nodesByLevel.has(level)) {
                nodesByLevel.set(level, []);
              }
              nodesByLevel.get(level)!.push(node);
            });
            
            // Calculate positions for each level
            const horizontalSpacing = 200;
            const verticalSpacing = 200;
            const startY = 100;
            
            const repositionedNodes = currentNodes.map(node => {
              // Only reposition nodes that were added without positions
              if (!nodesWithoutPositions.includes(node.id)) {
                return node;
              }
              
              const level = levels.get(node.id) ?? 0;
              const nodesAtLevel = nodesByLevel.get(level) ?? [];
              const indexInLevel = nodesAtLevel.findIndex(n => n.id === node.id);
              
              // Calculate horizontal position (center nodes at same level)
              const totalWidth = (nodesAtLevel.length - 1) * horizontalSpacing;
              const startX = 400 - totalWidth / 2;
              const x = startX + (indexInLevel * horizontalSpacing);
              
              // Calculate vertical position based on level
              const y = startY + (level * verticalSpacing);
              
              return {
                ...node,
                position: { x, y }
              };
            });
            
            return repositionedNodes;
          });
          
          return currentEdges; // Return edges unchanged
        });
      }, 0);
    }
  }, [selectedNodeId, calculateNodeLevels, saveState]);

  const optimizeLayoutFunction = useCallback((
    algorithm: LayoutAlgorithm = 'auto',
    options?: any
  ) => {
    // Save state before layout optimization
    saveState();
    
    const optimizedNodes = optimizeLayout(nodes, edges, algorithm, options);
    
    // Update all node positions (batch update, don't save state for each)
    isUndoRedoOperation.current = true;
    optimizedNodes.forEach(node => {
      setNodes(prev =>
        prev.map(n =>
          n.id === node.id
            ? { ...n, position: node.position }
            : n
        )
      );
    });
    isUndoRedoOperation.current = false;
    
    return optimizedNodes;
  }, [nodes, edges, saveState]);

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
    applyOperations,
    optimizeLayout: optimizeLayoutFunction,
    undo,
    redo,
    canUndo,
    canRedo
  };
};

