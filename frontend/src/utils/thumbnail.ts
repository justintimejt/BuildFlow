import html2canvas from 'html2canvas';
import { Project } from '../types';

/**
 * Generate a thumbnail from a React Flow canvas element
 */
export const generateThumbnailFromCanvas = async (
  canvasElement: HTMLElement,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
    windowWidth?: number;
    windowHeight?: number;
  }
): Promise<string> => {
  const { width = 400, height = 300, quality = 0.8 } = options || {};

  try {
    // Get the actual dimensions of the element
    const rect = canvasElement.getBoundingClientRect();
    const elementWidth = rect.width || canvasElement.scrollWidth || width;
    const elementHeight = rect.height || canvasElement.scrollHeight || height;

    const canvas = await html2canvas(canvasElement, {
      width: elementWidth,
      height: elementHeight,
      scale: 1,
      useCORS: true,
      backgroundColor: '#f3f4f6', // Match the canvas background
      logging: false,
      allowTaint: false,
      // Capture the full viewport
      x: 0,
      y: 0,
      scrollX: 0,
      scrollY: 0,
      // Ensure we capture the entire visible area
      windowWidth: options?.windowWidth || elementWidth,
      windowHeight: options?.windowHeight || elementHeight,
    });

    // Convert to base64 with specified quality
    return canvas.toDataURL('image/png', quality);
  } catch (error) {
    console.error('Failed to generate thumbnail:', error);
    throw error;
  }
};

/**
 * Generate a thumbnail from project data (programmatic rendering)
 * This is a fallback when canvas element is not available
 */
export const generateThumbnailFromProject = async (
  project: Project
): Promise<string> => {
  // For now, return a placeholder
  // In the future, we could render nodes/edges to a canvas programmatically
  return createPlaceholderThumbnail(project);
};

/**
 * Create a placeholder thumbnail when preview is not available
 */
export const createPlaceholderThumbnail = (project: Project): string => {
  // Create a simple canvas with project info
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 300;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return '';

  // Background - pure black
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, 400, 300);

  // Text - white
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(project.name || 'Untitled Project', 200, 120);

  // Node/Edge count - white with 70% opacity
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = '16px sans-serif';
  ctx.fillText(
    `${project.nodes?.length || 0} nodes • ${project.edges?.length || 0} edges`,
    200,
    160
  );

  return canvas.toDataURL('image/png');
};

/**
 * Optimize thumbnail size by compressing
 */
export const optimizeThumbnail = async (
  dataUrl: string,
  maxSizeKB: number = 100
): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      const maxDimension = 400;

      // Resize if needed
      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height);
        width = width * ratio;
        height = height * ratio;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      
      // Try different quality levels to meet size requirement
      let quality = 0.8;
      let result = canvas.toDataURL('image/jpeg', quality);
      
      // Check size and reduce quality if needed
      while (getDataUrlSize(result) > maxSizeKB * 1024 && quality > 0.1) {
        quality -= 0.1;
        result = canvas.toDataURL('image/jpeg', quality);
      }
      
      resolve(result);
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
};

/**
 * Get the size of a data URL in bytes
 */
const getDataUrlSize = (dataUrl: string): number => {
  const base64 = dataUrl.split(',')[1];
  if (!base64) return 0;
  return (base64.length * 3) / 4;
};

