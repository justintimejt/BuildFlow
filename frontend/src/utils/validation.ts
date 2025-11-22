import { Project, Node, Edge } from '../types';

export const validateNode = (node: Node): boolean => {
  return !!(
    node.id &&
    node.type &&
    node.position &&
    typeof node.position.x === 'number' &&
    typeof node.position.y === 'number' &&
    node.data &&
    node.data.name &&
    typeof node.data.name === 'string' &&
    node.data.name.trim().length > 0
  );
};

export const validateEdge = (edge: Edge): boolean => {
  return !!(
    edge.id &&
    edge.source &&
    edge.target &&
    edge.source !== edge.target
  );
};

export const validateProject = (project: Project): boolean => {
  if (!project.nodes || !project.edges) {
    return false;
  }

  if (!Array.isArray(project.nodes) || !Array.isArray(project.edges)) {
    return false;
  }

  const allNodesValid = project.nodes.every(validateNode);
  const allEdgesValid = project.edges.every(validateEdge);

  if (!allNodesValid || !allEdgesValid) {
    return false;
  }

  // Validate that all edge source/target references exist
  const nodeIds = new Set(project.nodes.map(n => n.id));
  const allEdgeReferencesValid = project.edges.every(
    edge => nodeIds.has(edge.source) && nodeIds.has(edge.target)
  );

  return allEdgeReferencesValid;
};

