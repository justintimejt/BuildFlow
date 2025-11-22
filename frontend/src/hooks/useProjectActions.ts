import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  deleteProjectFromStorage,
  duplicateProject,
  updateProjectName,
  exportProjectToJSON,
  loadProjectFromStorage
} from '../utils/storage';
import { Project } from '../types';
import { supabaseClient, isSupabaseAvailable } from '../lib/supabaseClient';

export const useProjectActions = () => {
  const navigate = useNavigate();

  const openProject = useCallback((id: string) => {
    navigate(`/project/${id}`);
  }, [navigate]);

  const deleteProject = useCallback(async (id: string): Promise<boolean> => {
    const result = deleteProjectFromStorage(id);
    
    if (!result.success) {
      return false;
    }
    
    // If project has a Supabase ID, delete it from Supabase as well
    if (result.supabaseId && isSupabaseAvailable() && supabaseClient) {
      try {
        const { error } = await supabaseClient
          .from("projects")
          .delete()
          .eq("id", result.supabaseId);
        
        if (error) {
          console.error("Failed to delete project from Supabase:", error);
          // Still return true since localStorage deletion succeeded
        }
      } catch (error) {
        console.error("Error deleting project from Supabase:", error);
        // Still return true since localStorage deletion succeeded
      }
    }
    
    return true;
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

