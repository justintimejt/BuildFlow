import { Node } from './node';
import { Edge } from './edge';

export interface Project {
  version: string;
  name?: string;
  createdAt?: string;
  updatedAt?: string;
  nodes: Node[];
  edges: Edge[];
}

