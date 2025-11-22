import { useState, useMemo } from 'react';
import { Template } from '../../types/template';
import { getLocalTemplates, getTemplatesByCategory } from '../../utils/templates';
import { FaTimes, FaServer, FaCloud, FaShoppingCart, FaDatabase, FaLayerGroup } from 'react-icons/fa';

interface TemplateGalleryProps {
  onSelect: (template: Template) => void;
  onClose: () => void;
}

const categoryIcons: Record<Template['category'], typeof FaServer> = {
  'web-app': FaServer,
  'microservices': FaLayerGroup,
  'serverless': FaCloud,
  'e-commerce': FaShoppingCart,
  'data-pipeline': FaDatabase,
  'other': FaLayerGroup
};

const categoryLabels: Record<Template['category'], string> = {
  'web-app': 'Web Apps',
  'microservices': 'Microservices',
  'serverless': 'Serverless',
  'e-commerce': 'E-commerce',
  'data-pipeline': 'Data Pipeline',
  'other': 'Other'
};

export function TemplateGallery({ onSelect, onClose }: TemplateGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<Template['category'] | 'all'>('all');
  const templates = useMemo(() => {
    return getTemplatesByCategory(selectedCategory);
  }, [selectedCategory]);

  const allTemplates = getLocalTemplates();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Select a Template</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <FaTimes />
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedCategory === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        {(['web-app', 'microservices', 'serverless', 'e-commerce', 'data-pipeline'] as const).map((category) => {
          const Icon = categoryIcons[category];
          return (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Icon />
              {categoryLabels[category]}
            </button>
          );
        })}
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No templates found in this category.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
          {templates.map((template) => {
            const Icon = categoryIcons[template.category];
            const complexityColors = {
              simple: 'bg-green-100 text-green-700',
              medium: 'bg-yellow-100 text-yellow-700',
              complex: 'bg-red-100 text-red-700'
            };

            return (
              <button
                key={template.id}
                onClick={() => onSelect(template)}
                className="text-left p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
              >
                <div className="flex items-start gap-3 mb-2">
                  <Icon className="text-2xl text-blue-600 flex-shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-800 mb-1">{template.name}</h4>
                    <p className="text-sm text-gray-600 line-clamp-2">{template.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-3 text-xs">
                  <span className={`px-2 py-1 rounded ${complexityColors[template.complexity]}`}>
                    {template.complexity}
                  </span>
                  <span className="text-gray-500">
                    {template.nodeCount} nodes • {template.edgeCount} edges
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

