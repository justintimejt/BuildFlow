import { useEffect, useRef } from "react";
import { supabaseClient, isSupabaseAvailable } from "../lib/supabaseClient";
import { useProjectContext } from "../contexts/ProjectContext";

export function useSupabaseDiagramSync(projectId: string | null) {
  const { nodes, edges, getProject } = useProjectContext();
  const lastPayloadRef = useRef<string | null>(null);

  useEffect(() => {
    // Skip sync if Supabase is not available or no project ID
    if (!projectId || !isSupabaseAvailable() || !supabaseClient) {
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const project = getProject();
        const payload = JSON.stringify(project);
        if (payload === lastPayloadRef.current) return;
        lastPayloadRef.current = payload;

        await supabaseClient
          .from("projects")
          .update({
            diagram_json: project,
            updated_at: new Date().toISOString(),
          })
          .eq("id", projectId);
      } catch (error) {
        console.error("Failed to sync to Supabase:", error);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [nodes, edges, getProject, projectId]);
}

