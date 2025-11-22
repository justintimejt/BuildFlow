import { useState, useRef, useEffect } from 'react';
import { StoredProject } from '../../utils/storage';
import { FaEllipsisV, FaEdit, FaCopy, FaTrash, FaDownload, FaArrowRight } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { ProjectCardPreview } from './ProjectCardPreview';

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
    <div
      className="bg-white shadow-md border border-gray-200 overflow-hidden flex flex-col"
    >
      {/* Preview Image Section */}
      <div className="relative w-full h-48 overflow-hidden bg-gray-100">
        <ProjectCardPreview
          thumbnail={project.thumbnail}
          project={project.project}
          className=""
        />
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
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
                onClick={(e) => e.stopPropagation()}
                className="w-full px-2 py-1 border border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-800"
                autoFocus
              />
            ) : (
              <h3
                className="font-semibold text-gray-800 truncate text-lg mb-1"
                title={project.name}
              >
                {project.name}
              </h3>
            )}
            {project.description && (
              <p className="text-sm text-gray-600 line-clamp-2 mt-1">{project.description}</p>
            )}
          </div>
          <div className="relative z-30 ml-2">
            <button
              ref={menuButtonRef}
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              title="More options"
            >
              <FaEllipsisV />
            </button>
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                  }}
                />
                <div
                  className="fixed w-48 bg-white shadow-lg z-50 border border-gray-200"
                  style={{
                    top: `${menuPosition.top}px`,
                    right: `${menuPosition.right}px`
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsRenaming(true);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <FaEdit className="text-xs" />
                    Rename
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicate();
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
                      setShowMenu(false);
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
                      handleDelete();
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

        {/* Metadata */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-blue-500"></span>
            {project.nodeCount || 0} nodes
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-purple-500"></span>
            {project.edgeCount || 0} edges
          </span>
          <span>•</span>
          <span className="truncate">
            {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
          </span>
        </div>

        {/* Open Project Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpen(project.id);
          }}
          className="w-full mt-auto px-4 py-3 bg-gray-200 text-gray-900 hover:bg-gray-300 transition-colors flex items-center justify-center gap-2 font-medium text-sm"
        >
          Open Project
          <FaArrowRight className="text-xs" />
        </button>
      </div>
    </div>
  );
}
