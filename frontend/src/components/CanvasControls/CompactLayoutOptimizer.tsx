import { useState, useRef, useEffect, useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useProjectContext } from '../../contexts/ProjectContext';
import { optimizeLayout as calculateLayout } from '../../utils/layoutAlgorithms';
import { FaMagic, FaSpinner, FaChevronDown, FaProjectDiagram, FaSitemap, FaNetworkWired, FaTh, FaCircle } from 'react-icons/fa';
import type { LayoutAlgorithm } from '../../utils/layoutAlgorithms';

const algorithmConfig: Record<LayoutAlgorithm, { label: string; icon: typeof FaProjectDiagram; description: string }> = {
  auto: { label: 'Auto', icon: FaMagic, description: 'Recommended' },
  hierarchical: { label: 'Hierarchical', icon: FaSitemap, description: 'Tree-like structure' },
  force: { label: 'Force-Directed', icon: FaNetworkWired, description: 'Natural clustering' },
  grid: { label: 'Grid', icon: FaTh, description: 'Aligned layout' },
  circular: { label: 'Circular', icon: FaCircle, description: 'Radial arrangement' },
};

export function CompactLayoutOptimizer() {
  const { nodes, edges, updateNodePosition } = useProjectContext();
  const { setNodes, fitView } = useReactFlow();
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<LayoutAlgorithm>('auto');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAlgorithmSelect, setShowAlgorithmSelect] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const algorithmSelectRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Check if click is outside the main dropdown
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setShowDropdown(false);
        setShowAlgorithmSelect(false);
      } else if (algorithmSelectRef.current && !algorithmSelectRef.current.contains(target)) {
        // Only close algorithm select if click is outside it but inside main dropdown
        setShowAlgorithmSelect(false);
      }
    };

    if (showDropdown || showAlgorithmSelect) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown, showAlgorithmSelect]);

  // Animate node positions smoothly
  const animateNodePositions = useCallback((
    oldPositions: Map<string, { x: number; y: number }>,
    newPositions: Map<string, { x: number; y: number }>,
    duration: number = 400
  ): Promise<void> => {
    return new Promise((resolve) => {
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease-out)
        const eased = 1 - Math.pow(1 - progress, 3);

        setNodes((nds) =>
          nds.map((n) => {
            const oldPos = oldPositions.get(n.id);
            const newPos = newPositions.get(n.id);
            
            if (oldPos && newPos) {
              const currentX = oldPos.x + (newPos.x - oldPos.x) * eased;
              const currentY = oldPos.y + (newPos.y - oldPos.y) * eased;
              
              return { ...n, position: { x: currentX, y: currentY } };
            }
            return n;
          })
        );

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Final update to ensure exact positions
          setNodes((nds) =>
            nds.map((n) => {
              const newPos = newPositions.get(n.id);
              return newPos ? { ...n, position: newPos } : n;
            })
          );
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }, [setNodes]);

  const handleOptimize = useCallback(async () => {
    if (nodes.length === 0) {
      return;
    }

    setIsOptimizing(true);
    setShowDropdown(false);

    try {
      // Save current positions for animation
      const oldPositions = new Map(nodes.map(n => [n.id, { ...n.position }]));

      // Calculate optimized positions (without updating state yet)
      const optimizedNodes = calculateLayout(nodes, edges, selectedAlgorithm);
      const newPositions = new Map(optimizedNodes.map(n => [n.id, { ...n.position }]));

      // Animate to new positions using ReactFlow's setNodes
      await animateNodePositions(oldPositions, newPositions, 400);

      // After animation completes, update the project context with final positions
      optimizedNodes.forEach(node => {
        updateNodePosition(node.id, node.position);
      });

      // Fit view to show all nodes
      setTimeout(() => {
        fitView({ padding: 0.1, duration: 300 });
      }, 100);
    } catch (error) {
      console.error('Error optimizing layout:', error);
    } finally {
      setIsOptimizing(false);
    }
  }, [nodes, edges, selectedAlgorithm, updateNodePosition, setNodes, fitView, animateNodePositions]);

  const isDisabled = nodes.length === 0 || isOptimizing;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowDropdown(!showDropdown);
        }}
        disabled={isDisabled}
        className="w-8 h-8 flex items-center justify-center 
                   rounded-md bg-purple-600 hover:bg-purple-700 
                   transition-colors shadow-md
                   disabled:opacity-50 disabled:cursor-not-allowed
                   focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        title="Optimize Layout"
        aria-label="Optimize Layout"
      >
        {isOptimizing ? (
          <FaSpinner className="w-4 h-4 text-white animate-spin" />
        ) : (
          <FaMagic className="w-4 h-4 text-white" />
        )}
      </button>

      {showDropdown && (
        <div 
          className="absolute top-full left-0 mt-1 bg-white border border-gray-200 
                      rounded-lg shadow-xl p-3 min-w-[240px] z-50"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-3">
            <label className="text-xs font-semibold text-gray-700 mb-2 block uppercase tracking-wide">
              Layout Algorithm
            </label>
            <div className="relative" ref={algorithmSelectRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAlgorithmSelect(!showAlgorithmSelect);
                }}
                disabled={isDisabled}
                className="w-full px-3 py-2.5 text-sm font-medium text-gray-900 bg-gradient-to-r from-purple-50 to-indigo-50 
                           border-2 border-purple-200 rounded-lg hover:border-purple-300 hover:from-purple-100 hover:to-indigo-100
                           focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                           disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:border-gray-200
                           transition-all duration-200 flex items-center justify-between group"
              >
                <div className="flex items-center gap-2">
                  {(() => {
                    const Icon = algorithmConfig[selectedAlgorithm].icon;
                    return <Icon className="w-4 h-4 text-purple-600" />;
                  })()}
                  <span>{algorithmConfig[selectedAlgorithm].label}</span>
                  {selectedAlgorithm === 'auto' && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs font-semibold text-purple-700 bg-purple-200 rounded">
                      Recommended
                    </span>
                  )}
                </div>
                <FaChevronDown className={`w-3 h-3 text-gray-500 transition-transform duration-200 ${showAlgorithmSelect ? 'rotate-180' : ''}`} />
              </button>
              
              {showAlgorithmSelect && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 
                                rounded-lg shadow-lg overflow-hidden z-50">
                  {(Object.keys(algorithmConfig) as LayoutAlgorithm[]).map((algorithm) => {
                    const config = algorithmConfig[algorithm];
                    const Icon = config.icon;
                    const isSelected = selectedAlgorithm === algorithm;
                    
                    return (
                      <button
                        key={algorithm}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAlgorithm(algorithm);
                          setShowAlgorithmSelect(false);
                        }}
                        className={`w-full px-3 py-2.5 text-sm text-left transition-colors duration-150
                                   flex items-center gap-3 hover:bg-purple-50 active:bg-purple-100
                                   ${isSelected ? 'bg-purple-50 border-l-2 border-purple-600' : 'border-l-2 border-transparent'}`}
                      >
                        <Icon className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-purple-600' : 'text-gray-500'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${isSelected ? 'text-purple-900' : 'text-gray-900'}`}>
                              {config.label}
                            </span>
                            {algorithm === 'auto' && (
                              <span className="px-1.5 py-0.5 text-xs font-semibold text-purple-700 bg-purple-200 rounded">
                                Recommended
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{config.description}</p>
                        </div>
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-purple-600 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOptimize();
            }}
            disabled={isOptimizing || nodes.length === 0}
            className="w-full px-4 py-2.5 text-sm font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg 
                       hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200 shadow-md hover:shadow-lg disabled:shadow-none
                       flex items-center justify-center gap-2"
          >
            {isOptimizing ? (
              <>
                <FaSpinner className="w-4 h-4 animate-spin" />
                <span>Optimizing...</span>
              </>
            ) : (
              <>
                <FaMagic className="w-4 h-4" />
                <span>Optimize Layout</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

