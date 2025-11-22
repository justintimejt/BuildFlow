import { NodeTypeConfig, NODE_TYPES } from './nodeTypes';

export const getNodeTypeConfig = (typeId: string): NodeTypeConfig | undefined => {
  return NODE_TYPES.find(nt => nt.id === typeId);
};

export const getDefaultNodeName = (typeId: string): string => {
  const config = getNodeTypeConfig(typeId);
  return config?.defaultName || 'Node';
};

