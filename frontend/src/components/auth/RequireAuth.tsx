// frontend/src/components/auth/RequireAuth.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseClient, isSupabaseAvailable } from '../../lib/supabaseClient';
import { DotScreenShader } from '@/components/ui/dot-shader-background';

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
      <div className="min-h-screen bg-black overflow-x-hidden relative flex items-center justify-center">
        {/* Dot Shader Background */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="w-full h-full">
            <DotScreenShader />
          </div>
        </div>
        <div className="relative z-10 text-center">
          <p className="text-xl font-light text-white mix-blend-exclusion">Checking authentication…</p>
        </div>
      </div>
    );
  }

  if (!isAuthed) return null;

  return <>{children}</>;
}

