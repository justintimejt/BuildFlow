import { useState, useCallback, useMemo, useEffect } from 'react';
import { StoredProject, getStoredProjects } from '../utils/storage';
import { getLocalTemplates } from '../utils/templates';
import { Template } from '../types/template';
import { supabaseClient, isSupabaseAvailable } from '../lib/supabaseClient';
import { getCurrentUserId } from '../lib/authHelpers';
import type { Project } from '../types';

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

  // Load projects from both localStorage and Supabase
  const loadProjects = useCallback(async () => {
    try {
      // Always load from localStorage first (for offline support)
      const localProjects = getStoredProjects();
      
      // If Supabase is available and user is authenticated, load from Supabase
      if (isSupabaseAvailable() && supabaseClient) {
        const userId = await getCurrentUserId();
        
        if (userId) {
          // User is authenticated: load projects from Supabase by user_id
          try {
            const { data: supabaseProjects, error } = await supabaseClient
              .from("projects")
              .select("id, name, diagram_json, created_at, updated_at")
              .eq("user_id", userId)
              .order("updated_at", { ascending: false });
            
            if (error) {
              console.error("Failed to load projects from Supabase:", error);
            } else if (supabaseProjects && supabaseProjects.length > 0) {
              // Convert Supabase projects to StoredProject format
              const convertedProjects: StoredProject[] = supabaseProjects.map((sp: any) => {
                const diagram = sp.diagram_json as Project;
                return {
                  id: sp.id, // Use Supabase ID as the ID
                  name: sp.name || diagram.name || 'Untitled Project',
                  description: diagram.description,
                  project: diagram,
                  createdAt: sp.created_at || diagram.createdAt || new Date().toISOString(),
                  updatedAt: sp.updated_at || diagram.updatedAt || new Date().toISOString(),
                  nodeCount: diagram.nodes?.length || 0,
                  edgeCount: diagram.edges?.length || 0,
                  supabaseId: sp.id, // Store Supabase ID
                };
              });
              
              // Merge with localStorage projects (Supabase takes precedence)
              // Create a map of Supabase projects by ID (using both id and supabaseId as keys)
              const supabaseMap = new Map<string, StoredProject>();
              convertedProjects.forEach(p => {
                supabaseMap.set(p.id, p);
                if (p.supabaseId) {
                  supabaseMap.set(p.supabaseId, p);
                }
              });
              
              // Create a set of all Supabase IDs that exist
              const existingSupabaseIds = new Set(convertedProjects.map(p => p.id));
              
              // Add localStorage projects that aren't in Supabase
              localProjects.forEach(localProject => {
                const supabaseId = localProject.supabaseId;
                // Only include if:
                // 1. It has no supabaseId (local-only project), OR
                // 2. The supabaseId exists in Supabase (not deleted)
                if (!supabaseId) {
                  // Local-only project, include it
                  convertedProjects.push(localProject);
                } else if (existingSupabaseIds.has(supabaseId)) {
                  // Supabase project exists, but we already have it from Supabase query
                  // Don't add the localStorage version (Supabase is source of truth)
                  // This handles the case where localStorage has stale data
                } else {
                  // supabaseId exists in localStorage but not in Supabase
                  // This means the Supabase project was deleted, so don't include it
                  console.log(`⚠️  Skipping localStorage project ${localProject.id} - Supabase project ${supabaseId} was deleted`);
                }
              });
              
              // Calculate node/edge counts
              const enriched = convertedProjects.map(p => ({
                ...p,
                nodeCount: p.nodeCount ?? p.project.nodes?.length ?? 0,
                edgeCount: p.edgeCount ?? p.project.edges?.length ?? 0
              }));
              
              setProjects(enriched);
              setIsLoading(false);
              return;
            }
          } catch (error) {
            console.error("Error loading projects from Supabase:", error);
          }
        }
      }
      
      // Fallback: use localStorage projects only
      const enriched = localProjects.map(p => ({
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

