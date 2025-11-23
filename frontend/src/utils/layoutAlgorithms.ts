import type { Node, Edge } from '../types';

export type LayoutAlgorithm = 'hierarchical' | 'force' | 'grid' | 'circular' | 'auto';

export interface HierarchicalLayoutOptions {
  horizontalSpacing: number;      // Default: 300
  verticalSpacing: number;        // Default: 250
  minNodeDistance: number;        // Default: 200
  centerAlignment: boolean;        // Default: true
  padding: number;                // Default: 100
}

export interface ForceLayoutOptions {
  iterations: number;             // Default: 300
  strength: number;               // Default: 0.5
  repulsion: number;             // Default: 2000
  centerGravity: number;         // Default: 0.1
  minDistance: number;           // Default: 150
}

export interface GridLayoutOptions {
  columns?: number;              // Auto-calculate if not specified
  cellWidth: number;            // Default: 300
  cellHeight: number;           // Default: 250
  startX: number;              // Default: 100
  startY: number;              // Default: 100
  sortBy: 'type' | 'name' | 'connections'; // Default: 'connections'
}

export interface CircularLayoutOptions {
  radius: number;               // Default: 300
  centerX: number;              // Default: 400
  centerY: number;              // Default: 400
  sortBy: 'connections' | 'type' | 'name'; // Default: 'connections'
}

// Calculate topological levels for hierarchical layout
export function calculateNodeLevels(nodes: Node[], edges: Edge[]): Map<string, number> {
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
  const maxLevel = Math.max(...Array.from(levels.values()), 0);
  nodes.forEach(node => {
    if (levels.get(node.id) === -1) {
      levels.set(node.id, maxLevel + 1);
    }
  });
  
  return levels;
}

// Group nodes by level
function groupNodesByLevel(nodes: Node[], levels: Map<string, number>): Map<number, Node[]> {
  const nodesByLevel = new Map<number, Node[]>();
  nodes.forEach(node => {
    const level = levels.get(node.id) ?? 0;
    if (!nodesByLevel.has(level)) {
      nodesByLevel.set(level, []);
    }
    nodesByLevel.get(level)!.push(node);
  });
  return nodesByLevel;
}

// Calculate optimal spacing based on node count
function calculateOptimalSpacing(
  nodesByLevel: Map<number, Node[]>,
  options: HierarchicalLayoutOptions
): { horizontal: number; vertical: number } {
  const maxNodesAtLevel = Math.max(...Array.from(nodesByLevel.values()).map(nodes => nodes.length), 1);
  
  // Adjust spacing based on node count
  let horizontalSpacing = options.horizontalSpacing;
  let verticalSpacing = options.verticalSpacing;
  
  // If many nodes at a level, slightly reduce spacing (but never below min)
  if (maxNodesAtLevel > 5) {
    horizontalSpacing = Math.max(
      options.minNodeDistance,
      options.horizontalSpacing * (1 - (maxNodesAtLevel - 5) * 0.05)
    );
  }
  
  return { horizontal: horizontalSpacing, vertical: verticalSpacing };
}

// Position nodes by level
function positionNodesByLevel(
  nodes: Node[],
  nodesByLevel: Map<number, Node[]>,
  spacing: { horizontal: number; vertical: number },
  options: HierarchicalLayoutOptions
): Node[] {
  const startY = options.padding;
  
  return nodes.map(node => {
    const level = Array.from(nodesByLevel.entries())
      .find(([_, levelNodes]) => levelNodes.some(n => n.id === node.id))?.[0] ?? 0;
    const nodesAtLevel = nodesByLevel.get(level) ?? [];
    const indexInLevel = nodesAtLevel.findIndex(n => n.id === node.id);
    
    // Calculate horizontal position
    let x: number;
    if (options.centerAlignment) {
      const totalWidth = (nodesAtLevel.length - 1) * spacing.horizontal;
      const startX = 400 - totalWidth / 2;
      x = startX + (indexInLevel * spacing.horizontal);
    } else {
      x = options.padding + (indexInLevel * spacing.horizontal);
    }
    
    // Calculate vertical position based on level
    const y = startY + (level * spacing.vertical);
    
    return {
      ...node,
      position: { x, y }
    };
  });
}

// Center diagram in viewport
function centerDiagram(nodes: Node[], _padding: number): Node[] {
  if (nodes.length === 0) return nodes;
  
  const minX = Math.min(...nodes.map(n => n.position.x));
  const maxX = Math.max(...nodes.map(n => n.position.x));
  const minY = Math.min(...nodes.map(n => n.position.y));
  const maxY = Math.max(...nodes.map(n => n.position.y));
  
  const width = maxX - minX;
  const height = maxY - minY;
  
  // Center around (400, 400) with padding
  const centerX = 400;
  const centerY = 400;
  
  const offsetX = centerX - (minX + width / 2);
  const offsetY = centerY - (minY + height / 2);
  
  return nodes.map(node => ({
    ...node,
    position: {
      x: node.position.x + offsetX,
      y: node.position.y + offsetY
    }
  }));
}

// Hierarchical Layout Algorithm
export function optimizeHierarchicalLayout(
  nodes: Node[],
  edges: Edge[],
  options: Partial<HierarchicalLayoutOptions> = {}
): Node[] {
  if (nodes.length === 0) return nodes;
  
  const defaultOptions: HierarchicalLayoutOptions = {
    horizontalSpacing: 300,
    verticalSpacing: 250,
    minNodeDistance: 200,
    centerAlignment: true,
    padding: 100
  };
  
  const opts = { ...defaultOptions, ...options };
  
  // Handle disconnected components separately
  const components = findConnectedComponents(nodes, edges);
  const allPositionedNodes: Node[] = [];
  let currentXOffset = 0;
  
  components.forEach((componentNodes, componentIndex) => {
    const componentEdges = edges.filter(
      e => componentNodes.some(n => n.id === e.source || n.id === e.target)
    );
    
    // Calculate levels for this component
    const levels = calculateNodeLevels(componentNodes, componentEdges);
    const nodesByLevel = groupNodesByLevel(componentNodes, levels);
    const spacing = calculateOptimalSpacing(nodesByLevel, opts);
    
    // Position nodes
    const positioned = positionNodesByLevel(componentNodes, nodesByLevel, spacing, {
      ...opts,
      padding: componentIndex === 0 ? opts.padding : currentXOffset + opts.padding
    });
    
    // Update offset for next component
    const maxX = Math.max(...positioned.map(n => n.position.x));
    currentXOffset = maxX + opts.horizontalSpacing * 2;
    
    allPositionedNodes.push(...positioned);
  });
  
  // Center the entire diagram
  return centerDiagram(allPositionedNodes, opts.padding);
}

// Find connected components in the graph
function findConnectedComponents(nodes: Node[], edges: Edge[]): Node[][] {
  const visited = new Set<string>();
  const components: Node[][] = [];
  
  function dfs(nodeId: string, component: Node[]) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      component.push(node);
      
      // Visit neighbors
      edges.forEach(edge => {
        if (edge.source === nodeId && !visited.has(edge.target)) {
          dfs(edge.target, component);
        }
        if (edge.target === nodeId && !visited.has(edge.source)) {
          dfs(edge.source, component);
        }
      });
    }
  }
  
  nodes.forEach(node => {
    if (!visited.has(node.id)) {
      const component: Node[] = [];
      dfs(node.id, component);
      components.push(component);
    }
  });
  
  return components;
}

// Force-Directed Layout Algorithm (Simplified)
export function optimizeForceDirectedLayout(
  nodes: Node[],
  edges: Edge[],
  options: Partial<ForceLayoutOptions> = {}
): Node[] {
  if (nodes.length === 0) return nodes;
  
  const defaultOptions: ForceLayoutOptions = {
    iterations: 300,
    strength: 0.5,
    repulsion: 2000,
    centerGravity: 0.1,
    minDistance: 150
  };
  
  const opts = { ...defaultOptions, ...options };
  
  // Initialize positions
  let positions = new Map(nodes.map(n => [n.id, { ...n.position }]));
  let velocities = new Map(nodes.map(n => [n.id, { x: 0, y: 0 }]));
  
  // Center point
  const centerX = 400;
  const centerY = 400;
  
  // Run simulation
  for (let i = 0; i < opts.iterations; i++) {
    const newPositions = new Map(positions);
    const newVelocities = new Map(velocities);
    
    nodes.forEach(node => {
      const pos = positions.get(node.id)!;
      const vel = velocities.get(node.id)!;
      
      let fx = 0;
      let fy = 0;
      
      // Repulsion from other nodes
      nodes.forEach(otherNode => {
        if (node.id === otherNode.id) return;
        const otherPos = positions.get(otherNode.id)!;
        const dx = pos.x - otherPos.x;
        const dy = pos.y - otherPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = opts.repulsion / (distance * distance);
        fx += (dx / distance) * force;
        fy += (dy / distance) * force;
      });
      
      // Attraction along edges
      edges.forEach(edge => {
        if (edge.source === node.id) {
          const targetPos = positions.get(edge.target)!;
          const dx = targetPos.x - pos.x;
          const dy = targetPos.y - pos.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = distance * opts.strength;
          fx += (dx / distance) * force;
          fy += (dy / distance) * force;
        } else if (edge.target === node.id) {
          const sourcePos = positions.get(edge.source)!;
          const dx = sourcePos.x - pos.x;
          const dy = sourcePos.y - pos.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = distance * opts.strength;
          fx += (dx / distance) * force;
          fy += (dy / distance) * force;
        }
      });
      
      // Center gravity
      fx += (centerX - pos.x) * opts.centerGravity;
      fy += (centerY - pos.y) * opts.centerGravity;
      
      // Update velocity (with damping)
      const damping = 0.85;
      vel.x = (vel.x + fx) * damping;
      vel.y = (vel.y + fy) * damping;
      
      // Update position
      const newPos = {
        x: pos.x + vel.x,
        y: pos.y + vel.y
      };
      
      newPositions.set(node.id, newPos);
      newVelocities.set(node.id, vel);
    });
    
    positions = newPositions;
    velocities = newVelocities;
  }
  
  // Apply positions to nodes
  return nodes.map(node => ({
    ...node,
    position: positions.get(node.id) || node.position
  }));
}

// Grid Layout Algorithm
export function optimizeGridLayout(
  nodes: Node[],
  options: Partial<GridLayoutOptions> = {}
): Node[] {
  if (nodes.length === 0) return nodes;
  
  const defaultOptions: GridLayoutOptions = {
    cellWidth: 300,
    cellHeight: 250,
    startX: 100,
    startY: 100,
    sortBy: 'connections'
  };
  
  const opts = { ...defaultOptions, ...options };
  
  // Calculate optimal columns
  const columns = opts.columns || Math.ceil(Math.sqrt(nodes.length));
  
  // Sort nodes
  const sortedNodes = [...nodes];
  if (opts.sortBy === 'type') {
    sortedNodes.sort((a, b) => a.type.localeCompare(b.type));
  } else if (opts.sortBy === 'name') {
    sortedNodes.sort((a, b) => a.data.name.localeCompare(b.data.name));
  }
  // 'connections' is default, no sorting needed
  
  // Position nodes in grid
  return sortedNodes.map((node, index) => {
    const row = Math.floor(index / columns);
    const col = index % columns;
    
    return {
      ...node,
      position: {
        x: opts.startX + col * opts.cellWidth,
        y: opts.startY + row * opts.cellHeight
      }
    };
  });
}

// Circular Layout Algorithm
export function optimizeCircularLayout(
  nodes: Node[],
  edges: Edge[],
  options: Partial<CircularLayoutOptions> = {}
): Node[] {
  if (nodes.length === 0) return nodes;
  
  const defaultOptions: CircularLayoutOptions = {
    radius: 300,
    centerX: 400,
    centerY: 400,
    sortBy: 'connections'
  };
  
  const opts = { ...defaultOptions, ...options };
  
  // Calculate connection counts
  const connectionCounts = new Map<string, number>();
  nodes.forEach(node => connectionCounts.set(node.id, 0));
  edges.forEach(edge => {
    connectionCounts.set(edge.source, (connectionCounts.get(edge.source) || 0) + 1);
    connectionCounts.set(edge.target, (connectionCounts.get(edge.target) || 0) + 1);
  });
  
  // Sort nodes
  const sortedNodes = [...nodes];
  if (opts.sortBy === 'connections') {
    sortedNodes.sort((a, b) => 
      (connectionCounts.get(b.id) || 0) - (connectionCounts.get(a.id) || 0)
    );
  } else if (opts.sortBy === 'type') {
    sortedNodes.sort((a, b) => a.type.localeCompare(b.type));
  } else if (opts.sortBy === 'name') {
    sortedNodes.sort((a, b) => a.data.name.localeCompare(b.data.name));
  }
  
  // Position nodes in circle
  const angleStep = (2 * Math.PI) / sortedNodes.length;
  
  return sortedNodes.map((node, index) => {
    const angle = index * angleStep;
    return {
      ...node,
      position: {
        x: opts.centerX + opts.radius * Math.cos(angle),
        y: opts.centerY + opts.radius * Math.sin(angle)
      }
    };
  });
}

// Auto-select algorithm based on graph characteristics
export function selectOptimalAlgorithm(nodes: Node[], edges: Edge[]): LayoutAlgorithm {
  if (nodes.length === 0) return 'hierarchical';
  if (nodes.length < 10) return 'grid';
  
  // Check if graph is hierarchical (has clear levels)
  const levels = calculateNodeLevels(nodes, edges);
  const levelCount = new Set(levels.values()).size;
  const avgNodesPerLevel = nodes.length / levelCount;
  
  if (levelCount > 2 && avgNodesPerLevel < 5) {
    return 'hierarchical';
  }
  
  // Check edge density
  const maxEdges = nodes.length * (nodes.length - 1) / 2;
  const edgeDensity = edges.length / maxEdges;
  
  if (edgeDensity > 0.3) {
    return 'force';
  }
  
  return 'hierarchical';
}

// Main optimization function
export function optimizeLayout(
  nodes: Node[],
  edges: Edge[],
  algorithm: LayoutAlgorithm = 'auto',
  options?: any
): Node[] {
  if (nodes.length === 0) return nodes;
  
  const selectedAlgorithm = algorithm === 'auto' 
    ? selectOptimalAlgorithm(nodes, edges)
    : algorithm;
  
  switch (selectedAlgorithm) {
    case 'hierarchical':
      return optimizeHierarchicalLayout(nodes, edges, options);
    case 'force':
      return optimizeForceDirectedLayout(nodes, edges, options);
    case 'grid':
      return optimizeGridLayout(nodes, options);
    case 'circular':
      return optimizeCircularLayout(nodes, edges, options);
    default:
      return optimizeHierarchicalLayout(nodes, edges, options);
  }
}

