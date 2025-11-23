import { useState, useEffect, useRef } from 'react';
import { FaTimes } from 'react-icons/fa';

interface SaveProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  defaultName?: string;
  buttonRef?: React.RefObject<HTMLButtonElement>;
}

export function SaveProjectModal({
  isOpen,
  onClose,
  onSave,
  defaultName = '',
  buttonRef
}: SaveProjectModalProps) {
  const [projectName, setProjectName] = useState(defaultName);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Update project name when defaultName changes and calculate position
  useEffect(() => {
    if (isOpen) {
      setProjectName(defaultName);
      
      // Calculate position relative to the save button
      if (buttonRef?.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setPosition({
          top: rect.bottom + window.scrollY + 8, // 8px gap below button
          left: rect.left + window.scrollX
        });
      }
      
      // Focus input when modal opens
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [isOpen, defaultName, buttonRef]);

  const handleSave = () => {
    const name = projectName.trim() || defaultName || 'Untitled Project';
    onSave(name);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-50"
        onClick={onClose}
      />
      {/* Modal positioned below button */}
      <div 
        ref={modalRef}
        className="fixed z-50"
        style={
          {
            top: `${position.top}px`,
            left: `${position.left}px`,
            transform: 'translateY(0)'
          } as React.CSSProperties
        }
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className="bg-black/80 backdrop-blur-xl rounded-2xl shadow-2xl border-2 border-white/20 w-80"
        >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-light tracking-tight text-white">Save Project</h2>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10"
            aria-label="Close"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <label htmlFor="projectName" className="block text-sm font-medium text-white">
              Project Name
            </label>
            <input
              ref={inputRef}
              id="projectName"
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Untitled Project"
              className="w-full px-4 py-3 bg-white/5 border-2 border-white/10 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all duration-200"
              autoFocus
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-transparent text-white border border-white/50 hover:border-white hover:bg-white/10 rounded-lg font-light tracking-tight transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-white text-black hover:bg-gray-200 rounded-lg font-light tracking-tight shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Save
          </button>
        </div>
        </div>
      </div>
    </>
  );
}

