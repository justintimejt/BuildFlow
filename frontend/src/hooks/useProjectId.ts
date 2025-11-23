import { useEffect, useState } from "react";
import { supabaseClient, isSupabaseAvailable } from "../lib/supabaseClient";
import { getOrCreateSessionId } from "../lib/session";
import { getCurrentUserId } from "../lib/authHelpers";

export function useProjectId(initialName: string = "Untitled Project") {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If Supabase is not available, skip and use localStorage mode
    if (!isSupabaseAvailable()) {
      setProjectId(null);
      setLoading(false);
      return;
    }

    const sessionId = getOrCreateSessionId();
    let cancelled = false;

    async function ensureProject() {
      if (!supabaseClient) {
        setProjectId(null);
        setLoading(false);
        return;
      }

      try {
        // Get current user ID if authenticated
        const userId = await getCurrentUserId();
        
        // Build query: filter by user_id if authenticated, otherwise by session_id
        let query = supabaseClient
          .from("projects")
          .select("id");
        
        if (userId) {
          // Authenticated user: query by user_id
          query = query.eq("user_id", userId);
        } else {
          // Anonymous user: query by session_id
          query = query.eq("session_id", sessionId);
        }
        
        const { data, error } = await query
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error("Failed to load project", error);
        }

        if (!cancelled) {
          if (data?.id) {
            setProjectId(data.id);
            setLoading(false);
            return;
          }

          // No project yet; create one with empty diagram
          const emptyDiagram = {
            version: "1.0.0",
            name: initialName,
            nodes: [],
            edges: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          // Prepare insert data
          const insertData: any = {
            session_id: sessionId, // Keep session_id for backward compatibility
            name: initialName,
            diagram_json: emptyDiagram,
          };

          // Set user_id if authenticated
          if (userId) {
            insertData.user_id = userId;
          }

          const { data: created, error: createError } = await supabaseClient
            .from("projects")
            .insert(insertData)
            .select("id")
            .single();

          if (createError) {
            console.error("Failed to create project", createError);
            setProjectId(null);
            setLoading(false);
            return;
          }

          if (!cancelled && created?.id) {
            setProjectId(created.id);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error("Error in useProjectId:", error);
        setProjectId(null);
        setLoading(false);
      }
    }

    ensureProject();

    return () => {
      cancelled = true;
    };
  }, [initialName]);

  return { projectId, loading };
}

