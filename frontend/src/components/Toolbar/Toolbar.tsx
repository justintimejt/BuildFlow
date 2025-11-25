import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectContext } from '../../contexts/ProjectContext';
import { useStorage } from '../../hooks/useStorage';
import { useExport } from '../../hooks/useExport';
import { useProjectId } from '../../hooks/useProjectId';
import { supabaseClient, isSupabaseAvailable } from '../../lib/supabaseClient';
import { getOrCreateSessionId } from '../../lib/session';
import { getCurrentUserId } from '../../lib/authHelpers';
import { getStoredProjects, updateStoredProjectSupabaseId, updateStoredProjectThumbnail } from '../../utils/storage';
import { useReactFlowContext } from '../../contexts/ReactFlowContext';
import { captureCanvasThumbnail } from '../../utils/canvasCapture';
import { optimizeThumbnail } from '../../utils/thumbnail';
import { FaSave, FaFolderOpen, FaDownload, FaFileExport, FaTrash, FaHome } from 'react-icons/fa';
import { SaveProjectModal } from './SaveProjectModal';
import { Toast } from '../ui/Toast';


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
  const saveButtonRef = useRef<HTMLButtonElement>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveModalDefaultName, setSaveModalDefaultName] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; isVisible: boolean }>({
    message: '',
    type: 'success',
    isVisible: false
  });

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

  const handleSaveClick = async () => {
    const project = getProject();
    
    // Use projectId from props, or from project.id, or from URL
    const currentProjectId = toolbarProjectId || project.id;
    
    // Get current project name from storage if available
    let defaultName = '';
    if (currentProjectId) {
      const { getStoredProjects } = await import('../../utils/storage');
      const projects = getStoredProjects();
      const currentProject = projects.find(p => p.id === currentProjectId);
      defaultName = currentProject?.name || project.name || '';
    } else {
      defaultName = project.name || '';
    }
    
    setSaveModalDefaultName(defaultName);
    setIsSaveModalOpen(true);
  };

  const handleSaveConfirm = async (name: string) => {
    const project = getProject();
    
    // Use projectId from props, or from project.id, or from URL
    const currentProjectId = toolbarProjectId || project.id;
    
    try {
      // Save to localStorage - pass projectId to update existing project
      const projectName = name || project.name || 'Untitled Project';
      const savedId = saveProject(project, projectName, currentProjectId || undefined);
      
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
            name: projectName
          };
          
          const sessionId = getOrCreateSessionId();
          const userId = await getCurrentUserId(); // Get current user ID
          
          if (supabaseId) {
            // Update existing Supabase project
            const updateData: any = {
              name: projectName,
              diagram_json: projectWithName,
              updated_at: new Date().toISOString(),
            };
            
            // Set user_id if authenticated (this will update existing projects)
            if (userId) {
              updateData.user_id = userId;
            }
            
            const { error } = await supabaseClient
              .from("projects")
              .update(updateData)
              .eq("id", supabaseId);
            
            if (error) {
              console.error("Failed to update project in Supabase:", error);
              throw error;
            }
          } else {
            // Check if there's already a Supabase project for this user/session
            let query = supabaseClient
              .from("projects")
              .select("id");
            
            if (userId) {
              query = query.eq("user_id", userId);
            } else {
              query = query.eq("session_id", sessionId);
            }
            
            const { data: existingProjects } = await query
              .order("created_at", { ascending: true })
              .limit(1);
            
            let newSupabaseId: string | null = null;
            
            if (existingProjects && existingProjects.length > 0) {
              // Use existing Supabase project
              newSupabaseId = existingProjects[0].id;
              console.log(`ℹ️  Using existing Supabase project: ${newSupabaseId}`);
              
              const updateData: any = {
                name: projectName,
                diagram_json: projectWithName,
                updated_at: new Date().toISOString(),
              };
              
              // Set user_id if authenticated
              if (userId) {
                updateData.user_id = userId;
              }
              
              const { error: updateError } = await supabaseClient
                .from("projects")
                .update(updateData)
                .eq("id", newSupabaseId);
              
              if (updateError) {
                console.error("Failed to update existing Supabase project:", updateError);
                throw updateError;
              }
            } else {
              // Create new Supabase project
              const insertData: any = {
                session_id: sessionId,
                name: projectName,
                diagram_json: projectWithName,
              };
              
              // Set user_id if authenticated
              if (userId) {
                insertData.user_id = userId;
              }
              
              const { data: created, error } = await supabaseClient
                .from("projects")
                .insert(insertData)
                .select("id")
                .single();
              
              if (error) {
                console.error("Failed to create project in Supabase:", error);
                throw error;
              } else if (created?.id) {
                newSupabaseId = created.id;
                console.log(`✅ Created new Supabase project: ${newSupabaseId}`);
                
                // Migrate chat messages if needed
                if (currentSupabaseProjectId && currentSupabaseProjectId !== newSupabaseId) {
                  console.log(`🔄 Migrating chat messages from ${currentSupabaseProjectId} to ${newSupabaseId}`);
                  try {
                    const { error: migrateError } = await supabaseClient
                      .from("chat_messages")
                      .update({ project_id: newSupabaseId })
                      .eq("project_id", currentSupabaseProjectId);
                    
                    if (migrateError) {
                      console.error("Failed to migrate chat messages:", migrateError);
                    } else {
                      console.log(`✅ Successfully migrated chat messages to new project`);
                    }
                  } catch (migrateErr) {
                    console.error("Error migrating chat messages:", migrateErr);
                  }
                }
              }
            }
            
            if (newSupabaseId) {
              updateStoredProjectSupabaseId(savedId, newSupabaseId);
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
          // Don't throw - allow localStorage save to succeed
        }
      }
      
      setToast({
        message: 'Project saved successfully!',
        type: 'success',
        isVisible: true
      });
    } catch (error) {
      setToast({
        message: 'Failed to save project',
        type: 'error',
        isVisible: true
      });
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
    <div className="h-14 bg-black/0 border-b border-white/10 flex items-center gap-2 px-4 shadow-sm backdrop-blur-sm relative z-20">
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center justify-center w-10 h-10 text-white/70 hover:text-white hover:bg-white/10 rounded-md transition-all duration-200"
        title="Back to Dashboard"
        aria-label="Back to Dashboard"
      >
        <FaHome className="w-5 h-5" />
      </button>
      
      <div className="w-px h-6 bg-white/10" />
      
      <div className="flex items-center gap-2">
        {/* Manual Save Button */}
      <button
          ref={saveButtonRef}
          onClick={handleSaveClick}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-light tracking-tight text-white bg-white/10 border border-white/20 rounded-md hover:bg-white/20 transition-all duration-200"
          title="Save project (rename or save to localStorage)"
      >
        <FaSave />
        Save
      </button>
      </div>

      <SaveProjectModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSaveConfirm}
        defaultName={saveModalDefaultName}
        buttonRef={saveButtonRef}
      />

      <button
        onClick={handleImportJSON}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-light tracking-tight text-white bg-white/10 border border-white/20 rounded-md hover:bg-white/20 transition-all duration-200"
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
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-light tracking-tight text-white bg-white/10 border border-white/20 rounded-md hover:bg-white/20 transition-all duration-200"
        title="Export as JSON"
      >
        <FaFileExport />
        Export JSON
      </button>

      <button
        onClick={handleExportPNG}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-light tracking-tight text-white bg-white/10 border border-white/20 rounded-md hover:bg-white/20 transition-all duration-200"
        title="Export as PNG"
      >
        <FaDownload />
        Export PNG
      </button>

      <div className="flex-1" />

      <button
        onClick={handleClear}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-light tracking-tight text-red-400 bg-red-400/10 border border-red-400/20 rounded-md hover:bg-red-400/20 transition-all duration-200"
        title="Clear canvas"
      >
        <FaTrash />
        Clear
      </button>

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />
    </div>
  );
}

