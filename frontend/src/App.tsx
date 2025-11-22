import { useState } from 'react';
import { ProjectProvider, useProjectContext } from './contexts/ProjectContext';
import { ComponentLibrary } from './components/SidebarLeft';
import { Canvas } from './components/Canvas';
import { InspectorPanel } from './components/SidebarRight';
import { Toolbar } from './components/Toolbar';
import { ChatBar } from './components/Chat';
import { useProjectId } from './hooks/useProjectId';
import { useSupabaseDiagramSync } from './hooks/useSupabaseDiagramSync';
import { useLoadProjectFromSupabase } from './hooks/useLoadProjectFromSupabase';
import { isSupabaseAvailable } from './lib/supabaseClient';

function AppContent() {
  const { selectedNodeId, setSelectedNodeId } = useProjectContext();
  const { projectId, loading } = useProjectId('Untitled Project');
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  
  // Load project from Supabase when projectId is available
  useLoadProjectFromSupabase(projectId || null);
  
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
      <Toolbar projectId={projectId} />
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
          {/* Node Properties as floating overlay */}
          <InspectorPanel selectedNodeId={selectedNodeId} />
        </div>
        {/* Chat Bar at bottom - shows always, but disabled if no projectId */}
        <ChatBar 
          projectId={projectId}
          leftSidebarCollapsed={leftSidebarCollapsed}
        />
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

