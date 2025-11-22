import { useState, useRef, useEffect, useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useProjectContext } from '../../contexts/ProjectContext';
import { optimizeLayout as calculateLayout } from '../../utils/layoutAlgorithms';
import { FaMagic, FaSpinner } from 'react-icons/fa';
import type { LayoutAlgorithm } from '../../utils/layoutAlgorithms';

export function CompactLayoutOptimizer() {
  const { nodes, edges, updateNodePosition } = useProjectContext();
  const { setNodes, fitView } = useReactFlow();
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<LayoutAlgorithm>('auto');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

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
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={isDisabled}
        className="w-8 h-8 flex items-center justify-center 
                   rounded-md hover:bg-gray-100 transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed
                   focus:outline-none focus:ring-2 focus:ring-indigo-500"
        title="Optimize Layout"
        aria-label="Optimize Layout"
      >
        {isOptimizing ? (
          <FaSpinner className="w-4 h-4 text-gray-700 animate-spin" />
        ) : (
          <FaMagic className="w-4 h-4 text-gray-700" />
        )}
      </button>

      {showDropdown && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 
                        rounded-lg shadow-lg p-2 min-w-[180px] z-50">
          <div className="mb-2">
            <label className="text-xs font-medium text-gray-700 mb-1 block">
              Algorithm
            </label>
            <select
              value={selectedAlgorithm}
              onChange={(e) => setSelectedAlgorithm(e.target.value as LayoutAlgorithm)}
              disabled={isDisabled}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded 
                         focus:outline-none focus:ring-2 focus:ring-indigo-500
                         disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              <option value="auto">Auto</option>
              <option value="hierarchical">Hierarchical</option>
              <option value="force">Force-Directed</option>
              <option value="grid">Grid</option>
              <option value="circular">Circular</option>
            </select>
          </div>
          <button
            onClick={handleOptimize}
            disabled={isOptimizing || nodes.length === 0}
            className="w-full px-3 py-1.5 text-sm bg-indigo-600 text-white rounded 
                       hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors"
          >
            {isOptimizing ? 'Optimizing...' : 'Optimize'}
          </button>
        </div>
      )}
    </div>
  );
}

