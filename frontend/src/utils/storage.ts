import { Project } from '../types';
import { PROJECT_VERSION, STORAGE_KEY, DEFAULT_PROJECT_NAME } from './constants';

export interface StoredProject {
  id: string;
  name: string;
  project: Project;
  createdAt: string;
  updatedAt: string;
}

export const saveProjectToStorage = (project: Project, name?: string): string => {
  const projectName = name || project.name || DEFAULT_PROJECT_NAME;
  const now = new Date().toISOString();
  
  const storedProject: StoredProject = {
    id: `project-${Date.now()}`,
    name: projectName,
    project: {
      ...project,
      version: PROJECT_VERSION,
      name: projectName,
      updatedAt: now,
      createdAt: project.createdAt || now
    },
    createdAt: project.createdAt || now,
    updatedAt: now
  };

  const existingProjects = getStoredProjects();
  existingProjects.push(storedProject);
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingProjects));
    return storedProject.id;
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
  return stored ? stored.project : null;
};

export const deleteProjectFromStorage = (id: string): boolean => {
  try {
    const projects = getStoredProjects();
    const filtered = projects.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Failed to delete project from localStorage:', error);
    return false;
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

