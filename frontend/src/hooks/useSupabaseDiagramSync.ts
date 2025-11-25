import { useEffect, useRef, useState, useCallback } from "react";
import { supabaseClient, isSupabaseAvailable } from "../lib/supabaseClient";
import { useProjectContext } from "../contexts/ProjectContext";

export type SaveStatus = "saved" | "saving" | "error" | "idle";

export function useSupabaseDiagramSync(projectId: string | null) {
  const { nodes, edges, getProject } = useProjectContext();
  const lastPayloadRef = useRef<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef<boolean>(false);
  const lastProjectIdRef = useRef<string | null>(null);

  // Reset last payload when project ID changes
  useEffect(() => {
    if (lastProjectIdRef.current !== projectId) {
      lastPayloadRef.current = null;
      lastProjectIdRef.current = projectId;
      setSaveStatus("idle");
    }
  }, [projectId]);

  // Debounced save function
  const saveToSupabase = useCallback(async (currentProjectId: string) => {
    // Prevent concurrent saves
    if (isSavingRef.current) {
      return;
    }

    if (!isSupabaseAvailable() || !supabaseClient) {
      setSaveStatus("idle");
      return;
    }

    const client = supabaseClient;

    try {
      isSavingRef.current = true;
      setSaveStatus("saving");
      setSaveError(null);

      const project = getProject();
      const payload = JSON.stringify(project);

      // Check if payload actually changed - if same, skip save but keep status
      if (payload === lastPayloadRef.current && lastPayloadRef.current !== null) {
        // Already saved this exact state - keep current status (likely "saved")
        isSavingRef.current = false;
        return;
      }

      // Update last payload before saving
      lastPayloadRef.current = payload;

      // Get the current project data from database to check for name
      let projectName = project.name;
      if (!projectName) {
        try {
          const { data } = await client
            .from("projects")
            .select("name, diagram_json")
            .eq("id", currentProjectId)
            .single();
          
          // Prefer name from diagram_json if it exists, otherwise use database name column
          if (data?.diagram_json?.name) {
            projectName = data.diagram_json.name;
          } else if (data?.name) {
            projectName = data.name;
          } else {
            projectName = "Untitled Project";
          }
        } catch (error) {
          console.warn("Failed to fetch project name, using default:", error);
          projectName = "Untitled Project";
        }
      }

      // Ensure the name is also in the diagram_json
      const projectWithName = {
        ...project,
        name: projectName
      };

      // Save to Supabase
      console.log(`💾 Saving project ${currentProjectId} to Supabase...`);
      const { data, error: updateError } = await client
        .from("projects")
        .update({
          name: projectName,
          diagram_json: projectWithName,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentProjectId)
        .select();

      if (updateError) {
        console.error(`❌ Failed to save project ${currentProjectId} to Supabase:`, updateError);
        throw updateError;
      }

      if (data && data.length > 0) {
        console.log(`✅ Successfully auto-saved project ${currentProjectId} to Supabase`);
      } else {
        console.warn(`⚠️ Save operation returned no data for project ${currentProjectId}`);
      }

      setSaveStatus("saved");
      setSaveError(null);
    } catch (error) {
      console.error("Failed to sync to Supabase:", error);
      setSaveStatus("error");
      setSaveError(error instanceof Error ? error.message : "Failed to save");
      // Reset lastPayloadRef on error so we can retry
      lastPayloadRef.current = null;
    } finally {
      isSavingRef.current = false;
    }
  }, [getProject]);

  // Watch for changes and trigger save
  useEffect(() => {
    // Skip sync if Supabase is not available or no project ID
    if (!projectId || !isSupabaseAvailable() || !supabaseClient) {
      if (!projectId) {
        console.log("🔵 Auto-save: No projectId, skipping sync");
      }
      setSaveStatus("idle");
      return;
    }

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Log when auto-save is triggered
    console.log(`💾 Auto-save triggered for project ${projectId} (nodes: ${nodes.length}, edges: ${edges.length})`);

    // Debounce the save operation (400ms delay)
    timeoutRef.current = setTimeout(() => {
      console.log(`💾 Auto-save executing for project ${projectId}`);
      saveToSupabase(projectId);
    }, 400);

    // Cleanup timeout on unmount or dependency change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [nodes, edges, projectId, saveToSupabase]);

  return { saveStatus, saveError };
}

