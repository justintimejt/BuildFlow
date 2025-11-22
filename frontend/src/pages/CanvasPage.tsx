import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ProjectProvider, useProjectContext } from '../contexts/ProjectContext';
import { ComponentLibrary } from '../components/SidebarLeft';
import { Canvas } from '../components/Canvas';
import { InspectorPanel } from '../components/SidebarRight';
import { Toolbar } from '../components/Toolbar';
import { ChatBar } from '../components/Chat';
import { useProjectId } from '../hooks/useProjectId';
import { useSupabaseDiagramSync } from '../hooks/useSupabaseDiagramSync';
import { useLoadProjectFromSupabase } from '../hooks/useLoadProjectFromSupabase';
import { isSupabaseAvailable } from '../lib/supabaseClient';
import { loadProjectFromStorage } from '../utils/storage';
import { useTemplates } from '../hooks/useTemplates';
import { saveProjectToStorage } from '../utils/storage';

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

  // Load project from Supabase when projectId is available (fallback if not in localStorage)
  // This will only load if Supabase is available and we haven't loaded from localStorage
  useLoadProjectFromSupabase(id && id !== 'new' && !hasLoaded ? id : null);

  // Sync diagram to Supabase (only if Supabase is configured)
  useSupabaseDiagramSync(id && id !== 'new' ? id : null);

  // Show loading only if Supabase is configured and still loading
  const shouldShowLoading = isSupabaseAvailable() && projectIdLoading && id && id !== 'new';

  if (shouldShowLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading project...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <Toolbar projectId={id && id !== 'new' ? id : projectId} />
      <div className="flex-1 flex overflow-hidden relative">
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
          projectId={id && id !== 'new' ? id : projectId}
          leftSidebarCollapsed={leftSidebarCollapsed}
        />
      </div>
    </div>
  );
}

export function CanvasPage() {
  return (
    <ProjectProvider>
      <CanvasContent />
    </ProjectProvider>
  );
}

