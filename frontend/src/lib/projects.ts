import { supabaseClient, isSupabaseAvailable } from "./supabaseClient";
import { getCurrentUserId } from "./authHelpers";
import { getOrCreateSessionId } from "./session";
import type { Project } from "../types";

export interface SupabaseProject {
  id: string;
  user_id: string | null;
  session_id: string | null;
  name: string;
  diagram_json: Project;
  created_at: string;
  updated_at: string;
}

export async function createProjectInSupabase({
  name = "Untitled Project",
  initialData = {
    version: "1.0.0",
    name,
    nodes: [],
    edges: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
}: {
  name?: string;
  initialData?: Project;
}): Promise<SupabaseProject> {
  if (!isSupabaseAvailable() || !supabaseClient) {
    throw new Error("Supabase not available");
  }

  const userId = await getCurrentUserId();
  const sessionId = getOrCreateSessionId();

  const insertData: any = {
    session_id: sessionId,
    name,
    diagram_json: initialData,
  };

  if (userId) {
    insertData.user_id = userId;
  }

  const { data, error } = await supabaseClient
    .from("projects")
    .insert(insertData)
    .select("*")
    .single();

  if (error || !data) {
    console.error("Failed to create project in Supabase", error);
    throw error ?? new Error("Failed to create project");
  }

  return data as SupabaseProject;
}

export async function updateProjectInSupabase(
  projectId: string,
  patch: Partial<Pick<SupabaseProject, "name" | "diagram_json">>
): Promise<SupabaseProject> {
  if (!isSupabaseAvailable() || !supabaseClient) {
    throw new Error("Supabase not available");
  }

  const { data, error } = await supabaseClient
    .from("projects")
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId)
    .select("*")
    .single();

  if (error || !data) {
    console.error("Failed to update project in Supabase", error);
    throw error ?? new Error("Failed to update project");
  }

  return data as SupabaseProject;
}

