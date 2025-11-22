# Visual System Design Editor

A lightweight, browser-based visual editor for designing system architectures through an intuitive drag-and-drop interface. Now with **AI-powered chat assistance via Gemini** and **Supabase backend integration**.

## Features

- 🎨 **Interactive Canvas** - Zoomable and pannable drawing surface
- 📦 **Component Library** - 12 predefined system component types
- 🔗 **Connection System** - Draw edges between nodes
- ✏️ **Node Configuration** - Edit metadata through inspector panel
- 💾 **Persistence** - Save/load projects via Supabase (cloud) or localStorage (offline)
- 📤 **Export** - Export diagrams as PNG images
- 🤖 **AI Chat Assistant (ArchCoach)** - Modify diagrams using natural language via Gemini

## Architecture

This is now a **monorepo** with:

- **`frontend/`** - React + TypeScript SPA (Vite)
- **`backend/`** - FastAPI server with Supabase + Gemini integration

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+ and pip
- Supabase account and project
- Google Gemini API key

### 1. Supabase Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema in `SUPABASE_SCHEMA.sql` in your Supabase SQL editor
3. Get your Supabase URL and keys from Project Settings > API

### 2. Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create `.env` file in `backend/`:
```env
PORT=4000
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
```

5. Run the backend server:
```bash
uvicorn app.main:app --reload --port 4000
```

The backend will be available at `http://localhost:4000`

### 3. Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file in `frontend/`:
```env
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_BACKEND_URL=http://localhost:4000/api
```

4. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

### 4. Run Both (Monorepo)

From the root directory:

```bash
# Install all dependencies
npm run install:all

# Run both frontend and backend
npm run dev
```

This uses `concurrently` to run both servers simultaneously.

## Usage

### Creating a Diagram

1. **Add Components**: Drag components from the left sidebar onto the canvas
2. **Connect Nodes**: Click and drag from a node's connection handle to another node
3. **Edit Properties**: Click on a node to open the inspector panel on the right
4. **AI Chat**: Use the chat panel to modify your diagram with natural language (e.g., "Add a database node", "Connect the API server to the database")
5. **Save Project**: Projects are automatically synced to Supabase as you edit
6. **Export**: Click "Export PNG" to download your diagram as an image

### Component Types

- Web Server
- Database
- Worker
- Cache
- Queue
- Storage
- Third-party API
- Compute Node
- Load Balancer
- Message Broker
- CDN
- Monitoring Service

### AI Chat (ArchCoach)

The AI chat assistant can help you:
- Add nodes to your diagram
- Update node properties
- Create connections between nodes
- Delete nodes or edges
- Modify the overall diagram structure

Examples:
- "Add a Redis cache node"
- "Connect the web server to the database"
- "Delete the monitoring service node"
- "Update the database node name to 'PostgreSQL'"

## Project Structure

```
/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry
│   │   ├── env.py                # Environment config
│   │   ├── supabase_client.py    # Supabase client
│   │   └── routes/
│   │       ├── health.py         # Health check endpoint
│   │       └── chat.py           # Gemini chat endpoint
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/           # React components
│   │   ├── contexts/             # React contexts
│   │   ├── hooks/                # Custom hooks
│   │   │   ├── useProjectId.ts   # Supabase project ID management
│   │   │   ├── useSupabaseDiagramSync.ts  # Sync to Supabase
│   │   │   └── useChatWithGemini.ts       # Chat with backend
│   │   ├── lib/
│   │   │   ├── supabaseClient.ts # Supabase client
│   │   │   └── session.ts        # Session management
│   │   └── ...
│   └── package.json
├── SUPABASE_SCHEMA.sql           # Database schema
└── package.json                  # Monorepo scripts
```

## Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Flow** - Diagram engine
- **TailwindCSS** - Styling
- **html2canvas** - PNG export
- **Supabase JS** - Supabase client

### Backend
- **FastAPI** - Python web framework
- **Supabase Python** - Database client
- **Google Gemini** - AI chat assistant
- **Uvicorn** - ASGI server

## Development

### Backend Development

```bash
cd backend
uvicorn app.main:app --reload --port 4000
```

### Frontend Development

```bash
cd frontend
npm run dev
```

### Build for Production

```bash
# Frontend
cd frontend
npm run build

# Backend
# Deploy using your preferred Python hosting (Railway, Render, etc.)
```

## Environment Variables

### Backend (`backend/.env`)
- `PORT` - Server port (default: 4000)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (keep secret!)
- `GOOGLE_GEMINI_API_KEY` - Google Gemini API key (keep secret!)

### Frontend (`frontend/.env`)
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key (safe for client)
- `VITE_BACKEND_URL` - Backend API URL (e.g., `http://localhost:4000/api`)

## License

MIT
