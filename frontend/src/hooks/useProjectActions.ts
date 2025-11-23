import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  deleteProjectFromStorage,
  duplicateProject,
  updateProjectName,
  exportProjectToJSON,
  loadProjectFromStorage
} from '../utils/storage';
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
        console.log(`🗑️  Deleting project ${result.supabaseId} from Supabase (chat messages will be cascade deleted)`);
        
        // Delete the project itself - this will automatically cascade delete all chat messages
        // due to the foreign key constraint: "project_id uuid not null references projects(id) on delete cascade"
        const { error, data } = await supabaseClient
          .from("projects")
          .delete()
          .eq("id", result.supabaseId)
          .select(); // Select to verify what was deleted
        
        if (error) {
          console.error("❌ Failed to delete project from Supabase:", error);
          console.error("Error details:", JSON.stringify(error, null, 2));
          
          // Try to delete chat messages explicitly as a fallback
          // (in case cascade isn't working due to RLS or other issues)
          console.log("🔄 Attempting to delete chat messages explicitly as fallback...");
          const { error: chatError, count: chatCount } = await supabaseClient
            .from("chat_messages")
            .delete()
            .eq("project_id", result.supabaseId)
            .select();
          
          if (chatError) {
            console.error("❌ Failed to delete chat messages from Supabase:", chatError);
          } else {
            console.log(`✅ Deleted ${chatCount || 0} chat messages as fallback`);
          }
          
          // Still return true since localStorage deletion succeeded
          return true;
        }
        
        // Verify deletion succeeded
        if (data && data.length > 0) {
          console.log(`✅ Successfully deleted project ${result.supabaseId} from Supabase`);
          
          // Verify that chat messages were also deleted (cascade should have handled this)
          const { data: remainingMessages, error: verifyError } = await supabaseClient
            .from("chat_messages")
            .select("id")
            .eq("project_id", result.supabaseId)
            .limit(1);
          
          if (verifyError) {
            console.log(`ℹ️  Could not verify chat message deletion: ${verifyError.message}`);
          } else if (remainingMessages && remainingMessages.length > 0) {
            console.warn(`⚠️  Warning: ${remainingMessages.length} chat message(s) still exist after project deletion`);
            console.warn(`⚠️  This suggests cascade delete may not be working. Attempting explicit deletion...`);
            
            // Try explicit deletion as fallback
            const { error: explicitDeleteError } = await supabaseClient
              .from("chat_messages")
              .delete()
              .eq("project_id", result.supabaseId);
            
            if (explicitDeleteError) {
              console.error(`❌ Failed to explicitly delete remaining chat messages:`, explicitDeleteError);
            } else {
              console.log(`✅ Explicitly deleted remaining chat messages`);
            }
          } else {
            console.log(`✅ Verified: All chat messages were automatically deleted via cascade`);
          }
        } else {
          console.log(`⚠️  Project deletion returned no data - project may not have existed in Supabase`);
        }
      } catch (error) {
        console.error("❌ Error deleting project from Supabase:", error);
        console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
        // Still return true since localStorage deletion succeeded
      }
    } else {
      if (!result.supabaseId) {
        console.log(`ℹ️  Project ${id} has no Supabase ID, skipping Supabase deletion`);
      } else if (!isSupabaseAvailable()) {
        console.log(`ℹ️  Supabase not available, skipping Supabase deletion`);
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

