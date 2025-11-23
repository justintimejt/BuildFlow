import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ProjectProvider, useProjectContext } from '../contexts/ProjectContext';
import { ReactFlowProvider } from '../contexts/ReactFlowContext';
import { ComponentLibrary } from '../components/SidebarLeft';
import { Canvas } from '../components/Canvas';
import { InspectorPanel } from '../components/SidebarRight';
import { Toolbar } from '../components/Toolbar';
import { ChatBar } from '../components/Chat';
import { useProjectId } from '../hooks/useProjectId';
import { useSupabaseDiagramSync } from '../hooks/useSupabaseDiagramSync';
import { useLoadProjectFromSupabase } from '../hooks/useLoadProjectFromSupabase';
import { isSupabaseAvailable } from '../lib/supabaseClient';
import { loadProjectFromStorage, getStoredProjects } from '../utils/storage';
import { useTemplates } from '../hooks/useTemplates';
import { saveProjectToStorage } from '../utils/storage';
import { DotScreenShader } from '@/components/ui/dot-shader-background';

function CanvasContent() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { selectedNodeId, setSelectedNodeId, loadProject } = useProjectContext();
  const { projectId, loading: projectIdLoading } = useProjectId('Untitled Project');
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const { createProjectFromTemplate } = useTemplates();

  // Handle template parameter
  useEffect(() => {
    const templateId = searchParams.get('template');
    if (templateId && id === 'new') {
      const templateProject = createProjectFromTemplate(templateId, 'Untitled Project');
      if (templateProject) {
        const newProjectId = saveProjectToStorage(templateProject, templateProject.name);
        navigate(`/project/${newProjectId}`, { replace: true });
      }
    }
  }, [searchParams, id, createProjectFromTemplate, navigate]);

  // Track if we've loaded the project to prevent double-loading
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loadedProjectId, setLoadedProjectId] = useState<string | null>(null);
  const [supabaseProjectId, setSupabaseProjectId] = useState<string | null>(null);

  // Reset hasLoaded when project ID changes
  useEffect(() => {
    if (id !== loadedProjectId) {
      setHasLoaded(false);
      setLoadedProjectId(id || null);
    }
  }, [id, loadedProjectId]);

  // Load project from localStorage first (primary source for dashboard projects)
  useEffect(() => {
    if (id && id !== 'new' && !hasLoaded) {
      // Always try localStorage first since that's where dashboard saves projects
      const project = loadProjectFromStorage(id);
      if (project) {
        // Ensure project has nodes and edges arrays
        const projectToLoad = {
          ...project,
          nodes: project.nodes || [],
          edges: project.edges || []
        };
        loadProject(projectToLoad);
        
        // Get the Supabase ID if available
        const projects = getStoredProjects();
        const storedProject = projects.find(p => p.id === id);
        if (storedProject?.supabaseId) {
          setSupabaseProjectId(storedProject.supabaseId);
        }
        
        setHasLoaded(true);
      } else {
        // Project not found in localStorage
        // If Supabase is available, let useLoadProjectFromSupabase try to load it
        // Otherwise, redirect to dashboard
        if (!isSupabaseAvailable()) {
          navigate('/dashboard', { replace: true });
        }
      }
    }
  }, [id, loadProject, navigate, hasLoaded]);

  // Watch for updates to the Supabase ID (e.g., when project is saved for the first time)
  useEffect(() => {
    if (id && id !== 'new') {
      const checkSupabaseId = () => {
        const projects = getStoredProjects();
        const storedProject = projects.find(p => p.id === id);
        if (storedProject?.supabaseId && storedProject.supabaseId !== supabaseProjectId) {
          setSupabaseProjectId(storedProject.supabaseId);
        }
      };

      // Check immediately
      checkSupabaseId();

      // Listen for custom event when Supabase ID is created/updated
      const handleSupabaseIdUpdate = (e: CustomEvent) => {
        if (e.detail.localStorageId === id) {
          const newSupabaseId = e.detail.supabaseId;
          const oldProjectId = e.detail.oldProjectId;
          
          // If messages were migrated, we need to trigger a reload
          if (oldProjectId && oldProjectId !== newSupabaseId) {
            console.log(`🔄 Project ID updated from ${oldProjectId} to ${newSupabaseId}, messages should be migrated`);
          }
          
          setSupabaseProjectId(newSupabaseId);
        }
      };

      // Listen for storage changes (works across tabs)
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'projects' || !e.key) {
          checkSupabaseId();
        }
      };

      // Check when window regains focus (user might have saved in another tab)
      const handleFocus = () => {
        checkSupabaseId();
      };

      window.addEventListener('projectSupabaseIdUpdated', handleSupabaseIdUpdate as EventListener);
      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('focus', handleFocus);

      // Also check periodically (less frequent, every 2 seconds) as fallback
      const interval = setInterval(checkSupabaseId, 2000);

      return () => {
        window.removeEventListener('projectSupabaseIdUpdated', handleSupabaseIdUpdate as EventListener);
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('focus', handleFocus);
        clearInterval(interval);
      };
    }
  }, [id, supabaseProjectId]);

  // Load project from Supabase when projectId is available (fallback if not in localStorage)
  // This will only load if Supabase is available and we haven't loaded from localStorage
  // Use supabaseProjectId if available, otherwise check if id is a UUID
  useLoadProjectFromSupabase(
    supabaseProjectId || 
    (id && id !== 'new' && !hasLoaded && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ? id : null)
  );

  // Sync diagram to Supabase (only if Supabase is configured)
  // Use supabaseProjectId if available, otherwise use the id if it's a UUID
  useSupabaseDiagramSync(supabaseProjectId || (id && id !== 'new' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ? id : null));

  // Show loading only if Supabase is configured and still loading
  const shouldShowLoading = isSupabaseAvailable() && projectIdLoading && id && id !== 'new';

  if (shouldShowLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black relative">
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="w-full h-full">
            <DotScreenShader />
          </div>
        </div>
        <div className="text-white/70 relative z-10">Loading project...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-black relative overflow-hidden">
      {/* Dot Shader Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="w-full h-full">
          <DotScreenShader />
        </div>
      </div>

      <Toolbar projectId={id && id !== 'new' ? id : projectId} />
      <div className="flex-1 flex overflow-hidden relative z-10">
        <div className={`${leftSidebarCollapsed ? 'w-0' : 'w-64'} flex-shrink-0 transition-all duration-300 ease-in-out ${leftSidebarCollapsed ? 'overflow-visible' : 'overflow-hidden'}`}>
          <ComponentLibrary 
            isCollapsed={leftSidebarCollapsed}
            onToggleCollapse={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
          />
        </div>
        <div className="flex-1" style={{ minHeight: 0, height: '100%' }}>
          <Canvas
            onNodeSelect={setSelectedNodeId}
            selectedNodeId={selectedNodeId}
          />
          <InspectorPanel selectedNodeId={selectedNodeId} />
        </div>
        <ChatBar 
          projectId={
            // Always prefer supabaseProjectId if available (this is the correct Supabase UUID)
            supabaseProjectId || 
            // Fallback to projectId from useProjectId (session-based, but valid for chat)
            // This ensures chat works even if project hasn't been saved to Supabase yet
            projectId ||
            // Last resort: use id if it's a valid UUID format
            (id && id !== 'new' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ? id : null)
          }
          leftSidebarCollapsed={leftSidebarCollapsed}
        />
      </div>
    </div>
  );
}

export function CanvasPage() {
  return (
    <ProjectProvider>
      <ReactFlowProvider>
        <CanvasContent />
      </ReactFlowProvider>
    </ProjectProvider>
  );
}

