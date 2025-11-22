import { useCallback } from 'react';
import { exportCanvasAsPNG } from '../utils/exportImage';

export const useExport = () => {
  const exportAsPNG = useCallback(async (elementId: string, filename?: string) => {
    try {
      await exportCanvasAsPNG(elementId, filename);
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }, []);

  return {
    exportAsPNG
  };
};

