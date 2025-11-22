import { ProjectProvider, useProjectContext } from './contexts/ProjectContext';
import { ComponentLibrary } from './components/SidebarLeft';
import { Canvas } from './components/Canvas';
import { InspectorPanel } from './components/SidebarRight';
import { Toolbar } from './components/Toolbar';
import { ChatBar } from './components/Chat';
import { useProjectId } from './hooks/useProjectId';
import { useSupabaseDiagramSync } from './hooks/useSupabaseDiagramSync';
import { isSupabaseAvailable } from './lib/supabaseClient';

function AppContent() {
  const { selectedNodeId, setSelectedNodeId } = useProjectContext();
  const { projectId, loading } = useProjectId('Untitled Project');
  
  // Sync diagram to Supabase (only if Supabase is configured)
  useSupabaseDiagramSync(projectId || null);

  // Show loading only if Supabase is configured and still loading
  // Otherwise, show the app immediately (localStorage mode)
  const shouldShowLoading = isSupabaseAvailable() && loading && !projectId;

  if (shouldShowLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading project...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <Toolbar />
      <div className="flex-1 flex overflow-hidden relative">
        <div className="w-64 flex-shrink-0">
          <ComponentLibrary />
        </div>
        <div className="flex-1">
          <Canvas
            onNodeSelect={setSelectedNodeId}
            selectedNodeId={selectedNodeId}
          />
        </div>
        <div className="w-80 flex-shrink-0">
          <InspectorPanel selectedNodeId={selectedNodeId} />
        </div>
        {/* Chat Bar at bottom - shows always, but disabled if no projectId */}
        <ChatBar projectId={projectId} />
      </div>
    </div>
  );
}

function App() {
  return (
    <ProjectProvider>
      <AppContent />
    </ProjectProvider>
  );
}

export default App;

