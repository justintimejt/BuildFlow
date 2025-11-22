from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Literal
from ..supabase_client import supabase
from ..env import Env
import google.generativeai as genai
import traceback
import uuid
import json
import re
from postgrest.exceptions import APIError

# Configure Gemini API - handle errors gracefully
try:
    if Env.GEMINI_API_KEY:
        genai.configure(api_key=Env.GEMINI_API_KEY)
    else:
        print("⚠️  Warning: GOOGLE_GEMINI_API_KEY not set in backend/.env")
except Exception as e:
    print(f"⚠️  Warning: Failed to configure Gemini API: {e}")

router = APIRouter()

# All available node types that can be created in the diagram
# Each node type includes its ID, label, description, and common use cases
# This list must stay in sync with frontend/src/nodes/nodeTypes.ts
AVAILABLE_NODE_TYPES = [
    {
        "id": "web-server",
        "label": "Web Server",
        "description": "Serves HTTP/HTTPS requests and hosts web applications. Handles incoming client requests and serves responses.",
        "use_cases": [
            "Hosting web applications and APIs",
            "Serving static content",
            "Handling HTTP/HTTPS requests",
            "Application servers for business logic"
        ]
    },
    {
        "id": "database",
        "label": "Database",
        "description": "Stores and manages structured data persistently. Provides data persistence and query capabilities.",
        "use_cases": [
            "Storing application data",
            "User data and authentication",
            "Transaction records",
            "Relational or NoSQL data storage"
        ]
    },
    {
        "id": "worker",
        "label": "Worker",
        "description": "Background processing service that handles asynchronous tasks and long-running operations.",
        "use_cases": [
            "Background job processing",
            "Image/video processing",
            "Data transformation tasks",
            "Scheduled tasks and cron jobs"
        ]
    },
    {
        "id": "cache",
        "label": "Cache",
        "description": "High-speed temporary storage for frequently accessed data to improve performance and reduce latency.",
        "use_cases": [
            "Caching database query results",
            "Session storage",
            "API response caching",
            "Reducing database load"
        ]
    },
    {
        "id": "queue",
        "label": "Queue",
        "description": "Message queue system that enables asynchronous communication and task distribution between services.",
        "use_cases": [
            "Task queuing and processing",
            "Decoupling services",
            "Handling peak loads",
            "Reliable message delivery"
        ]
    },
    {
        "id": "storage",
        "label": "Storage",
        "description": "Object storage or file storage system for storing files, media, and unstructured data.",
        "use_cases": [
            "File storage (images, documents)",
            "Object storage (S3-style)",
            "Media files and assets",
            "Backup and archival storage"
        ]
    },
    {
        "id": "third-party-api",
        "label": "Third-party API",
        "description": "External service or API that your system integrates with. Represents dependencies on external services.",
        "use_cases": [
            "Payment processing APIs",
            "Authentication services (OAuth)",
            "Email/SMS services",
            "External data providers"
        ]
    },
    {
        "id": "compute-node",
        "label": "Compute Node",
        "description": "Generic compute resource for processing tasks, running containers, or executing code.",
        "use_cases": [
            "Container orchestration nodes",
            "Serverless function execution",
            "Batch processing",
            "General-purpose compute resources"
        ]
    },
    {
        "id": "load-balancer",
        "label": "Load Balancer",
        "description": "Distributes incoming network traffic across multiple servers to ensure high availability and performance.",
        "use_cases": [
            "Distributing traffic across web servers",
            "High availability and redundancy",
            "SSL termination",
            "Traffic routing and health checks"
        ]
    },
    {
        "id": "message-broker",
        "label": "Message Broker",
        "description": "Middleware that enables communication between distributed systems using publish-subscribe or message queue patterns.",
        "use_cases": [
            "Event-driven architectures",
            "Microservices communication",
            "Real-time messaging",
            "Pub/sub messaging patterns"
        ]
    },
    {
        "id": "cdn",
        "label": "CDN",
        "description": "Content Delivery Network that caches and serves content from edge locations close to users for faster delivery.",
        "use_cases": [
            "Serving static assets globally",
            "Reducing latency for users",
            "Offloading traffic from origin servers",
            "Video streaming and media delivery"
        ]
    },
    {
        "id": "monitoring",
        "label": "Monitoring Service",
        "description": "Service that collects metrics, logs, and traces to monitor system health, performance, and availability.",
        "use_cases": [
            "Application performance monitoring",
            "Infrastructure metrics",
            "Log aggregation and analysis",
            "Alerting and incident management"
        ]
    },
    {
        "id": "api-gateway",
        "label": "API Gateway",
        "description": "Single entry point for API requests that handles routing, authentication, rate limiting, and request/response transformation.",
        "use_cases": [
            "API request routing and load balancing",
            "Authentication and authorization",
            "Rate limiting and throttling",
            "Request/response transformation"
        ]
    },
    {
        "id": "dns",
        "label": "DNS",
        "description": "Domain Name System service that translates domain names to IP addresses and manages DNS records.",
        "use_cases": [
            "Domain name resolution",
            "Load balancing via DNS",
            "CDN routing",
            "Service discovery"
        ]
    },
    {
        "id": "vpc-network",
        "label": "VPC / Network",
        "description": "Virtual Private Cloud or network infrastructure that provides isolated network environments for resources.",
        "use_cases": [
            "Network isolation and security",
            "Private network segments",
            "Subnet management",
            "Network routing and connectivity"
        ]
    },
    {
        "id": "vpn-link",
        "label": "VPN / Private Link",
        "description": "Virtual Private Network or private link that provides secure, encrypted connections between networks or services.",
        "use_cases": [
            "Secure remote access",
            "Site-to-site connectivity",
            "Private service connections",
            "Encrypted data transmission"
        ]
    },
    {
        "id": "auth-service",
        "label": "Auth Service",
        "description": "Authentication service that handles user login, session management, and authentication tokens.",
        "use_cases": [
            "User authentication",
            "Session management",
            "Token generation and validation",
            "Single sign-on (SSO)"
        ]
    },
    {
        "id": "identity-provider",
        "label": "Identity Provider (IdP)",
        "description": "Identity provider that manages user identities and provides authentication services (e.g., OAuth, SAML).",
        "use_cases": [
            "OAuth/OIDC authentication",
            "SAML-based SSO",
            "Social login integration",
            "Centralized identity management"
        ]
    },
    {
        "id": "secrets-manager",
        "label": "Secrets Manager",
        "description": "Service for securely storing and managing secrets, API keys, passwords, and certificates.",
        "use_cases": [
            "API key management",
            "Password and credential storage",
            "Certificate management",
            "Secure configuration storage"
        ]
    },
    {
        "id": "waf",
        "label": "Web Application Firewall",
        "description": "Security service that filters and monitors HTTP/HTTPS traffic to protect web applications from attacks.",
        "use_cases": [
            "SQL injection prevention",
            "XSS attack protection",
            "DDoS mitigation",
            "Rate limiting and bot protection"
        ]
    },
    {
        "id": "search-engine",
        "label": "Search Engine",
        "description": "Search service that provides full-text search capabilities for applications and data.",
        "use_cases": [
            "Full-text search",
            "Product search",
            "Document search",
            "Real-time search indexing"
        ]
    },
    {
        "id": "data-warehouse",
        "label": "Data Warehouse",
        "description": "Centralized repository for storing and analyzing large volumes of structured data for business intelligence.",
        "use_cases": [
            "Business intelligence and analytics",
            "Data aggregation and reporting",
            "Historical data analysis",
            "ETL data processing"
        ]
    },
    {
        "id": "stream-processor",
        "label": "Stream Processor",
        "description": "Service that processes continuous streams of data in real-time for analytics and event processing.",
        "use_cases": [
            "Real-time data processing",
            "Event stream processing",
            "Real-time analytics",
            "Streaming ETL pipelines"
        ]
    },
    {
        "id": "etl-job",
        "label": "ETL / Batch Job",
        "description": "Extract, Transform, Load job that processes data in batches for data integration and transformation.",
        "use_cases": [
            "Data integration",
            "Batch data processing",
            "Data transformation pipelines",
            "Scheduled data migrations"
        ]
    },
    {
        "id": "scheduler",
        "label": "Scheduler / Cron",
        "description": "Service that schedules and executes tasks, jobs, or workflows at specified times or intervals.",
        "use_cases": [
            "Scheduled task execution",
            "Cron job management",
            "Workflow scheduling",
            "Periodic data processing"
        ]
    },
    {
        "id": "serverless-function",
        "label": "Serverless Function",
        "description": "Event-driven compute service that runs code in response to events without managing servers.",
        "use_cases": [
            "Event-driven processing",
            "API endpoints",
            "Background task processing",
            "Microservices architecture"
        ]
    },
    {
        "id": "logging-service",
        "label": "Logging Service",
        "description": "Service that collects, stores, and analyzes application and system logs for debugging and monitoring.",
        "use_cases": [
            "Centralized log collection",
            "Log aggregation and storage",
            "Log analysis and search",
            "Debugging and troubleshooting"
        ]
    },
    {
        "id": "alerting-service",
        "label": "Alerting / Incident Management",
        "description": "Service that monitors system health and sends alerts or manages incidents when issues are detected.",
        "use_cases": [
            "System health monitoring",
            "Alert notification",
            "Incident management",
            "On-call management"
        ]
    },
    {
        "id": "status-page",
        "label": "Status Page / Health Check",
        "description": "Public status page or health check service that displays system availability and service status.",
        "use_cases": [
            "Public service status",
            "Health check endpoints",
            "Service availability monitoring",
            "Incident communication"
        ]
    },
    {
        "id": "orchestrator",
        "label": "Workflow Orchestrator",
        "description": "Service that orchestrates and manages complex workflows, pipelines, and multi-step processes.",
        "use_cases": [
            "Workflow management",
            "Pipeline orchestration",
            "Multi-step process coordination",
            "Distributed task coordination"
        ]
    },
    {
        "id": "notification-service",
        "label": "Notification Service",
        "description": "Service that sends notifications to users via various channels (push, in-app, etc.).",
        "use_cases": [
            "Push notifications",
            "In-app notifications",
            "User alerts",
            "Multi-channel notifications"
        ]
    },
    {
        "id": "email-service",
        "label": "Email Service",
        "description": "Service that handles email sending, receiving, and management for applications.",
        "use_cases": [
            "Transactional emails",
            "Email marketing",
            "Email delivery",
            "Email templates and management"
        ]
    },
    {
        "id": "webhook-endpoint",
        "label": "Webhook Endpoint",
        "description": "HTTP endpoint that receives webhook callbacks from external services for event-driven integrations.",
        "use_cases": [
            "Third-party service callbacks",
            "Event-driven integrations",
            "Real-time data synchronization",
            "External service notifications"
        ]
    },
    {
        "id": "web-client",
        "label": "Web Client",
        "description": "Web browser or web application client that interacts with backend services.",
        "use_cases": [
            "Web application frontend",
            "Browser-based clients",
            "User interface",
            "Client-side applications"
        ]
    },
    {
        "id": "mobile-app",
        "label": "Mobile App",
        "description": "Mobile application (iOS, Android) that interacts with backend services via APIs.",
        "use_cases": [
            "Mobile application frontend",
            "Native mobile apps",
            "Mobile user interface",
            "Cross-platform mobile apps"
        ]
    },
    {
        "id": "admin-panel",
        "label": "Admin Panel",
        "description": "Administrative interface for managing and configuring system components and settings.",
        "use_cases": [
            "System administration",
            "Configuration management",
            "User management",
            "Dashboard and monitoring"
        ]
    }
]

class ChatRequest(BaseModel):
    projectId: str
    message: str

@router.post("/chat")
async def chat(req: ChatRequest):
    try:
        # Validate projectId is a valid UUID
        try:
            uuid.UUID(req.projectId)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid projectId format. Expected UUID, got: {req.projectId}"
            )
        
        # Check if Supabase is configured
        if supabase is None:
            raise HTTPException(
                status_code=503,
                detail="Supabase is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env"
            )
        
        # Check if Gemini API key is configured
        if not Env.GEMINI_API_KEY:
            raise HTTPException(
                status_code=503,
                detail="Gemini API key is not configured. Please set GOOGLE_GEMINI_API_KEY in backend/.env"
            )
        
        # 1) Load diagram context
        try:
            project_res = supabase.table("projects").select("diagram_json").eq("id", req.projectId).single().execute()
        except APIError as e:
            # Handle Supabase API errors specifically
            # APIError contains a dict with 'message', 'code', etc.
            error_dict = e.args[0] if e.args and isinstance(e.args[0], dict) else {}
            error_msg = error_dict.get('message', str(e))
            error_code = error_dict.get('code', '')
            
            print(f"Supabase APIError: {error_msg} (code: {error_code})")
            
            # Check if it's a UUID format error (PostgreSQL error code 22P02)
            if "invalid input syntax for type uuid" in error_msg.lower() or error_code == '22P02':
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid projectId format: {req.projectId}. Must be a valid UUID."
                )
            # Check if it's a "not found" error (PostgREST error code PGRST116)
            elif "not found" in error_msg.lower() or "no rows" in error_msg.lower() or "PGRST116" in error_code:
                raise HTTPException(
                    status_code=404,
                    detail=f"Project not found: {req.projectId}"
                )
            else:
                raise HTTPException(status_code=500, detail=f"Database error: {error_msg}")
        except Exception as e:
            # Handle any other exceptions
            error_msg = str(e)
            print(f"Error loading project: {e}")
            print(traceback.format_exc())
            if "invalid input syntax for type uuid" in error_msg.lower():
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid projectId format: {req.projectId}. Must be a valid UUID."
                )
            raise HTTPException(status_code=500, detail=f"Error loading project: {error_msg}")

        # Supabase Python client raises exceptions on error, so if we get here, check data
        if not project_res.data:
            raise HTTPException(status_code=404, detail="Project not found in database")

        project = project_res.data
        diagram_json = project.get("diagram_json", {})

        # 2) Load recent chat context
        try:
            messages_res = (
                supabase.table("chat_messages")
                .select("role, content, created_at")
                .eq("project_id", req.projectId)
                .order("created_at", desc=False)
                .limit(20)
                .execute()
            )
            history_rows = messages_res.data or []
        except Exception as e:
            print(f"Error loading chat history: {e}")
            history_rows = []

        history_text = (
            "\n".join(f"{row['role'].upper()}: {row['content']}" for row in history_rows)
            if history_rows
            else "No previous messages."
        )

        # 3) Build system prompt for Gemini
        system_instruction = f"""
You are ArchCoach, a friendly and helpful AI assistant that helps users design system architecture diagrams.
The diagram is represented as a JSON "project" with nodes and edges.

Current diagram JSON:
{diagram_json}

Recent chat:
{history_text}

When the user sends an instruction, you should:
1. Provide a friendly, conversational response explaining what you're doing
2. Generate the necessary diagram operations to fulfill their request

You MUST respond with a JSON object in this exact format:
{{
  "message": "A friendly, conversational explanation of what you're doing. Be helpful and clear. Describe what components you're adding, removing, or modifying.",
  "operations": [
    {{"op": "add_node", "payload": {{"id": "web-server-1", "type": "web-server", "position": {{"x": 400, "y": 100}}, "data": {{"name": "API Server"}}}}, "metadata": {{"x": 400, "y": 100}}}},
    {{"op": "add_node", "payload": {{"id": "database-1", "type": "database", "position": {{"x": 400, "y": 300}}, "data": {{"name": "PostgreSQL"}}}}, "metadata": {{"x": 400, "y": 300}}}},
    {{"op": "add_edge", "payload": {{"source": "web-server-1", "target": "database-1"}}}}
  ]
}}

IMPORTANT: When positioning nodes, use appropriate spacing:
- Horizontal spacing: 250 pixels between nodes (e.g., x: 100, 350, 600, 850)
- Vertical spacing: 250 pixels between rows (e.g., y: 100, 350, 600, 850)
- Arrange nodes in a grid layout with 4 nodes per row
- Start positions: x starts at 100, y starts at 100
- Example positions for multiple nodes:
  - Row 1: (100, 100), (350, 100), (600, 100), (850, 100)
  - Row 2: (100, 350), (350, 350), (600, 350), (850, 350)
  - Row 3: (100, 600), (350, 600), (600, 600), (850, 600)

Available operations:
- "add_node": {{"op": "add_node", "payload": {{"id": string (REQUIRED - use a descriptive ID like "web-server-1", "database-1", etc.), "type": string, "position": {{"x": number, "y": number}}, "data": {{"name": string, "description": string, "attributes": object}}}}, "metadata": {{"x": number, "y": number}}}}
- "update_node": {{"op": "update_node", "payload": {{"id": string, "data": {{"name": string, "description": string, "attributes": object}}}}}}
- "delete_node": {{"op": "delete_node", "payload": {{"id": string}}}}
- "add_edge": {{"op": "add_edge", "payload": {{"source": string (MUST match a node ID from an add_node operation), "target": string (MUST match a node ID from an add_node operation), "type": string (optional)}}}}
- "delete_edge": {{"op": "delete_edge", "payload": {{"id": string}}}}

Available node types: web-server, database, worker, cache, queue, storage, third-party-api, compute-node, load-balancer, message-broker, cdn, monitoring

CRITICAL RULES FOR POSITIONING NODES:
1. Position nodes in a HIERARCHICAL layout: vertical flow overall, but horizontal arrangement for nodes at the same level
2. Nodes at the SAME LEVEL (e.g., multiple web servers, multiple databases) should be arranged HORIZONTALLY with x values like 200, 400, 600, etc. (200px spacing)
3. Different LEVELS should be arranged VERTICALLY with y values: level 0 at y: 100, level 1 at y: 300, level 2 at y: 500, etc. (200px vertical spacing between levels)
4. Determine levels based on architecture: entry points (load-balancer, CDN) = level 0, application layer (web-server, worker) = level 1, data layer (database, cache) = level 2, etc.
5. If creating multiple nodes at the same level, space them horizontally: first at x: 200, second at x: 400, third at x: 600, etc., all with the same y value
6. Example: 2 web servers at level 1 should be at (x: 200, y: 300) and (x: 400, y: 300), then a database at level 2 at (x: 400, y: 500)

CRITICAL RULES FOR CREATING CONNECTIONS:
1. When creating nodes with "add_node", you MUST include an explicit "id" field in the payload (e.g., "web-server-1", "database-1", "cache-1")
2. When creating edges with "add_edge", the "source" and "target" fields MUST reference the exact "id" values from the corresponding "add_node" operations
3. Always create nodes BEFORE creating edges that connect them (nodes must exist before they can be connected)
4. If you're creating multiple connected components, create all nodes first, then create all edges that connect them

IMPORTANT:
- The "message" field should be conversational and helpful, describing what you did (e.g., "I've added a database node to your diagram!")
- The "operations" array should contain the actual diagram modifications
- If the user asks a question or needs help (not a diagram modification), respond with a helpful message and an empty operations array: {{"message": "...", "operations": []}}
- Return ONLY valid JSON. Do NOT wrap it in markdown code blocks (```json or ```).
- Do NOT include any text outside the JSON object.
"""

        # 4) Call Gemini API
        try:
            # First, list all available models to see what's actually available
            available_models = []
            try:
                print("📋 Listing all available Gemini models...")
                for model in genai.list_models():
                    model_display_name = model.name.split('/')[-1] if '/' in model.name else model.name
                    if 'generateContent' in model.supported_generation_methods:
                        available_models.append({
                            'name': model_display_name,
                            'full_name': model.name,
                            'methods': model.supported_generation_methods
                        })
                        print(f"  ✅ {model_display_name} (full: {model.name})")
                
                if not available_models:
                    print("⚠️  No models with generateContent support found")
                else:
                    print(f"📊 Found {len(available_models)} available model(s)")
            except Exception as e:
                print(f"⚠️  Warning: Could not list models: {e}")
                print(traceback.format_exc())
            
            # Prioritize free-tier compatible models
            # Updated list based on actual available models (gemini-1.5-flash is no longer available)
            # Free tier typically supports: gemini-2.5-flash, gemini-2.0-flash, gemini-flash-latest
            preferred_models = [
                "gemini-2.5-flash",           # Latest stable free-tier model
                "gemini-2.0-flash",           # Alternative free-tier option
                "gemini-flash-latest",         # Latest flash model
                "gemini-2.5-flash-lite",      # Lite version
                "gemini-2.0-flash-lite",      # Alternative lite
                "gemini-pro-latest",          # Pro model (may have limits)
                "gemini-1.5-flash",           # Legacy (may not be available)
                "gemini-1.5-pro",             # Legacy (may not be available)
            ]
            
            model_name = None
            model_full_name = None
            
            # First, try to find preferred models from the list
            if available_models:
                for preferred in preferred_models:
                    for model_info in available_models:
                        # Exact match or starts with preferred name
                        if (model_info['name'] == preferred or 
                            model_info['name'].startswith(preferred) or
                            preferred in model_info['name']):
                            # Check if it's a free-tier model (not experimental, not preview)
                            if ('-exp' not in model_info['name'].lower() and 
                                '-preview' not in model_info['name'].lower()):
                                model_name = model_info['name']
                                model_full_name = model_info['full_name']
                                print(f"✅ Selected free-tier model: {model_name} (full: {model_full_name})")
                                break
                    if model_name:
                        break
            
            # If no preferred model found, use the first available non-experimental, non-preview model
            if not model_name and available_models:
                for model_info in available_models:
                    if ('-exp' not in model_info['name'].lower() and 
                        '-preview' not in model_info['name'].lower()):
                        model_name = model_info['name']
                        model_full_name = model_info['full_name']
                        print(f"✅ Selected available model: {model_name} (full: {model_full_name})")
                        break
            
            # Fallback: try creating models directly (for backwards compatibility)
            if not model_name:
                print("⚠️  No model found from list, trying direct model creation...")
                for name in preferred_models:
                    try:
                        test_model = genai.GenerativeModel(name)
                        model_name = name
                        model_full_name = name
                        print(f"✅ Using model (direct): {model_name}")
                        break
                    except Exception as e:
                        print(f"  Model {name} not available: {e}")
                        continue
            
            if not model_name:
                error_detail = "No available Gemini models found. "
                if available_models:
                    error_detail += f"Available models: {', '.join([m['name'] for m in available_models[:5]])}"
                else:
                    error_detail += "Please check your API key and model availability."
                raise HTTPException(status_code=503, detail=error_detail)
            
            # Use display name (GenerativeModel accepts just the model name, not the full path)
            # The full name is like "models/gemini-2.5-flash" but we need just "gemini-2.5-flash"
            model_to_use = model_name  # Use display name, not full path
            print(f"🔧 Creating GenerativeModel with: {model_to_use}")
            model = genai.GenerativeModel(model_to_use)
            prompt = system_instruction + "\nUSER:\n" + req.message
            response = model.generate_content(prompt)
            reply_text = (response.text or "").strip()
            
            # Clean up response: remove markdown code blocks if present
            # Handle various formats: ```json, ```, text before/after code blocks
            # Try to find JSON in markdown code blocks (```json ... ``` or ``` ... ```)
            code_block_pattern = r'```(?:json)?\s*\n?(.*?)```'
            code_block_match = re.search(code_block_pattern, reply_text, re.DOTALL)
            if code_block_match:
                reply_text = code_block_match.group(1).strip()
            elif reply_text.startswith('```'):
                # Fallback: simple code block removal
                first_newline = reply_text.find('\n')
                if first_newline != -1:
                    reply_text = reply_text[first_newline + 1:]
                else:
                    reply_text = reply_text[3:]  # Remove ``` if no newline
                # Remove trailing ```
                last_backticks = reply_text.rfind('```')
                if last_backticks != -1:
                    reply_text = reply_text[:last_backticks]
                reply_text = reply_text.strip()
            
            # Try to extract JSON object if there's text before/after
            # Look for first { and last } to extract JSON object
            first_brace = reply_text.find('{')
            last_brace = reply_text.rfind('}')
            if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
                # Extract just the JSON object
                potential_json = reply_text[first_brace:last_brace + 1]
                # Only use it if it looks like valid JSON structure
                if potential_json.count('{') == potential_json.count('}'):
                    reply_text = potential_json
        except Exception as e:
            error_msg = str(e)
            print(f"Error calling Gemini API: {e}")
            print(traceback.format_exc())
            
            # Handle rate limit errors with helpful messages
            if "429" in error_msg or "quota" in error_msg.lower() or "rate limit" in error_msg.lower():
                if "free_tier" in error_msg.lower():
                    raise HTTPException(
                        status_code=429,
                        detail="Gemini API free tier quota exceeded. Please wait a few minutes or upgrade your API plan. Free tier typically supports gemini-2.5-flash, gemini-2.0-flash, and gemini-flash-latest models."
                    )
                else:
                    raise HTTPException(
                        status_code=429,
                        detail="Gemini API rate limit exceeded. Please wait a few minutes before trying again."
                    )
            
            raise HTTPException(status_code=500, detail=f"Gemini API error: {error_msg}")

        if not reply_text:
            raise HTTPException(status_code=500, detail="Empty response from Gemini")

        # Parse the response JSON
        try:
            response_data = json.loads(reply_text)
            
            # Extract message and operations
            assistant_message = response_data.get("message", "I've processed your request.")
            operations = response_data.get("operations", [])
            
            # Validate operations is a list
            if not isinstance(operations, list):
                operations = []
            
        except json.JSONDecodeError as e:
            print(f"⚠️  Warning: Failed to parse AI response as JSON: {e}")
            print(f"📝 Raw response (first 500 chars): {reply_text[:500]}")
            print(f"📝 Raw response length: {len(reply_text)} chars")
            
            # Initialize fallback values
            operations = []
            assistant_message = None
            
            # Try to extract JSON from the response more aggressively
            json_pattern = r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}'
            json_matches = re.findall(json_pattern, reply_text, re.DOTALL)
            
            if json_matches:
                # Try the largest match first (likely the main JSON object)
                json_matches.sort(key=len, reverse=True)
                for json_candidate in json_matches:
                    try:
                        response_data = json.loads(json_candidate)
                        if "message" in response_data or "operations" in response_data:
                            assistant_message = response_data.get("message", "I've processed your request.")
                            operations = response_data.get("operations", [])
                            if not isinstance(operations, list):
                                operations = []
                            print(f"✅ Successfully extracted JSON from response")
                            break
                    except json.JSONDecodeError:
                        continue
            
            # If we still don't have a message, try fallback parsing
            if assistant_message is None:
                # Fallback: treat as old format (just operations array)
                try:
                    parsed = json.loads(reply_text)
                    if isinstance(parsed, list):
                        operations = parsed
                        assistant_message = "I've updated your diagram."
                    else:
                        operations = []
                        assistant_message = "I received your message, but couldn't parse the response format."
                except json.JSONDecodeError:
                    operations = []
                    error_preview = str(e)[:100] if len(str(e)) > 100 else str(e)
                    assistant_message = f"I received your message, but encountered an error processing it. The AI response couldn't be parsed as JSON. Please try rephrasing your request. (Error: {error_preview})"
                    print(f"❌ All JSON parsing attempts failed. Full error: {e}")
                    print(f"📄 Full response: {reply_text}")

        # 5) Store messages (user + assistant) for history
        try:
            supabase.table("chat_messages").insert([
                {
                    "project_id": req.projectId,
                    "role": "user",
                    "content": req.message,
                },
                {
                    "project_id": req.projectId,
                    "role": "assistant",
                    "content": assistant_message,
                },
            ]).execute()
        except Exception as e:
            print(f"Warning: Failed to save chat history: {e}")
            # Don't fail the request if history save fails

        # Return both the message and operations
        return {
            "message": assistant_message,
            "operations": operations
        }
    
    except HTTPException:
        # Re-raise HTTP exceptions (they already have proper status codes)
        raise
    except Exception as e:
        # Catch any other unexpected errors
        print(f"Unexpected error in chat endpoint: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

