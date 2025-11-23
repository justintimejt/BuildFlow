# Supabase Google Auth Login Card – Cursor-ready Prompt

You are an AI pair programmer working in the **BuildFlow / Luna** repo.

Your task: **Create a login card UI that lets users sign in / sign up with Google using Supabase Auth (Google OAuth)**, and wire it up end-to-end on the frontend.

The result should be a clean, centered login card with:

- App name / logo
- Short description
- A primary **"Continue with Google"** button
- Basic loading/error handling
- Integration with **Supabase Google OAuth**

This is a React/TypeScript frontend using Vite and Supabase JS v2.

---

## 1. Supabase dashboard: enable Google provider

**Required setup in Supabase Dashboard:**

1. Go to **Authentication → Providers → Google** in your Supabase project dashboard.
2. Enable Google and add your **Client ID** and **Client Secret** from Google Cloud Console.
3. Set the **Redirect URL** to:
   - `http://localhost:5173/auth/callback` (dev - Vite default port)
   - `https://your-production-domain.com/auth/callback` (prod)
4. Make sure these URLs match what you'll use in `redirectTo` on the frontend.

---

## 2. Login card component

Create a reusable **`LoginCard`** React component that renders the UI and handles the Google sign-in flow.

**File location:** `frontend/src/components/auth/LoginCard.tsx`

```tsx
// frontend/src/components/auth/LoginCard.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseClient, isSupabaseAvailable } from '../../lib/supabaseClient';

type LoginCardProps = {
  redirectPathAfterLogin?: string;
};

export function LoginCard({
  redirectPathAfterLogin = '/dashboard',
}: LoginCardProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    if (!isSupabaseAvailable() || !supabaseClient) {
      setError('Supabase is not configured. Please check your environment variables.');
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const redirectTo = `${window.location.origin}/auth/callback`;

      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
        },
      });

      if (error) {
        console.error('Supabase Google OAuth error', error);
        setError(error.message);
        setIsLoading(false);
      }
      // On success, user is redirected to Google then back to redirectTo.
      // No further action needed here.
    } catch (err: any) {
      console.error('Unexpected error during Google sign-in', err);
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  if (!isSupabaseAvailable()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-gray-800">Welcome to BuildFlow</h1>
            <p className="mt-3 text-sm text-red-600">
              Supabase is not configured. Please set up your environment variables.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-800">Welcome to BuildFlow</h1>
          <p className="mt-1 text-sm text-gray-500">
            Sign in to save and manage your architecture diagrams.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70 transition-colors"
        >
          {isLoading ? (
            <span>Signing in…</span>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 48 48"
                className="h-5 w-5"
              >
                <path
                  fill="#FFC107"
                  d="M43.6 20.5H42V20H24v8h11.3C33.6 31.9 29.3 35 24 35 16.8 35 11 29.2 11 22s5.8-13 13-13c3.3 0 6.3 1.2 8.6 3.3l5.7-5.7C34.6 3.2 29.7 1 24 1 12.3 1 3 10.3 3 22s9.3 21 21 21c10.5 0 20-7.6 20-21 0-1.2-.1-2.3-.4-3.5z"
                />
                <path
                  fill="#FF3D00"
                  d="M6.3 14.7l6.6 4.8C14.4 16.2 18.8 13 24 13c3.3 0 6.3 1.2 8.6 3.3l5.7-5.7C34.6 7.2 29.7 5 24 5 16.3 5 9.6 9.3 6.3 14.7z"
                />
                <path
                  fill="#4CAF50"
                  d="M24 43c5.2 0 10-1.9 13.6-5.2l-6.3-5.2C29.1 34.5 26.7 35 24 35c-5.2 0-9.5-3.1-11.3-7.5l-6.6 5.1C9.6 38.7 16.3 43 24 43z"
                />
                <path
                  fill="#1976D2"
                  d="M43.6 20.5H42V20H24v8h11.3c-1 2.5-2.8 4.6-5.1 6.1.1-.1 0 0 0 0l6.3 5.2C35.9 40.4 40 37 42.7 32.1c1.3-2.3 2.1-4.9 2.1-8.1 0-1.2-.1-2.3-.4-3.5z"
                />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>

        {error && (
          <p className="mt-3 text-center text-xs text-red-600">
            {error}
          </p>
        )}

        <p className="mt-6 text-center text-xs text-gray-500">
          By continuing, you agree to our Terms and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
```

**Create the auth components index file:** `frontend/src/components/auth/index.ts`

```ts
export { LoginCard } from './LoginCard';
```

- Keep the card centered with full-screen flex container.
- Button uses a loading state and basic error message.
- Handles the case where Supabase is not configured.

---

## 3. Auth callback route

Create a simple **`/auth/callback`** page/route that Supabase will redirect to after Google sign-in. This route should:

1. Call `supabaseClient.auth.getSession()` to ensure the user is logged in.
2. Redirect the user to the app's main authenticated area (e.g. `/dashboard`).

**File location:** `frontend/src/pages/AuthCallbackPage.tsx`

```tsx
// frontend/src/pages/AuthCallbackPage.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseClient, isSupabaseAvailable } from '../lib/supabaseClient';

export function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      if (!isSupabaseAvailable() || !supabaseClient) {
        console.error('Supabase is not configured');
        navigate('/login');
        return;
      }

      const { data, error } = await supabaseClient.auth.getSession();

      if (error) {
        console.error('Error fetching session after OAuth callback', error);
        navigate('/login');
        return;
      }

      if (data.session) {
        navigate('/dashboard');
      } else {
        navigate('/login');
      }
    };

    checkSession();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <p className="text-sm text-gray-600">Finishing sign-in…</p>
    </div>
  );
}
```

---

## 4. Update LoginPage

Update the existing **`LoginPage`** to use `LoginCard`:

**File location:** `frontend/src/pages/LoginPage.tsx`

```tsx
// frontend/src/pages/LoginPage.tsx
import { LoginCard } from '../components/auth';

export function LoginPage() {
  return <LoginCard />;
}
```

---

## 5. Update App.tsx routing

Add the auth callback route to your router:

**File location:** `frontend/src/App.tsx`

Add this import:
```tsx
import { AuthCallbackPage } from './pages/AuthCallbackPage';
```

Add this route inside the `<Routes>` component:
```tsx
<Route path="/auth/callback" element={<AuthCallbackPage />} />
```

The complete routes section should look like:
```tsx
<Routes>
  <Route path="/" element={<HomePage />} />
  <Route path="/login" element={<LoginPage />} />
  <Route path="/auth/callback" element={<AuthCallbackPage />} />
  <Route path="/dashboard" element={<DashboardPage />} />
  <Route path="/project/:id" element={<CanvasPage />} />
  <Route path="/project/new" element={<CanvasPage />} />
</Routes>
```

---

## 6. Protected routes (optional but recommended)

To make login meaningful, protect the dashboard / editor routes so only authenticated users can access them.

Implement a simple `RequireAuth` wrapper that checks the session and redirects to `/login` if the user is not signed in.

**File location:** `frontend/src/components/auth/RequireAuth.tsx`

```tsx
// frontend/src/components/auth/RequireAuth.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseClient, isSupabaseAvailable } from '../../lib/supabaseClient';

interface RequireAuthProps {
  children: React.ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const check = async () => {
      if (!isSupabaseAvailable() || !supabaseClient) {
        // If Supabase is not configured, allow access (graceful degradation)
        setIsAuthed(true);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabaseClient.auth.getSession();
      if (error || !data.session) {
        setIsAuthed(false);
        setIsLoading(false);
        navigate('/login');
        return;
      }
      setIsAuthed(true);
      setIsLoading(false);
    };

    check();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-600">Checking authentication…</p>
      </div>
    );
  }

  if (!isAuthed) return null;

  return <>{children}</>;
}
```

**Update the auth index file:** `frontend/src/components/auth/index.ts`

```ts
export { LoginCard } from './LoginCard';
export { RequireAuth } from './RequireAuth';
```

Then wrap your dashboard / editor routes with `RequireAuth` in `App.tsx`:

```tsx
<Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
<Route path="/project/:id" element={<RequireAuth><CanvasPage /></RequireAuth>} />
<Route path="/project/new" element={<RequireAuth><CanvasPage /></RequireAuth>} />
```

---

## Definition of done

- There is a **dedicated login page** at `/login` that renders a **centered login card**.
- The login card shows:
  - App title/description ("Welcome to BuildFlow").
  - A primary **"Continue with Google"** button with Google icon.
- Clicking the button triggers **Supabase Google OAuth** via `supabaseClient.auth.signInWithOAuth({ provider: "google" })`.
- Successful login redirects back to `/auth/callback`, which then redirects to `/dashboard`.
- Errors are handled gracefully and shown in the login card.
- The implementation handles the case where Supabase is not configured (graceful degradation).
- All file paths match the repo structure: `frontend/src/components/auth/` and `frontend/src/pages/`.
- Uses existing Supabase client from `frontend/src/lib/supabaseClient.ts` which exports `supabaseClient` and `isSupabaseAvailable()`.
