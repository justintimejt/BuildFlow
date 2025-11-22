import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaTh, FaList, FaSearch } from 'react-icons/fa';
import { useDashboard } from '../hooks/useDashboard';
import { useProjectActions } from '../hooks/useProjectActions';
import { useTemplates } from '../hooks/useTemplates';
import { saveProjectToStorage } from '../utils/storage';
import { Project } from '../types';
import { EmptyState, ProjectGrid, ProjectList, CreateProjectModal } from '../components/Dashboard';

export function DashboardPage() {
  const navigate = useNavigate();
  const {
    projects,
    viewMode,
    setViewMode,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    searchQuery,
    setSearchQuery,
    isLoading,
    refreshProjects
  } = useDashboard();
  
  const { openProject, deleteProject, duplicate, renameProject, downloadProject } = useProjectActions();
  const { createProjectFromTemplate } = useTemplates();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCreateFromScratch = (name: string) => {
    const newProject: Project = {
      version: '1.0.0',
      name,
      nodes: [],
      edges: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const projectId = saveProjectToStorage(newProject, name);
    navigate(`/project/${projectId}`);
  };

  const handleCreateFromTemplate = (template: any, name: string) => {
    const newProject = createProjectFromTemplate(template.id, name);
    if (!newProject) return;
    
    const projectId = saveProjectToStorage(newProject, name);
    navigate(`/project/${projectId}`);
  };

  const handleDelete = async (id: string) => {
    const success = await deleteProject(id);
    if (success) {
      refreshProjects();
    }
  };

  const handleDuplicate = (id: string) => {
    const newId = duplicate(id);
    if (newId) {
      refreshProjects();
    }
  };

  const handleRename = async (id: string, newName: string) => {
    const success = await renameProject(id, newName);
    if (success) {
      refreshProjects();
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Projects</h1>
            <p className="text-sm text-gray-500 mt-1">
              {projects.length} {projects.length === 1 ? 'project' : 'projects'}
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <FaPlus />
            Create New Project
          </button>
        </div>
      </header>

      {/* Toolbar */}
      {projects.length > 0 && (
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* View Toggle & Sort */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  <FaTh />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  <FaList />
                </button>
              </div>

              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [by, order] = e.target.value.split('-');
                  setSortBy(by as any);
                  setSortOrder(order as 'asc' | 'desc');
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="modified-desc">Last Modified (Newest)</option>
                <option value="modified-asc">Last Modified (Oldest)</option>
                <option value="created-desc">Created (Newest)</option>
                <option value="created-asc">Created (Oldest)</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {projects.length === 0 ? (
          <EmptyState />
        ) : viewMode === 'grid' ? (
          <ProjectGrid
            projects={projects}
            onOpen={openProject}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
            onRename={handleRename}
            onExport={downloadProject}
          />
        ) : (
          <div className="bg-white">
            <ProjectList
              projects={projects}
              onOpen={openProject}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
              onRename={handleRename}
              onExport={downloadProject}
            />
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateFromScratch={handleCreateFromScratch}
        onCreateFromTemplate={handleCreateFromTemplate}
      />
    </div>
  );
}

