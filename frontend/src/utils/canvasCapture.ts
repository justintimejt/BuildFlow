import { ReactFlowInstance } from '@xyflow/react';
import { generateThumbnailFromCanvas } from './thumbnail';

/**
 * Capture a thumbnail from the React Flow canvas
 */
export const captureCanvasThumbnail = async (
  reactFlowInstance: ReactFlowInstance | null,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
  }
): Promise<string | null> => {
  if (!reactFlowInstance) {
    return null;
  }

  try {
    // Get the React Flow viewport element (the actual rendered canvas area)
    const reactFlowElement = document.querySelector('.react-flow__viewport') || 
                             document.querySelector('.react-flow__renderer') ||
                             document.querySelector('.react-flow');
    if (!reactFlowElement) {
      console.warn('React Flow element not found');
      return null;
    }

    // Fit view to show all content with more padding to ensure everything is visible
    reactFlowInstance.fitView({ 
      padding: 0.2, // Increased padding to show more of the canvas
      duration: 0,
      includeHiddenNodes: false,
      maxZoom: 1.0,
      minZoom: 0.1
    });
    
    // Wait longer for the viewport to fully update and render
    await new Promise(resolve => setTimeout(resolve, 200));

    // Generate thumbnail with better options for capturing the full viewport
    const thumbnail = await generateThumbnailFromCanvas(
      reactFlowElement as HTMLElement,
      {
        ...options,
        // Ensure we capture the full viewport
        windowWidth: reactFlowElement.scrollWidth || window.innerWidth,
        windowHeight: reactFlowElement.scrollHeight || window.innerHeight,
      }
    );

    return thumbnail;
  } catch (error) {
    console.error('Failed to capture canvas thumbnail:', error);
    return null;
  }
};

