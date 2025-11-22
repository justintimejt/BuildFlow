import { Project } from '../types';
import { Template } from '../types/template';

// Helper function to generate unique edge IDs
let edgeIdCounter = 1;
const generateEdgeId = () => `edge-${edgeIdCounter++}`;

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
      id: generateEdgeId(),
      source: 'web-server-1',
      target: 'database-1',
      type: 'smoothstep'
    }
  ]
};

// Template 2: Three-Tier Web Application
const THREE_TIER_WEB_APP: Project = {
  version: '1.0.0',
  name: 'Three-Tier Web Application',
  description: 'Traditional three-tier architecture with load balancer, web servers, application servers, cache, and databases',
  nodes: [
    {
      id: 'load-balancer-1',
      type: 'load-balancer',
      position: { x: 400, y: 100 },
      data: { name: 'Load Balancer', description: 'Distributes incoming traffic across multiple web servers' }
    },
    {
      id: 'web-server-1',
      type: 'web-server',
      position: { x: 200, y: 250 },
      data: { name: 'Web Server 1', description: 'Handles HTTP requests, serves static content' }
    },
    {
      id: 'web-server-2',
      type: 'web-server',
      position: { x: 600, y: 250 },
      data: { name: 'Web Server 2', description: 'Redundant web server for failover' }
    },
    {
      id: 'app-server-1',
      type: 'worker',
      position: { x: 200, y: 400 },
      data: { name: 'Application Server 1', description: 'Business logic processing' }
    },
    {
      id: 'app-server-2',
      type: 'worker',
      position: { x: 600, y: 400 },
      data: { name: 'Application Server 2', description: 'Redundant application server' }
    },
    {
      id: 'cache-1',
      type: 'cache',
      position: { x: 400, y: 550 },
      data: { name: 'Cache Layer', description: 'Redis cache for session and frequently accessed data' }
    },
    {
      id: 'database-primary',
      type: 'database',
      position: { x: 200, y: 700 },
      data: { name: 'Primary Database', description: 'PostgreSQL/MySQL primary database' }
    },
    {
      id: 'database-replica',
      type: 'database',
      position: { x: 600, y: 700 },
      data: { name: 'Replica Database', description: 'Read replica for scaling reads' }
    }
  ],
  edges: [
    { id: generateEdgeId(), source: 'load-balancer-1', target: 'web-server-1', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'load-balancer-1', target: 'web-server-2', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'web-server-1', target: 'app-server-1', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'web-server-2', target: 'app-server-2', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'app-server-1', target: 'cache-1', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'app-server-2', target: 'cache-1', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'app-server-1', target: 'database-primary', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'app-server-2', target: 'database-primary', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'database-primary', target: 'database-replica', type: 'smoothstep' }
  ]
};

// Template 3: High-Availability Microservices
const HIGH_AVAILABILITY_MICROSERVICES: Project = {
  version: '1.0.0',
  name: 'High-Availability Microservices',
  description: 'Comprehensive microservices architecture with service mesh, API gateway, and distributed data storage',
  nodes: [
    {
      id: 'cdn-1',
      type: 'cdn',
      position: { x: 400, y: 100 },
      data: { name: 'CDN', description: 'CloudFront/Cloudflare for static content delivery' }
    },
    {
      id: 'api-gateway-1',
      type: 'api-gateway',
      position: { x: 400, y: 250 },
      data: { name: 'API Gateway', description: 'Kong/AWS API Gateway for routing and authentication' }
    },
    {
      id: 'load-balancer-1',
      type: 'load-balancer',
      position: { x: 400, y: 400 },
      data: { name: 'Load Balancer', description: 'Application load balancer' }
    },
    {
      id: 'user-service',
      type: 'worker',
      position: { x: 200, y: 550 },
      data: { name: 'User Service', description: 'Handles user authentication and profile management' }
    },
    {
      id: 'order-service',
      type: 'worker',
      position: { x: 400, y: 550 },
      data: { name: 'Order Service', description: 'Manages order processing and fulfillment' }
    },
    {
      id: 'payment-service',
      type: 'worker',
      position: { x: 600, y: 550 },
      data: { name: 'Payment Service', description: 'Processes payments and transactions' }
    },
    {
      id: 'notification-service',
      type: 'notification-service',
      position: { x: 200, y: 700 },
      data: { name: 'Notification Service', description: 'Sends emails, SMS, and push notifications' }
    },
    {
      id: 'message-broker-1',
      type: 'message-broker',
      position: { x: 400, y: 700 },
      data: { name: 'Message Broker', description: 'RabbitMQ/Kafka for asynchronous communication' }
    },
    {
      id: 'cache-cluster',
      type: 'cache',
      position: { x: 600, y: 700 },
      data: { name: 'Cache Cluster', description: 'Redis cluster for distributed caching' }
    },
    {
      id: 'user-database',
      type: 'database',
      position: { x: 200, y: 850 },
      data: { name: 'User Database', description: 'Dedicated database for user service' }
    },
    {
      id: 'order-database',
      type: 'database',
      position: { x: 400, y: 850 },
      data: { name: 'Order Database', description: 'Dedicated database for order service' }
    },
    {
      id: 'payment-database',
      type: 'database',
      position: { x: 600, y: 850 },
      data: { name: 'Payment Database', description: 'Dedicated database for payment service' }
    }
  ],
  edges: [
    { id: generateEdgeId(), source: 'cdn-1', target: 'api-gateway-1', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'api-gateway-1', target: 'load-balancer-1', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'load-balancer-1', target: 'user-service', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'load-balancer-1', target: 'order-service', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'load-balancer-1', target: 'payment-service', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'user-service', target: 'message-broker-1', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'order-service', target: 'message-broker-1', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'payment-service', target: 'message-broker-1', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'message-broker-1', target: 'notification-service', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'user-service', target: 'cache-cluster', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'order-service', target: 'cache-cluster', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'payment-service', target: 'cache-cluster', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'user-service', target: 'user-database', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'order-service', target: 'order-database', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'payment-service', target: 'payment-database', type: 'smoothstep' }
  ]
};

// Template 4: Real-Time Analytics Platform
const REALTIME_ANALYTICS: Project = {
  version: '1.0.0',
  name: 'Real-Time Analytics Platform',
  description: 'Data processing architecture for real-time analytics, streaming data processing, and business intelligence',
  nodes: [
    {
      id: 'data-sources',
      type: 'storage',
      position: { x: 200, y: 100 },
      data: { name: 'Data Sources', description: 'Multiple data sources (APIs, databases, files)' }
    },
    {
      id: 'message-queue-1',
      type: 'queue',
      position: { x: 400, y: 100 },
      data: { name: 'Message Queue', description: 'Kafka/Kinesis for high-throughput message streaming' }
    },
    {
      id: 'stream-processor-1',
      type: 'stream-processor',
      position: { x: 200, y: 250 },
      data: { name: 'Stream Processor 1', description: 'Apache Flink/Spark Streaming for real-time processing' }
    },
    {
      id: 'stream-processor-2',
      type: 'stream-processor',
      position: { x: 400, y: 250 },
      data: { name: 'Stream Processor 2', description: 'Redundant stream processor' }
    },
    {
      id: 'batch-processor',
      type: 'etl-job',
      position: { x: 600, y: 250 },
      data: { name: 'Batch Processor', description: 'Apache Spark for batch processing' }
    },
    {
      id: 'timeseries-db',
      type: 'database',
      position: { x: 200, y: 400 },
      data: { name: 'Time-Series Database', description: 'InfluxDB/TimescaleDB for time-series data' }
    },
    {
      id: 'data-warehouse-1',
      type: 'data-warehouse',
      position: { x: 400, y: 400 },
      data: { name: 'Data Warehouse', description: 'Snowflake/Redshift for analytical queries' }
    },
    {
      id: 'cache-layer-1',
      type: 'cache',
      position: { x: 600, y: 400 },
      data: { name: 'Cache Layer', description: 'Redis for frequently accessed analytics' }
    },
    {
      id: 'analytics-api',
      type: 'web-server',
      position: { x: 400, y: 550 },
      data: { name: 'Analytics API', description: 'REST API for analytics queries' }
    },
    {
      id: 'dashboard-service',
      type: 'web-server',
      position: { x: 400, y: 700 },
      data: { name: 'Dashboard Service', description: 'Frontend service for visualization' }
    },
    {
      id: 'monitoring-service-1',
      type: 'monitoring',
      position: { x: 600, y: 550 },
      data: { name: 'Monitoring Service', description: 'Prometheus/Grafana for system monitoring' }
    }
  ],
  edges: [
    { id: generateEdgeId(), source: 'data-sources', target: 'message-queue-1', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'message-queue-1', target: 'stream-processor-1', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'message-queue-1', target: 'stream-processor-2', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'message-queue-1', target: 'batch-processor', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'stream-processor-1', target: 'timeseries-db', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'stream-processor-2', target: 'timeseries-db', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'batch-processor', target: 'data-warehouse-1', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'timeseries-db', target: 'cache-layer-1', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'data-warehouse-1', target: 'cache-layer-1', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'cache-layer-1', target: 'analytics-api', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'analytics-api', target: 'dashboard-service', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'stream-processor-1', target: 'monitoring-service-1', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'stream-processor-2', target: 'monitoring-service-1', type: 'smoothstep' }
  ]
};

// Template 5: Event-Driven E-commerce System
const EVENT_DRIVEN_ECOMMERCE: Project = {
  version: '1.0.0',
  name: 'Event-Driven E-commerce System',
  description: 'Modern e-commerce architecture using event-driven patterns for order processing, inventory management, and customer notifications',
  nodes: [
    {
      id: 'cdn-2',
      type: 'cdn',
      position: { x: 400, y: 100 },
      data: { name: 'CDN', description: 'CloudFront for static assets' }
    },
    {
      id: 'web-app',
      type: 'web-server',
      position: { x: 400, y: 250 },
      data: { name: 'Web Application', description: 'Frontend application server' }
    },
    {
      id: 'api-gateway-2',
      type: 'api-gateway',
      position: { x: 400, y: 400 },
      data: { name: 'API Gateway', description: 'API routing and authentication' }
    },
    {
      id: 'product-service',
      type: 'worker',
      position: { x: 200, y: 550 },
      data: { name: 'Product Service', description: 'Manages product catalog' }
    },
    {
      id: 'cart-service',
      type: 'worker',
      position: { x: 400, y: 550 },
      data: { name: 'Cart Service', description: 'Shopping cart management' }
    },
    {
      id: 'order-service-2',
      type: 'worker',
      position: { x: 600, y: 550 },
      data: { name: 'Order Service', description: 'Order processing and management' }
    },
    {
      id: 'payment-service-2',
      type: 'worker',
      position: { x: 200, y: 700 },
      data: { name: 'Payment Service', description: 'Payment processing' }
    },
    {
      id: 'inventory-service',
      type: 'worker',
      position: { x: 400, y: 700 },
      data: { name: 'Inventory Service', description: 'Inventory management' }
    },
    {
      id: 'event-bus',
      type: 'message-broker',
      position: { x: 600, y: 700 },
      data: { name: 'Event Bus', description: 'Kafka/EventBridge for event streaming' }
    },
    {
      id: 'notification-service-2',
      type: 'notification-service',
      position: { x: 200, y: 850 },
      data: { name: 'Notification Service', description: 'Sends order confirmations and updates' }
    },
    {
      id: 'search-service',
      type: 'search-engine',
      position: { x: 400, y: 850 },
      data: { name: 'Search Service', description: 'Elasticsearch for product search' }
    },
    {
      id: 'recommendation-engine',
      type: 'worker',
      position: { x: 600, y: 850 },
      data: { name: 'Recommendation Engine', description: 'ML-based product recommendations' }
    },
    {
      id: 'product-database',
      type: 'database',
      position: { x: 200, y: 1000 },
      data: { name: 'Product Database', description: 'Product catalog database' }
    },
    {
      id: 'order-database-2',
      type: 'database',
      position: { x: 400, y: 1000 },
      data: { name: 'Order Database', description: 'Order history database' }
    },
    {
      id: 'cache-layer-2',
      type: 'cache',
      position: { x: 600, y: 1000 },
      data: { name: 'Cache Layer', description: 'Redis for session and product cache' }
    }
  ],
  edges: [
    { id: generateEdgeId(), source: 'cdn-2', target: 'web-app', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'web-app', target: 'api-gateway-2', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'api-gateway-2', target: 'product-service', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'api-gateway-2', target: 'cart-service', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'api-gateway-2', target: 'order-service-2', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'cart-service', target: 'order-service-2', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'order-service-2', target: 'payment-service-2', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'order-service-2', target: 'inventory-service', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'order-service-2', target: 'event-bus', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'event-bus', target: 'notification-service-2', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'product-service', target: 'search-service', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'product-service', target: 'recommendation-engine', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'product-service', target: 'product-database', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'order-service-2', target: 'order-database-2', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'product-service', target: 'cache-layer-2', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'cart-service', target: 'cache-layer-2', type: 'smoothstep' }
  ]
};

// Template 6: Machine Learning Pipeline
const ML_PIPELINE: Project = {
  version: '1.0.0',
  name: 'Machine Learning Pipeline',
  description: 'End-to-end ML pipeline architecture for model training, deployment, and inference at scale',
  nodes: [
    {
      id: 'data-sources-2',
      type: 'storage',
      position: { x: 200, y: 100 },
      data: { name: 'Data Sources', description: 'Training data sources (databases, files, APIs)' }
    },
    {
      id: 'data-pipeline',
      type: 'worker',
      position: { x: 400, y: 100 },
      data: { name: 'Data Pipeline', description: 'ETL pipeline for data preprocessing' }
    },
    {
      id: 'feature-store',
      type: 'database',
      position: { x: 600, y: 100 },
      data: { name: 'Feature Store', description: 'Centralized feature storage' }
    },
    {
      id: 'training-cluster',
      type: 'compute-node',
      position: { x: 200, y: 250 },
      data: { name: 'Training Cluster', description: 'GPU/CPU cluster for model training' }
    },
    {
      id: 'model-registry',
      type: 'storage',
      position: { x: 400, y: 250 },
      data: { name: 'Model Registry', description: 'MLflow/Model registry for versioning' }
    },
    {
      id: 'batch-inference',
      type: 'worker',
      position: { x: 200, y: 400 },
      data: { name: 'Batch Inference Service', description: 'Processes batch predictions' }
    },
    {
      id: 'realtime-inference-api',
      type: 'web-server',
      position: { x: 400, y: 400 },
      data: { name: 'Real-Time Inference API', description: 'REST API for real-time predictions' }
    },
    {
      id: 'model-serving',
      type: 'worker',
      position: { x: 600, y: 400 },
      data: { name: 'Model Serving', description: 'TensorFlow Serving/SageMaker endpoint' }
    },
    {
      id: 'monitoring-service-2',
      type: 'monitoring',
      position: { x: 400, y: 550 },
      data: { name: 'Monitoring Service', description: 'Tracks model performance and drift' }
    },
    {
      id: 'ab-testing-service',
      type: 'worker',
      position: { x: 200, y: 550 },
      data: { name: 'A/B Testing Service', description: 'Manages model experiments' }
    },
    {
      id: 'feedback-loop',
      type: 'queue',
      position: { x: 600, y: 550 },
      data: { name: 'Feedback Loop', description: 'Collects prediction feedback' }
    }
  ],
  edges: [
    { id: generateEdgeId(), source: 'data-sources-2', target: 'data-pipeline', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'data-pipeline', target: 'feature-store', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'feature-store', target: 'training-cluster', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'training-cluster', target: 'model-registry', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'model-registry', target: 'batch-inference', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'model-registry', target: 'realtime-inference-api', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'realtime-inference-api', target: 'model-serving', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'batch-inference', target: 'model-serving', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'model-serving', target: 'monitoring-service-2', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'model-serving', target: 'ab-testing-service', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'model-serving', target: 'feedback-loop', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'feedback-loop', target: 'data-sources-2', type: 'smoothstep' }
  ]
};

// Template 7: IoT Data Processing System
const IOT_DATA_PROCESSING: Project = {
  version: '1.0.0',
  name: 'IoT Data Processing System',
  description: 'Architecture designed to handle massive volumes of IoT sensor data with real-time processing, storage, and analytics',
  nodes: [
    {
      id: 'iot-devices',
      type: 'third-party-api',
      position: { x: 400, y: 100 },
      data: { name: 'IoT Devices', description: 'Sensors and IoT devices' }
    },
    {
      id: 'iot-gateway',
      type: 'web-server',
      position: { x: 400, y: 250 },
      data: { name: 'IoT Gateway', description: 'Collects and aggregates device data' }
    },
    {
      id: 'message-queue-2',
      type: 'queue',
      position: { x: 400, y: 400 },
      data: { name: 'Message Queue', description: 'Kafka/MQTT broker for message streaming' }
    },
    {
      id: 'stream-processor-3',
      type: 'stream-processor',
      position: { x: 200, y: 550 },
      data: { name: 'Stream Processor', description: 'Real-time data processing' }
    },
    {
      id: 'rule-engine',
      type: 'worker',
      position: { x: 400, y: 550 },
      data: { name: 'Rule Engine', description: 'Applies business rules and triggers alerts' }
    },
    {
      id: 'timeseries-db-2',
      type: 'database',
      position: { x: 600, y: 550 },
      data: { name: 'Time-Series Database', description: 'InfluxDB for time-series data' }
    },
    {
      id: 'data-lake',
      type: 'storage',
      position: { x: 200, y: 700 },
      data: { name: 'Data Lake', description: 'S3/Data Lake for raw data storage' }
    },
    {
      id: 'analytics-engine',
      type: 'worker',
      position: { x: 400, y: 700 },
      data: { name: 'Analytics Engine', description: 'Batch analytics and ML processing' }
    },
    {
      id: 'dashboard-service-2',
      type: 'web-server',
      position: { x: 600, y: 700 },
      data: { name: 'Dashboard Service', description: 'Real-time visualization' }
    },
    {
      id: 'alert-service',
      type: 'alerting-service',
      position: { x: 400, y: 850 },
      data: { name: 'Alert Service', description: 'Sends notifications for anomalies' }
    },
    {
      id: 'device-management',
      type: 'worker',
      position: { x: 200, y: 850 },
      data: { name: 'Device Management', description: 'Manages device configuration' }
    }
  ],
  edges: [
    { id: generateEdgeId(), source: 'iot-devices', target: 'iot-gateway', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'iot-gateway', target: 'message-queue-2', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'message-queue-2', target: 'stream-processor-3', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'message-queue-2', target: 'rule-engine', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'stream-processor-3', target: 'timeseries-db-2', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'stream-processor-3', target: 'data-lake', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'rule-engine', target: 'alert-service', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'timeseries-db-2', target: 'analytics-engine', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'data-lake', target: 'analytics-engine', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'analytics-engine', target: 'dashboard-service-2', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'timeseries-db-2', target: 'dashboard-service-2', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'device-management', target: 'iot-gateway', type: 'smoothstep' }
  ]
};

// Keep existing templates
const MICROSERVICES: Project = {
  version: '1.0.0',
  name: 'Microservices Architecture',
  description: 'Distributed microservices with API gateway and load balancer',
  nodes: [
    {
      id: 'api-gateway-3',
      type: 'api-gateway',
      position: { x: 400, y: 100 },
      data: { name: 'API Gateway', description: 'Entry point for all API requests' }
    },
    {
      id: 'load-balancer-2',
      type: 'load-balancer',
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
      id: 'cache-2',
      type: 'cache',
      position: { x: 500, y: 250 },
      data: { name: 'Redis Cache', description: 'In-memory cache for fast access' }
    },
    {
      id: 'database-2',
      type: 'database',
      position: { x: 200, y: 550 },
      data: { name: 'Database', description: 'Primary data store' }
    }
  ],
  edges: [
    { id: generateEdgeId(), source: 'api-gateway-3', target: 'load-balancer-2', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'load-balancer-2', target: 'service-1', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'load-balancer-2', target: 'service-2', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'api-gateway-3', target: 'cache-2', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'service-1', target: 'database-2', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'service-2', target: 'database-2', type: 'smoothstep' }
  ]
};

const SERVERLESS: Project = {
  version: '1.0.0',
  name: 'Serverless Architecture',
  description: 'Event-driven serverless architecture with cloud functions',
  nodes: [
    {
      id: 'api-gateway-4',
      type: 'api-gateway',
      position: { x: 300, y: 100 },
      data: { name: 'API Gateway', description: 'Serverless API endpoint' }
    },
    {
      id: 'lambda-1',
      type: 'serverless-function',
      position: { x: 150, y: 250 },
      data: { name: 'Lambda Function 1', description: 'Processes API requests' }
    },
    {
      id: 'lambda-2',
      type: 'serverless-function',
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
      id: 'cdn-3',
      type: 'cdn',
      position: { x: 300, y: 550 },
      data: { name: 'CloudFront CDN', description: 'Content delivery network' }
    }
  ],
  edges: [
    { id: generateEdgeId(), source: 'api-gateway-4', target: 'lambda-1', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'api-gateway-4', target: 'lambda-2', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'lambda-1', target: 'dynamodb-1', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'lambda-2', target: 's3-1', type: 'smoothstep' },
    { id: generateEdgeId(), source: 's3-1', target: 'cdn-3', type: 'smoothstep' }
  ]
};

const ECOMMERCE: Project = {
  version: '1.0.0',
  name: 'E-commerce Platform',
  description: 'Full-featured e-commerce architecture with payment integration',
  nodes: [
    {
      id: 'web-server-3',
      type: 'web-server',
      position: { x: 300, y: 100 },
      data: { name: 'Web Server', description: 'Frontend web application' }
    },
    {
      id: 'app-server-3',
      type: 'worker',
      position: { x: 300, y: 250 },
      data: { name: 'Application Server', description: 'Business logic server' }
    },
    {
      id: 'cache-3',
      type: 'cache',
      position: { x: 150, y: 400 },
      data: { name: 'Redis Cache', description: 'Session and product cache' }
    },
    {
      id: 'database-3',
      type: 'database',
      position: { x: 300, y: 400 },
      data: { name: 'Database', description: 'Product and order database' }
    },
    {
      id: 'queue-2',
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
    { id: generateEdgeId(), source: 'web-server-3', target: 'app-server-3', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'app-server-3', target: 'cache-3', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'app-server-3', target: 'database-3', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'app-server-3', target: 'queue-2', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'app-server-3', target: 'payment-api-1', type: 'smoothstep' }
  ]
};

const DATA_PIPELINE: Project = {
  version: '1.0.0',
  name: 'Data Pipeline',
  description: 'ETL pipeline for data processing and analytics',
  nodes: [
    {
      id: 'data-source-2',
      type: 'storage',
      position: { x: 200, y: 100 },
      data: { name: 'Data Source', description: 'External data source' }
    },
    {
      id: 'queue-3',
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
      id: 'database-4',
      type: 'database',
      position: { x: 200, y: 550 },
      data: { name: 'Data Warehouse', description: 'Processed data storage' }
    },
    {
      id: 'storage-2',
      type: 'storage',
      position: { x: 400, y: 400 },
      data: { name: 'Storage Bucket', description: 'Archived data storage' }
    }
  ],
  edges: [
    { id: generateEdgeId(), source: 'data-source-2', target: 'queue-3', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'queue-3', target: 'worker-1', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'queue-3', target: 'worker-2', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'worker-1', target: 'database-4', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'worker-2', target: 'database-4', type: 'smoothstep' },
    { id: generateEdgeId(), source: 'worker-2', target: 'storage-2', type: 'smoothstep' }
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
    id: 'three-tier-web-app',
    name: 'Three-Tier Web Application',
    description: 'Traditional three-tier architecture with load balancer, web servers, application servers, cache, and databases',
    category: 'web-app',
    complexity: 'medium',
    project: THREE_TIER_WEB_APP,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodeCount: 8,
    edgeCount: 9
  },
  {
    id: 'high-availability-microservices',
    name: 'High-Availability Microservices',
    description: 'Comprehensive microservices architecture with service mesh, API gateway, and distributed data storage',
    category: 'microservices',
    complexity: 'complex',
    project: HIGH_AVAILABILITY_MICROSERVICES,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodeCount: 12,
    edgeCount: 15
  },
  {
    id: 'realtime-analytics',
    name: 'Real-Time Analytics Platform',
    description: 'Data processing architecture for real-time analytics, streaming data processing, and business intelligence',
    category: 'data-pipeline',
    complexity: 'complex',
    project: REALTIME_ANALYTICS,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodeCount: 11,
    edgeCount: 13
  },
  {
    id: 'event-driven-ecommerce',
    name: 'Event-Driven E-commerce System',
    description: 'Modern e-commerce architecture using event-driven patterns for order processing, inventory management, and customer notifications',
    category: 'e-commerce',
    complexity: 'complex',
    project: EVENT_DRIVEN_ECOMMERCE,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodeCount: 15,
    edgeCount: 16
  },
  {
    id: 'ml-pipeline',
    name: 'Machine Learning Pipeline',
    description: 'End-to-end ML pipeline architecture for model training, deployment, and inference at scale',
    category: 'other',
    complexity: 'complex',
    project: ML_PIPELINE,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodeCount: 11,
    edgeCount: 12
  },
  {
    id: 'iot-data-processing',
    name: 'IoT Data Processing System',
    description: 'Architecture designed to handle massive volumes of IoT sensor data with real-time processing, storage, and analytics',
    category: 'data-pipeline',
    complexity: 'complex',
    project: IOT_DATA_PROCESSING,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodeCount: 11,
    edgeCount: 12
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
