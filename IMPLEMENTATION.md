# Visual System Design Editor - Implementation Documentation

## Table of Contents
1. [Tech Stack](#tech-stack)
2. [Architecture Overview](#architecture-overview)
3. [Current Implementation](#current-implementation)
4. [Key Features](#key-features)
5. [File Structure](#file-structure)
6. [Data Models](#data-models)
7. [State Management](#state-management)
8. [Component Details](#component-details)
9. [Utility Functions](#utility-functions)

---

## Tech Stack

### Core Framework & Language
- **React 18.2.0** - UI framework for building component-based interfaces
- **TypeScript 5.2.2** - Type-safe JavaScript with strict mode enabled
- **Vite 5.0.8** - Fast build tool and development server

### Diagram Engine
- **@xyflow/react 12.0.0** - Modern React Flow library (formerly react-flow-renderer) for creating interactive node-based diagrams
  - Provides canvas, nodes, edges, zoom/pan functionality
  - Built-in controls (zoom, pan, minimap)
  - Custom node support

### Styling
- **TailwindCSS 3.3.6** - Utility-first CSS framework for rapid UI development
- **PostCSS 8.4.32** - CSS processing tool
- **Autoprefixer 10.4.16** - Automatically adds vendor prefixes

### Icons
- **react-icons 4.12.0** - Comprehensive icon library (using Font Awesome icons)

### Data & Export
- **uuid 9.0.1** - Generate unique identifiers for nodes and edges
- **html2canvas 1.4.1** - Convert canvas/DOM elements to PNG images

### Development Tools
- **ESLint 8.55.0** - Code linting with TypeScript rules
- **@typescript-eslint/eslint-plugin & parser** - TypeScript-specific linting rules
- **@vitejs/plugin-react 4.2.1** - Vite plugin for React support

### Type Definitions
- **@types/react 18.2.43** - TypeScript types for React
- **@types/react-dom 18.2.17** - TypeScript types for React DOM
- **@types/uuid 9.0.7** - TypeScript types for uuid

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Web Application                       │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Left    │  │    Center    │  │    Right     │      │
│  │ Sidebar  │  │    Canvas    │  │   Sidebar    │      │
│  │(Library) │  │  (ReactFlow) │  │ (Inspector)  │      │
│  └──────────┘  └──────────────┘  └──────────────┘      │
│                        │                                 │
│                        ▼                                 │
│            ┌───────────────────────┐                    │
│            │   ProjectContext      │                    │
│            │   (React Context)     │                    │
│            └───────────────────────┘                    │
│                        │                                 │
│                        ▼                                 │
│        ┌───────────────────────────────┐                │
│        │   useProject Hook             │                │
│        │   (State Management)          │                │
│        └───────────────────────────────┘                │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │   Browser Storage     │
            │  (localStorage)       │
            └───────────────────────┘
```

### Application Structure

The application follows a **component-based architecture** with:

1. **Context API** for global state management (`ProjectContext`)
2. **Custom Hooks** for business logic (`useProject`, `useStorage`, `useExport`)
3. **React Flow** for diagram rendering and interactions
4. **localStorage** for data persistence
5. **Three-panel layout**: Left sidebar (component library), Center canvas, Right sidebar (inspector)

---

## Current Implementation

### Core Features Implemented

✅ **Interactive Canvas**
- Zoom and pan controls (via React Flow)
- MiniMap for navigation overview
- Background grid pattern
- Drag-and-drop nodes from sidebar
- Node selection and manipulation

✅ **Component Library (12 Node Types)**
- Web Server (blue)
- Database (green)
- Worker (orange)
- Cache (yellow)
- Queue (purple)
- Storage (teal)
- Third-party API (red)
- Compute Node (gray)
- Load Balancer (indigo)
- Message Broker (pink)
- CDN (cyan)
- Monitoring Service (amber)

✅ **Node Management**
- Add nodes via drag-and-drop from sidebar
- Move nodes on canvas
- Select nodes (single selection)
- Delete nodes (with connected edges cleanup)
- Visual feedback (selection highlight, hover states)

✅ **Connection System**
- Create edges between nodes
- Visual connection lines (smoothstep style)
- Delete edges
- Prevent duplicate connections
- Auto-cleanup when nodes are deleted

✅ **Inspector Panel**
- Edit node name (required field)
- View node type (read-only)
- Edit description (optional)
- Add/remove/edit custom attributes (key-value pairs)
- Delete node button
- Real-time updates to canvas

✅ **Persistence**
- Save projects to localStorage
- Load projects from localStorage
- Export projects as JSON files
- Import projects from JSON files
- Clear canvas functionality

✅ **Export Functionality**
- Export canvas as PNG image (using html2canvas)
- High-quality image output (2x scale)
- Automatic file download

### Toolbar Actions

- **Save** - Save project to localStorage (prompts for name)
- **Load** - Import JSON file from device
- **Export JSON** - Download project as JSON file
- **Export PNG** - Export canvas as PNG image
- **Clear** - Clear entire canvas (with confirmation)

---

## Key Features

### 1. Drag-and-Drop System

**Component Library → Canvas:**
- Components are draggable from the left sidebar
- On drop, a new node is created at the drop position
- Node type is transferred via `dataTransfer` API
- Position is calculated using React Flow's coordinate system

**Node Movement:**
- Nodes can be dragged on the canvas
- Position updates are synced with project state
- Updates occur when dragging ends (not during drag for performance)

### 2. Node Selection

- Click on a node to select it
- Selected node is highlighted with blue border
- Inspector panel shows when a node is selected
- Click on canvas background to deselect

### 3. Edge Creation

- Click and drag from a node's connection handle (bottom handle)
- Drop on another node's connection handle (top handle)
- Prevents duplicate edges between same nodes
- Edges use smoothstep style for visual appeal

### 4. State Synchronization

- React Flow manages its own internal state for rendering
- Project state is maintained in `useProject` hook
- Synchronization via `useEffect` hooks
- Bidirectional updates: React Flow changes → Project state, Project state → React Flow

### 5. Data Persistence

**localStorage:**
- Projects stored as JSON array in localStorage
- Key: `visual-system-editor-projects`
- Each stored project includes: id, name, project data, timestamps

**JSON Import/Export:**
- Standard JSON format for project files
- Includes version, nodes, edges, metadata
- Validation on import

---

## File Structure

```
src/
├── components/
│   ├── Canvas/
│   │   ├── Canvas.tsx          # Main React Flow canvas component
│   │   └── index.ts            # Export barrel
│   ├── SidebarLeft/
│   │   ├── ComponentLibrary.tsx # Component library container
│   │   ├── ComponentItem.tsx    # Draggable component item
│   │   └── index.ts             # Export barrel
│   ├── SidebarRight/
│   │   ├── InspectorPanel.tsx   # Node properties editor
│   │   └── index.ts             # Export barrel
│   └── Toolbar/
│       ├── Toolbar.tsx          # Top toolbar with actions
│       └── index.ts             # Export barrel
├── contexts/
│   └── ProjectContext.tsx       # React Context for project state
├── hooks/
│   ├── useProject.ts            # Core project state management
│   ├── useStorage.ts            # Storage operations wrapper
│   └── useExport.ts             # Image export functionality
├── nodes/
│   ├── nodeTypes.ts             # Node type definitions (12 types)
│   ├── nodeConfig.ts            # Node configuration helpers
│   └── customNodes.tsx          # Custom React Flow node component
├── types/
│   ├── node.ts                  # Node TypeScript interface
│   ├── edge.ts                  # Edge TypeScript interface
│   ├── project.ts               # Project TypeScript interface
│   └── index.ts                 # Type exports
├── utils/
│   ├── constants.ts             # App constants (version, keys)
│   ├── storage.ts               # localStorage operations
│   ├── exportImage.ts           # PNG export using html2canvas
│   └── validation.ts            # Data validation utilities
├── styles/
│   └── globals.css              # Global styles and Tailwind imports
├── App.tsx                      # Main app component (layout)
└── main.tsx                     # Application entry point
```

---

## Data Models

### Node

```typescript
interface Node {
  id: string;                    // UUID v4
  type: string;                  // Node type ID (e.g., 'web-server')
  position: {
    x: number;
    y: number;
  };
  data: {
    name: string;                // Display name (required)
    description?: string;        // Optional description
    attributes?: Record<string, string | number>; // Custom key-value pairs
  };
}
```

### Edge

```typescript
interface Edge {
  id: string;                    // UUID v4
  source: string;                // Source node ID
  target: string;                // Target node ID
  type?: string;                 // Edge type (default: 'smoothstep')
  label?: string;                // Optional edge label
  animated?: boolean;            // Optional animation
}
```

### Project

```typescript
interface Project {
  version: string;               // Project format version (currently '1.0.0')
  name?: string;                 // Optional project name
  createdAt?: string;           // ISO timestamp
  updatedAt?: string;           // ISO timestamp
  nodes: Node[];                 // Array of nodes
  edges: Edge[];                 // Array of edges
}
```

### StoredProject (localStorage format)

```typescript
interface StoredProject {
  id: string;                    // Unique storage ID
  name: string;                  // Project name
  project: Project;              // Project data
  createdAt: string;            // ISO timestamp
  updatedAt: string;            // ISO timestamp
}
```

---

## State Management

### ProjectContext

The application uses **React Context API** for global state management:

**Provider:** `ProjectProvider` wraps the entire application
**Hook:** `useProjectContext()` provides access to project state and operations

**Exposed State:**
- `nodes` - Array of all nodes
- `edges` - Array of all edges
- `selectedNodeId` - Currently selected node ID (or null)

**Exposed Operations:**
- `setSelectedNodeId` - Select/deselect a node
- `addNode(type, position)` - Add a new node
- `updateNode(nodeId, updates)` - Update node data
- `updateNodePosition(nodeId, position)` - Update node position
- `deleteNode(nodeId)` - Delete node and connected edges
- `addEdge(source, target)` - Create new edge
- `deleteEdge(edgeId)` - Delete edge
- `loadProject(project)` - Load a project
- `getProject()` - Get current project data
- `clearProject()` - Clear all nodes and edges

### useProject Hook

Core state management hook that:
- Manages nodes and edges arrays using `useState`
- Provides CRUD operations for nodes and edges
- Handles edge cleanup when nodes are deleted
- Generates UUIDs for new nodes/edges
- Maintains selected node state

### State Flow

```
User Action → Component Handler → ProjectContext Operation 
  → useProject Hook → State Update → React Re-render 
  → Canvas/Inspector Updates
```

---

## Component Details

### Canvas Component

**Location:** `src/components/Canvas/Canvas.tsx`

**Responsibilities:**
- Render React Flow diagram
- Handle drag-and-drop from sidebar
- Manage node/edge interactions
- Sync React Flow state with project state
- Provide zoom, pan, minimap controls

**Key Features:**
- Custom node types (`custom` node type)
- Background grid pattern
- Connection handles (top/bottom)
- Node click selection
- Canvas click deselection
- Drag-and-drop support

**State Synchronization:**
- React Flow's internal state is kept in sync with project state
- Uses `useNodesState` and `useEdgesState` from React Flow
- Updates project state when nodes/edges change

### ComponentLibrary Component

**Location:** `src/components/SidebarLeft/ComponentLibrary.tsx`

**Responsibilities:**
- Display list of available node types
- Render draggable component items

**Node Types:**
- Maps over `NODE_TYPES` array (12 predefined types)
- Each type rendered as a `ComponentItem`

### ComponentItem Component

**Location:** `src/components/SidebarLeft/ComponentItem.tsx`

**Responsibilities:**
- Render individual draggable component
- Handle drag start/end events
- Transfer node type via drag data

**Features:**
- Visual feedback during drag (opacity change)
- Icon and label display
- Color-coded by node type

### InspectorPanel Component

**Location:** `src/components/SidebarRight/InspectorPanel.tsx`

**Responsibilities:**
- Display node properties when a node is selected
- Allow editing of node metadata
- Provide delete node functionality

**Form Fields:**
- **Node Name** - Text input (required, updates on change)
- **Node Type** - Read-only display
- **Description** - Textarea (optional, updates on change)
- **Custom Attributes** - Dynamic key-value pairs (add/remove/edit)

**State Management:**
- Local state for form inputs (`useState`)
- Syncs with selected node via `useEffect`
- Updates project state on field changes

### Toolbar Component

**Location:** `src/components/Toolbar/Toolbar.tsx`

**Responsibilities:**
- Provide save/load/export actions
- Handle file operations
- Clear canvas functionality

**Actions:**
- **Save** - Prompts for name, saves to localStorage
- **Load** - Opens file picker for JSON import
- **Export JSON** - Downloads project as JSON file
- **Export PNG** - Exports canvas as PNG image
- **Clear** - Clears all nodes/edges (with confirmation)

### CustomNode Component

**Location:** `src/nodes/customNodes.tsx`

**Responsibilities:**
- Render custom node appearance
- Display node icon, name, description
- Show connection handles
- Indicate selection state

**Visual Design:**
- White background with shadow
- Colored icon based on node type
- Blue border when selected
- Handles at top (target) and bottom (source)
- Description truncated to 2 lines

---

## Utility Functions

### Storage Utilities

**Location:** `src/utils/storage.ts`

**Functions:**
- `saveProjectToStorage(project, name?)` - Save project to localStorage
- `getStoredProjects()` - Get all stored projects
- `loadProjectFromStorage(id)` - Load project by ID
- `deleteProjectFromStorage(id)` - Delete stored project
- `exportProjectToJSON(project)` - Convert project to JSON string
- `importProjectFromJSON(jsonString)` - Parse JSON and return project

**Storage Format:**
- Array of `StoredProject` objects in localStorage
- Key: `'visual-system-editor-projects'`
- JSON stringified format

### Export Utilities

**Location:** `src/utils/exportImage.ts`

**Functions:**
- `exportCanvasAsPNG(elementId, filename?)` - Export element as PNG

**Implementation:**
- Uses `html2canvas` library
- 2x scale for high quality
- White background
- Automatic file download

### Constants

**Location:** `src/utils/constants.ts`

**Constants:**
- `PROJECT_VERSION = '1.0.0'` - Current project format version
- `STORAGE_KEY = 'visual-system-editor-projects'` - localStorage key
- `DEFAULT_PROJECT_NAME = 'Untitled Project'` - Default project name

---

## Custom Hooks

### useProject

**Location:** `src/hooks/useProject.ts`

**Purpose:** Core state management for project data

**Returns:**
- State: `nodes`, `edges`, `selectedNodeId`
- Actions: `addNode`, `updateNode`, `deleteNode`, `addEdge`, `deleteEdge`, etc.

**Key Implementation Details:**
- Uses `useState` for nodes and edges arrays
- Uses `uuid` library for ID generation
- Automatically cleans up edges when nodes are deleted
- Provides project serialization (`getProject`)

### useStorage

**Location:** `src/hooks/useStorage.ts`

**Purpose:** Wrapper around storage utilities with memoization

**Returns:**
- `saveProject(project, name?)` - Save to localStorage
- `loadProject(id)` - Load from localStorage
- `getProjects()` - Get all stored projects
- `deleteProject(id)` - Delete stored project
- `exportToJSON(project)` - Export as JSON string
- `importFromJSON(jsonString)` - Import from JSON

### useExport

**Location:** `src/hooks/useExport.ts`

**Purpose:** Image export functionality

**Returns:**
- `exportAsPNG(elementId, filename?)` - Export element as PNG

---

## Node Types Configuration

**Location:** `src/nodes/nodeTypes.ts`

**Node Type Interface:**
```typescript
interface NodeTypeConfig {
  id: string;                    // Unique identifier
  label: string;                 // Display label
  icon: React.ComponentType;     // Icon component
  color: string;                 // Color name (for theming)
  defaultName: string;           // Default node name
}
```

**All 12 Node Types:**
1. `web-server` - Web Server (blue, FaServer icon)
2. `database` - Database (green, FaDatabase icon)
3. `worker` - Worker (orange, FaCog icon)
4. `cache` - Cache (yellow, FaBolt icon)
5. `queue` - Queue (purple, FaList icon)
6. `storage` - Storage (teal, FaBox icon)
7. `third-party-api` - Third-party API (red, FaPlug icon)
8. `compute-node` - Compute Node (gray, FaMicrochip icon)
9. `load-balancer` - Load Balancer (indigo, FaBalanceScale icon)
10. `message-broker` - Message Broker (pink, FaExchangeAlt icon)
11. `cdn` - CDN (cyan, FaCloud icon)
12. `monitoring` - Monitoring Service (amber, FaChartLine icon)

---

## Styling Approach

### TailwindCSS

- Utility-first CSS framework
- Classes applied directly to components
- Responsive design utilities available
- Custom color palette via color map functions

### Color System

Colors are defined as strings (e.g., 'blue', 'green') and mapped to hex values via helper functions:
- `getColorValue(color: string): string` - Maps color names to hex codes
- Used consistently across `ComponentItem`, `CustomNode`, and `InspectorPanel`

### Layout

- Flexbox-based layout
- Three-column design (fixed left sidebar, flexible canvas, fixed right sidebar)
- Full-height layout (`h-screen`)
- Overflow handling for scrollable sections

---

## Development Configuration

### TypeScript Configuration

**Location:** `tsconfig.json`

**Key Settings:**
- Target: ES2020
- Module: ESNext
- JSX: react-jsx
- Strict mode enabled
- Module resolution: bundler
- No unused locals/parameters checks

### Vite Configuration

**Location:** `vite.config.ts`

**Configuration:**
- React plugin enabled
- Default Vite settings

### Build Scripts

- `npm run dev` - Start development server (Vite)
- `npm run build` - Build for production (TypeScript + Vite)
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

---

## Current Limitations & Future Considerations

### Current Limitations

1. **No Undo/Redo** - Cannot undo operations
2. **Single Selection Only** - Cannot select multiple nodes
3. **No Copy/Paste** - Cannot duplicate nodes
4. **No Keyboard Shortcuts** - All interactions via mouse
5. **Basic Edge Styling** - All edges use same style (smoothstep)
6. **No Templates** - Must create diagrams from scratch
7. **No Auto-layout** - Manual node positioning only
8. **LocalStorage Only** - No cloud sync or collaboration
9. **No SVG Export** - Only PNG export available
10. **Limited Validation** - Basic JSON validation only

### Future Enhancement Opportunities

- Undo/redo functionality
- Multi-select and bulk operations
- Keyboard shortcuts
- Custom node types
- Edge labels and styling
- Snap-to-grid
- Auto-layout algorithms
- Templates and presets
- SVG export option
- PDF export
- Cloud storage integration
- Collaboration features
- Version history

---

## Dependencies Summary

### Production Dependencies (7)
- react ^18.2.0
- react-dom ^18.2.0
- @xyflow/react ^12.0.0
- react-icons ^4.12.0
- html2canvas ^1.4.1
- uuid ^9.0.1

### Development Dependencies (15)
- @types/react ^18.2.43
- @types/react-dom ^18.2.17
- @types/uuid ^9.0.7
- @typescript-eslint/eslint-plugin ^6.14.0
- @typescript-eslint/parser ^6.14.0
- @vitejs/plugin-react ^4.2.1
- autoprefixer ^10.4.16
- eslint ^8.55.0
- eslint-plugin-react-hooks ^4.6.0
- eslint-plugin-react-refresh ^0.4.5
- postcss ^8.4.32
- tailwindcss ^3.3.6
- typescript ^5.2.2
- vite ^5.0.8

**Total Packages:** 278 (including transitive dependencies)

---

## Conclusion

The Visual System Design Editor is a fully functional, browser-based diagramming tool built with modern web technologies. It provides a clean, intuitive interface for creating system architecture diagrams with drag-and-drop functionality, node editing, and export capabilities. The codebase follows React best practices with TypeScript for type safety and TailwindCSS for styling.

The application is ready for production use as a single-page application and can be deployed to any static hosting service (Vercel, Netlify, GitHub Pages, etc.).

---

**Last Updated:** 2024
**Project Version:** 1.0.0
**Build Tool:** Vite 5.0.8
**Node.js Requirement:** 18+

