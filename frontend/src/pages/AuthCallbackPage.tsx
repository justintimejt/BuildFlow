// frontend/src/pages/AuthCallbackPage.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseClient, isSupabaseAvailable } from '../lib/supabaseClient';
import { DotScreenShader } from '@/components/ui/dot-shader-background';

export function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      if (!isSupabaseAvailable() || !supabaseClient) {
        console.error('Supabase is not configured');
        navigate('/login');
        return;
      }

      // Handle the OAuth callback - Supabase uses URL hash fragments
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const error = hashParams.get('error');

      if (error) {
        console.error('OAuth error:', error);
        navigate('/login');
        return;
      }

      // If we have an access token in the URL, wait a moment for Supabase to process it
      if (accessToken) {
        // Give Supabase a moment to set the session
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Check for session
      const { data, error: sessionError } = await supabaseClient.auth.getSession();

      if (sessionError) {
        console.error('Error fetching session after OAuth callback', sessionError);
        navigate('/login');
        return;
      }

      if (data.session) {
        // Clear the hash from URL
        window.history.replaceState(null, '', window.location.pathname);
        navigate('/dashboard', { replace: true });
      } else {
        // If no session, try listening for auth state change
        const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session) {
            window.history.replaceState(null, '', window.location.pathname);
            navigate('/dashboard', { replace: true });
            subscription.unsubscribe();
          } else if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
            navigate('/login', { replace: true });
            subscription.unsubscribe();
          }
        });

        // Fallback: if no session after 3 seconds, redirect to login
        setTimeout(() => {
          subscription.unsubscribe();
          navigate('/login', { replace: true });
        }, 3000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-black overflow-x-hidden relative flex items-center justify-center">
      {/* Dot Shader Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="w-full h-full">
          <DotScreenShader />
        </div>
      </div>
      <div className="relative z-10 text-center">
        <p className="text-xl font-light text-white mix-blend-exclusion">Finishing sign-in…</p>
      </div>
    </div>
  );
}

