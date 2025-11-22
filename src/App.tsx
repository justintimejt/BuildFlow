import { ProjectProvider, useProjectContext } from './contexts/ProjectContext';
import { ComponentLibrary } from './components/SidebarLeft';
import { Canvas } from './components/Canvas';
import { InspectorPanel } from './components/SidebarRight';
import { Toolbar } from './components/Toolbar';

function AppContent() {
  const { selectedNodeId, setSelectedNodeId, selectedEdgeId, setSelectedEdgeId } = useProjectContext();

  return (
    <div className="h-screen flex flex-col">
      <Toolbar />
      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 flex-shrink-0">
          <ComponentLibrary />
        </div>
        <div className="flex-1">
          <Canvas
            onNodeSelect={setSelectedNodeId}
            selectedNodeId={selectedNodeId}
            onEdgeSelect={setSelectedEdgeId}
            selectedEdgeId={selectedEdgeId}
          />
        </div>
        <div className="w-80 flex-shrink-0">
          <InspectorPanel selectedNodeId={selectedNodeId} selectedEdgeId={selectedEdgeId} />
        </div>
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

