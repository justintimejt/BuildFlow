# Fix: User Project Access Across Devices

## Problem Summary

Currently, users cannot access their diagrams from different devices even when logged in with the same account because:

1. **`user_id` is never set**: When projects are created or updated, only `session_id` is set. The `user_id` column remains `null` in the database.
2. **Projects are queried by `session_id` only**: The frontend queries projects using `session_id` (which is device-specific, stored in localStorage), not `user_id`.
3. **Dashboard loads from localStorage only**: The dashboard only loads projects from localStorage, not from Supabase by `user_id`.
4. **No user-based filtering**: There's no mechanism to filter projects by the authenticated user's ID.

## Solution Overview

The fix requires changes across multiple layers:

1. **Frontend**: Set `user_id` when creating/updating projects if user is authenticated
2. **Frontend**: Query projects by `user_id` when authenticated (fallback to `session_id` for anonymous users)
3. **Frontend**: Update dashboard to load projects from Supabase by `user_id`
4. **Database**: Update RLS policies to allow users to access their own projects
5. **Migration**: Optionally migrate existing projects to set `user_id` for logged-in users

---

## Step-by-Step Implementation

### Step 1: Update Database RLS Policies

**File**: Run this SQL in your Supabase SQL Editor

```sql
-- First, create an index on user_id for better query performance
create index if not exists projects_user_id_idx on projects(user_id);

-- Update RLS policies to allow users to access their own projects
-- Keep the existing permissive policy for now (since RLS is off), but prepare for when it's enabled

-- Policy: Users can read/write their own projects
create policy "users can manage own projects"
on projects
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Policy: Allow anonymous users to access projects by session_id
-- This is a fallback for users who aren't logged in
create policy "anon can access by session_id"
on projects
for all
using (
  -- Allow if user_id is null (anonymous) OR if user is authenticated and owns the project
  (user_id is null AND session_id = current_setting('request.session_id', true)) OR
  (auth.uid() = user_id)
)
with check (
  -- Same logic for inserts/updates
  (user_id is null AND session_id = current_setting('request.session_id', true)) OR
  (auth.uid() = user_id)
);

-- Note: The above policy is complex. A simpler approach is to allow all for now
-- and rely on application-level filtering, then tighten later.
-- For now, keep the existing permissive policy if RLS is off.
```

**Note**: Since RLS is currently off, these policies won't be enforced yet. They're prepared for when you enable RLS.

---

### Step 2: Update Frontend - Get User ID Helper

**File**: `frontend/src/lib/authHelpers.ts` (create new file)

```typescript
import { supabaseClient, isSupabaseAvailable } from './supabaseClient';

/**
 * Gets the current authenticated user's ID, or null if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  if (!isSupabaseAvailable() || !supabaseClient) {
    return null;
  }

  try {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    
    if (error || !session?.user) {
      return null;
    }

    return session.user.id;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
}
```

---

### Step 3: Update Frontend - Project Creation with user_id

**File**: `frontend/src/hooks/useProjectId.ts`

**Changes needed**:

1. Import `getCurrentUserId` and `useAuth`
2. When creating a project, set `user_id` if user is authenticated
3. When querying projects, filter by `user_id` if authenticated, otherwise by `session_id`

```typescript
import { useEffect, useState } from "react";
import { supabaseClient, isSupabaseAvailable } from "../lib/supabaseClient";
import { getOrCreateSessionId } from "../lib/session";
import { getCurrentUserId } from "../lib/authHelpers";

export function useProjectId(initialName: string = "Untitled Project") {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseAvailable()) {
      setProjectId(null);
      setLoading(false);
      return;
    }

    const sessionId = getOrCreateSessionId();
    let cancelled = false;

    async function ensureProject() {
      if (!supabaseClient) {
        setProjectId(null);
        setLoading(false);
        return;
      }

      try {
        // Get current user ID if authenticated
        const userId = await getCurrentUserId();
        
        // Build query: filter by user_id if authenticated, otherwise by session_id
        let query = supabaseClient
          .from("projects")
          .select("id");
        
        if (userId) {
          // Authenticated user: query by user_id
          query = query.eq("user_id", userId);
        } else {
          // Anonymous user: query by session_id
          query = query.eq("session_id", sessionId);
        }
        
        const { data, error } = await query
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error("Failed to load project", error);
        }

        if (!cancelled) {
          if (data?.id) {
            setProjectId(data.id);
            setLoading(false);
            return;
          }

          // No project yet; create one with empty diagram
          const emptyDiagram = {
            version: "1.0.0",
            name: initialName,
            nodes: [],
            edges: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          // Prepare insert data
          const insertData: any = {
            session_id: sessionId, // Keep session_id for backward compatibility
            name: initialName,
            diagram_json: emptyDiagram,
          };

          // Set user_id if authenticated
          if (userId) {
            insertData.user_id = userId;
          }

          const { data: created, error: createError } = await supabaseClient
            .from("projects")
            .insert(insertData)
            .select("id")
            .single();

          if (createError) {
            console.error("Failed to create project", createError);
            setProjectId(null);
            setLoading(false);
            return;
          }

          if (!cancelled && created?.id) {
            setProjectId(created.id);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error("Error in useProjectId:", error);
        setProjectId(null);
        setLoading(false);
      }
    }

    ensureProject();

    return () => {
      cancelled = true;
    };
  }, [initialName]);

  return { projectId, loading };
}
```

---

### Step 4: Update Frontend - Toolbar Save with user_id

**File**: `frontend/src/components/Toolbar/Toolbar.tsx`

**Changes needed**:

1. Import `getCurrentUserId`
2. When creating/updating projects, set `user_id` if authenticated
3. When updating existing projects, ensure `user_id` is set if user is now authenticated

```typescript
// Add import at top
import { getCurrentUserId } from '../../lib/authHelpers';

// In handleSaveConfirm function, around line 130-140:
// Replace the Supabase sync section with:

if (savedId && isSupabaseAvailable() && supabaseClient) {
  try {
    const projects = getStoredProjects();
    const storedProject = projects.find(p => p.id === savedId);
    const supabaseId = storedProject?.supabaseId;
    
    const projectWithName = {
      ...project,
      id: savedId,
      name: projectName
    };
    
    const sessionId = getOrCreateSessionId();
    const userId = await getCurrentUserId(); // Get current user ID
    
    if (supabaseId) {
      // Update existing Supabase project
      const updateData: any = {
        name: projectName,
        diagram_json: projectWithName,
        updated_at: new Date().toISOString(),
      };
      
      // Set user_id if authenticated (this will update existing projects)
      if (userId) {
        updateData.user_id = userId;
      }
      
      const { error } = await supabaseClient
        .from("projects")
        .update(updateData)
        .eq("id", supabaseId);
      
      if (error) {
        console.error("Failed to update project in Supabase:", error);
        throw error;
      }
    } else {
      // Check if there's already a Supabase project for this user/session
      let query = supabaseClient
        .from("projects")
        .select("id");
      
      if (userId) {
        query = query.eq("user_id", userId);
      } else {
        query = query.eq("session_id", sessionId);
      }
      
      const { data: existingProjects } = await query
        .order("created_at", { ascending: true })
        .limit(1);
      
      let newSupabaseId: string | null = null;
      
      if (existingProjects && existingProjects.length > 0) {
        // Use existing Supabase project
        newSupabaseId = existingProjects[0].id;
        console.log(`ℹ️  Using existing Supabase project: ${newSupabaseId}`);
        
        const updateData: any = {
          name: projectName,
          diagram_json: projectWithName,
          updated_at: new Date().toISOString(),
        };
        
        // Set user_id if authenticated
        if (userId) {
          updateData.user_id = userId;
        }
        
        const { error: updateError } = await supabaseClient
          .from("projects")
          .update(updateData)
          .eq("id", newSupabaseId);
        
        if (updateError) {
          console.error("Failed to update existing Supabase project:", updateError);
          throw updateError;
        }
      } else {
        // Create new Supabase project
        const insertData: any = {
          session_id: sessionId,
          name: projectName,
          diagram_json: projectWithName,
        };
        
        // Set user_id if authenticated
        if (userId) {
          insertData.user_id = userId;
        }
        
        const { data: created, error } = await supabaseClient
          .from("projects")
          .insert(insertData)
          .select("id")
          .single();
        
        if (error) {
          console.error("Failed to create project in Supabase:", error);
          throw error;
        } else if (created?.id) {
          newSupabaseId = created.id;
          console.log(`✅ Created new Supabase project: ${newSupabaseId}`);
          
          // Migrate chat messages if needed
          if (currentSupabaseProjectId && currentSupabaseProjectId !== newSupabaseId) {
            console.log(`🔄 Migrating chat messages from ${currentSupabaseProjectId} to ${newSupabaseId}`);
            try {
              const { error: migrateError } = await supabaseClient
                .from("chat_messages")
                .update({ project_id: newSupabaseId })
                .eq("project_id", currentSupabaseProjectId);
              
              if (migrateError) {
                console.error("Failed to migrate chat messages:", migrateError);
              } else {
                console.log(`✅ Successfully migrated chat messages to new project`);
              }
            } catch (migrateErr) {
              console.error("Error migrating chat messages:", migrateErr);
            }
          }
        }
      }
      
      if (newSupabaseId) {
        updateStoredProjectSupabaseId(savedId, newSupabaseId);
        window.dispatchEvent(new CustomEvent('projectSupabaseIdUpdated', {
          detail: { 
            localStorageId: savedId, 
            supabaseId: newSupabaseId,
            oldProjectId: currentSupabaseProjectId || null
          }
        }));
      }
    }
  } catch (error) {
    console.error("Failed to sync project to Supabase:", error);
    // Don't throw - allow localStorage save to succeed
  }
}
```

---

### Step 5: Update Frontend - Dashboard to Load from Supabase

**File**: `frontend/src/hooks/useDashboard.ts`

**Changes needed**:

1. Load projects from Supabase by `user_id` when authenticated
2. Merge with localStorage projects
3. Sync Supabase projects to localStorage for offline access

```typescript
import { useState, useCallback, useMemo, useEffect } from 'react';
import { StoredProject, getStoredProjects, saveProjectToStorage } from '../utils/storage';
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
              // Create a map of Supabase projects by ID
              const supabaseMap = new Map(convertedProjects.map(p => [p.supabaseId || p.id, p]));
              
              // Add localStorage projects that aren't in Supabase
              localProjects.forEach(localProject => {
                const supabaseId = localProject.supabaseId;
                if (!supabaseId || !supabaseMap.has(supabaseId)) {
                  // This is a local-only project, include it
                  convertedProjects.push(localProject);
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
```

---

### Step 6: Update CanvasPage Auto-Create with user_id

**File**: `frontend/src/pages/CanvasPage.tsx`

**Changes needed**:

1. When auto-creating Supabase project, set `user_id` if authenticated

```typescript
// Add import
import { getCurrentUserId } from '../lib/authHelpers';

// In the autoCreateSupabaseProject function, around line 128:
const sessionId = getOrCreateSessionId();
const userId = await getCurrentUserId(); // Get current user ID

const projectWithName = {
  ...project,
  name: projectName,
};

const insertData: any = {
  session_id: sessionId,
  name: projectName,
  diagram_json: projectWithName,
};

// Set user_id if authenticated
if (userId) {
  insertData.user_id = userId;
}

const { data: created, error } = await supabaseClient
  .from("projects")
  .insert(insertData)
  .select("id")
  .single();
```

---

### Step 7: Migration Script (Optional)

**File**: `migrations/migrate_user_ids.sql` (run in Supabase SQL Editor)

This script migrates existing projects to set `user_id` for projects that have a matching session but the user is now logged in. However, since `session_id` is device-specific, this is tricky. A better approach is to:

1. Let users manually "claim" their projects when they log in
2. Or, run a one-time migration that sets `user_id` for projects where we can match them

For now, the automatic updates in Steps 3-6 will set `user_id` for all new and updated projects going forward.

```sql
-- Optional: One-time migration to set user_id for existing projects
-- This is complex because session_id is device-specific
-- Better to let the application handle it going forward

-- If you want to manually link projects to users, you could:
-- 1. Create a mapping table or
-- 2. Allow users to "claim" projects on first login
-- 3. Or just let new projects get user_id automatically

-- For now, the application changes will handle new/updated projects
```

---

## Testing Checklist

After implementing the changes:

- [ ] **Test 1**: Create a project while logged in → Check database, `user_id` should be set
- [ ] **Test 2**: Create a project while not logged in → Check database, `user_id` should be null, `session_id` should be set
- [ ] **Test 3**: Log in on Device A, create a project → Log in on Device B → Project should appear in dashboard
- [ ] **Test 4**: Update an existing project (that had null user_id) while logged in → `user_id` should be set
- [ ] **Test 5**: Dashboard loads projects from Supabase when authenticated
- [ ] **Test 6**: Dashboard falls back to localStorage when not authenticated
- [ ] **Test 7**: Projects created before this fix can still be accessed (via session_id fallback)

---

## Important Notes

1. **Backward Compatibility**: The code maintains backward compatibility by:
   - Still setting `session_id` for anonymous users
   - Querying by `session_id` when user is not authenticated
   - Allowing projects with null `user_id` to still work

2. **RLS Policies**: Since RLS is currently off, the policies won't be enforced yet. When you enable RLS, make sure to:
   - Test the policies thoroughly
   - Update them if needed based on your security requirements

3. **Migration Strategy**: Existing projects with `user_id = null` will continue to work via `session_id`. As users log in and update/create projects, `user_id` will be set automatically.

4. **Performance**: The `user_id` index will help with query performance when filtering by user.

5. **Offline Support**: The dashboard still loads from localStorage first, then syncs with Supabase, ensuring offline functionality.

---

## Rollback Plan

If issues arise:

1. The changes are additive - existing functionality (session_id-based) still works
2. You can revert the frontend changes file by file
3. The database changes (index, policies) are non-breaking
4. Projects will continue to work with `session_id` even if `user_id` is null

---

## Next Steps After Implementation

1. **Enable RLS**: Once tested, enable RLS in Supabase and verify the policies work correctly
2. **User Migration**: Consider adding a UI feature to let users "claim" their existing projects
3. **Analytics**: Track how many projects have `user_id` vs `session_id` to monitor migration progress
4. **Cleanup**: After a grace period, consider archiving or cleaning up projects with null `user_id` that haven't been accessed in a while

