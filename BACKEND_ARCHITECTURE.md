# Backend Architecture Documentation

## Overview

**The Visual System Design Editor is a pure frontend application with NO backend architecture.**

This application operates entirely in the browser as a **single-page application (SPA)** with no server-side components, API endpoints, or database connections.

---

## Architecture Model

### Frontend-Only Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Browser (Client-Side Only)                  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │         React Application (SPA)                    │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐        │ │
│  │  │   UI     │  │  State   │  │  Logic   │        │ │
│  │  │ Components│ │ Management│ │ Hooks    │        │ │
│  │  └──────────┘  └──────────┘  └──────────┘        │ │
│  │                       │                            │ │
│  │                       ▼                            │ │
│  │              ┌─────────────────┐                  │ │
│  │              │  Browser Storage │                  │ │
│  │              │   (localStorage) │                  │ │
│  │              └─────────────────┘                  │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
                           │
                           │ (No Network Calls)
                           │
                    ┌──────┴──────┐
                    │             │
              ┌─────▼─────┐  ┌───▼────┐
              │   Vite    │  │ Static │
              │ Dev Server│  │  Host  │
              └───────────┘  └────────┘
          (Dev only)     (Production)
```

---

## Key Architecture Characteristics

### ✅ What This Application HAS

1. **Pure Frontend Application**
   - React + TypeScript SPA
   - All logic runs in the browser
   - No server-side rendering (SSR)
   - No backend API calls

2. **Client-Side State Management**
   - React Context API for global state
   - Custom hooks for business logic
   - Component-level state for UI

3. **Browser-Based Storage**
   - **localStorage** for persistent data storage
   - JSON file import/export for data portability
   - All data stored locally on user's device

4. **Static Asset Hosting**
   - Production build generates static files
   - Can be deployed to any static hosting service
   - No server configuration required

### ❌ What This Application DOES NOT HAVE

1. **No Backend Server**
   - No Node.js/Express server
   - No Python/Django/Flask backend
   - No Java/Spring Boot server
   - No server-side code at all

2. **No API Endpoints**
   - No REST API
   - No GraphQL API
   - No WebSocket connections
   - No HTTP requests to external services (except static assets)

3. **No Database**
   - No SQL database (PostgreSQL, MySQL, SQLite)
   - No NoSQL database (MongoDB, DynamoDB, Firestore)
   - No database connections or ORMs
   - All persistence handled by browser localStorage

4. **No Authentication/Authorization**
   - No user accounts
   - No login/logout functionality
   - No authentication tokens (JWT, OAuth, etc.)
   - No role-based access control

5. **No External Services**
   - No cloud storage integration (AWS S3, Google Cloud Storage)
   - No third-party API integrations
   - No webhook endpoints
   - No background job processing

---

## Data Persistence Strategy

### Storage Mechanism: localStorage

The application uses **browser localStorage** as its only persistent storage mechanism.

#### Storage Implementation

**Location:** `src/utils/storage.ts`

**Storage Key:** `'visual-system-editor-projects'`

**Storage Format:**
```json
[
  {
    "id": "project-1234567890",
    "name": "My Project",
    "project": {
      "version": "1.0.0",
      "name": "My Project",
      "nodes": [...],
      "edges": [...],
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T11:45:00Z"
    },
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T11:45:00Z"
  }
]
```

#### Storage Operations

1. **Save Project**
   - User clicks "Save" in toolbar
   - Project data serialized to JSON
   - Stored in localStorage as array
   - No network request, instant save

2. **Load Project**
   - User imports JSON file or loads from localStorage
   - Project data parsed from JSON
   - Loaded into React state
   - No network request, instant load

3. **Export/Import**
   - Export: Project data converted to JSON string, downloaded as file
   - Import: User uploads JSON file, parsed and loaded
   - Both operations are purely client-side

#### localStorage Limitations

**Storage Limits:**
- Typically 5-10 MB per origin
- Varies by browser
- No guarantee of persistence across private browsing

**Data Scope:**
- Domain-specific (per origin)
- Not shared across devices/browsers
- Cleared if user clears browser data

**Synchronization:**
- No cloud sync
- No multi-device access
- No collaboration features
- Data exists only on user's local machine

---

## Development vs Production Architecture

### Development Mode

```
┌─────────────────────────────────────────┐
│         Vite Dev Server                 │
│  ┌──────────────────────────────────┐  │
│  │  Hot Module Replacement (HMR)    │  │
│  │  - Live reload on file changes   │  │
│  │  - Fast refresh for React        │  │
│  └──────────────────────────────────┘  │
│              │                          │
│              ▼                          │
│  ┌──────────────────────────────────┐  │
│  │  Static File Serving             │  │
│  │  - Serves index.html             │  │
│  │  - Serves compiled assets        │  │
│  │  - No backend processing         │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
              │
              │ HTTP (static files only)
              ▼
    ┌─────────────────────┐
    │   Browser           │
    │   (React App)       │
    └─────────────────────┘
```

**Vite Dev Server:**
- Port: 5173 (default)
- Serves static files only
- Provides HMR for development experience
- **Not a backend server** - no API endpoints or server-side logic

### Production Mode

```
┌─────────────────────────────────────────┐
│      Static File Hosting                │
│  ┌──────────────────────────────────┐  │
│  │  Build Output (dist/)            │  │
│  │  - index.html                    │  │
│  │  - JavaScript bundles            │  │
│  │  - CSS files                     │  │
│  │  - Static assets                 │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
              │
              │ CDN / Static Hosting
              ▼
    ┌─────────────────────┐
    │   Browser           │
    │   (React App)       │
    └─────────────────────┘
```

**Production Build:**
- Static files generated by Vite
- No server required
- Can be hosted on:
  - Vercel (static hosting)
  - Netlify (static hosting)
  - GitHub Pages
  - AWS S3 + CloudFront
  - Any static file server

---

## Network Communication

### HTTP Requests

**Incoming Requests:**
- Only requests for static assets (HTML, JS, CSS, images)
- All handled by static file server/CDN
- No API endpoints to serve

**Outgoing Requests:**
- None from the application itself
- Dependencies may make requests (e.g., for fonts, icons)
- html2canvas may load external resources for rendering

### Data Flow

```
User Action
    │
    ▼
React Component
    │
    ▼
React Hook / Context
    │
    ▼
State Update
    │
    ▼
localStorage (if save operation)
    │
    ▼
UI Re-render
```

**No Network Layer:**
- All data flow is in-memory (React state)
- Persistence is local (localStorage)
- No network latency
- No server roundtrips
- Instant UI updates

---

## Benefits of Frontend-Only Architecture

### ✅ Advantages

1. **Simplicity**
   - No server setup required
   - No database configuration
   - Easier to understand and maintain

2. **Fast Development**
   - Quick iteration cycles
   - No backend deployment needed
   - All logic in one codebase

3. **Low Cost**
   - No server hosting costs
   - Can use free static hosting
   - No database costs

4. **Privacy**
   - All data stays on user's device
   - No data transmitted to servers
   - User has full control

5. **Performance**
   - No network latency
   - Instant UI updates
   - Fast local operations

6. **Offline Capability**
   - Works offline (except initial load)
   - No server dependency
   - Self-contained application

### ⚠️ Limitations

1. **No Cloud Sync**
   - Data not accessible across devices
   - No backup in cloud
   - Data lost if browser data cleared

2. **No Collaboration**
   - No multi-user support
   - No real-time sharing
   - No version control

3. **Storage Limits**
   - localStorage has size limits (~5-10MB)
   - Not suitable for large projects
   - No scalable storage

4. **No Server-Side Processing**
   - All computation in browser
   - Limited by browser capabilities
   - No background jobs

---

## Deployment Architecture

### Current Deployment Model

**Static Site Hosting:**

```
┌─────────────────────────────────────────┐
│   Static Hosting Service                │
│   (Vercel / Netlify / GitHub Pages)     │
│                                         │
│   ┌─────────────────────────────────┐  │
│   │   Static Files                  │  │
│   │   - index.html                  │  │
│   │   - assets/*.js                 │  │
│   │   - assets/*.css                │  │
│   └─────────────────────────────────┘  │
└─────────────────────────────────────────┘
              │
              │ HTTPS
              ▼
    ┌─────────────────────┐
    │   User's Browser    │
    │   (Downloads &      │
    │    Runs Locally)    │
    └─────────────────────┘
```

**Deployment Steps:**
1. Build command: `npm run build`
2. Output directory: `dist/`
3. Upload `dist/` contents to static host
4. No server configuration needed
5. No environment variables needed (unless for build-time only)
6. No database setup needed

---

## Future Backend Considerations

If backend functionality is needed in the future, here are potential architectures:

### Option 1: Backend-as-a-Service (BaaS)

```
Frontend (React) → Firebase / Supabase / Appwrite
                    ↓
              - Authentication
              - Database (Firestore/PostgreSQL)
              - Storage (Files)
              - Real-time sync
```

**Pros:** Quick setup, managed services
**Cons:** Vendor lock-in, ongoing costs

### Option 2: Traditional Backend API

```
Frontend (React) → REST/GraphQL API → Database
                    ↓
              Node.js/Express
              Python/FastAPI
              Java/Spring Boot
```

**Pros:** Full control, flexible
**Cons:** More complex, requires maintenance

### Option 3: Serverless Functions

```
Frontend (React) → API Gateway → Lambda/Cloud Functions
                    ↓
              - Serverless functions
              - Managed database
              - File storage
```

**Pros:** Scalable, pay-per-use
**Cons:** Cold starts, distributed architecture

---

## Summary

**Current Backend Architecture: NONE**

- ✅ Pure frontend application
- ✅ Client-side state management
- ✅ Browser localStorage for persistence
- ✅ Static file hosting for deployment
- ❌ No backend server
- ❌ No API endpoints
- ❌ No database
- ❌ No authentication
- ❌ No cloud services

This architecture is intentionally simple and suited for a lightweight, privacy-focused, single-user diagramming tool that operates entirely within the browser.

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Architecture Type:** Frontend-Only / Client-Side Only

