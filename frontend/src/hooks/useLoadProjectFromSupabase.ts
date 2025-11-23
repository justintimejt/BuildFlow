import { useEffect } from "react";
import { supabaseClient, isSupabaseAvailable } from "../lib/supabaseClient";
import { useProjectContext } from "../contexts/ProjectContext";
import type { Project } from "../types";

export function useLoadProjectFromSupabase(projectId: string | null) {
  const { loadProject, nodes } = useProjectContext();
  const hasLoadedRef = { current: false };

  useEffect(() => {
    // Skip if Supabase is not available, no project ID, or already loaded
    // Also skip if nodes already exist (project was loaded from localStorage)
    if (!projectId || !isSupabaseAvailable() || !supabaseClient || hasLoadedRef.current || (nodes && nodes.length > 0)) {
      return;
    }

    // Store supabaseClient in a const to satisfy TypeScript
    const client = supabaseClient;

    let cancelled = false;

    async function loadProjectData() {
      try {
        const { data, error } = await client
          .from("projects")
          .select("diagram_json, name")
          .eq("id", projectId)
          .single();

        if (error) {
          console.error("Failed to load project from Supabase:", error);
          return;
        }

        if (!cancelled && data) {
          // Load the diagram_json if it exists and has nodes/edges
          if (data.diagram_json) {
            const diagram = data.diagram_json as Project;
            if (diagram.nodes && diagram.edges) {
              // Ensure name is set from database if not in diagram_json
              const projectToLoad: Project = {
                ...diagram,
                name: diagram.name || data.name || "Untitled Project",
              };
              loadProject(projectToLoad);
              hasLoadedRef.current = true;
            }
          }
        }
      } catch (error) {
        console.error("Error loading project from Supabase:", error);
      }
    }

    loadProjectData();

    return () => {
      cancelled = true;
    };
  }, [projectId, loadProject]);
}

