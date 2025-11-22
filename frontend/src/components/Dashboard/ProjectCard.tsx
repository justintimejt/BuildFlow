import { useState, useRef, useEffect } from 'react';
import { StoredProject } from '../../utils/storage';
import { FaFolder, FaEllipsisV, FaEdit, FaCopy, FaTrash, FaDownload } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';

interface ProjectCardProps {
  project: StoredProject;
  onOpen: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onExport: (id: string) => void;
}

export function ProjectCard({
  project,
  onOpen,
  onDuplicate,
  onDelete,
  onRename,
  onExport
}: ProjectCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(project.name);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const handleRename = () => {
    if (newName.trim() && newName !== project.name) {
      onRename(project.id, newName.trim());
    }
    setIsRenaming(false);
    setShowMenu(false);
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
      onDelete(project.id);
    }
    setShowMenu(false);
  };

  const handleDuplicate = () => {
    onDuplicate(project.id);
    setShowMenu(false);
  };

  // Calculate menu position when it opens
  useEffect(() => {
    if (showMenu && menuButtonRef.current) {
      const rect = menuButtonRef.current.getBoundingClientRect();
      const menuWidth = 192; // w-48 = 12rem = 192px
      const gap = 4;
      
      // Calculate right position, ensuring menu doesn't go off-screen
      let right = window.innerWidth - rect.right;
      if (right + menuWidth > window.innerWidth) {
        // If menu would go off-screen, align to button's left edge
        right = window.innerWidth - rect.left;
      }
      
      // Ensure menu doesn't go off-screen on the left
      if (right > window.innerWidth - 20) {
        right = window.innerWidth - menuWidth - 20;
      }
      
      setMenuPosition({
        top: rect.bottom + gap,
        right: Math.max(20, right) // Minimum 20px from right edge
      });
    }
  }, [showMenu]);

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <FaFolder className="text-blue-500 text-2xl flex-shrink-0" />
            {isRenaming ? (
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onBlur={handleRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename();
                  if (e.key === 'Escape') {
                    setNewName(project.name);
                    setIsRenaming(false);
                  }
                }}
                className="flex-1 px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            ) : (
              <h3
                className="font-semibold text-gray-800 truncate cursor-pointer hover:text-blue-600"
                onClick={() => onOpen(project.id)}
                title={project.name}
              >
                {project.name}
              </h3>
            )}
          </div>
          <div className="relative z-30">
            <button
              ref={menuButtonRef}
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            >
              <FaEllipsisV />
            </button>
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />
                <div
                  className="fixed w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200"
                  style={{
                    top: `${menuPosition.top}px`,
                    right: `${menuPosition.right}px`
                  }}
                >
                  <button
                    onClick={() => {
                      setIsRenaming(true);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <FaEdit className="text-xs" />
                    Rename
                  </button>
                  <button
                    onClick={handleDuplicate}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <FaCopy className="text-xs" />
                    Duplicate
                  </button>
                  <button
                    onClick={() => {
                      onExport(project.id);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <FaDownload className="text-xs" />
                    Export
                  </button>
                  <div className="border-t border-gray-200" />
                  <button
                    onClick={handleDelete}
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

        {project.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{project.description}</p>
        )}

        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
          <span>{project.nodeCount || 0} nodes</span>
          <span>•</span>
          <span>Updated {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}</span>
        </div>

        <button
          onClick={() => onOpen(project.id)}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Open Project
        </button>
      </div>
    </div>
  );
}

