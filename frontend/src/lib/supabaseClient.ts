import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase is configured
const isSupabaseConfigured = 
  supabaseUrl && 
  supabaseUrl !== 'your_supabase_url_here' &&
  supabaseUrl.startsWith('http') &&
  supabaseAnonKey &&
  supabaseAnonKey !== 'your_supabase_anon_key_here' &&
  supabaseAnonKey.length > 50;

// Helper function to show helpful warnings
function showConfigWarning(instructions: string) {
  const warningMsg = `
╔══════════════════════════════════════════════════════════════╗
║  ⚠️  Supabase Not Configured: Running in Local-Only Mode
╠══════════════════════════════════════════════════════════════╣
║
║  ${instructions}
║
║  📍 To enable Supabase sync:
║     1. Copy frontend/.env.example to frontend/.env
║     2. Add your actual Supabase credentials
║     3. Restart the dev server
║
║  💡 The app will continue to work with localStorage only.
║
╚══════════════════════════════════════════════════════════════╝
  `;
  console.warn(warningMsg);
}

// Create Supabase client or null (graceful degradation)
let supabaseClient: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  try {
    supabaseClient = createClient(supabaseUrl!, supabaseAnonKey!);
    console.log('✅ Supabase client initialized successfully');
  } catch (error) {
    console.error('❌ Failed to create Supabase client:', error);
    showConfigWarning('Invalid Supabase configuration. Check your .env file.');
  }
} else {
  showConfigWarning('Supabase credentials not found or incomplete. App will use localStorage only.\n\nGet your keys from: https://supabase.com/dashboard/project/wqxihrrgcegeniyxwbfs/settings/api');
}

// Export client (may be null if not configured)
export { supabaseClient };

// Helper to check if Supabase is available
export const isSupabaseAvailable = () => supabaseClient !== null;

