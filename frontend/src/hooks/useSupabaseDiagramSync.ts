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

        // Get the current project data from database to check for name
        let projectName = project.name;
        if (!projectName) {
          try {
            const { data } = await supabaseClient
              .from("projects")
              .select("name, diagram_json")
              .eq("id", projectId)
              .single();
            
            // Prefer name from diagram_json if it exists, otherwise use database name column
            if (data?.diagram_json?.name) {
              projectName = data.diagram_json.name;
            } else if (data?.name) {
              projectName = data.name;
            } else {
              projectName = "Untitled Project";
            }
          } catch {
            projectName = "Untitled Project";
          }
        }

        // Ensure the name is also in the diagram_json
        const projectWithName = {
          ...project,
          name: projectName
        };

        await supabaseClient
          .from("projects")
          .update({
            name: projectName,
            diagram_json: projectWithName,
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

