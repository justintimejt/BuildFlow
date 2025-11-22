import { useCallback } from 'react';
import { Project } from '../types';
import {
  saveProjectToStorage,
  getStoredProjects,
  loadProjectFromStorage,
  deleteProjectFromStorage,
  exportProjectToJSON,
  importProjectFromJSON,
  StoredProject
} from '../utils/storage';

export const useStorage = () => {
  const saveProject = useCallback((project: Project, name?: string): string => {
    return saveProjectToStorage(project, name);
  }, []);

  const loadProject = useCallback((id: string): Project | null => {
    return loadProjectFromStorage(id);
  }, []);

  const getProjects = useCallback((): StoredProject[] => {
    return getStoredProjects();
  }, []);

  const deleteProject = useCallback((id: string): boolean => {
    return deleteProjectFromStorage(id);
  }, []);

  const exportToJSON = useCallback((project: Project): string => {
    return exportProjectToJSON(project);
  }, []);

  const importFromJSON = useCallback((jsonString: string): Project | null => {
    return importProjectFromJSON(jsonString);
  }, []);

  return {
    saveProject,
    loadProject,
    getProjects,
    deleteProject,
    exportToJSON,
    importFromJSON
  };
};

