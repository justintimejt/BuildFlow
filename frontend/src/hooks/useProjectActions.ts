import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  deleteProjectFromStorage,
  duplicateProject,
  updateProjectName,
  exportProjectToJSON,
  loadProjectFromStorage,
  getStoredProjects
} from '../utils/storage';
import { supabaseClient, isSupabaseAvailable } from '../lib/supabaseClient';

export const useProjectActions = () => {
  const navigate = useNavigate();

  const openProject = useCallback((id: string) => {
    navigate(`/project/${id}`);
  }, [navigate]);

  const deleteProject = useCallback(async (id: string): Promise<boolean> => {
    // First, try to get the project from localStorage to find its supabaseId
    const projects = getStoredProjects();
    
    // Check if id looks like a UUID (Supabase IDs are UUIDs)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    // Find project by ID or by supabaseId (in case we're deleting by Supabase UUID)
    let projectToDelete = projects.find(p => p.id === id);
    if (!projectToDelete && isUUID) {
      // If not found by ID and it's a UUID, check if any localStorage project has this as supabaseId
      projectToDelete = projects.find(p => p.supabaseId === id);
    }
    
    // Determine the Supabase ID to delete
    // Priority: 1) supabaseId from localStorage project, 2) the id itself (if it's a UUID)
    const supabaseId = projectToDelete?.supabaseId || (isUUID ? id : null);
    
    // Determine the localStorage ID to delete (could be different from the passed ID)
    const localStorageId = projectToDelete?.id || (isUUID ? null : id);
    
    // Delete from localStorage if project exists there
    let localStorageDeleted = false;
    if (localStorageId && projectToDelete) {
      const result = deleteProjectFromStorage(localStorageId);
      localStorageDeleted = result.success;
      if (!result.success) {
        console.error(`Failed to delete project ${localStorageId} from localStorage`);
        // Continue anyway to try Supabase deletion
      } else {
        console.log(`✅ Successfully deleted project ${localStorageId} from localStorage`);
      }
    } else if (!isUUID) {
      // If it's not a UUID and not found, try deleting by the ID anyway
      const result = deleteProjectFromStorage(id);
      localStorageDeleted = result.success;
    if (!result.success) {
        console.log(`ℹ️  Project ${id} not found in localStorage`);
    }
    } else {
      console.log(`ℹ️  Project ${id} not found in localStorage, may be Supabase-only`);
      localStorageDeleted = true; // Consider it "deleted" since it wasn't there
    }
    
    // Delete from Supabase if we have a Supabase ID
    let supabaseDeleted = false;
    if (supabaseId && isSupabaseAvailable() && supabaseClient) {
      try {
        console.log(`🗑️  Deleting project ${supabaseId} from Supabase (chat messages will be cascade deleted)`);
        
        // Delete the project itself - this will automatically cascade delete all chat messages
        // due to the foreign key constraint: "project_id uuid not null references projects(id) on delete cascade"
        const { error, data } = await supabaseClient
          .from("projects")
          .delete()
          .eq("id", supabaseId)
          .select(); // Select to verify what was deleted
        
        if (error) {
          console.error("❌ Failed to delete project from Supabase:", error);
          console.error("Error details:", JSON.stringify(error, null, 2));
          supabaseDeleted = false;
        } else if (data && data.length > 0) {
          console.log(`✅ Successfully deleted project ${supabaseId} from Supabase`);
          supabaseDeleted = true;
        } else {
          console.log(`⚠️  Project deletion returned no data - project may not have existed in Supabase or was already deleted`);
          supabaseDeleted = true; // Consider it deleted if it wasn't there
        }
      } catch (error) {
        console.error("❌ Error deleting project from Supabase:", error);
        console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
        supabaseDeleted = false;
      }
    } else {
      if (!supabaseId) {
        console.log(`ℹ️  Project ${id} has no Supabase ID, skipping Supabase deletion`);
      } else if (!isSupabaseAvailable()) {
        console.log(`ℹ️  Supabase not available, skipping Supabase deletion`);
      }
      supabaseDeleted = true; // No Supabase to delete from, so consider it successful
    }
    
    // Return true if at least one deletion succeeded (localStorage or Supabase)
    // This handles cases where project exists only in one place
    return localStorageDeleted || supabaseDeleted;
  }, []);

  const duplicate = useCallback((id: string): string | null => {
    return duplicateProject(id);
  }, []);

  const renameProject = useCallback(async (id: string, newName: string): Promise<boolean> => {
    const result = updateProjectName(id, newName);
    
    if (!result.success) {
      return false;
    }
    
    // If project has a Supabase ID, update it in Supabase as well
    if (result.supabaseId && isSupabaseAvailable() && supabaseClient) {
      try {
        // Get the updated project to include in diagram_json
        const project = loadProjectFromStorage(id);
        const projectWithName = project ? {
          ...project,
          name: newName
        } : null;
        
        const { error } = await supabaseClient
          .from("projects")
          .update({
            name: newName,
            diagram_json: projectWithName || { name: newName },
            updated_at: new Date().toISOString(),
          })
          .eq("id", result.supabaseId);
        
        if (error) {
          console.error("Failed to update project name in Supabase:", error);
          // Still return true since localStorage update succeeded
        }
      } catch (error) {
        console.error("Error updating project name in Supabase:", error);
        // Still return true since localStorage update succeeded
      }
    }
    
    return true;
  }, []);

  const exportProject = useCallback((id: string): string | null => {
    const project = loadProjectFromStorage(id);
    if (!project) return null;
    return exportProjectToJSON(project);
  }, []);

  const downloadProject = useCallback((id: string) => {
    const json = exportProject(id);
    if (!json) return;

    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project-${id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [exportProject]);

  return {
    openProject,
    deleteProject,
    duplicate,
    renameProject,
    exportProject,
    downloadProject
  };
};

