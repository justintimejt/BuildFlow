# Setup Guide - Visual System Design Editor

This guide walks you through setting up the complete frontend + backend architecture with Supabase and Gemini integration.

## Step-by-Step Setup

### 1. Supabase Project Setup

1. **Create Supabase Account**
   - Go to [supabase.com](https://supabase.com)
   - Sign up or log in
   - Create a new project

2. **Run Database Schema**
   - In your Supabase dashboard, go to SQL Editor
   - Copy and paste the contents of `SUPABASE_SCHEMA.sql`
   - Execute the SQL to create tables and policies

3. **Get Your Supabase Credentials**
   - Go to Project Settings > API
   - Copy your:
     - Project URL (e.g., `https://xxxxx.supabase.co`)
     - Anon/Public Key (for frontend)
     - Service Role Key (for backend - **KEEP SECRET!**)

### 2. Google Gemini API Setup

1. **Get API Key**
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Sign in with your Google account
   - Create a new API key
   - Copy the API key (you'll need it for backend)

### 3. Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create Python virtual environment (recommended):**
   ```bash
   python -m venv venv
   # On macOS/Linux:
   source venv/bin/activate
   # On Windows:
   venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Create `.env` file in `backend/` directory:**
   ```env
   PORT=4000
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   GOOGLE_GEMINI_API_KEY=your-gemini-api-key-here
   ```

5. **Test the backend:**
   ```bash
   uvicorn app.main:app --reload --port 4000
   ```
   
   You should see:
   ```
   INFO:     Uvicorn running on http://127.0.0.1:4000 (Press CTRL+C to quit)
   ```

6. **Verify health endpoint:**
   ```bash
   curl http://localhost:4000/api/health
   ```
   
   Should return: `{"ok":true}`

### 4. Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```
   
   This will install:
   - React and dependencies
   - Vite
   - React Flow
   - Supabase JS client
   - All other frontend dependencies

3. **Create `.env` file in `frontend/` directory:**
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   VITE_BACKEND_URL=http://localhost:4000/api
   ```

4. **Start the frontend dev server:**
   ```bash
   npm run dev
   ```
   
   The app should open at `http://localhost:5173`

### 5. Run Both Services (Monorepo Style)

From the root directory:

1. **Install root dependencies:**
   ```bash
   npm install
   ```

2. **Install frontend dependencies:**
   ```bash
   cd frontend && npm install && cd ..
   ```

3. **Install backend dependencies:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # or venv\Scripts\activate on Windows
   pip install -r requirements.txt
   cd ..
   ```

4. **Run both services:**
   ```bash
   npm run dev
   ```
   
   This will start both backend (port 4000) and frontend (port 5173) simultaneously.

### 6. Testing the Integration

1. **Open the app** in your browser: `http://localhost:5173`

2. **Create a diagram:**
   - Drag some nodes from the left sidebar
   - Connect them with edges
   - Edit node properties

3. **Test Supabase sync:**
   - Check your Supabase dashboard > Table Editor > `projects` table
   - You should see a new row with your diagram JSON
   - The diagram should sync automatically as you edit

4. **Test AI Chat (if chat panel is added):**
   - Open the chat panel (you may need to add it to the UI)
   - Send a message like: "Add a database node"
   - The AI should respond with operations and apply them to your diagram

## Troubleshooting

### Backend Issues

**"Missing environment variables" error:**
- Check that your `backend/.env` file exists and has all required variables
- Ensure variable names match exactly (case-sensitive)

**"Module not found" errors:**
- Make sure you activated the virtual environment
- Reinstall dependencies: `pip install -r requirements.txt`

**CORS errors:**
- Check that CORS middleware is configured in `backend/app/main.py`
- Verify frontend URL is allowed in CORS settings

### Frontend Issues

**"VITE_SUPABASE_URL is not defined":**
- Check that `frontend/.env` file exists
- Ensure variable names start with `VITE_` prefix
- Restart the dev server after creating/modifying `.env`

**"Failed to load project" errors:**
- Verify Supabase credentials are correct
- Check browser console for detailed error messages
- Ensure RLS policies allow access (check SUPABASE_SCHEMA.sql)

**Backend connection errors:**
- Verify backend is running on port 4000
- Check `VITE_BACKEND_URL` in frontend `.env` matches backend URL
- Check browser console for CORS or network errors

### Supabase Issues

**"Row Level Security policy violation":**
- Run the RLS policies from `SUPABASE_SCHEMA.sql`
- For development, the schema includes permissive policies
- For production, tighten these policies based on your auth requirements

**"Table does not exist":**
- Ensure you ran the entire `SUPABASE_SCHEMA.sql` script
- Check Supabase dashboard > Database > Tables

## Architecture Overview

```
┌─────────────────┐         ┌──────────────┐         ┌─────────────┐
│   Frontend      │────────▶│   Backend    │────────▶│  Supabase   │
│   (React)       │  HTTP   │   (FastAPI)  │   API   │  (Postgres) │
│   Port 5173     │         │   Port 4000  │         │             │
└─────────────────┘         └──────────────┘         └─────────────┘
       │                            │
       │                            ▼
       │                     ┌─────────────┐
       │                     │   Gemini    │
       │                     │     API     │
       │                     └─────────────┘
       │
       ▼
┌─────────────┐
│ localStorage│ (fallback/offline)
└─────────────┘
```

## Next Steps

1. **Add Chat UI:** Integrate the `ChatPanel` component into your main app layout
2. **Enhance AI Prompts:** Improve the Gemini system prompt in `backend/app/routes/chat.py`
3. **Add Authentication:** Implement Supabase Auth for multi-user support
4. **Deploy:**
   - Frontend: Deploy to Vercel/Netlify
   - Backend: Deploy to Railway/Render/Fly.io
   - Supabase: Already hosted, just update env vars

## Environment Variables Summary

### Backend (`backend/.env`)
- `PORT` - Backend server port
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (secret!)
- `GOOGLE_GEMINI_API_KEY` - Gemini API key (secret!)

### Frontend (`frontend/.env`)
- `VITE_SUPABASE_URL` - Supabase project URL (public)
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key (public, safe for client)
- `VITE_BACKEND_URL` - Backend API URL

## Security Notes

- **Never commit `.env` files** to git
- **Service Role Key** should only be in backend `.env`, never in frontend
- **Anon Key** is safe for frontend but has limited permissions
- For production, use proper authentication and tighten RLS policies

