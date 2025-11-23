import { useState, useCallback, useEffect } from 'react';
import { getLocalTemplates, getTemplateById } from '../utils/templates';
import { Template } from '../types/template';
import { Project } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const useTemplates = () => {
  const [templates, setTemplates] = useState<Template[]>([]);

  const loadTemplates = useCallback(() => {
    const localTemplates = getLocalTemplates();
    setTemplates(localTemplates);
  }, []);

  const getTemplate = useCallback((id: string): Template | undefined => {
    return templates.find(t => t.id === id) || getTemplateById(id);
  }, [templates]);

  const createProjectFromTemplate = useCallback((templateId: string, projectName?: string): Project | null => {
    const template = getTemplate(templateId);
    if (!template) return null;

    // Deep clone template project and regenerate all IDs
    const newNodes = template.project.nodes.map((node: any) => ({
      ...node,
      id: uuidv4()
    }));

    // Create edge mapping for new node IDs
    const nodeIdMap = new Map<string, string>();
    template.project.nodes.forEach((oldNode: any, index: number) => {
      nodeIdMap.set(oldNode.id, newNodes[index].id);
    });

    const newEdges = template.project.edges.map((edge: any) => ({
      ...edge,
      id: uuidv4(),
      source: nodeIdMap.get(edge.source) || edge.source,
      target: nodeIdMap.get(edge.target) || edge.target
    }));

    // Clone template project
    const newProject: Project = {
      ...template.project,
      id: undefined,
      name: projectName || template.name,
      description: template.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      templateId: template.id,
      isTemplate: false,
      nodes: newNodes,
      edges: newEdges
    };

    return newProject;
  }, [getTemplate]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  return {
    templates,
    loadTemplates,
    getTemplate,
    createProjectFromTemplate
  };
};

