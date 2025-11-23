# Luna Component Library Prompt (Cursor-ready)

You are an AI pair programmer working in the **BuildFlow / Luna** repo.  
Your task is to ensure that the **left sidebar “Components” library** and the **backend `AVAILABLE_NODE_TYPES` in `backend/app/routes/chat.py`** stay perfectly in sync.

---

## Overall goal

1. **Left sidebar**: Render a component library on the left side of the system design builder UI that lists all available components (nodes) the user can drag or click to add to the canvas.
2. **Backend**: Ensure the FastAPI `AVAILABLE_NODE_TYPES` list in `backend/app/routes/chat.py` contains the same components and uses the same `id` values so Gemini can generate valid diagram operations.
3. **Single source of truth**: Use the table below as the **canonical list of components** (IDs, labels, and conceptual purpose).

The UI already shows some components like `Web Server`, `Database`, etc. Update or extend the existing implementation so that **this full list** is represented in both frontend and backend.

---

## Component list (must exist both in the sidebar and in AVAILABLE_NODE_TYPES)

Each component has a **node type ID** (used by Gemini and the canvas) and a **label** (what the user sees).

> Treat the `id` column as the exact `type`/`id` value used for nodes and in `AVAILABLE_NODE_TYPES`.

| id                 | label                          |
|--------------------|--------------------------------|
| web-server         | Web Server                     |
| database           | Database                       |
| worker             | Worker                         |
| cache              | Cache                          |
| queue              | Queue                          |
| storage            | Storage                        |
| third-party-api    | Third-party API                |
| compute-node       | Compute Node                   |
| load-balancer      | Load Balancer                  |
| message-broker     | Message Broker                 |
| cdn                | CDN                            |
| monitoring         | Monitoring Service             |
| api-gateway        | API Gateway                    |
| dns                | DNS                            |
| vpc-network        | VPC / Network                  |
| vpn-link           | VPN / Private Link             |
| auth-service       | Auth Service                   |
| identity-provider  | Identity Provider (IdP)        |
| secrets-manager    | Secrets Manager                |
| waf                | Web Application Firewall       |
| search-engine      | Search Engine                  |
| data-warehouse     | Data Warehouse                 |
| stream-processor   | Stream Processor               |
| etl-job            | ETL / Batch Job                |
| scheduler          | Scheduler / Cron               |
| serverless-function| Serverless Function            |
| logging-service    | Logging Service                |
| alerting-service   | Alerting / Incident Management |
| status-page        | Status Page / Health Check     |
| orchestrator       | Workflow Orchestrator          |
| notification-service | Notification Service         |
| email-service      | Email Service                  |
| webhook-endpoint   | Webhook Endpoint               |
| web-client         | Web Client                     |
| mobile-app         | Mobile App                     |
| admin-panel        | Admin Panel                    |

---

## Frontend requirements (left sidebar component library)

1. **Locate the existing Components sidebar**  
   - Find the React component that renders the left-hand “Components” list (the one currently showing items like Web Server, Database, Worker, etc.).  
   - This might be something like `ComponentLibrary`, `SidebarComponents`, or similar in the frontend codebase.

2. **Define a typed component config list**  
   - Create or update a **single array of component definitions** used to render the sidebar.  
   - Each item should at least contain:

     ```ts
     type ComponentDefinition = {
       id: string;        // must match the ids in the table above
       label: string;     // human-readable name
       description?: string;
       icon?: ReactNode;  // existing icon system can be reused
     };
     ```

   - Populate this array with **every component** from the table above.

3. **Render the list in the sidebar**  
   - For each `ComponentDefinition`, render a card/row similar to the existing ones (icon + label, optional description).
   - Ensure the UI scrolls if the list is long.

4. **Interaction: add node to canvas**  
   - Keep existing behavior for how a user adds a node (drag-and-drop or click-to-add).
   - When a node is created from a component, set its `type`/`nodeType` to the component’s `id` (e.g., `"api-gateway"`, `"search-engine"`).
   - Set sensible default `data` for each node (e.g. `name` defaulting to the label). Example:

     ```ts
     {
       id: generatedNodeId,
       type: component.id, // e.g. "api-gateway"
       position: { x, y },
       data: {
         name: component.label,
         description: component.description ?? '',
       },
     }
     ```

5. **Visual grouping (optional but nice)**  
   - Optionally group components into sections like “Networking”, “Security”, “Data & Analytics”, “Clients”, etc., but **do not change the IDs**.

---

## Backend requirements (FastAPI / Gemini config)

1. Open `backend/app/routes/chat.py` and make sure the `AVAILABLE_NODE_TYPES` list contains **one entry per row in the table above**, with matching `id` and `label`.

2. For each entry include:
   - `id`: exactly the `id` from the table
   - `label`: the human-readable name
   - `description`: short explanation of what the component does
   - `use_cases`: list of 3–5 common use cases

3. Confirm that:
   - All node types from the table are present.
   - There are no mismatches between the frontend component `id`s and these `id`s.
   - The `system_instruction` string that lists available node types still renders correctly (no syntax errors, proper f-strings).

4. The Gemini system prompt already explains how to use `AVAILABLE_NODE_TYPES`. Do **not** remove that behavior. Just ensure the list is complete and accurate.

---

## Consistency checks

Before finishing:

1. **Search** the codebase for any hard-coded node type names or IDs. Update them so they refer to the canonical IDs from the table.
2. Ensure the canvas rendering logic understands all new types (e.g., default node shapes/styles fall back gracefully if no custom renderer exists).
3. Run any existing frontend/backend tests or type checks and fix issues introduced by the new components.

When you’re done, the result should be:

- The left sidebar shows **all** components listed in the table above.
- Clicking/dragging any component creates a node with the correct `type` ID.
- Gemini can safely refer to these node types in `operations` it returns because `AVAILABLE_NODE_TYPES` is complete and in sync with the frontend.
