import { Project } from './project';

export type TemplateCategory = 'web-app' | 'microservices' | 'serverless' | 'data-pipeline' | 'e-commerce' | 'other';
export type TemplateComplexity = 'simple' | 'medium' | 'complex';

export interface Template {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  complexity: TemplateComplexity;
  thumbnail?: string;
  project: Project;
  createdAt: string;
  updatedAt: string;
  nodeCount: number;
  edgeCount: number;
}

