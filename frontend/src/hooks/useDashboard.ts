import { useState, useCallback, useMemo, useEffect } from 'react';
import { StoredProject, getStoredProjects } from '../utils/storage';
import { getLocalTemplates } from '../utils/templates';
import { Template } from '../types/template';

export type ViewMode = 'grid' | 'list';
export type SortBy = 'name' | 'created' | 'modified';

export const useDashboard = () => {
  const [projects, setProjects] = useState<StoredProject[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('dashboard-view-mode');
    return (saved as ViewMode) || 'grid';
  });
  const [sortBy, setSortBy] = useState<SortBy>('modified');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Load projects from storage
  const loadProjects = useCallback(() => {
    try {
      const stored = getStoredProjects();
      // Calculate node/edge counts if not present
      const enriched = stored.map(p => ({
        ...p,
        nodeCount: p.nodeCount ?? p.project.nodes?.length ?? 0,
        edgeCount: p.edgeCount ?? p.project.edges?.length ?? 0
      }));
      setProjects(enriched);
    } catch (error) {
      console.error('Failed to load projects:', error);
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load templates
  const loadTemplates = useCallback(() => {
    try {
      const localTemplates = getLocalTemplates();
      setTemplates(localTemplates);
    } catch (error) {
      console.error('Failed to load templates:', error);
      setTemplates([]);
    }
  }, []);

  // Save view mode preference
  useEffect(() => {
    localStorage.setItem('dashboard-view-mode', viewMode);
  }, [viewMode]);

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let filtered = [...projects];

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      );
    }

    // Apply sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        case 'created':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'modified':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [projects, searchQuery, sortBy, sortOrder]);

  useEffect(() => {
    loadProjects();
    loadTemplates();
  }, [loadProjects, loadTemplates]);

  return {
    projects: filteredProjects,
    allProjects: projects, // Return original unfiltered projects
    templates,
    viewMode,
    setViewMode,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    searchQuery,
    setSearchQuery,
    isLoading,
    loadProjects,
    refreshProjects: loadProjects
  };
};

