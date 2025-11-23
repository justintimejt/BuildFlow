import { 
  FaServer, 
  FaDatabase, 
  FaCog, 
  FaBolt, 
  FaList, 
  FaBox, 
  FaPlug, 
  FaMicrochip,
  FaBalanceScale,
  FaExchangeAlt,
  FaCloud,
  FaChartLine,
  FaRoute,
  FaGlobe,
  FaNetworkWired,
  FaLock,
  FaUserShield,
  FaKey,
  FaShieldAlt,
  FaSearch,
  FaWarehouse,
  FaStream,
  FaTasks,
  FaClock,
  FaFileAlt,
  FaBell,
  FaCheckCircle,
  FaProjectDiagram,
  FaEnvelope,
  FaCodeBranch,
  FaLaptop,
  FaMobileAlt,
  FaCogs
} from 'react-icons/fa';

export interface NodeTypeConfig {
  id: string;
  label: string;
  icon: React.ComponentType;
  color: string;
  defaultName: string;
  category?: string;
}

export interface NodeCategory {
  id: string;
  label: string;
  nodeIds: string[];
}

export const NODE_TYPES: NodeTypeConfig[] = [
  // Compute & Servers
  {
    id: 'web-server',
    label: 'Web Server',
    icon: FaServer,
    color: 'blue',
    defaultName: 'Web Server',
    category: 'compute'
  },
  {
    id: 'compute-node',
    label: 'Compute Node',
    icon: FaMicrochip,
    color: 'gray',
    defaultName: 'Compute Node',
    category: 'compute'
  },
  {
    id: 'worker',
    label: 'Worker',
    icon: FaCog,
    color: 'orange',
    defaultName: 'Worker',
    category: 'compute'
  },
  {
    id: 'serverless-function',
    label: 'Serverless Function',
    icon: FaBolt,
    color: 'purple',
    defaultName: 'Serverless Function',
    category: 'compute'
  },
  // Data & Storage
  {
    id: 'database',
    label: 'Database',
    icon: FaDatabase,
    color: 'green',
    defaultName: 'Database',
    category: 'data'
  },
  {
    id: 'cache',
    label: 'Cache',
    icon: FaBolt,
    color: 'yellow',
    defaultName: 'Cache',
    category: 'data'
  },
  {
    id: 'storage',
    label: 'Storage',
    icon: FaBox,
    color: 'teal',
    defaultName: 'Storage',
    category: 'data'
  },
  {
    id: 'data-warehouse',
    label: 'Data Warehouse',
    icon: FaWarehouse,
    color: 'purple',
    defaultName: 'Data Warehouse',
    category: 'data'
  },
  {
    id: 'search-engine',
    label: 'Search Engine',
    icon: FaSearch,
    color: 'blue',
    defaultName: 'Search Engine',
    category: 'data'
  },
  // Networking
  {
    id: 'load-balancer',
    label: 'Load Balancer',
    icon: FaBalanceScale,
    color: 'indigo',
    defaultName: 'Load Balancer',
    category: 'networking'
  },
  {
    id: 'api-gateway',
    label: 'API Gateway',
    icon: FaRoute,
    color: 'blue',
    defaultName: 'API Gateway',
    category: 'networking'
  },
  {
    id: 'cdn',
    label: 'CDN',
    icon: FaCloud,
    color: 'cyan',
    defaultName: 'CDN',
    category: 'networking'
  },
  {
    id: 'dns',
    label: 'DNS',
    icon: FaGlobe,
    color: 'indigo',
    defaultName: 'DNS',
    category: 'networking'
  },
  {
    id: 'vpc-network',
    label: 'VPC / Network',
    icon: FaNetworkWired,
    color: 'gray',
    defaultName: 'VPC / Network',
    category: 'networking'
  },
  {
    id: 'vpn-link',
    label: 'VPN / Private Link',
    icon: FaLock,
    color: 'blue',
    defaultName: 'VPN / Private Link',
    category: 'networking'
  },
  // Messaging & Queues
  {
    id: 'queue',
    label: 'Queue',
    icon: FaList,
    color: 'purple',
    defaultName: 'Queue',
    category: 'messaging'
  },
  {
    id: 'message-broker',
    label: 'Message Broker',
    icon: FaExchangeAlt,
    color: 'pink',
    defaultName: 'Message Broker',
    category: 'messaging'
  },
  // Security
  {
    id: 'auth-service',
    label: 'Auth Service',
    icon: FaUserShield,
    color: 'green',
    defaultName: 'Auth Service',
    category: 'security'
  },
  {
    id: 'identity-provider',
    label: 'Identity Provider (IdP)',
    icon: FaUserShield,
    color: 'green',
    defaultName: 'Identity Provider',
    category: 'security'
  },
  {
    id: 'secrets-manager',
    label: 'Secrets Manager',
    icon: FaKey,
    color: 'red',
    defaultName: 'Secrets Manager',
    category: 'security'
  },
  {
    id: 'waf',
    label: 'Web Application Firewall',
    icon: FaShieldAlt,
    color: 'red',
    defaultName: 'WAF',
    category: 'security'
  },
  // Observability
  {
    id: 'monitoring',
    label: 'Monitoring Service',
    icon: FaChartLine,
    color: 'amber',
    defaultName: 'Monitoring Service',
    category: 'observability'
  },
  {
    id: 'logging-service',
    label: 'Logging Service',
    icon: FaFileAlt,
    color: 'gray',
    defaultName: 'Logging Service',
    category: 'observability'
  },
  {
    id: 'alerting-service',
    label: 'Alerting / Incident Management',
    icon: FaBell,
    color: 'red',
    defaultName: 'Alerting Service',
    category: 'observability'
  },
  {
    id: 'status-page',
    label: 'Status Page / Health Check',
    icon: FaCheckCircle,
    color: 'green',
    defaultName: 'Status Page',
    category: 'observability'
  },
  // Data Processing
  {
    id: 'stream-processor',
    label: 'Stream Processor',
    icon: FaStream,
    color: 'cyan',
    defaultName: 'Stream Processor',
    category: 'processing'
  },
  {
    id: 'etl-job',
    label: 'ETL / Batch Job',
    icon: FaTasks,
    color: 'orange',
    defaultName: 'ETL Job',
    category: 'processing'
  },
  {
    id: 'scheduler',
    label: 'Scheduler / Cron',
    icon: FaClock,
    color: 'yellow',
    defaultName: 'Scheduler',
    category: 'processing'
  },
  {
    id: 'orchestrator',
    label: 'Workflow Orchestrator',
    icon: FaProjectDiagram,
    color: 'indigo',
    defaultName: 'Orchestrator',
    category: 'processing'
  },
  // Integration
  {
    id: 'third-party-api',
    label: 'Third-party API',
    icon: FaPlug,
    color: 'red',
    defaultName: 'Third-party API',
    category: 'integration'
  },
  {
    id: 'webhook-endpoint',
    label: 'Webhook Endpoint',
    icon: FaCodeBranch,
    color: 'purple',
    defaultName: 'Webhook Endpoint',
    category: 'integration'
  },
  // Communication
  {
    id: 'notification-service',
    label: 'Notification Service',
    icon: FaBell,
    color: 'blue',
    defaultName: 'Notification Service',
    category: 'communication'
  },
  {
    id: 'email-service',
    label: 'Email Service',
    icon: FaEnvelope,
    color: 'blue',
    defaultName: 'Email Service',
    category: 'communication'
  },
  // Clients
  {
    id: 'web-client',
    label: 'Web Client',
    icon: FaLaptop,
    color: 'blue',
    defaultName: 'Web Client',
    category: 'clients'
  },
  {
    id: 'mobile-app',
    label: 'Mobile App',
    icon: FaMobileAlt,
    color: 'indigo',
    defaultName: 'Mobile App',
    category: 'clients'
  },
  {
    id: 'admin-panel',
    label: 'Admin Panel',
    icon: FaCogs,
    color: 'gray',
    defaultName: 'Admin Panel',
    category: 'clients'
  }
];

// Category definitions
export const NODE_CATEGORIES: NodeCategory[] = [
  {
    id: 'compute',
    label: 'Compute & Servers',
    nodeIds: ['web-server', 'compute-node', 'worker', 'serverless-function']
  },
  {
    id: 'data',
    label: 'Data & Storage',
    nodeIds: ['database', 'cache', 'storage', 'data-warehouse', 'search-engine']
  },
  {
    id: 'networking',
    label: 'Networking',
    nodeIds: ['load-balancer', 'api-gateway', 'cdn', 'dns', 'vpc-network', 'vpn-link']
  },
  {
    id: 'messaging',
    label: 'Messaging & Queues',
    nodeIds: ['queue', 'message-broker']
  },
  {
    id: 'security',
    label: 'Security',
    nodeIds: ['auth-service', 'identity-provider', 'secrets-manager', 'waf']
  },
  {
    id: 'observability',
    label: 'Observability',
    nodeIds: ['monitoring', 'logging-service', 'alerting-service', 'status-page']
  },
  {
    id: 'processing',
    label: 'Data Processing',
    nodeIds: ['stream-processor', 'etl-job', 'scheduler', 'orchestrator']
  },
  {
    id: 'integration',
    label: 'Integration',
    nodeIds: ['third-party-api', 'webhook-endpoint']
  },
  {
    id: 'communication',
    label: 'Communication',
    nodeIds: ['notification-service', 'email-service']
  },
  {
    id: 'clients',
    label: 'Clients',
    nodeIds: ['web-client', 'mobile-app', 'admin-panel']
  }
];

export const getNodeTypeConfig = (typeId: string): NodeTypeConfig | undefined => {
  return NODE_TYPES.find(nt => nt.id === typeId);
};

