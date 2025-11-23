import { useState } from 'react';
import { FaTimes, FaPlus, FaLayerGroup } from 'react-icons/fa';
import { TemplateGallery } from './TemplateGallery';
import { Template } from '../../types/template';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFromScratch: (name: string) => void;
  onCreateFromTemplate: (template: Template, name: string) => void;
}

export function CreateProjectModal({
  isOpen,
  onClose,
  onCreateFromScratch,
  onCreateFromTemplate
}: CreateProjectModalProps) {
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [projectName, setProjectName] = useState('');
  const [creationMode, setCreationMode] = useState<'scratch' | 'template'>('scratch');

  if (!isOpen) return null;

  const handleCreate = () => {
    const name = projectName.trim() || 'Untitled Project';
    
    if (creationMode === 'template' && selectedTemplate) {
      onCreateFromTemplate(selectedTemplate, name);
    } else {
      onCreateFromScratch(name);
    }
    
    // Reset state
    setProjectName('');
    setSelectedTemplate(null);
    setShowTemplateGallery(false);
    setCreationMode('scratch');
    onClose();
  };

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setProjectName(template.name);
    setShowTemplateGallery(false);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <h2 className="text-2xl font-light tracking-tight text-white">Create New Project</h2>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition-colors"
            >
              <FaTimes />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Creation Mode Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-white mb-2">
                Start with:
              </label>
              
              <div className="space-y-2">
                <label className="flex items-start gap-3 p-4 border-2 border-white/10 rounded-lg cursor-pointer hover:bg-white/5 hover:border-white/20 transition-all duration-200">
                  <input
                    type="radio"
                    name="creationMode"
                    value="scratch"
                    checked={creationMode === 'scratch'}
                    onChange={() => {
                      setCreationMode('scratch');
                      setSelectedTemplate(null);
                      setProjectName('');
                    }}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <FaPlus className="text-white" />
                      <span className="font-medium text-white">Start from Scratch</span>
                    </div>
                    <p className="text-sm text-white/70">
                      Create an empty project and build your architecture from the ground up
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 border-2 border-white/10 rounded-lg cursor-pointer hover:bg-white/5 hover:border-white/20 transition-all duration-200">
                  <input
                    type="radio"
                    name="creationMode"
                    value="template"
                    checked={creationMode === 'template'}
                    onChange={() => setCreationMode('template')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <FaLayerGroup className="text-white" />
                      <span className="font-medium text-white">Use Template</span>
                    </div>
                    <p className="text-sm text-white/70">
                      Start from a pre-built architecture template
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Template Selection */}
            {creationMode === 'template' && (
              <div className="space-y-3">
                {!showTemplateGallery && (
                  <div>
                    {selectedTemplate ? (
                      <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-white">{selectedTemplate.name}</h4>
                            <p className="text-sm text-white/70">{selectedTemplate.description}</p>
                            <p className="text-xs text-white/50 mt-1">
                              {selectedTemplate.nodeCount} nodes • {selectedTemplate.edgeCount} edges
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setShowTemplateGallery(true);
                              setSelectedTemplate(null);
                            }}
                            className="text-sm text-white/70 hover:text-white transition-colors"
                          >
                            Change Template
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowTemplateGallery(true)}
                        className="w-full px-4 py-3 border-2 border-dashed border-white/20 rounded-lg hover:border-white/30 hover:bg-white/5 transition-all duration-200 text-white font-medium"
                      >
                        Browse Templates
                      </button>
                    )}
                  </div>
                )}

                {showTemplateGallery && (
                  <TemplateGallery
                    onSelect={handleTemplateSelect}
                    onClose={() => setShowTemplateGallery(false)}
                  />
                )}
              </div>
            )}

            {/* Project Name Input */}
            <div className="space-y-2">
              <label htmlFor="projectName" className="block text-sm font-medium text-white">
                Project Name
              </label>
              <input
                id="projectName"
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Untitled Project"
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (creationMode === 'template' && !selectedTemplate) {
                      setShowTemplateGallery(true);
                    } else {
                      handleCreate();
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
            <button
              onClick={onClose}
              className="px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 font-light tracking-tight"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={creationMode === 'template' && !selectedTemplate}
              className="px-6 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-light tracking-tight shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Create Project
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

