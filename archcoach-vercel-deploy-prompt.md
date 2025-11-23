# Deploy BuildFlow Frontend to Vercel – Cursor-ready Prompt

You are an AI pair programmer working in the **BuildFlow** repo.

Your task: **Set up deployment of the frontend on Vercel**, wired to the existing backend and Supabase project. When finished, a push to `main` should automatically trigger a new deployment, and the production site should load correctly with all environment variables configured.

Assumptions:

- Repo is on **GitHub**.
- Frontend is a **React/TypeScript app** (Vite) in a `frontend/` directory.
- Backend (FastAPI + Gemini) is deployed elsewhere (Railway/Render/etc.) and exposed via a public HTTPS URL.
- Supabase project already exists with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

---

## 1. Prepare the frontend for production deploy

1. Confirm the frontend directory structure:

   - Root repo:
     - `frontend/` (React app)
     - `backend/` (FastAPI)
     - README, etc.

2. Inside `frontend/` check the build configuration:

   - Vite example:
     - `package.json` should have:
       - `"build": "vite build"`
     - `vite.config.ts` should output to `dist` (default).

3. Confirm that all **API URLs** used by the frontend come from **environment variables**, not hardcoded localhost. The frontend uses `VITE_BACKEND_URL` for the backend API:

   ```ts
   let backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
   backendUrl = backendUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');
   const response = await fetch(`${backendUrl}/api/chat`, { ... });
   ```

   Do **not** leave `http://localhost:4000` or similar hardcoded in production code.

4. In `frontend/.env.example` (or similar), document required env vars, e.g.:

   ```bash
   VITE_BACKEND_URL=
   VITE_SUPABASE_URL=
   VITE_SUPABASE_ANON_KEY=
   ```

   Note: The frontend code uses `VITE_BACKEND_URL` (not `VITE_API_BASE_URL`) and automatically handles trailing slashes.

---

## 2. Create Vercel project and link GitHub repo

1. Go to **https://vercel.com** and log in with GitHub.
2. Click **"Add New…” → Project"**.
3. Select the **BuildFlow** GitHub repo.
4. In the "Configure Project" step:

   - **Root Directory**: set this to `frontend` (because the frontend lives in `frontend/`).
   - Framework Preset: Vercel should auto-detect `Vite` or `React`.
   - Build Command: verify it is `npm run build` (which runs `tsc && vite build` - includes TypeScript compilation).
   - Output Directory: verify it is `dist` (Vite default).

5. Click **“Continue”** to the environment variables section.

---

## 3. Configure environment variables on Vercel

In the Vercel project settings for this app:

1. Go to **Settings → Environment Variables**.

2. Add the following keys for **Production** (and optionally also for "Preview" and "Development"):

   - `VITE_BACKEND_URL`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

3. Values:

   - `VITE_BACKEND_URL` → the public URL of your backend API, for example:

     ```text
     https://your-backend-host.com
     ```

     (No trailing slash. The frontend code will automatically handle trailing slashes and will call `VITE_BACKEND_URL + "/api/chat"`.)

   - `VITE_SUPABASE_URL` → your Supabase project URL (from Supabase dashboard).
   - `VITE_SUPABASE_ANON_KEY` → your Supabase anon public key.

4. Save the variables.

> **Important:** For Vite and other bundlers, any env var used in client code must be prefixed with `VITE_`. Do not use server-only keys in client code.

---

## 4. Verify frontend config for production URLs

The frontend code in `frontend/src/hooks/useChatWithGemini.ts` already uses environment variables correctly:

```ts
// Get backend URL with fallback to default
// Remove trailing slashes and /api if present to avoid double /api/api
let backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
backendUrl = backendUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');

const res = await fetch(`${backendUrl}/api/chat`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ projectId, message: text }),
});
```

This means:

- In local dev, it uses `http://localhost:4000` (backend running locally).
- On Vercel, `VITE_BACKEND_URL` is injected at build time and used instead.
- The code automatically handles trailing slashes and prevents double `/api/api` paths.

**No code changes needed** - the frontend is already configured correctly.

---

## 5. Trigger first deployment

Once the project is configured in Vercel:

1. In Vercel, click **“Deploy”** (for the initial build).  
   Vercel will:
   - Clone the repo from GitHub.
   - Run `npm install` (or the appropriate package manager) in `frontend/`.
   - Run `npm run build` (which executes `tsc && vite build` - TypeScript compilation + Vite build).
   - Serve the built `dist` folder.

2. If the build fails:
   - Check the **Vercel Build Logs**.
   - Fix any missing env vars or build errors (TypeScript, imports, etc.).
   - Push a new commit to `main` to trigger another deployment.

3. When the deployment succeeds, Vercel will give you a **Production URL**, e.g.:

   ```text
   https://buildflow.vercel.app
   ```

---

## 6. Verify the deployed app

Open the Vercel URL and verify:

1. The frontend loads without errors (no missing env var warnings in the browser console).
2. Logging in (if implemented) works correctly (Supabase env vars are correct).
3. Chat calls go to the **correct backend URL**:
   - Open browser dev tools → Network tab.
   - Send a chat message.
   - Verify requests go to `https://your-backend-host.com/api/chat` (not localhost).
4. The canvas / dashboard / chat interfaces all work as expected.
5. Authentication (Google/GitHub OAuth via Supabase) works correctly.

If API calls fail with CORS errors:

- Ensure the backend is configured to allow CORS from the Vercel domain, e.g. `https://buildflow.vercel.app`.
- Update the Supabase OAuth redirect URLs in the Supabase dashboard to include your Vercel domain (e.g., `https://buildflow.vercel.app/auth/callback`).

---

## 7. Set up automatic deployments from `main`

By default, Vercel will:

- Create a deployment each time you push to **any** branch.
- Treat the repo’s default branch (usually `main`) as **Production**.

Confirm this in the Vercel project:

1. Go to **Settings → Git**.
2. Ensure the **Production Branch** is set to `main`.

Now:

- Push to `main` → new production deployment.
- Push to other branches → preview deployments (useful for testing new features).

---

## 8. Optional: Custom domain

If you want a custom domain (e.g. `app.buildflow.com`):

1. In Vercel project → **Settings → Domains**.
2. Add your domain (e.g. `app.buildflow.com`).
3. Follow Vercel's instructions to update DNS (usually a CNAME record pointing to `cname.vercel-dns.com`).
4. Wait for DNS to propagate; Vercel will issue SSL automatically.

Update any environment variables or third-party OAuth redirects to point at the new domain if needed:
- Update Supabase OAuth redirect URLs to include the new domain (e.g., `https://app.buildflow.com/auth/callback`).

---

## Definition of done

- The **frontend** builds and deploys successfully to Vercel from the `frontend/` directory.
- Environment variables on Vercel include:
  - `VITE_BACKEND_URL` (backend API URL)
  - `VITE_SUPABASE_URL` (Supabase project URL)
  - `VITE_SUPABASE_ANON_KEY` (Supabase anonymous key)
- The production site loads at the Vercel URL (or custom domain) and:
  - Can call the backend `/api/chat` endpoint via `VITE_BACKEND_URL`.
  - Can talk to Supabase (auth, database) using the configured keys.
  - OAuth redirects work correctly (Google/GitHub login).
- Pushing to `main` triggers an automatic new deployment on Vercel.
