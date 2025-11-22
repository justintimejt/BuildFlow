# How to Find Your Supabase Credentials

## What You Have:
`wqxihrrgcegeniyxwbfs` - This is your **Project Reference ID**

## Where to Get All Your Keys:

### Step 1: Go to Supabase Dashboard
1. Visit: https://supabase.com/dashboard
2. Log in to your account
3. Select your project

### Step 2: Navigate to API Settings
1. Click on **Settings** (gear icon in left sidebar)
2. Click on **API** in the settings menu

### Step 3: Find These Values:

#### 1. Project URL (for both .env files)
- Look for **Project URL** section
- It will look like: `https://wqxihrrgcegeniyxwbfs.supabase.co`
- Copy this entire URL

#### 2. anon public key (for frontend/.env)
- Look for **Project API keys** section
- Find the key labeled **anon public**
- Click "Reveal" if hidden
- Copy the entire key (it's very long, starts with `eyJ...`)
- This is safe to use in frontend code

#### 3. service_role secret key (for backend/.env)
- In the same **Project API keys** section
- Find the key labeled **service_role secret**
- Click "Reveal" if hidden
- Copy the entire key (it's very long, starts with `eyJ...`)
- ⚠️ **NEVER expose this key publicly!** Only use in backend/.env
- This key bypasses Row Level Security (RLS)

## What They Look Like:

### Project URL:
```
https://wqxihrrgcegeniyxwbfs.supabase.co
```

### API Keys (both look similar but are different):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxeGlocnJnY2VnZW5peXh3YmZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk4MTIzNDUsImV4cCI6MjAyNTM4ODM0NX0.abcdefghijklmnopqrstuvwxyz123456789
```
(They are very long JWT tokens - usually 200+ characters)

## How to Fill Your .env Files:

### backend/.env:
```env
PORT=4000
SUPABASE_URL=https://wqxihrrgcegeniyxwbfs.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (the LONG service_role key)
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
```

### frontend/.env:
```env
VITE_SUPABASE_URL=https://wqxihrrgcegeniyxwbfs.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (the LONG anon key)
VITE_BACKEND_URL=http://localhost:4000/api
```

## Quick Check:
- ✅ Project ID is SHORT (~20 chars) - used in URL
- ✅ API Keys are LONG (200+ chars, JWT format starting with `eyJ`)
- ✅ Service Role key says "secret" - use in backend only
- ✅ Anon key says "public" - safe for frontend
