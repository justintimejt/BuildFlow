import { supabaseClient, isSupabaseAvailable } from './supabaseClient';

/**
 * Gets the current authenticated user's ID, or null if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  if (!isSupabaseAvailable() || !supabaseClient) {
    return null;
  }

  try {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    
    if (error || !session?.user) {
      return null;
    }

    return session.user.id;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
}

