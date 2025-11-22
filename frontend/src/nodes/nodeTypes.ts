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
  FaChartLine
} from 'react-icons/fa';

export interface NodeTypeConfig {
  id: string;
  label: string;
  icon: React.ComponentType;
  color: string;
  defaultName: string;
}

export const NODE_TYPES: NodeTypeConfig[] = [
  {
    id: 'web-server',
    label: 'Web Server',
    icon: FaServer,
    color: 'blue',
    defaultName: 'Web Server'
  },
  {
    id: 'database',
    label: 'Database',
    icon: FaDatabase,
    color: 'green',
    defaultName: 'Database'
  },
  {
    id: 'worker',
    label: 'Worker',
    icon: FaCog,
    color: 'orange',
    defaultName: 'Worker'
  },
  {
    id: 'cache',
    label: 'Cache',
    icon: FaBolt,
    color: 'yellow',
    defaultName: 'Cache'
  },
  {
    id: 'queue',
    label: 'Queue',
    icon: FaList,
    color: 'purple',
    defaultName: 'Queue'
  },
  {
    id: 'storage',
    label: 'Storage',
    icon: FaBox,
    color: 'teal',
    defaultName: 'Storage'
  },
  {
    id: 'third-party-api',
    label: 'Third-party API',
    icon: FaPlug,
    color: 'red',
    defaultName: 'Third-party API'
  },
  {
    id: 'compute-node',
    label: 'Compute Node',
    icon: FaMicrochip,
    color: 'gray',
    defaultName: 'Compute Node'
  },
  {
    id: 'load-balancer',
    label: 'Load Balancer',
    icon: FaBalanceScale,
    color: 'indigo',
    defaultName: 'Load Balancer'
  },
  {
    id: 'message-broker',
    label: 'Message Broker',
    icon: FaExchangeAlt,
    color: 'pink',
    defaultName: 'Message Broker'
  },
  {
    id: 'cdn',
    label: 'CDN',
    icon: FaCloud,
    color: 'cyan',
    defaultName: 'CDN'
  },
  {
    id: 'monitoring',
    label: 'Monitoring Service',
    icon: FaChartLine,
    color: 'amber',
    defaultName: 'Monitoring Service'
  }
];

export const getNodeTypeConfig = (typeId: string): NodeTypeConfig | undefined => {
  return NODE_TYPES.find(nt => nt.id === typeId);
};

