import { useState, useEffect } from 'react';
import { useRailwayDeployment } from '../../hooks/useRailwayDeployment';
import { FaTimes, FaRocket, FaCheckCircle, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';

interface DeploymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName?: string;
}

export function DeploymentModal({ isOpen, onClose, projectId, projectName }: DeploymentModalProps) {
  const [railwayToken, setRailwayToken] = useState('');
  const [customProjectName, setCustomProjectName] = useState(projectName || '');
  const { deployToRailway, isDeploying, error, deploymentResult } = useRailwayDeployment();

  useEffect(() => {
    // Load saved token from localStorage if available
    const savedToken = localStorage.getItem('railway_api_token');
    if (savedToken) {
      setRailwayToken(savedToken);
    }
  }, []);

  const handleDeploy = async () => {
    if (!railwayToken.trim()) {
      alert('Please enter your Railway API token');
      return;
    }

    try {
      // Save token to localStorage
      localStorage.setItem('railway_api_token', railwayToken);
      
      await deployToRailway(projectId, railwayToken, customProjectName || undefined);
    } catch (err) {
      // Error is handled by the hook
      console.error('Deployment failed:', err);
    }
  };

  const handleClose = () => {
    if (!isDeploying) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <FaRocket className="text-blue-600 text-xl" />
            <h2 className="text-xl font-semibold text-gray-800">Deploy to Railway</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isDeploying}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            aria-label="Close deployment modal"
            title="Close"
          >
            <FaTimes />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {!deploymentResult ? (
            <>
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Deploy your architecture diagram to Railway infrastructure. Each node will be
                  converted to a Railway service or database.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Railway API Token *
                </label>
                <input
                  type="password"
                  value={railwayToken}
                  onChange={(e) => setRailwayToken(e.target.value)}
                  placeholder="Enter your Railway API token"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isDeploying}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Get your token from{' '}
                  <a
                    href="https://railway.app/account/tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Railway Account Settings
                  </a>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name (optional)
                </label>
                <input
                  type="text"
                  value={customProjectName}
                  onChange={(e) => setCustomProjectName(e.target.value)}
                  placeholder="Railway project name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isDeploying}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                  <FaExclamationTriangle className="text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-red-800 font-medium">Deployment Failed</p>
                    <p className="text-sm text-red-600 mt-1">{error}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={handleClose}
                  disabled={isDeploying}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeploy}
                  disabled={isDeploying || !railwayToken.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isDeploying ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Deploying...
                    </>
                  ) : (
                    <>
                      <FaRocket />
                      Deploy
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-start gap-3">
                  <FaCheckCircle className="text-green-600 text-xl mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-800">Deployment Successful!</p>
                    <p className="text-sm text-green-700 mt-1">{deploymentResult.message}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Railway Project</p>
                  <p className="text-sm text-gray-600">{deploymentResult.railway_project_name}</p>
                  <a
                    href={`https://railway.app/project/${deploymentResult.railway_project_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View on Railway →
                  </a>
                </div>

                {deploymentResult.services.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Services ({deploymentResult.deployed_services})
                    </p>
                    <div className="space-y-1">
                      {deploymentResult.services.map((service) => (
                        <div
                          key={service.node_id}
                          className="text-sm text-gray-600 bg-gray-50 p-2 rounded"
                        >
                          {service.name}
                          {service.needs_code && (
                            <span className="ml-2 text-xs text-amber-600">
                              (needs code)
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {deploymentResult.databases.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Databases ({deploymentResult.deployed_databases})
                    </p>
                    <div className="space-y-1">
                      {deploymentResult.databases.map((db) => (
                        <div
                          key={db.node_id}
                          className="text-sm text-gray-600 bg-gray-50 p-2 rounded"
                        >
                          {db.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {deploymentResult.errors.length > 0 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm font-medium text-yellow-800 mb-2">Warnings</p>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {deploymentResult.errors.map((err, idx) => (
                        <li key={idx}>• {err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

