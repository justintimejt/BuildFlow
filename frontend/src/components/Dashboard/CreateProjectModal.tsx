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
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-800">Create New Project</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FaTimes />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Creation Mode Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start with:
              </label>
              
              <div className="space-y-2">
                <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
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
                      <FaPlus className="text-blue-600" />
                      <span className="font-medium text-gray-800">Start from Scratch</span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Create an empty project and build your architecture from the ground up
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
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
                      <FaLayerGroup className="text-purple-600" />
                      <span className="font-medium text-gray-800">Use Template</span>
                    </div>
                    <p className="text-sm text-gray-500">
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
                      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-800">{selectedTemplate.name}</h4>
                            <p className="text-sm text-gray-600">{selectedTemplate.description}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {selectedTemplate.nodeCount} nodes • {selectedTemplate.edgeCount} edges
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setShowTemplateGallery(true);
                              setSelectedTemplate(null);
                            }}
                            className="text-sm text-purple-600 hover:text-purple-700"
                          >
                            Change Template
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowTemplateGallery(true)}
                        className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors text-gray-700 font-medium"
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
              <label htmlFor="projectName" className="block text-sm font-medium text-gray-700">
                Project Name
              </label>
              <input
                id="projectName"
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Untitled Project"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={creationMode === 'template' && !selectedTemplate}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Create Project
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

