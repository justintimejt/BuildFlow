import { useState, useRef, useEffect } from 'react';
import { StoredProject } from '../../utils/storage';
import { FaArrowRight, FaEllipsisV, FaEdit, FaTrash, FaDownload } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { ProjectCardPreview } from './ProjectCardPreview';

interface ProjectCardProps {
  project: StoredProject;
  onOpen: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
  onRename: (id: string, newName: string) => void;
  onExport: (id: string) => void;
}

export function ProjectCard({
  project,
  onOpen,
  onDelete,
  onRename,
  onExport
}: ProjectCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(project.name);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleRename = () => {
    if (newName.trim() && newName !== project.name) {
      onRename(project.id, newName.trim());
    }
    setIsRenaming(false);
    setShowMenu(false);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    const confirmed = window.confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`);
    setShowMenu(false);
    
    if (confirmed) {
      try {
        await onDelete(project.id);
      } catch (error) {
        console.error('Error deleting project:', error);
        alert('Failed to delete project. Please try again.');
      }
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showMenu &&
        menuButtonRef.current &&
        menuRef.current &&
        !menuButtonRef.current.contains(event.target as Node) &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      // Use setTimeout to avoid immediate closure
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  return (
    <div
      className="bg-white/5 backdrop-blur-sm shadow-2xl border border-white/10 overflow-hidden flex flex-col rounded-2xl"
    >
      {/* Preview Image Section */}
      <div className="relative w-full h-48 overflow-hidden bg-[#171717]">
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
                className="w-full px-2 py-1 border border-white/20 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-white/20 rounded"
                autoFocus
              />
            ) : (
              <h3
                className="font-light tracking-tight text-white truncate text-lg mb-1"
                title={project.name}
              >
                {project.name}
              </h3>
            )}
            {project.description && (
              <p className="text-sm text-white/70 line-clamp-2 mt-1">{project.description}</p>
            )}
          </div>
          <div className="relative ml-2">
            <button
              ref={menuButtonRef}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setShowMenu(!showMenu);
              }}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 transition-colors rounded"
              title="More options"
            >
              <FaEllipsisV />
            </button>
            {showMenu && (
              <div
                ref={menuRef}
                className="absolute right-0 top-full mt-6 w-36 bg-black/80 backdrop-blur-xl shadow-2xl z-50 border border-white/20 rounded-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsRenaming(true);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-white hover:bg-white/10 flex items-center gap-1.5 transition-colors rounded-t-lg"
                >
                  <FaEdit className="text-[10px]" />
                  Rename
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onExport(project.id);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-white hover:bg-white/10 flex items-center gap-1.5 transition-colors"
                >
                  <FaDownload className="text-[10px]" />
                  Export
                </button>
                <div className="border-t border-white/10" />
                <button
                  onClick={handleDelete}
                  className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-red-400/10 flex items-center gap-1.5 transition-colors rounded-b-lg"
                >
                  <FaTrash className="text-[10px]" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-4 text-xs text-white/70 mb-4">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-[#51a2ff] rounded-full"></span>
            {project.nodeCount || 0} nodes
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-[#a684ff] rounded-full"></span>
            {project.edgeCount || 0} edges
          </span>
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
          className="w-full mt-auto px-4 py-3 bg-white/10 border border-white/20 text-white hover:bg-white/20 hover:border-white/30 transition-all duration-200 flex items-center justify-center gap-2 font-light tracking-tight text-sm rounded-lg"
        >
          Open Project
          <FaArrowRight className="text-xs" />
        </button>
      </div>
    </div>
  );
}
