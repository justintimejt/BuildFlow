# Canvas Controls Redesign Specification

## Overview

This document outlines the implementation plan for redesigning the undo/redo and layout optimization controls. The goal is to move these controls from the toolbar to a floating panel that hovers over the canvas in the top-left corner, making them more accessible and visually integrated with the canvas workspace.

## Current Implementation

### Undo/Redo Buttons
- **Location**: `frontend/src/components/Toolbar/Toolbar.tsx`
- **Current Position**: In the main toolbar at the top of the page
- **Current Style**: Full buttons with icons and text labels ("Undo", "Redo")
- **Current State**: Disabled state when no history available

### Layout Optimizer
- **Location**: `frontend/src/components/LayoutOptimizer/LayoutOptimizer.tsx`
- **Current Position**: Top-right corner of canvas using React Flow's `Panel` component
- **Current Style**: Dropdown selector + button with icon and text
- **Current Size**: Full-width controls with text labels

## Target Design

### Floating Control Panel
- **Position**: Top-left corner of canvas, floating over the canvas area
- **Layout**: Horizontal row of icon-only buttons
- **Buttons**: Undo, Redo, Optimize Layout (with optional compact dropdown)
- **Styling**: Compact, icon-only buttons with hover tooltips
- **Behavior**: Always visible, positioned absolutely over canvas

## Implementation Plan

### Phase 1: Create Floating Controls Component

#### 1.1 Create New Component File
**File**: `frontend/src/components/CanvasControls/CanvasControls.tsx`

**Purpose**: 
- Container component for floating canvas controls
- Manages positioning and styling
- Groups undo/redo and layout optimizer together

**Structure**:
```tsx
interface CanvasControlsProps {
  // Props if needed
}

export function CanvasControls() {
  // Component implementation
}
```

#### 1.2 Component Features
- Absolute positioning in top-left corner
- Flexbox layout for horizontal button arrangement
- Consistent button styling (icon-only, compact)
- Hover tooltips for accessibility
- Responsive design considerations

### Phase 2: Redesign Undo/Redo Buttons

#### 2.1 Extract Undo/Redo to Separate Component
**File**: `frontend/src/components/CanvasControls/UndoRedoControls.tsx`

**Implementation**:
- Icon-only buttons (FaUndo, FaRedo from react-icons/fa)
- Compact size (smaller padding, icon size)
- Disabled state styling (opacity, cursor)
- Tooltips showing "Undo (Ctrl+Z)" and "Redo (Ctrl+Y)"
- Maintain keyboard shortcut functionality

**Button Specifications**:
- Size: `w-8 h-8` or `w-9 h-9` (32-36px)
- Icon size: `w-4 h-4` (16px)
- Padding: Minimal (`p-1.5` or `p-2`)
- Border radius: `rounded-md` or `rounded-lg`
- Background: `bg-white` with shadow for visibility
- Hover: Slight scale or background change
- Disabled: `opacity-50 cursor-not-allowed`

#### 2.2 Remove from Toolbar
**File**: `frontend/src/components/Toolbar/Toolbar.tsx`

**Changes**:
- Remove undo/redo buttons and their divider
- Keep keyboard shortcuts (they work globally)
- Maintain all other toolbar functionality

### Phase 3: Redesign Layout Optimizer

#### 3.1 Create Compact Layout Optimizer
**File**: `frontend/src/components/CanvasControls/CompactLayoutOptimizer.tsx`

**Design Options**:

**Option A: Icon Button with Dropdown Menu**
- Single icon button (FaMagic)
- Click opens dropdown menu with algorithm options
- More compact, cleaner look
- Dropdown appears below button

**Option B: Icon Button with Popover**
- Single icon button
- Click opens popover with algorithm selector
- Can include "Optimize" button in popover
- More space-efficient

**Option C: Compact Button Group**
- Icon button for optimize action
- Small dropdown arrow or separate icon for algorithm selection
- Most compact option

**Recommended**: Option A (Icon button with dropdown menu)

**Implementation Details**:
- Button size: Match undo/redo buttons (`w-8 h-8` or `w-9 h-9`)
- Icon: `FaMagic` (sparkles/magic wand)
- Dropdown: 
  - Appears on click
  - Positioned below button
  - Contains algorithm selector (compact select or radio buttons)
  - "Optimize" action button in dropdown
  - Closes on selection or outside click
- Loading state: Spinner icon when optimizing
- Tooltip: "Optimize Layout"

#### 3.2 Update LayoutOptimizer Component
**File**: `frontend/src/components/LayoutOptimizer/LayoutOptimizer.tsx`

**Changes**:
- Create new compact variant or new component
- Maintain existing functionality
- Adapt UI to icon-only with dropdown
- Keep algorithm selection logic
- Keep animation and optimization logic

#### 3.3 Remove from Canvas Panel
**File**: `frontend/src/components/Canvas/Canvas.tsx`

**Changes**:
- Remove `<Panel>` with LayoutOptimizer
- Remove LayoutOptimizer import
- Keep all other Canvas functionality

### Phase 4: Integration

#### 4.1 Add CanvasControls to Canvas
**File**: `frontend/src/components/Canvas/Canvas.tsx`

**Implementation**:
```tsx
import { CanvasControls } from '../CanvasControls';

// Inside Canvas component return:
<ReactFlow ...>
  {/* Existing components */}
  <Panel position="top-left" className="m-2">
    <CanvasControls />
  </Panel>
</ReactFlow>
```

**Alternative**: Use absolute positioning instead of Panel
```tsx
<div className="absolute top-2 left-2 z-10">
  <CanvasControls />
</div>
```

#### 4.2 Component Structure
```
CanvasControls/
├── CanvasControls.tsx          # Main container
├── UndoRedoControls.tsx         # Undo/Redo buttons
├── CompactLayoutOptimizer.tsx   # Compact layout optimizer
└── index.ts                     # Exports
```

### Phase 5: Styling and Polish

#### 5.1 Visual Design
- **Container**: 
  - Background: `bg-white` or `bg-white/90` (semi-transparent)
  - Border: `border border-gray-200`
  - Shadow: `shadow-md` or `shadow-lg`
  - Border radius: `rounded-lg`
  - Padding: `p-1` or `p-1.5` (minimal)
  - Gap between buttons: `gap-1` or `gap-1.5`

- **Buttons**:
  - Consistent sizing across all buttons
  - Hover effects: `hover:bg-gray-100` or `hover:scale-105`
  - Active state: `active:scale-95`
  - Transition: `transition-all duration-150`

#### 5.2 Accessibility
- Tooltips on all buttons (using `title` attribute or tooltip library)
- Keyboard shortcuts still work (global listeners)
- ARIA labels for screen readers
- Focus states for keyboard navigation

#### 5.3 Responsive Considerations
- Ensure buttons remain accessible on smaller screens
- Consider touch targets (minimum 44x44px for mobile)
- May need to adjust positioning on very small screens

## File Changes Summary

### New Files to Create
1. `frontend/src/components/CanvasControls/CanvasControls.tsx`
2. `frontend/src/components/CanvasControls/UndoRedoControls.tsx`
3. `frontend/src/components/CanvasControls/CompactLayoutOptimizer.tsx`
4. `frontend/src/components/CanvasControls/index.ts`

### Files to Modify
1. `frontend/src/components/Canvas/Canvas.tsx`
   - Add CanvasControls component
   - Remove LayoutOptimizer Panel

2. `frontend/src/components/Toolbar/Toolbar.tsx`
   - Remove undo/redo buttons
   - Remove undo/redo keyboard shortcut handler (or keep if global)
   - Keep other toolbar functionality

3. `frontend/src/components/LayoutOptimizer/LayoutOptimizer.tsx` (optional)
   - May need to extract logic for compact version
   - Or create new compact component that uses same logic

## Implementation Steps

### Step 1: Create Component Structure
1. Create `CanvasControls` directory
2. Create base component files with TypeScript interfaces
3. Set up exports in `index.ts`

### Step 2: Implement Undo/Redo Controls
1. Create `UndoRedoControls.tsx`
2. Extract undo/redo logic from Toolbar
3. Implement icon-only buttons
4. Add tooltips
5. Test keyboard shortcuts still work

### Step 3: Implement Compact Layout Optimizer
1. Create `CompactLayoutOptimizer.tsx`
2. Design dropdown menu structure
3. Implement algorithm selection in dropdown
4. Add optimize button in dropdown
5. Handle loading states
6. Test optimization functionality

### Step 4: Create Main Container
1. Implement `CanvasControls.tsx`
2. Arrange buttons horizontally
3. Apply consistent styling
4. Add container styling (background, shadow, etc.)

### Step 5: Integrate into Canvas
1. Import CanvasControls in Canvas.tsx
2. Add to React Flow Panel or absolute positioning
3. Test positioning and visibility
4. Ensure it doesn't interfere with canvas interactions

### Step 6: Remove from Old Locations
1. Remove undo/redo from Toolbar
2. Remove LayoutOptimizer Panel from Canvas
3. Clean up unused imports
4. Test all functionality still works

### Step 7: Polish and Test
1. Adjust spacing and sizing
2. Test hover states and tooltips
3. Test keyboard shortcuts
4. Test on different screen sizes
5. Verify accessibility

## Code Examples

### CanvasControls.tsx Structure
```tsx
import { UndoRedoControls } from './UndoRedoControls';
import { CompactLayoutOptimizer } from './CompactLayoutOptimizer';

export function CanvasControls() {
  return (
    <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm 
                    border border-gray-200 rounded-lg shadow-md p-1.5">
      <UndoRedoControls />
      <div className="w-px h-6 bg-gray-300" />
      <CompactLayoutOptimizer />
    </div>
  );
}
```

### UndoRedoControls.tsx Structure
```tsx
import { FaUndo, FaRedo } from 'react-icons/fa';
import { useProjectContext } from '../../contexts/ProjectContext';

export function UndoRedoControls() {
  const { undo, redo, canUndo, canRedo } = useProjectContext();

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={undo}
        disabled={!canUndo}
        className="w-8 h-8 flex items-center justify-center 
                   rounded-md hover:bg-gray-100 transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed
                   focus:outline-none focus:ring-2 focus:ring-indigo-500"
        title="Undo (Ctrl+Z)"
        aria-label="Undo"
      >
        <FaUndo className="w-4 h-4 text-gray-700" />
      </button>
      
      <button
        onClick={redo}
        disabled={!canRedo}
        className="w-8 h-8 flex items-center justify-center 
                   rounded-md hover:bg-gray-100 transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed
                   focus:outline-none focus:ring-2 focus:ring-indigo-500"
        title="Redo (Ctrl+Y)"
        aria-label="Redo"
      >
        <FaRedo className="w-4 h-4 text-gray-700" />
      </button>
    </div>
  );
}
```

### CompactLayoutOptimizer.tsx Structure
```tsx
import { useState, useRef, useEffect } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useProjectContext } from '../../contexts/ProjectContext';
import { optimizeLayout as calculateLayout } from '../../utils/layoutAlgorithms';
import { FaMagic, FaSpinner, FaChevronDown } from 'react-icons/fa';
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

  const handleOptimize = async () => {
    // ... optimization logic (similar to existing LayoutOptimizer)
    setShowDropdown(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={nodes.length === 0}
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
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded 
                         focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
```

## Testing Checklist

- [ ] Undo/redo buttons appear in top-left of canvas
- [ ] Buttons are icon-only (no text)
- [ ] Tooltips show on hover
- [ ] Undo/redo functionality works correctly
- [ ] Keyboard shortcuts (Ctrl+Z, Ctrl+Y) still work
- [ ] Buttons disable appropriately when no history
- [ ] Layout optimizer button appears next to undo/redo
- [ ] Layout optimizer dropdown opens and closes correctly
- [ ] Algorithm selection works in dropdown
- [ ] Optimization works with selected algorithm
- [ ] Loading state shows during optimization
- [ ] Controls don't interfere with canvas interactions
- [ ] Controls are visible and accessible
- [ ] Responsive on different screen sizes
- [ ] No console errors
- [ ] Undo/redo removed from toolbar
- [ ] Old layout optimizer removed from canvas

## Benefits

1. **Better UX**: Controls are closer to the canvas workspace
2. **Cleaner Toolbar**: Toolbar is less cluttered
3. **More Space**: Icon-only buttons save space
4. **Visual Integration**: Controls feel part of the canvas
5. **Consistency**: All canvas controls in one place
6. **Accessibility**: Tooltips provide context without cluttering UI

## Potential Issues and Solutions

### Issue 1: Controls Overlap Canvas Elements
**Solution**: Use React Flow's Panel component or ensure z-index is appropriate

### Issue 2: Controls Too Small on Touch Devices
**Solution**: Ensure minimum touch target size (44x44px) or add responsive sizing

### Issue 3: Dropdown Menu Positioning
**Solution**: Use absolute positioning with proper calculations, or use a dropdown library

### Issue 4: Keyboard Shortcuts Conflict
**Solution**: Ensure global keyboard listeners still work, may need to adjust event handling

## Future Enhancements

1. **Collapsible Panel**: Add ability to collapse/expand controls
2. **Customizable Position**: Allow users to drag controls to preferred position
3. **More Controls**: Add other canvas controls (zoom, fit view, etc.) to the panel
4. **Themes**: Support dark mode styling
5. **Animation**: Add smooth transitions for dropdown appearance

