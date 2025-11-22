import { Project } from '../types';
import { PROJECT_VERSION, STORAGE_KEY, DEFAULT_PROJECT_NAME } from './constants';

export interface StoredProject {
  id: string;
  name: string;
  description?: string;
  project: Project;
  createdAt: string;
  updatedAt: string;
  nodeCount?: number;
  edgeCount?: number;
  tags?: string[];
  isFavorite?: boolean;
  supabaseId?: string; // UUID from Supabase if synced
}

export const saveProjectToStorage = (project: Project, name?: string, projectId?: string): string => {
  const projectName = name || project.name || DEFAULT_PROJECT_NAME;
  const now = new Date().toISOString();
  const existingProjects = getStoredProjects();
  
  // Check if we're updating an existing project
  const existingIndex = projectId ? existingProjects.findIndex(p => p.id === projectId) : -1;
  let finalProjectId: string;
  
  if (existingIndex >= 0) {
    // Update existing project
    finalProjectId = projectId!;
    const existing = existingProjects[existingIndex];
    existingProjects[existingIndex] = {
      ...existing,
      name: projectName,
      project: {
        ...project,
        id: finalProjectId,
        version: PROJECT_VERSION,
        name: projectName,
        updatedAt: now,
        createdAt: existing.createdAt || project.createdAt || now
      },
      updatedAt: now,
      nodeCount: project.nodes?.length || 0,
      edgeCount: project.edges?.length || 0
    };
  } else {
    // Create new project
    finalProjectId = projectId || `project-${Date.now()}`;
    const storedProject: StoredProject = {
      id: finalProjectId,
      name: projectName,
      project: {
        ...project,
        id: finalProjectId,
        version: PROJECT_VERSION,
        name: projectName,
        updatedAt: now,
        createdAt: project.createdAt || now
      },
      createdAt: project.createdAt || now,
      updatedAt: now,
      nodeCount: project.nodes?.length || 0,
      edgeCount: project.edges?.length || 0
    };
    existingProjects.push(storedProject);
  }
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingProjects));
    return finalProjectId;
  } catch (error) {
    console.error('Failed to save project to localStorage:', error);
    throw error;
  }
};

export const getStoredProjects = (): StoredProject[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load projects from localStorage:', error);
    return [];
  }
};

export const loadProjectFromStorage = (id: string): Project | null => {
  const projects = getStoredProjects();
  const stored = projects.find(p => p.id === id);
  if (stored) {
    // Ensure the project has the ID set
    return {
      ...stored.project,
      id: stored.id
    };
  }
  return null;
};

export const deleteProjectFromStorage = (id: string): { success: boolean; supabaseId?: string } => {
  try {
    const projects = getStoredProjects();
    const projectToDelete = projects.find(p => p.id === id);
    const supabaseId = projectToDelete?.supabaseId;
    
    const filtered = projects.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    
    return { success: true, supabaseId };
  } catch (error) {
    console.error('Failed to delete project from localStorage:', error);
    return { success: false };
  }
};

export const exportProjectToJSON = (project: Project): string => {
  const exportData = {
    ...project,
    version: PROJECT_VERSION,
    updatedAt: new Date().toISOString()
  };
  return JSON.stringify(exportData, null, 2);
};

export const importProjectFromJSON = (jsonString: string): Project | null => {
  try {
    const data = JSON.parse(jsonString);
    if (data.nodes && Array.isArray(data.nodes) && data.edges && Array.isArray(data.edges)) {
      return {
        version: data.version || PROJECT_VERSION,
        name: data.name,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        nodes: data.nodes,
        edges: data.edges
      };
    }
    return null;
  } catch (error) {
    console.error('Failed to import project from JSON:', error);
    return null;
  }
};

export const updateProjectName = (id: string, newName: string): { success: boolean; supabaseId?: string } => {
  try {
    const projects = getStoredProjects();
    const index = projects.findIndex(p => p.id === id);
    if (index === -1) return { success: false };
    
    const supabaseId = projects[index].supabaseId;
    
    projects[index].name = newName;
    projects[index].updatedAt = new Date().toISOString();
    projects[index].project.name = newName;
    projects[index].project.updatedAt = new Date().toISOString();
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    return { success: true, supabaseId };
  } catch (error) {
    console.error('Failed to update project name:', error);
    return { success: false };
  }
};

export const duplicateProject = (id: string): string | null => {
  try {
    const project = loadProjectFromStorage(id);
    if (!project) return null;
    
    const newProject: Project = {
      ...project,
      name: `${project.name || DEFAULT_PROJECT_NAME} - Copy`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return saveProjectToStorage(newProject, newProject.name);
  } catch (error) {
    console.error('Failed to duplicate project:', error);
    return null;
  }
};

export const updateStoredProjectMetadata = (id: string): void => {
  try {
    const projects = getStoredProjects();
    const index = projects.findIndex(p => p.id === id);
    if (index === -1) return;
    
    const project = projects[index].project;
    projects[index].nodeCount = project.nodes?.length || 0;
    projects[index].edgeCount = project.edges?.length || 0;
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (error) {
    console.error('Failed to update project metadata:', error);
  }
};

export const updateStoredProjectSupabaseId = (localStorageId: string, supabaseId: string): void => {
  try {
    const projects = getStoredProjects();
    const index = projects.findIndex(p => p.id === localStorageId);
    if (index === -1) return;
    
    projects[index].supabaseId = supabaseId;
    projects[index].project.id = supabaseId; // Also update in project object
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (error) {
    console.error('Failed to update Supabase ID:', error);
  }
};

