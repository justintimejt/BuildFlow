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

