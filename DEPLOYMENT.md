# BuildFlow Frontend Deployment to Vercel

This document summarizes the deployment setup for the BuildFlow frontend to Vercel.

## ✅ Completed Setup

1. **Created `frontend/.env.example`** - Documents required environment variables:
   - `VITE_BACKEND_URL` - Backend API URL
   - `VITE_SUPABASE_URL` - Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

2. **Created `frontend/vercel.json`** - Vercel configuration:
   - Build command: `npm run build`
   - Output directory: `dist`
   - Framework: `vite`

3. **Verified build configuration**:
   - Build command: `tsc && vite build` (includes TypeScript compilation)
   - Output directory: `dist` (Vite default)
   - All API calls use environment variables (`VITE_BACKEND_URL`)

4. **Fixed merge conflict** in `frontend/src/components/ui/index.ts`

## ⚠️ Pre-Deployment Checklist

Before deploying to Vercel, ensure:

1. **Fix TypeScript errors** - There are some TypeScript errors that need to be resolved:
   - `useSupabaseDiagramSync.ts` - null checks for `supabaseClient`
   - `useTemplates.ts` - Type definitions and implicit any types
   - `nodeTypes.ts` - Unused imports
   - `layoutAlgorithms.ts` - Type issues

2. **Set up Vercel project**:
   - Go to https://vercel.com and log in with GitHub
   - Click "Add New… → Project"
   - Select the BuildFlow GitHub repo
   - Set **Root Directory** to `frontend`
   - Framework should auto-detect as Vite

3. **Configure environment variables in Vercel**:
   - Go to **Settings → Environment Variables**
   - Add for **Production** (and optionally Preview/Development):
     - `VITE_BACKEND_URL` = your deployed backend URL (e.g., `https://your-backend-host.com`)
     - `VITE_SUPABASE_URL` = your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY` = your Supabase anonymous key

4. **Update Supabase OAuth redirect URLs**:
   - In Supabase dashboard → Authentication → URL Configuration
   - Add your Vercel domain: `https://your-app.vercel.app/auth/callback`

5. **Deploy**:
   - Click "Deploy" in Vercel
   - Monitor build logs for any errors
   - Once successful, test the deployed app

## 📝 Notes

- The frontend code already uses environment variables correctly
- OAuth redirects use `window.location.origin` which automatically works with Vercel domains
- The build process includes TypeScript compilation, so all TS errors must be resolved before deployment
- The output directory is `dist` which is the Vite default

## 🔗 Related Files

- `frontend/.env.example` - Environment variable template
- `frontend/vercel.json` - Vercel configuration
- `archcoach-vercel-deploy-prompt.md` - Detailed deployment instructions

