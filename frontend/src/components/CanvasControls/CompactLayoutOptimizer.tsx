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
                   rounded-md bg-white text-black hover:bg-gray-200 
                   transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5
                   disabled:opacity-50 disabled:cursor-not-allowed
                   focus:outline-none focus:ring-2 focus:ring-white/20"
        title="Optimize Layout"
        aria-label="Optimize Layout"
      >
        {isOptimizing ? (
          <FaSpinner className="w-4 h-4 animate-spin" />
        ) : (
          <FaMagic className="w-4 h-4" />
        )}
      </button>

      {showDropdown && (
        <div 
          className="absolute top-full left-0 mt-1 bg-white/10 backdrop-blur-md border border-white/10 
                      rounded-2xl shadow-2xl p-3 min-w-[240px] z-50"
          onClick={(e) => e.stopPropagation()}
        >
          <div>
            <label className="text-xs font-semibold text-white mb-2 block uppercase tracking-wide">
              Layout Algorithm
            </label>
            <div className="relative" ref={algorithmSelectRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAlgorithmSelect(!showAlgorithmSelect);
                }}
                disabled={isDisabled}
                className="w-full px-3 py-2.5 text-sm font-medium text-white bg-white/5 
                           border-2 border-white/10 rounded-lg hover:border-white/20 hover:bg-white/10
                           focus:outline-none focus:ring-2 focus:ring-white/20
                           disabled:bg-white/5 disabled:text-white/30 disabled:cursor-not-allowed disabled:border-white/5
                           transition-all duration-200 flex items-center justify-between group"
              >
                <div className="flex items-center gap-2">
                  {(() => {
                    const Icon = algorithmConfig[selectedAlgorithm].icon;
                    return <Icon className="w-4 h-4 text-white" />;
                  })()}
                  <span>{algorithmConfig[selectedAlgorithm].label}</span>
                  {selectedAlgorithm === 'auto' && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs font-semibold text-white/70 bg-white/10 rounded">
                      Recommended
                    </span>
                  )}
                </div>
                <FaChevronDown className={`w-3 h-3 text-white/70 transition-transform duration-200 ${showAlgorithmSelect ? 'rotate-180' : ''}`} />
              </button>
              
              {showAlgorithmSelect && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white/10 backdrop-blur-md border border-white/10 
                                rounded-lg shadow-2xl overflow-hidden z-50">
                  {(Object.keys(algorithmConfig) as LayoutAlgorithm[]).map((algorithm) => {
                    const config = algorithmConfig[algorithm];
                    const Icon = config.icon;
                    const isSelected = selectedAlgorithm === algorithm;
                    
                    return (
                      <button
                        key={algorithm}
                        onClick={async (e) => {
                          e.stopPropagation();
                          setSelectedAlgorithm(algorithm);
                          setShowAlgorithmSelect(false);
                          setShowDropdown(false);
                          
                          // Trigger optimization with the selected algorithm
                          if (nodes.length > 0 && !isOptimizing) {
                            setIsOptimizing(true);
                            
                            try {
                              // Save current positions for animation
                              const oldPositions = new Map(nodes.map(n => [n.id, { ...n.position }]));
                              
                              // Calculate optimized positions (without updating state yet)
                              const optimizedNodes = calculateLayout(nodes, edges, algorithm);
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
                          }
                        }}
                        disabled={isDisabled}
                        className={`w-full px-3 py-2.5 text-sm text-left transition-all duration-200
                                   flex items-center gap-3 hover:bg-white/10
                                   disabled:opacity-50 disabled:cursor-not-allowed
                                   ${isSelected ? 'bg-white/10 border-l-2 border-white' : 'border-l-2 border-transparent'}`}
                      >
                        <Icon className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-white' : 'text-white/70'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${isSelected ? 'text-white' : 'text-white/70'}`}>
                              {config.label}
                            </span>
                            {algorithm === 'auto' && (
                              <span className="px-1.5 py-0.5 text-xs font-semibold text-white/70 bg-white/10 rounded">
                                Recommended
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-white/50 mt-0.5">{config.description}</p>
                        </div>
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-white flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

