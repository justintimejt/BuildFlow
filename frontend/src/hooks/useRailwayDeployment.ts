import { useState, useCallback } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000/api';

interface DeploymentRequest {
  projectId: string;
  railwayToken: string;
  projectName?: string;
}

interface DeploymentResponse {
  success: boolean;
  railway_project_id: string;
  railway_project_name: string;
  deployed_services: number;
  deployed_databases: number;
  services: Array<{
    node_id: string;
    railway_id: string;
    name: string;
    type: string;
    needs_code?: boolean;
  }>;
  databases: Array<{
    node_id: string;
    railway_id: string;
    name: string;
    type: string;
  }>;
  errors: string[];
  message: string;
}

interface DeploymentStatus {
  deployed: boolean;
  metadata?: any;
  message?: string;
}

export const useRailwayDeployment = () => {
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deploymentResult, setDeploymentResult] = useState<DeploymentResponse | null>(null);

  const deployToRailway = useCallback(async (
    projectId: string,
    railwayToken: string,
    projectName?: string
  ): Promise<DeploymentResponse> => {
    setIsDeploying(true);
    setError(null);
    setDeploymentResult(null);

    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

      let response: Response;
      try {
        response = await fetch(`${BACKEND_URL}/deploy/railway`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectId,
            railwayToken,
            projectName,
          } as DeploymentRequest),
          signal: controller.signal,
        });
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timed out. The deployment may still be processing. Please check Railway dashboard.');
        }
        if (fetchError.message?.includes('Failed to fetch') || fetchError.message?.includes('Load failed')) {
          throw new Error(`Cannot connect to backend server at ${BACKEND_URL}. Make sure the backend is running.`);
        }
        throw fetchError;
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: `HTTP ${response.status} error` }));
        const errorMessage = errorData.detail || `HTTP error! status: ${response.status}`;
        
        // Provide helpful message for 404 errors
        if (response.status === 404 && errorMessage.includes('not found')) {
          throw new Error(errorMessage);
        }
        
        throw new Error(errorMessage);
      }

      const data: DeploymentResponse = await response.json();
      setDeploymentResult(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to deploy to Railway';
      setError(errorMessage);
      throw err;
    } finally {
      setIsDeploying(false);
    }
  }, []);

  const getDeploymentStatus = useCallback(async (
    projectId: string
  ): Promise<DeploymentStatus> => {
    try {
      const response = await fetch(`${BACKEND_URL}/deploy/status/${projectId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: DeploymentStatus = await response.json();
      return data;
    } catch (err) {
      console.error('Failed to get deployment status:', err);
      return { deployed: false, message: 'Failed to fetch deployment status' };
    }
  }, []);

  return {
    deployToRailway,
    getDeploymentStatus,
    isDeploying,
    error,
    deploymentResult,
  };
};

