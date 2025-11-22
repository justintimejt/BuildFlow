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
    <div className="divide-y divide-gray-200">
      {projects.map((project) => (
        <div
          key={project.id}
          className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors cursor-pointer"
          onClick={() => onOpen(project.id)}
        >
          <FaFolder className="text-blue-500 text-xl flex-shrink-0" />
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
                className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            ) : (
              <h3 className="font-semibold text-gray-800 truncate">{project.name}</h3>
            )}
            {project.description && (
              <p className="text-sm text-gray-500 truncate">{project.description}</p>
            )}
          </div>
          <div className="text-sm text-gray-500 whitespace-nowrap">
            {project.nodeCount || 0} nodes
          </div>
          <div className="text-sm text-gray-500 whitespace-nowrap">
            {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
          </div>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpenId(menuOpenId === project.id ? null : project.id);
              }}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
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
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-20 border border-gray-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartRename(project);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
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
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
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
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <FaDownload className="text-xs" />
                    Export
                  </button>
                  <div className="border-t border-gray-200" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(project);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
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

