import { StoredProject } from '../../utils/storage';
import { FaFolder, FaEllipsisV, FaEdit, FaCopy, FaTrash, FaDownload } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';

interface ProjectListProps {
  projects: StoredProject[];
  onOpen: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onExport: (id: string) => void;
}

export function ProjectList({
  projects,
  onOpen,
  onDuplicate,
  onDelete,
  onRename,
  onExport
}: ProjectListProps) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const handleStartRename = (project: StoredProject) => {
    setRenamingId(project.id);
    setNewName(project.name);
    setMenuOpenId(null);
  };

  const handleFinishRename = (id: string) => {
    if (newName.trim() && newName !== projects.find(p => p.id === id)?.name) {
      onRename(id, newName.trim());
    }
    setRenamingId(null);
    setNewName('');
  };

  const handleDelete = (project: StoredProject) => {
    if (window.confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
      onDelete(project.id);
    }
    setMenuOpenId(null);
  };

  return (
    <div className="divide-y divide-white/10">
      {projects.map((project) => (
        <div
          key={project.id}
          className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors cursor-pointer"
          onClick={() => onOpen(project.id)}
        >
          <FaFolder className="text-white/70 text-xl flex-shrink-0" />
          <div className="flex-1 min-w-0">
            {renamingId === project.id ? (
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onBlur={() => handleFinishRename(project.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleFinishRename(project.id);
                  if (e.key === 'Escape') {
                    setRenamingId(null);
                    setNewName('');
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-full px-2 py-1 border border-white/20 bg-white/5 text-white rounded focus:outline-none focus:ring-2 focus:ring-white/20"
                autoFocus
              />
            ) : (
              <h3 className="font-light tracking-tight text-white truncate">{project.name}</h3>
            )}
            {project.description && (
              <p className="text-sm text-white/70 truncate">{project.description}</p>
            )}
          </div>
          <div className="text-sm text-white/70 whitespace-nowrap">
            {project.nodeCount || 0} nodes
          </div>
          <div className="text-sm text-white/70 whitespace-nowrap">
            {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
          </div>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpenId(menuOpenId === project.id ? null : project.id);
              }}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded transition-colors"
            >
              <FaEllipsisV />
            </button>
            {menuOpenId === project.id && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpenId(null);
                  }}
                />
                <div className="absolute right-0 mt-1 w-48 bg-white/5 backdrop-blur-sm rounded-lg shadow-2xl z-20 border border-white/10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartRename(project);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 flex items-center gap-2 transition-colors"
                  >
                    <FaEdit className="text-xs" />
                    Rename
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicate(project.id);
                      setMenuOpenId(null);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 flex items-center gap-2 transition-colors"
                  >
                    <FaCopy className="text-xs" />
                    Duplicate
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onExport(project.id);
                      setMenuOpenId(null);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 flex items-center gap-2 transition-colors"
                  >
                    <FaDownload className="text-xs" />
                    Export
                  </button>
                  <div className="border-t border-white/10" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(project);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-400/10 flex items-center gap-2 transition-colors"
                  >
                    <FaTrash className="text-xs" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

