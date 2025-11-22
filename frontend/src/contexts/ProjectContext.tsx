import { createContext, useContext, ReactNode } from 'react';
import { useProject } from '../hooks/useProject';

interface ProjectContextType {
  nodes: ReturnType<typeof useProject>['nodes'];
  edges: ReturnType<typeof useProject>['edges'];
  selectedNodeId: ReturnType<typeof useProject>['selectedNodeId'];
  setSelectedNodeId: ReturnType<typeof useProject>['setSelectedNodeId'];
  addNode: ReturnType<typeof useProject>['addNode'];
  updateNode: ReturnType<typeof useProject>['updateNode'];
  updateNodePosition: ReturnType<typeof useProject>['updateNodePosition'];
  deleteNode: ReturnType<typeof useProject>['deleteNode'];
  addEdge: ReturnType<typeof useProject>['addEdge'];
  deleteEdge: ReturnType<typeof useProject>['deleteEdge'];
  loadProject: ReturnType<typeof useProject>['loadProject'];
  getProject: ReturnType<typeof useProject>['getProject'];
  clearProject: ReturnType<typeof useProject>['clearProject'];
  applyOperations: ReturnType<typeof useProject>['applyOperations'];
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const project = useProject();

  return (
    <ProjectContext.Provider value={project}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjectContext() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjectContext must be used within ProjectProvider');
  }
  return context;
}

