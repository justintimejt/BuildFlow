import { Project } from '../types';
import { Template } from '../types/template';
import { v4 as uuidv4 } from 'uuid';

// Template 1: Basic Web Application
const BASIC_WEB_APP: Project = {
  version: '1.0.0',
  name: 'Basic Web Application',
  description: 'Simple two-tier architecture with web server and database',
  nodes: [
    {
      id: 'web-server-1',
      type: 'web-server',
      position: { x: 250, y: 150 },
      data: { name: 'Web Server', description: 'Main web server handling HTTP requests' }
    },
    {
      id: 'database-1',
      type: 'database',
      position: { x: 250, y: 350 },
      data: { name: 'Database', description: 'Primary database for data storage' }
    }
  ],
  edges: [
    {
      id: 'edge-1',
      source: 'web-server-1',
      target: 'database-1',
      type: 'smoothstep'
    }
  ]
};

// Template 2: Microservices Architecture
const MICROSERVICES: Project = {
  version: '1.0.0',
  name: 'Microservices Architecture',
  description: 'Distributed microservices with API gateway and load balancer',
  nodes: [
    {
      id: 'api-gateway-1',
      type: 'web-server',
      position: { x: 400, y: 100 },
      data: { name: 'API Gateway', description: 'Entry point for all API requests' }
    },
    {
      id: 'load-balancer-1',
      type: 'web-server',
      position: { x: 200, y: 250 },
      data: { name: 'Load Balancer', description: 'Distributes traffic across services' }
    },
    {
      id: 'service-1',
      type: 'worker',
      position: { x: 100, y: 400 },
      data: { name: 'User Service', description: 'Handles user management' }
    },
    {
      id: 'service-2',
      type: 'worker',
      position: { x: 300, y: 400 },
      data: { name: 'Order Service', description: 'Handles order processing' }
    },
    {
      id: 'cache-1',
      type: 'cache',
      position: { x: 500, y: 250 },
      data: { name: 'Redis Cache', description: 'In-memory cache for fast access' }
    },
    {
      id: 'database-1',
      type: 'database',
      position: { x: 200, y: 550 },
      data: { name: 'Database', description: 'Primary data store' }
    }
  ],
  edges: [
    { id: 'e1', source: 'api-gateway-1', target: 'load-balancer-1', type: 'smoothstep' },
    { id: 'e2', source: 'load-balancer-1', target: 'service-1', type: 'smoothstep' },
    { id: 'e3', source: 'load-balancer-1', target: 'service-2', type: 'smoothstep' },
    { id: 'e4', source: 'api-gateway-1', target: 'cache-1', type: 'smoothstep' },
    { id: 'e5', source: 'service-1', target: 'database-1', type: 'smoothstep' },
    { id: 'e6', source: 'service-2', target: 'database-1', type: 'smoothstep' }
  ]
};

// Template 3: Serverless Architecture
const SERVERLESS: Project = {
  version: '1.0.0',
  name: 'Serverless Architecture',
  description: 'Event-driven serverless architecture with cloud functions',
  nodes: [
    {
      id: 'api-gateway-1',
      type: 'web-server',
      position: { x: 300, y: 100 },
      data: { name: 'API Gateway', description: 'Serverless API endpoint' }
    },
    {
      id: 'lambda-1',
      type: 'worker',
      position: { x: 150, y: 250 },
      data: { name: 'Lambda Function 1', description: 'Processes API requests' }
    },
    {
      id: 'lambda-2',
      type: 'worker',
      position: { x: 450, y: 250 },
      data: { name: 'Lambda Function 2', description: 'Handles background tasks' }
    },
    {
      id: 'dynamodb-1',
      type: 'database',
      position: { x: 150, y: 400 },
      data: { name: 'DynamoDB', description: 'NoSQL database' }
    },
    {
      id: 's3-1',
      type: 'storage',
      position: { x: 450, y: 400 },
      data: { name: 'S3 Storage', description: 'Object storage for files' }
    },
    {
      id: 'cdn-1',
      type: 'web-server',
      position: { x: 300, y: 550 },
      data: { name: 'CloudFront CDN', description: 'Content delivery network' }
    }
  ],
  edges: [
    { id: 'e1', source: 'api-gateway-1', target: 'lambda-1', type: 'smoothstep' },
    { id: 'e2', source: 'api-gateway-1', target: 'lambda-2', type: 'smoothstep' },
    { id: 'e3', source: 'lambda-1', target: 'dynamodb-1', type: 'smoothstep' },
    { id: 'e4', source: 'lambda-2', target: 's3-1', type: 'smoothstep' },
    { id: 'e5', source: 's3-1', target: 'cdn-1', type: 'smoothstep' }
  ]
};

// Template 4: E-commerce Platform
const ECOMMERCE: Project = {
  version: '1.0.0',
  name: 'E-commerce Platform',
  description: 'Full-featured e-commerce architecture with payment integration',
  nodes: [
    {
      id: 'web-server-1',
      type: 'web-server',
      position: { x: 300, y: 100 },
      data: { name: 'Web Server', description: 'Frontend web application' }
    },
    {
      id: 'app-server-1',
      type: 'worker',
      position: { x: 300, y: 250 },
      data: { name: 'Application Server', description: 'Business logic server' }
    },
    {
      id: 'cache-1',
      type: 'cache',
      position: { x: 150, y: 400 },
      data: { name: 'Redis Cache', description: 'Session and product cache' }
    },
    {
      id: 'database-1',
      type: 'database',
      position: { x: 300, y: 400 },
      data: { name: 'Database', description: 'Product and order database' }
    },
    {
      id: 'queue-1',
      type: 'queue',
      position: { x: 450, y: 400 },
      data: { name: 'Message Queue', description: 'Order processing queue' }
    },
    {
      id: 'payment-api-1',
      type: 'third-party-api',
      position: { x: 300, y: 550 },
      data: { name: 'Payment API', description: 'Third-party payment gateway' }
    }
  ],
  edges: [
    { id: 'e1', source: 'web-server-1', target: 'app-server-1', type: 'smoothstep' },
    { id: 'e2', source: 'app-server-1', target: 'cache-1', type: 'smoothstep' },
    { id: 'e3', source: 'app-server-1', target: 'database-1', type: 'smoothstep' },
    { id: 'e4', source: 'app-server-1', target: 'queue-1', type: 'smoothstep' },
    { id: 'e5', source: 'app-server-1', target: 'payment-api-1', type: 'smoothstep' }
  ]
};

// Template 5: Data Pipeline
const DATA_PIPELINE: Project = {
  version: '1.0.0',
  name: 'Data Pipeline',
  description: 'ETL pipeline for data processing and analytics',
  nodes: [
    {
      id: 'data-source-1',
      type: 'storage',
      position: { x: 200, y: 100 },
      data: { name: 'Data Source', description: 'External data source' }
    },
    {
      id: 'queue-1',
      type: 'queue',
      position: { x: 200, y: 250 },
      data: { name: 'Message Queue', description: 'Buffers incoming data' }
    },
    {
      id: 'worker-1',
      type: 'worker',
      position: { x: 100, y: 400 },
      data: { name: 'Worker 1', description: 'Data transformation worker' }
    },
    {
      id: 'worker-2',
      type: 'worker',
      position: { x: 300, y: 400 },
      data: { name: 'Worker 2', description: 'Data transformation worker' }
    },
    {
      id: 'database-1',
      type: 'database',
      position: { x: 200, y: 550 },
      data: { name: 'Data Warehouse', description: 'Processed data storage' }
    },
    {
      id: 'storage-1',
      type: 'storage',
      position: { x: 400, y: 400 },
      data: { name: 'Storage Bucket', description: 'Archived data storage' }
    }
  ],
  edges: [
    { id: 'e1', source: 'data-source-1', target: 'queue-1', type: 'smoothstep' },
    { id: 'e2', source: 'queue-1', target: 'worker-1', type: 'smoothstep' },
    { id: 'e3', source: 'queue-1', target: 'worker-2', type: 'smoothstep' },
    { id: 'e4', source: 'worker-1', target: 'database-1', type: 'smoothstep' },
    { id: 'e5', source: 'worker-2', target: 'database-1', type: 'smoothstep' },
    { id: 'e6', source: 'worker-2', target: 'storage-1', type: 'smoothstep' }
  ]
};

export const TEMPLATES: Template[] = [
  {
    id: 'basic-web-app',
    name: 'Basic Web Application',
    description: 'Simple two-tier architecture with web server and database',
    category: 'web-app',
    complexity: 'simple',
    project: BASIC_WEB_APP,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodeCount: 2,
    edgeCount: 1
  },
  {
    id: 'microservices',
    name: 'Microservices Architecture',
    description: 'Distributed microservices with API gateway and load balancer',
    category: 'microservices',
    complexity: 'complex',
    project: MICROSERVICES,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodeCount: 6,
    edgeCount: 6
  },
  {
    id: 'serverless',
    name: 'Serverless Architecture',
    description: 'Event-driven serverless architecture with cloud functions',
    category: 'serverless',
    complexity: 'medium',
    project: SERVERLESS,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodeCount: 6,
    edgeCount: 5
  },
  {
    id: 'ecommerce',
    name: 'E-commerce Platform',
    description: 'Full-featured e-commerce architecture with payment integration',
    category: 'e-commerce',
    complexity: 'medium',
    project: ECOMMERCE,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodeCount: 6,
    edgeCount: 5
  },
  {
    id: 'data-pipeline',
    name: 'Data Pipeline',
    description: 'ETL pipeline for data processing and analytics',
    category: 'data-pipeline',
    complexity: 'medium',
    project: DATA_PIPELINE,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodeCount: 6,
    edgeCount: 6
  }
];

export const getLocalTemplates = (): Template[] => {
  return TEMPLATES;
};

export const getTemplateById = (id: string): Template | undefined => {
  return TEMPLATES.find(t => t.id === id);
};

export const getTemplatesByCategory = (category: Template['category'] | 'all'): Template[] => {
  if (category === 'all') return TEMPLATES;
  return TEMPLATES.filter(t => t.category === category);
};

