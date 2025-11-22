# Architecture Templates Documentation

This document provides detailed specifications for pre-built architecture templates that can be used as starting points for system design projects. Each template includes a complete architecture diagram with nodes, edges, use cases, and implementation guidance.

---

## Table of Contents

1. [Three-Tier Web Application](#three-tier-web-application)
2. [High-Availability Microservices](#high-availability-microservices)
3. [Real-Time Analytics Platform](#real-time-analytics-platform)
4. [Multi-Region Cloud Architecture](#multi-region-cloud-architecture)
5. [Event-Driven E-commerce System](#event-driven-e-commerce-system)
6. [Machine Learning Pipeline](#machine-learning-pipeline)
7. [Content Delivery Network (CDN) Architecture](#content-delivery-network-cdn-architecture)
8. [IoT Data Processing System](#iot-data-processing-system)
9. [Blockchain-Based Application](#blockchain-based-application)
10. [Hybrid Cloud Architecture](#hybrid-cloud-architecture)

---

## Three-Tier Web Application

### Overview
A traditional three-tier architecture separating presentation, application logic, and data storage layers. This is the foundation for most web applications.

### Use Cases
- **Corporate websites** with moderate traffic
- **Internal business applications** requiring clear separation of concerns
- **Content management systems** (CMS)
- **Small to medium e-commerce sites**
- **Educational platforms** and learning management systems

### Architecture Components

**Nodes:**
1. **Load Balancer** (Type: `load-balancer`)
   - Position: (400, 100)
   - Description: Distributes incoming traffic across multiple web servers
   - Use: High availability and traffic distribution

2. **Web Server 1** (Type: `web-server`)
   - Position: (200, 250)
   - Description: Handles HTTP requests, serves static content
   - Use: Presentation layer

3. **Web Server 2** (Type: `web-server`)
   - Position: (600, 250)
   - Description: Redundant web server for failover
   - Use: High availability

4. **Application Server 1** (Type: `worker`)
   - Position: (200, 400)
   - Description: Business logic processing
   - Use: Application layer

5. **Application Server 2** (Type: `worker`)
   - Position: (600, 400)
   - Description: Redundant application server
   - Use: Load distribution

6. **Cache Layer** (Type: `cache`)
   - Position: (400, 550)
   - Description: Redis cache for session and frequently accessed data
   - Use: Performance optimization

7. **Primary Database** (Type: `database`)
   - Position: (200, 700)
   - Description: PostgreSQL/MySQL primary database
   - Use: Data persistence

8. **Replica Database** (Type: `database`)
   - Position: (600, 700)
   - Description: Read replica for scaling reads
   - Use: Read scaling and backup

**Edges:**
- Load Balancer → Web Server 1
- Load Balancer → Web Server 2
- Web Server 1 → Application Server 1
- Web Server 2 → Application Server 2
- Application Server 1 → Cache Layer
- Application Server 2 → Cache Layer
- Application Server 1 → Primary Database
- Application Server 2 → Primary Database
- Primary Database → Replica Database

**Complexity:** Medium  
**Category:** web-app  
**Node Count:** 8  
**Edge Count:** 9

---

## High-Availability Microservices

### Overview
A comprehensive microservices architecture with service mesh, API gateway, and distributed data storage. Designed for large-scale applications requiring high availability and scalability.

### Use Cases
- **Large-scale SaaS platforms** with millions of users
- **Financial services applications** requiring high reliability
- **Social media platforms** with high traffic
- **Enterprise applications** with multiple business domains
- **Platform-as-a-Service (PaaS)** offerings

### Architecture Components

**Nodes:**
1. **CDN** (Type: `cdn`)
   - Position: (400, 100)
   - Description: CloudFront/Cloudflare for static content delivery
   - Use: Global content distribution

2. **API Gateway** (Type: `web-server`)
   - Position: (400, 250)
   - Description: Kong/AWS API Gateway for routing and authentication
   - Use: Single entry point, rate limiting, authentication

3. **Load Balancer** (Type: `load-balancer`)
   - Position: (400, 400)
   - Description: Application load balancer
   - Use: Traffic distribution

4. **User Service** (Type: `worker`)
   - Position: (200, 550)
   - Description: Handles user authentication and profile management
   - Use: User domain logic

5. **Order Service** (Type: `worker`)
   - Position: (400, 550)
   - Description: Manages order processing and fulfillment
   - Use: Order domain logic

6. **Payment Service** (Type: `worker`)
   - Position: (600, 550)
   - Description: Processes payments and transactions
   - Use: Payment domain logic

7. **Notification Service** (Type: `worker`)
   - Position: (200, 700)
   - Description: Sends emails, SMS, and push notifications
   - Use: Communication services

8. **Message Broker** (Type: `message-broker`)
   - Position: (400, 700)
   - Description: RabbitMQ/Kafka for asynchronous communication
   - Use: Service communication and event streaming

9. **Cache Cluster** (Type: `cache`)
   - Position: (600, 700)
   - Description: Redis cluster for distributed caching
   - Use: Session storage and caching

10. **User Database** (Type: `database`)
    - Position: (200, 850)
    - Description: Dedicated database for user service
    - Use: User data persistence

11. **Order Database** (Type: `database`)
    - Position: (400, 850)
    - Description: Dedicated database for order service
    - Use: Order data persistence

12. **Payment Database** (Type: `database`)
    - Position: (600, 850)
    - Description: Dedicated database for payment service
    - Use: Transaction data persistence

**Edges:**
- CDN → API Gateway
- API Gateway → Load Balancer
- Load Balancer → User Service
- Load Balancer → Order Service
- Load Balancer → Payment Service
- User Service → Message Broker
- Order Service → Message Broker
- Payment Service → Message Broker
- Message Broker → Notification Service
- User Service → Cache Cluster
- Order Service → Cache Cluster
- Payment Service → Cache Cluster
- User Service → User Database
- Order Service → Order Database
- Payment Service → Payment Database

**Complexity:** Complex  
**Category:** microservices  
**Node Count:** 12  
**Edge Count:** 15

---

## Real-Time Analytics Platform

### Overview
A data processing architecture designed for real-time analytics, streaming data processing, and business intelligence. Handles high-volume data ingestion and provides real-time insights.

### Use Cases
- **Business intelligence dashboards** with live data
- **Financial trading platforms** requiring real-time analysis
- **IoT monitoring systems** processing sensor data
- **Social media analytics** platforms
- **Gaming analytics** for player behavior tracking
- **E-commerce recommendation engines**

### Architecture Components

**Nodes:**
1. **Data Sources** (Type: `storage`)
   - Position: (200, 100)
   - Description: Multiple data sources (APIs, databases, files)
   - Use: Data ingestion

2. **Message Queue** (Type: `queue`)
   - Position: (400, 100)
   - Description: Kafka/Kinesis for high-throughput message streaming
   - Use: Buffering and decoupling

3. **Stream Processor 1** (Type: `worker`)
   - Position: (200, 250)
   - Description: Apache Flink/Spark Streaming for real-time processing
   - Use: Stream processing

4. **Stream Processor 2** (Type: `worker`)
   - Position: (400, 250)
   - Description: Redundant stream processor
   - Use: High availability

5. **Batch Processor** (Type: `worker`)
   - Position: (600, 250)
   - Description: Apache Spark for batch processing
   - Use: Historical data analysis

6. **Time-Series Database** (Type: `database`)
   - Position: (200, 400)
   - Description: InfluxDB/TimescaleDB for time-series data
   - Use: Real-time metrics storage

7. **Data Warehouse** (Type: `database`)
   - Position: (400, 400)
   - Description: Snowflake/Redshift for analytical queries
   - Use: Historical data analysis

8. **Cache Layer** (Type: `cache`)
   - Position: (600, 400)
   - Description: Redis for frequently accessed analytics
   - Use: Fast query responses

9. **Analytics API** (Type: `web-server`)
   - Position: (400, 550)
   - Description: REST API for analytics queries
   - Use: Data access layer

10. **Dashboard Service** (Type: `web-server`)
    - Position: (400, 700)
    - Description: Frontend service for visualization
    - Use: User interface

11. **Monitoring Service** (Type: `monitoring`)
    - Position: (600, 550)
    - Description: Prometheus/Grafana for system monitoring
    - Use: System health tracking

**Edges:**
- Data Sources → Message Queue
- Message Queue → Stream Processor 1
- Message Queue → Stream Processor 2
- Message Queue → Batch Processor
- Stream Processor 1 → Time-Series Database
- Stream Processor 2 → Time-Series Database
- Batch Processor → Data Warehouse
- Time-Series Database → Cache Layer
- Data Warehouse → Cache Layer
- Cache Layer → Analytics API
- Analytics API → Dashboard Service
- Stream Processor 1 → Monitoring Service
- Stream Processor 2 → Monitoring Service

**Complexity:** Complex  
**Category:** data-pipeline  
**Node Count:** 11  
**Edge Count:** 13

---

## Multi-Region Cloud Architecture

### Overview
A globally distributed architecture designed for high availability, disaster recovery, and low latency across multiple geographic regions. Implements active-active or active-passive configurations.

### Use Cases
- **Global SaaS applications** serving users worldwide
- **Financial services** requiring multi-region redundancy
- **Gaming platforms** with global player base
- **Content platforms** with international audience
- **Enterprise applications** with global operations

### Architecture Components

**Nodes:**
1. **Global Load Balancer** (Type: `load-balancer`)
   - Position: (400, 100)
   - Description: Route53/Cloudflare for DNS-based routing
   - Use: Geographic routing

2. **Region 1 CDN** (Type: `cdn`)
   - Position: (200, 250)
   - Description: CDN for North America region
   - Use: Regional content delivery

3. **Region 2 CDN** (Type: `cdn`)
   - Position: (600, 250)
   - Description: CDN for Europe region
   - Use: Regional content delivery

4. **Region 1 API Gateway** (Type: `web-server`)
   - Position: (200, 400)
   - Description: API gateway in Region 1
   - Use: Regional entry point

5. **Region 2 API Gateway** (Type: `web-server`)
   - Position: (600, 400)
   - Description: API gateway in Region 2
   - Use: Regional entry point

6. **Region 1 App Servers** (Type: `worker`)
   - Position: (200, 550)
   - Description: Application servers in Region 1
   - Use: Regional processing

7. **Region 2 App Servers** (Type: `worker`)
   - Position: (600, 550)
   - Description: Application servers in Region 2
   - Use: Regional processing

8. **Global Cache** (Type: `cache`)
   - Position: (400, 700)
   - Description: Distributed Redis cluster across regions
   - Use: Shared cache layer

9. **Region 1 Primary DB** (Type: `database`)
   - Position: (200, 850)
   - Description: Primary database in Region 1
   - Use: Regional data storage

10. **Region 2 Replica DB** (Type: `database`)
    - Position: (600, 850)
    - Description: Replica database in Region 2
    - Use: Disaster recovery and read scaling

11. **Object Storage** (Type: `storage`)
    - Position: (400, 1000)
    - Description: S3/GCS for global file storage
    - Use: Shared storage across regions

**Edges:**
- Global Load Balancer → Region 1 CDN
- Global Load Balancer → Region 2 CDN
- Region 1 CDN → Region 1 API Gateway
- Region 2 CDN → Region 2 API Gateway
- Region 1 API Gateway → Region 1 App Servers
- Region 2 API Gateway → Region 2 App Servers
- Region 1 App Servers → Global Cache
- Region 2 App Servers → Global Cache
- Region 1 App Servers → Region 1 Primary DB
- Region 2 App Servers → Region 2 Replica DB
- Region 1 Primary DB → Region 2 Replica DB
- Region 1 App Servers → Object Storage
- Region 2 App Servers → Object Storage

**Complexity:** Complex  
**Category:** other  
**Node Count:** 11  
**Edge Count:** 13

---

## Event-Driven E-commerce System

### Overview
A modern e-commerce architecture using event-driven patterns for order processing, inventory management, and customer notifications. Designed for high throughput and scalability.

### Use Cases
- **Large e-commerce platforms** (Amazon, eBay style)
- **Marketplace applications** with multiple sellers
- **Flash sale platforms** with high traffic spikes
- **Subscription box services** with recurring orders
- **B2B e-commerce platforms**

### Architecture Components

**Nodes:**
1. **CDN** (Type: `cdn`)
   - Position: (400, 100)
   - Description: CloudFront for static assets
   - Use: Fast content delivery

2. **Web Application** (Type: `web-server`)
   - Position: (400, 250)
   - Description: Frontend application server
   - Use: User interface

3. **API Gateway** (Type: `web-server`)
   - Position: (400, 400)
   - Description: API routing and authentication
   - Use: API management

4. **Product Service** (Type: `worker`)
   - Position: (200, 550)
   - Description: Manages product catalog
   - Use: Product domain

5. **Cart Service** (Type: `worker`)
   - Position: (400, 550)
   - Description: Shopping cart management
   - Use: Cart operations

6. **Order Service** (Type: `worker`)
   - Position: (600, 550)
   - Description: Order processing and management
   - Use: Order domain

7. **Payment Service** (Type: `worker`)
   - Position: (200, 700)
   - Description: Payment processing
   - Use: Payment handling

8. **Inventory Service** (Type: `worker`)
   - Position: (400, 700)
   - Description: Inventory management
   - Use: Stock tracking

9. **Event Bus** (Type: `message-broker`)
   - Position: (600, 700)
   - Description: Kafka/EventBridge for event streaming
   - Use: Event-driven communication

10. **Notification Service** (Type: `worker`)
    - Position: (200, 850)
    - Description: Sends order confirmations and updates
    - Use: Customer communication

11. **Search Service** (Type: `worker`)
    - Position: (400, 850)
    - Description: Elasticsearch for product search
    - Use: Search functionality

12. **Recommendation Engine** (Type: `worker`)
    - Position: (600, 850)
    - Description: ML-based product recommendations
    - Use: Personalization

13. **Product Database** (Type: `database`)
    - Position: (200, 1000)
    - Description: Product catalog database
    - Use: Product data

14. **Order Database** (Type: `database`)
    - Position: (400, 1000)
    - Description: Order history database
    - Use: Order data

15. **Cache Layer** (Type: `cache`)
    - Position: (600, 1000)
    - Description: Redis for session and product cache
    - Use: Performance optimization

**Edges:**
- CDN → Web Application
- Web Application → API Gateway
- API Gateway → Product Service
- API Gateway → Cart Service
- API Gateway → Order Service
- Cart Service → Order Service
- Order Service → Payment Service
- Order Service → Inventory Service
- Order Service → Event Bus
- Event Bus → Notification Service
- Product Service → Search Service
- Product Service → Recommendation Engine
- Product Service → Product Database
- Order Service → Order Database
- Product Service → Cache Layer
- Cart Service → Cache Layer

**Complexity:** Complex  
**Category:** e-commerce  
**Node Count:** 15  
**Edge Count:** 16

---

## Machine Learning Pipeline

### Overview
An end-to-end ML pipeline architecture for model training, deployment, and inference at scale. Supports both batch and real-time predictions.

### Use Cases
- **Recommendation systems** for e-commerce and content platforms
- **Fraud detection** systems for financial services
- **Image recognition** services
- **Natural language processing** applications
- **Predictive analytics** platforms
- **Computer vision** applications

### Architecture Components

**Nodes:**
1. **Data Sources** (Type: `storage`)
   - Position: (200, 100)
   - Description: Training data sources (databases, files, APIs)
   - Use: Data ingestion

2. **Data Pipeline** (Type: `worker`)
   - Position: (400, 100)
   - Description: ETL pipeline for data preprocessing
   - Use: Data preparation

3. **Feature Store** (Type: `database`)
   - Position: (600, 100)
   - Description: Centralized feature storage
   - Use: Feature management

4. **Training Cluster** (Type: `compute-node`)
   - Position: (200, 250)
   - Description: GPU/CPU cluster for model training
   - Use: Model training

5. **Model Registry** (Type: `storage`)
   - Position: (400, 250)
   - Description: MLflow/Model registry for versioning
   - Use: Model management

6. **Batch Inference Service** (Type: `worker`)
   - Position: (200, 400)
   - Description: Processes batch predictions
   - Use: Offline predictions

7. **Real-Time Inference API** (Type: `web-server`)
   - Position: (400, 400)
   - Description: REST API for real-time predictions
   - Use: Online predictions

8. **Model Serving** (Type: `worker`)
   - Position: (600, 400)
   - Description: TensorFlow Serving/SageMaker endpoint
   - Use: Model inference

9. **Monitoring Service** (Type: `monitoring`)
   - Position: (400, 550)
   - Description: Tracks model performance and drift
   - Use: Model monitoring

10. **A/B Testing Service** (Type: `worker`)
    - Position: (200, 550)
    - Description: Manages model experiments
    - Use: Model comparison

11. **Feedback Loop** (Type: `queue`)
    - Position: (600, 550)
    - Description: Collects prediction feedback
    - Use: Continuous improvement

**Edges:**
- Data Sources → Data Pipeline
- Data Pipeline → Feature Store
- Feature Store → Training Cluster
- Training Cluster → Model Registry
- Model Registry → Batch Inference Service
- Model Registry → Real-Time Inference API
- Real-Time Inference API → Model Serving
- Batch Inference Service → Model Serving
- Model Serving → Monitoring Service
- Model Serving → A/B Testing Service
- Model Serving → Feedback Loop
- Feedback Loop → Data Sources

**Complexity:** Complex  
**Category:** other  
**Node Count:** 11  
**Edge Count:** 12

---

## Content Delivery Network (CDN) Architecture

### Overview
A comprehensive CDN architecture for global content distribution with origin servers, edge locations, and intelligent caching strategies.

### Use Cases
- **Video streaming platforms** (Netflix, YouTube style)
- **Software distribution** platforms
- **Gaming platforms** with large file downloads
- **News and media websites** with global audience
- **Mobile app backend** with global users

### Architecture Components

**Nodes:**
1. **Origin Server** (Type: `web-server`)
   - Position: (400, 100)
   - Description: Primary content source
   - Use: Content origin

2. **Edge Location 1** (Type: `cdn`)
   - Position: (200, 250)
   - Description: North America edge cache
   - Use: Regional caching

3. **Edge Location 2** (Type: `cdn`)
   - Position: (400, 250)
   - Description: Europe edge cache
   - Use: Regional caching

4. **Edge Location 3** (Type: `cdn`)
   - Position: (600, 250)
   - Description: Asia-Pacific edge cache
   - Use: Regional caching

5. **Load Balancer** (Type: `load-balancer`)
   - Position: (400, 400)
   - Description: Distributes requests to edge locations
   - Use: Request routing

6. **Media Processing** (Type: `worker`)
   - Position: (200, 550)
   - Description: Video/image transcoding service
   - Use: Content optimization

7. **Storage Backend** (Type: `storage`)
   - Position: (400, 550)
   - Description: S3/GCS for content storage
   - Use: Content persistence

8. **Cache Invalidation Service** (Type: `worker`)
   - Position: (600, 550)
   - Description: Manages cache purging
   - Use: Cache management

9. **Analytics Service** (Type: `monitoring`)
   - Position: (400, 700)
   - Description: Tracks CDN performance
   - Use: Performance monitoring

10. **Database** (Type: `database`)
    - Position: (400, 850)
    - Description: Metadata and configuration database
    - Use: Configuration storage

**Edges:**
- Origin Server → Edge Location 1
- Origin Server → Edge Location 2
- Origin Server → Edge Location 3
- Edge Location 1 → Load Balancer
- Edge Location 2 → Load Balancer
- Edge Location 3 → Load Balancer
- Origin Server → Media Processing
- Media Processing → Storage Backend
- Origin Server → Storage Backend
- Cache Invalidation Service → Edge Location 1
- Cache Invalidation Service → Edge Location 2
- Cache Invalidation Service → Edge Location 3
- Edge Location 1 → Analytics Service
- Edge Location 2 → Analytics Service
- Edge Location 3 → Analytics Service
- Origin Server → Database

**Complexity:** Medium  
**Category:** other  
**Node Count:** 10  
**Edge Count:** 15

---

## IoT Data Processing System

### Overview
An architecture designed to handle massive volumes of IoT sensor data with real-time processing, storage, and analytics capabilities.

### Use Cases
- **Smart city** infrastructure monitoring
- **Industrial IoT** (IIoT) for manufacturing
- **Agricultural monitoring** systems
- **Healthcare IoT** devices
- **Fleet management** and tracking
- **Environmental monitoring** systems

### Architecture Components

**Nodes:**
1. **IoT Devices** (Type: `third-party-api`)
   - Position: (400, 100)
   - Description: Sensors and IoT devices
   - Use: Data generation

2. **IoT Gateway** (Type: `web-server`)
   - Position: (400, 250)
   - Description: Collects and aggregates device data
   - Use: Data collection

3. **Message Queue** (Type: `queue`)
   - Position: (400, 400)
   - Description: Kafka/MQTT broker for message streaming
   - Use: Message buffering

4. **Stream Processor** (Type: `worker`)
   - Position: (200, 550)
   - Description: Real-time data processing
   - Use: Stream analytics

5. **Rule Engine** (Type: `worker`)
   - Position: (400, 550)
   - Description: Applies business rules and triggers alerts
   - Use: Event processing

6. **Time-Series Database** (Type: `database`)
   - Position: (600, 550)
   - Description: InfluxDB for time-series data
   - Use: Historical data storage

7. **Data Lake** (Type: `storage`)
   - Position: (200, 700)
   - Description: S3/Data Lake for raw data storage
   - Use: Long-term storage

8. **Analytics Engine** (Type: `worker`)
   - Position: (400, 700)
   - Description: Batch analytics and ML processing
   - Use: Advanced analytics

9. **Dashboard Service** (Type: `web-server`)
   - Position: (600, 700)
   - Description: Real-time visualization
   - Use: User interface

10. **Alert Service** (Type: `worker`)
    - Position: (400, 850)
    - Description: Sends notifications for anomalies
    - Use: Alerting

11. **Device Management** (Type: `worker`)
    - Position: (200, 850)
    - Description: Manages device configuration
    - Use: Device control

**Edges:**
- IoT Devices → IoT Gateway
- IoT Gateway → Message Queue
- Message Queue → Stream Processor
- Message Queue → Rule Engine
- Stream Processor → Time-Series Database
- Stream Processor → Data Lake
- Rule Engine → Alert Service
- Time-Series Database → Analytics Engine
- Data Lake → Analytics Engine
- Analytics Engine → Dashboard Service
- Time-Series Database → Dashboard Service
- Device Management → IoT Gateway

**Complexity:** Complex  
**Category:** data-pipeline  
**Node Count:** 11  
**Edge Count:** 12

---

## Blockchain-Based Application

### Overview
A decentralized application architecture leveraging blockchain technology for trust, transparency, and immutability.

### Use Cases
- **Cryptocurrency exchanges** and wallets
- **Supply chain tracking** systems
- **Digital identity** management
- **Smart contract** platforms
- **NFT marketplaces**
- **Decentralized finance (DeFi)** applications

### Architecture Components

**Nodes:**
1. **Frontend Application** (Type: `web-server`)
   - Position: (400, 100)
   - Description: User-facing web application
   - Use: User interface

2. **API Gateway** (Type: `web-server`)
   - Position: (400, 250)
   - Description: REST API for application logic
   - Use: API management

3. **Blockchain Node 1** (Type: `compute-node`)
   - Position: (200, 400)
   - Description: Ethereum/Blockchain node
   - Use: Blockchain interaction

4. **Blockchain Node 2** (Type: `compute-node`)
   - Position: (400, 400)
   - Description: Redundant blockchain node
   - Use: High availability

5. **Smart Contract Service** (Type: `worker`)
   - Position: (600, 400)
   - Description: Manages smart contract interactions
   - Use: Contract execution

6. **Wallet Service** (Type: `worker`)
   - Position: (200, 550)
   - Description: Manages user wallets and keys
   - Use: Wallet management

7. **Transaction Queue** (Type: `queue`)
   - Position: (400, 550)
   - Description: Queues blockchain transactions
   - Use: Transaction management

8. **Indexing Service** (Type: `worker`)
   - Position: (600, 550)
   - Description: Indexes blockchain data for queries
   - Use: Data indexing

9. **Relational Database** (Type: `database`)
   - Position: (200, 700)
   - Description: Stores application data
   - Use: Application state

10. **Cache Layer** (Type: `cache`)
    - Position: (400, 700)
    - Description: Caches blockchain queries
    - Use: Performance optimization

11. **IPFS/Storage** (Type: `storage`)
    - Position: (600, 700)
    - Description: Decentralized file storage
    - Use: Content storage

**Edges:**
- Frontend Application → API Gateway
- API Gateway → Blockchain Node 1
- API Gateway → Blockchain Node 2
- API Gateway → Smart Contract Service
- Smart Contract Service → Blockchain Node 1
- Smart Contract Service → Blockchain Node 2
- Wallet Service → Transaction Queue
- Transaction Queue → Blockchain Node 1
- Transaction Queue → Blockchain Node 2
- Blockchain Node 1 → Indexing Service
- Blockchain Node 2 → Indexing Service
- Indexing Service → Relational Database
- API Gateway → Cache Layer
- API Gateway → IPFS/Storage

**Complexity:** Complex  
**Category:** other  
**Node Count:** 11  
**Edge Count:** 14

---

## Hybrid Cloud Architecture

### Overview
A hybrid cloud architecture combining on-premises infrastructure with public cloud services for flexibility, security, and cost optimization.

### Use Cases
- **Enterprise applications** with sensitive data
- **Financial institutions** with compliance requirements
- **Healthcare systems** with HIPAA requirements
- **Government applications** with data sovereignty needs
- **Legacy system modernization** projects

### Architecture Components

**Nodes:**
1. **On-Prem Load Balancer** (Type: `load-balancer`)
   - Position: (200, 100)
   - Description: On-premises load balancer
   - Use: Traffic distribution

2. **On-Prem Web Servers** (Type: `web-server`)
   - Position: (200, 250)
   - Description: On-premises application servers
   - Use: Sensitive data processing

3. **VPN Gateway** (Type: `web-server`)
   - Position: (400, 250)
   - Description: Secure connection to cloud
   - Use: Network connectivity

4. **Cloud API Gateway** (Type: `web-server`)
   - Position: (600, 250)
   - Description: Cloud-based API gateway
   - Use: Public API access

5. **Cloud Compute** (Type: `worker`)
   - Position: (600, 400)
   - Description: Cloud-based compute instances
   - Use: Scalable processing

6. **On-Prem Database** (Type: `database`)
   - Position: (200, 550)
   - Description: On-premises database for sensitive data
   - Use: Secure data storage

7. **Cloud Database** (Type: `database`)
   - Position: (600, 550)
   - Description: Cloud database for non-sensitive data
   - Use: Scalable storage

8. **Data Sync Service** (Type: `worker`)
   - Position: (400, 550)
   - Description: Synchronizes data between on-prem and cloud
   - Use: Data consistency

9. **Cloud Storage** (Type: `storage`)
   - Position: (600, 700)
   - Description: Cloud object storage
   - Use: Backup and archives

10. **On-Prem Cache** (Type: `cache`)
    - Position: (200, 700)
    - Description: On-premises cache
    - Use: Performance optimization

11. **Monitoring Service** (Type: `monitoring`)
    - Position: (400, 700)
    - Description: Unified monitoring across hybrid environment
    - Use: System visibility

**Edges:**
- On-Prem Load Balancer → On-Prem Web Servers
- On-Prem Web Servers → VPN Gateway
- VPN Gateway → Cloud API Gateway
- Cloud API Gateway → Cloud Compute
- On-Prem Web Servers → On-Prem Database
- Cloud Compute → Cloud Database
- On-Prem Database → Data Sync Service
- Cloud Database → Data Sync Service
- Data Sync Service → Cloud Storage
- On-Prem Web Servers → On-Prem Cache
- Cloud Compute → Monitoring Service
- On-Prem Web Servers → Monitoring Service

**Complexity:** Complex  
**Category:** other  
**Node Count:** 11  
**Edge Count:** 12

---

## Template Implementation Guidelines

### Node Positioning Strategy

When implementing these templates, follow these positioning guidelines:

1. **Hierarchical Layout:**
   - Level 0 (y: 100): Entry points (CDN, Load Balancers)
   - Level 1 (y: 250-300): API Gateways, Web Servers
   - Level 2 (y: 400-500): Application Services, Workers
   - Level 3 (y: 550-700): Data Services, Caches
   - Level 4 (y: 700-850): Databases, Storage
   - Level 5 (y: 850+): Backup, Monitoring

2. **Horizontal Spacing:**
   - Same-level nodes: 200px spacing (x: 200, 400, 600, 800)
   - Related nodes: 150px spacing
   - Unrelated nodes: 250px spacing

3. **Visual Flow:**
   - Top to bottom: Request flow
   - Left to right: Service distribution
   - Group related services horizontally

### Edge Connection Patterns

1. **Request Flow:** Entry → Processing → Storage
2. **Service Communication:** Horizontal connections between services
3. **Data Flow:** Services → Databases, Caches
4. **Event Flow:** Services → Message Brokers → Consumers

### Complexity Guidelines

- **Simple:** 3-5 nodes, straightforward connections
- **Medium:** 6-10 nodes, moderate complexity
- **Complex:** 11+ nodes, multiple layers, advanced patterns

### Category Classification

- **web-app:** Traditional web applications
- **microservices:** Distributed service architectures
- **serverless:** Event-driven, function-based architectures
- **data-pipeline:** Data processing and analytics
- **e-commerce:** E-commerce and marketplace systems
- **other:** Specialized architectures (IoT, ML, Blockchain, etc.)

---

## Notes for Implementation

1. **Node IDs:** Use descriptive IDs (e.g., `web-server-1`, `database-primary`)
2. **Node Types:** Match the available node types in the system
3. **Edge Types:** Use `smoothstep` for most connections, `bezier` for complex flows
4. **Descriptions:** Provide clear, concise descriptions for each node
5. **Use Cases:** Document when and why to use each template
6. **Scaling:** Consider how each template can scale horizontally
7. **Security:** Note security considerations for each architecture
8. **Cost:** Consider cost implications for cloud resources

---

**Last Updated:** 2024-XX-XX  
**Version:** 1.0.0  
**Status:** Ready for Implementation

