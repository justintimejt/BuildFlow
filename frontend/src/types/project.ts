import { Node } from './node';
import { Edge } from './edge';

export interface Project {
  version: string;
  id?: string;
  name?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  nodes: Node[];
  edges: Edge[];
  tags?: string[];
  isTemplate?: boolean;
  templateId?: string;
}

