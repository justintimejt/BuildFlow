import { useEffect, useRef, useState } from "react";
import { supabaseClient, isSupabaseAvailable } from "../lib/supabaseClient";
import { useProjectContext } from "../contexts/ProjectContext";

export type SaveStatus = "saved" | "saving" | "error" | "idle";

export function useSupabaseDiagramSync(projectId: string | null) {
  const { nodes, edges, getProject } = useProjectContext();
  const lastPayloadRef = useRef<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    // Skip sync if Supabase is not available or no project ID
    if (!projectId || !isSupabaseAvailable() || !supabaseClient) {
      setSaveStatus("idle");
      return;
    }

    // Store supabaseClient in a const to satisfy TypeScript
    const client = supabaseClient;

    const timeout = setTimeout(async () => {
      try {
        const project = getProject();
        const payload = JSON.stringify(project);
        if (payload === lastPayloadRef.current) {
          setSaveStatus("saved");
          return;
        }
        
        setSaveStatus("saving");
        setSaveError(null);
        lastPayloadRef.current = payload;

        // Get the current project data from database to check for name
        let projectName = project.name;
        if (!projectName) {
          try {
            const { data } = await client
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

        await client
          .from("projects")
          .update({
            name: projectName,
            diagram_json: projectWithName,
            updated_at: new Date().toISOString(),
          })
          .eq("id", projectId);
        
        setSaveStatus("saved");
        setSaveError(null);
      } catch (error) {
        console.error("Failed to sync to Supabase:", error);
        setSaveStatus("error");
        setSaveError(error instanceof Error ? error.message : "Failed to save");
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [nodes, edges, getProject, projectId]);

  return { saveStatus, saveError };
}

