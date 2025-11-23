import { useState, useMemo } from 'react';
import { Template } from '../../types/template';
import { getTemplatesByCategory } from '../../utils/templates';
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Select a Template</h3>
        <button
          onClick={onClose}
          className="text-white/70 hover:text-white transition-colors"
        >
          <FaTimes />
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            selectedCategory === 'all'
              ? 'bg-white text-black shadow-lg'
              : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
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
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                selectedCategory === category
                  ? 'bg-white text-black shadow-lg'
                  : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
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
        <div className="text-center py-8 text-white/70">
          No templates found in this category.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
          {templates.map((template) => {
            const Icon = categoryIcons[template.category];
            const complexityColors = {
              simple: 'bg-white/10 text-white border border-white/20',
              medium: 'bg-white/10 text-white border border-white/20',
              complex: 'bg-white/10 text-white border border-white/20'
            };

            return (
              <button
                key={template.id}
                onClick={() => onSelect(template)}
                className="text-left p-4 border-2 border-white/10 rounded-lg hover:border-white/20 hover:bg-white/5 transition-all duration-200"
              >
                <div className="flex items-start gap-3 mb-2">
                  <Icon className="text-2xl text-white flex-shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white mb-1">{template.name}</h4>
                    <p className="text-sm text-white/70 line-clamp-2">{template.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-3 text-xs">
                  <span className={`px-2 py-1 rounded ${complexityColors[template.complexity]}`}>
                    {template.complexity}
                  </span>
                  <span className="text-white/70">
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

