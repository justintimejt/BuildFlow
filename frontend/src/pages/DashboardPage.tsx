import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaTh, FaList, FaSearch, FaProjectDiagram } from 'react-icons/fa';
import { useDashboard } from '../hooks/useDashboard';
import { useProjectActions } from '../hooks/useProjectActions';
import { useTemplates } from '../hooks/useTemplates';
import { useAuth } from '../hooks/useAuth';
import { saveProjectToStorage } from '../utils/storage';
import { Project } from '../types';
import { EmptyState, ProjectGrid, ProjectList, CreateProjectModal } from '../components/Dashboard';
import { Input } from '@/components/ui/input';
import { DotScreenShader } from '@/components/ui/dot-shader-background';
import { ArrowRight } from 'lucide-react';

export function DashboardPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const {
    projects,
    allProjects,
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

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

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
      <div className="h-screen flex items-center justify-center bg-black relative">
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="w-full h-full">
            <DotScreenShader />
          </div>
        </div>
        <div className="text-white/70 relative z-10">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-black overflow-hidden relative">
      {/* Dot Shader Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="w-full h-full">
          <DotScreenShader />
        </div>
      </div>

      {/* Header */}
      <header className="bg-black/0 border-b border-white/10 px-6 py-4 relative z-10 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          {/* Logo and App Name */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="relative group cursor-pointer transition-transform hover:scale-105"
              aria-label="Go to landing page"
            >
              <div className="absolute inset-0 bg-white/20 rounded-lg blur-sm opacity-50 group-hover:opacity-70 transition-opacity"></div>
              <div className="relative bg-white/10 border border-white/20 p-2 rounded-lg group-hover:bg-white/15 transition-colors">
                <FaProjectDiagram className="text-white text-xl" />
              </div>
            </button>
            <div>
              <h1 className="text-2xl font-light tracking-tight text-white">BuildFlow</h1>
              <p className="text-sm font-light tracking-tight text-white/70">Projects</p>
            </div>
          </div>
          
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-white hover:text-white/80 transition-colors font-medium"
          >
            <span>Logout</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        
        {/* Welcome Message and Create Button */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-light tracking-tight text-white">
              Welcome {user?.displayName || 'User'},
            </h2>
            <p className="text-sm text-white/70 mt-1">
              Manage your AI simulation projects and view insights
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-all duration-200 font-light tracking-tight shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <FaPlus />
            New Project
          </button>
        </div>
      </header>

      {/* Toolbar */}
      {allProjects.length > 0 && (
        <div className="bg-black/0 border-b border-white/10 px-6 py-3 relative z-10 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 z-10" />
                <Input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/50 focus:border-white/20"
                />
              </div>
            </div>

            {/* View Toggle & Sort */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded transition-all duration-200 ${
                    viewMode === 'grid' ? 'bg-white/10 text-white shadow-sm' : 'text-white/70 hover:text-white'
                  }`}
                >
                  <FaTh />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded transition-all duration-200 ${
                    viewMode === 'list' ? 'bg-white/10 text-white shadow-sm' : 'text-white/70 hover:text-white'
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
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20"
              >
                <option value="modified-desc" className="bg-black">Last Modified (Newest)</option>
                <option value="modified-asc" className="bg-black">Last Modified (Oldest)</option>
                <option value="created-desc" className="bg-black">Created (Newest)</option>
                <option value="created-asc" className="bg-black">Created (Oldest)</option>
                <option value="name-asc" className="bg-black">Name (A-Z)</option>
                <option value="name-desc" className="bg-black">Name (Z-A)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto relative z-10">
        {projects.length === 0 ? (
          <EmptyState onCreateClick={() => setShowCreateModal(true)} />
        ) : viewMode === 'grid' ? (
          <ProjectGrid
            projects={projects}
            onOpen={openProject}
            onDelete={handleDelete}
            onRename={handleRename}
            onExport={downloadProject}
          />
        ) : (
          <div className="bg-black/0">
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

