// frontend/src/components/auth/LoginCard.tsx
import { useState } from 'react';
import { supabaseClient, isSupabaseAvailable } from '../../lib/supabaseClient';

type LoginCardProps = {
  redirectPathAfterLogin?: string;
};

export function LoginCard({
  redirectPathAfterLogin = '/dashboard',
}: LoginCardProps) {
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isLoadingGitHub, setIsLoadingGitHub] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    if (!isSupabaseAvailable() || !supabaseClient) {
      setError('Supabase is not configured. Please check your environment variables.');
      return;
    }

    setError(null);
    setIsLoadingGoogle(true);
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
        setIsLoadingGoogle(false);
      }
      // On success, user is redirected to Google then back to redirectTo.
      // No further action needed here.
    } catch (err: any) {
      console.error('Unexpected error during Google sign-in', err);
      setError('Something went wrong. Please try again.');
      setIsLoadingGoogle(false);
    }
  };

  const handleGitHubSignIn = async () => {
    if (!isSupabaseAvailable() || !supabaseClient) {
      setError('Supabase is not configured. Please check your environment variables.');
      return;
    }

    setError(null);
    setIsLoadingGitHub(true);
    try {
      const redirectTo = `${window.location.origin}/auth/callback`;

      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo,
        },
      });

      if (error) {
        console.error('Supabase GitHub OAuth error', error);
        setError(error.message);
        setIsLoadingGitHub(false);
      }
      // On success, user is redirected to GitHub then back to redirectTo.
      // No further action needed here.
    } catch (err: any) {
      console.error('Unexpected error during GitHub sign-in', err);
      setError('Something went wrong. Please try again.');
      setIsLoadingGitHub(false);
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

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoadingGoogle || isLoadingGitHub}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70 transition-colors"
          >
            {isLoadingGoogle ? (
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

          <button
            type="button"
            onClick={handleGitHubSignIn}
            disabled={isLoadingGoogle || isLoadingGitHub}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70 transition-colors"
          >
            {isLoadingGitHub ? (
              <span>Signing in…</span>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="h-5 w-5 fill-current"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                <span>Continue with GitHub</span>
              </>
            )}
          </button>
        </div>

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

