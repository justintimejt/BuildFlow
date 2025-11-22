import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectContext } from '../../contexts/ProjectContext';
import { useStorage } from '../../hooks/useStorage';
import { useExport } from '../../hooks/useExport';
import { useProjectId } from '../../hooks/useProjectId';
import { supabaseClient, isSupabaseAvailable } from '../../lib/supabaseClient';
import { getOrCreateSessionId } from '../../lib/session';
import { getStoredProjects, updateStoredProjectSupabaseId, updateStoredProjectThumbnail } from '../../utils/storage';
import { useReactFlowContext } from '../../contexts/ReactFlowContext';
import { captureCanvasThumbnail } from '../../utils/canvasCapture';
import { optimizeThumbnail } from '../../utils/thumbnail';
import { FaSave, FaFolderOpen, FaDownload, FaFileExport, FaTrash, FaHome } from 'react-icons/fa';

interface ToolbarProps {
  projectId?: string | null;
}

export function Toolbar({ projectId: toolbarProjectId }: ToolbarProps) {
  const navigate = useNavigate();
  const { getProject, loadProject, clearProject, undo, redo, canUndo, canRedo } = useProjectContext();
  const { reactFlowInstance } = useReactFlowContext();
  const { saveProject, exportToJSON, importFromJSON } = useStorage();
  // Get the current projectId from useProjectId hook (for chat message migration)
  const { projectId: currentSupabaseProjectId } = useProjectId('Untitled Project');
  const { exportAsPNG } = useExport();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcuts for undo/redo (global, works from anywhere)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+Z (undo) or Ctrl+Y / Ctrl+Shift+Z (redo)
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          if (canUndo) {
            undo();
          }
        } else if ((e.key === 'y') || (e.key === 'z' && e.shiftKey)) {
          e.preventDefault();
          if (canRedo) {
            redo();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [undo, redo, canUndo, canRedo]);

  const handleSave = async () => {
    const project = getProject();
    
    // Use projectId from props, or from project.id, or from URL
    const currentProjectId = toolbarProjectId || project.id;
    
    // If we have a projectId, use the existing name or prompt for a new one
    // If we don't have a projectId, prompt for a name
    let name: string | undefined;
    if (currentProjectId) {
      // Get current project name from storage
      const { getStoredProjects } = await import('../../utils/storage');
      const projects = getStoredProjects();
      const currentProject = projects.find(p => p.id === currentProjectId);
      const currentName = currentProject?.name || project.name;
      
      const newName = prompt('Enter project name (optional):', currentName);
      name = newName || currentName;
    } else {
      name = prompt('Enter project name (optional):') || undefined;
    }
    
    try {
      // Save to localStorage - pass projectId to update existing project
      const savedId = saveProject(project, name, currentProjectId || undefined);
      
      // Generate thumbnail if React Flow instance is available
      if (savedId && reactFlowInstance) {
        try {
          const thumbnail = await captureCanvasThumbnail(reactFlowInstance, {
            width: 400,
            height: 300,
            quality: 0.8
          });
          
          if (thumbnail) {
            // Optimize thumbnail to reduce size
            const optimizedThumbnail = await optimizeThumbnail(thumbnail, 100);
            // Update stored project with thumbnail
            updateStoredProjectThumbnail(savedId, optimizedThumbnail);
          }
        } catch (error) {
          console.error('Failed to generate thumbnail:', error);
          // Don't fail the save if thumbnail generation fails
        }
      }
      
      // If Supabase is available, sync to Supabase
      if (savedId && isSupabaseAvailable() && supabaseClient) {
        try {
          const projects = getStoredProjects();
          const storedProject = projects.find(p => p.id === savedId);
          const supabaseId = storedProject?.supabaseId;
          
          const projectWithName = {
            ...project,
            id: savedId,
            name: name || project.name
          };
          
          const sessionId = getOrCreateSessionId();
          
          if (supabaseId) {
            // Update existing Supabase project
            const { error } = await supabaseClient
              .from("projects")
              .update({
                name: name || project.name,
                diagram_json: projectWithName,
                updated_at: new Date().toISOString(),
              })
              .eq("id", supabaseId);
            
            if (error) {
              console.error("Failed to update project in Supabase:", error);
              throw error;
            }
          } else {
            // Check if there's already a Supabase project for this session
            // (might have been created by useProjectId or previous chat)
            const { data: existingProjects } = await supabaseClient
              .from("projects")
              .select("id")
              .eq("session_id", sessionId)
              .order("created_at", { ascending: true })
              .limit(1);
            
            let newSupabaseId: string | null = null;
            
            if (existingProjects && existingProjects.length > 0) {
              // Use existing Supabase project instead of creating a new one
              newSupabaseId = existingProjects[0].id;
              console.log(`ℹ️  Using existing Supabase project: ${newSupabaseId}`);
              
              // Update the existing project with the new data
              const { error: updateError } = await supabaseClient
                .from("projects")
                .update({
                  name: name || project.name || "Untitled Project",
                  diagram_json: projectWithName,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", newSupabaseId);
              
              if (updateError) {
                console.error("Failed to update existing Supabase project:", updateError);
                throw updateError;
              }
            } else {
              // Create new Supabase project
              const { data: created, error } = await supabaseClient
                .from("projects")
                .insert({
                  session_id: sessionId,
                  name: name || project.name || "Untitled Project",
                  diagram_json: projectWithName,
                })
                .select("id")
                .single();
              
              if (error) {
                console.error("Failed to create project in Supabase:", error);
                throw error;
              } else if (created?.id) {
                newSupabaseId = created.id;
                console.log(`✅ Created new Supabase project: ${newSupabaseId}`);
                
                // If there was a previous projectId (from useProjectId), migrate chat messages
                if (currentSupabaseProjectId && currentSupabaseProjectId !== newSupabaseId) {
                  console.log(`🔄 Migrating chat messages from ${currentSupabaseProjectId} to ${newSupabaseId}`);
                  try {
                    const { error: migrateError } = await supabaseClient
                      .from("chat_messages")
                      .update({ project_id: newSupabaseId })
                      .eq("project_id", currentSupabaseProjectId);
                    
                    if (migrateError) {
                      console.error("Failed to migrate chat messages:", migrateError);
                      // Don't throw - migration failure shouldn't block save
                    } else {
                      console.log(`✅ Successfully migrated chat messages to new project`);
                    }
                  } catch (migrateErr) {
                    console.error("Error migrating chat messages:", migrateErr);
                    // Don't throw - migration failure shouldn't block save
                  }
                }
              }
            }
            
            if (newSupabaseId) {
              // Store the Supabase ID in localStorage
              updateStoredProjectSupabaseId(savedId, newSupabaseId);
              
              // Dispatch custom event to notify other components (including chat)
              window.dispatchEvent(new CustomEvent('projectSupabaseIdUpdated', {
                detail: { 
                  localStorageId: savedId, 
                  supabaseId: newSupabaseId,
                  oldProjectId: currentSupabaseProjectId || null
                }
              }));
            }
          }
        } catch (error) {
          console.error("Failed to sync project to Supabase:", error);
          // Don't throw - allow localStorage save to succeed even if Supabase fails
        }
      }
      
      alert('Project saved successfully!');
    } catch (error) {
      alert('Failed to save project');
      console.error(error);
    }
  };

  const handleExportJSON = () => {
    const project = getProject();
    const json = exportToJSON(project);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `project-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const project = importFromJSON(json);
        if (project) {
          loadProject(project);
          alert('Project loaded successfully!');
        } else {
          alert('Invalid project file');
        }
      } catch (error) {
        alert('Failed to load project');
        console.error(error);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportPNG = async () => {
    try {
      await exportAsPNG('canvas-container', `diagram-${Date.now()}.png`);
    } catch (error) {
      alert('Failed to export image');
      console.error(error);
    }
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear the canvas? This cannot be undone.')) {
      clearProject();
    }
  };

  return (
    <div className="h-14 bg-white border-b border-gray-200 flex items-center gap-2 px-4 shadow-sm">
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center justify-center w-10 h-10 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
        title="Back to Dashboard"
        aria-label="Back to Dashboard"
      >
        <FaHome className="w-5 h-5" />
      </button>
      
      <div className="w-px h-6 bg-gray-300" />
      
      <button
        onClick={handleSave}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        title="Save to localStorage"
      >
        <FaSave />
        Save
      </button>

      <button
        onClick={handleImportJSON}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        title="Import JSON file"
      >
        <FaFolderOpen />
        Load
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />

      <button
        onClick={handleExportJSON}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        title="Export as JSON"
      >
        <FaFileExport />
        Export JSON
      </button>

      <button
        onClick={handleExportPNG}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
        title="Export as PNG"
      >
        <FaDownload />
        Export PNG
      </button>

      <div className="flex-1" />

      <button
        onClick={handleClear}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
        title="Clear canvas"
      >
        <FaTrash />
        Clear
      </button>
    </div>
  );
}

