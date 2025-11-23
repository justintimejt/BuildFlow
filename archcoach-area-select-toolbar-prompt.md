# Area Highlight & Group Move Tool – Cursor-ready Prompt

You are an AI pair programmer working in the **BuildFlow / Luna** repo.

Your task: **Add a toolbar tool that lets the user highlight a rectangular area on the canvas and move all the nodes inside that area together.**

The feature should feel like typical “marquee selection” in design tools: click the tool in the toolbar → drag a rectangle on the canvas → nodes inside become selected → dragging moves them as a group.

---

## High-level behavior

1. **New toolbar button** (e.g. “Area Select” / marquee icon) in the canvas toolbar.
2. When the tool is active:
   - Clicking and dragging on an empty part of the canvas draws a **rectangular highlight**.
   - As the rectangle grows/shrinks, any nodes inside the rectangle are **visually selected**.
3. When the user releases the mouse:
   - The highlighted nodes remain selected.
4. When the user drags any of the selected nodes:
   - **All selected nodes move together** (group move).
5. Switching to another tool (e.g. default select, pan, etc.) exits area-select mode and hides the rectangle.

Assume the canvas is based on **React + React Flow** or a similar node/edge library.

---

## Toolbar integration

1. Locate the **canvas toolbar** component (e.g. `CanvasToolbar`, `EditorToolbar`, `TopBar`, etc.).
2. Add an **“Area Select”** button with toggle behavior:
   - When inactive, clicking it **activates area-select mode**.
   - When active, clicking it again **deactivates area-select mode**.
   - If another mutually exclusive tool (like “pan” or “connect”) is active, deactivating that when “Area Select” is turned on.

Example toolbar snippet (adapt naming and styles to your codebase):

```tsx
type Tool = "select" | "pan" | "area-select" | "connect";

const CanvasToolbar: React.FC = () => {
  const { activeTool, setActiveTool } = useCanvasToolState();

  const toggleAreaSelect = () => {
    setActiveTool(activeTool === "area-select" ? "select" : "area-select");
  };

  return (
    <div className="canvas-toolbar">
      {/* other buttons */}
      <button
        type="button"
        onClick={toggleAreaSelect}
        className={
          activeTool === "area-select"
            ? "toolbar-button toolbar-button--active"
            : "toolbar-button"
        }
        aria-pressed={activeTool === "area-select"}
        aria-label="Area select tool"
      >
        {/* Replace with your icon system */}
        <span>▭</span>
      </button>
    </div>
  );
};
```

You can store `activeTool` in a global store / context, e.g. `CanvasToolContext` or Zustand.

---

## Area selection rectangle on the canvas

Create a mechanism on the canvas to handle **mouse down / move / up** when `activeTool === "area-select"`.

### 1. State in the canvas component

In your main canvas component (the one wrapping `<ReactFlow>`):

```tsx
type Point = { x: number; y: number };

const Canvas: React.FC = () => {
  const { activeTool } = useCanvasToolState();

  const [isDraggingArea, setIsDraggingArea] = useState(false);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [dragCurrent, setDragCurrent] = useState<Point | null>(null);

  // nodes, setNodes come from React Flow or your state manager
  const [nodes, setNodes] = useNodesState(initialNodes);

  // ...
};
```

> Coordinate space note: use the **canvas / React Flow coordinates**, not raw clientX/clientY. Use React Flow’s `project` function or equivalent to convert screen coordinates → flow coordinates.

### 2. Mouse event handlers

Attach handlers to a transparent overlay on top of the canvas, but only when `activeTool === "area-select"`.

```tsx
const { project } = useReactFlow(); // if using React Flow

const handleMouseDown = (event: React.MouseEvent) => {
  if (activeTool !== "area-select") return;
  // Only start if clicking on empty canvas (optional: ignore if clicking a node)
  const bounds = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
  const point = project({
    x: event.clientX - bounds.left,
    y: event.clientY - bounds.top,
  });

  setIsDraggingArea(true);
  setDragStart(point);
  setDragCurrent(point);
};

const handleMouseMove = (event: React.MouseEvent) => {
  if (!isDraggingArea || !dragStart) return;

  const bounds = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
  const point = project({
    x: event.clientX - bounds.left,
    y: event.clientY - bounds.top,
  });

  setDragCurrent(point);
};

const handleMouseUp = () => {
  if (!isDraggingArea || !dragStart || !dragCurrent) {
    setIsDraggingArea(false);
    setDragStart(null);
    setDragCurrent(null);
    return;
  }

  // Compute selection rectangle
  const x1 = Math.min(dragStart.x, dragCurrent.x);
  const y1 = Math.min(dragStart.y, dragCurrent.y);
  const x2 = Math.max(dragStart.x, dragCurrent.x);
  const y2 = Math.max(dragStart.y, dragCurrent.y);

  const selectedNodeIds = nodes
    .filter((node) => {
      const { x, y } = node.position;
      // Optionally consider node width/height if available
      return x >= x1 && x <= x2 && y >= y1 && y <= y2;
    })
    .map((node) => node.id);

  // Update nodes to mark them selected
  setNodes((prev) =>
    prev.map((node) => ({
      ...node,
      selected: selectedNodeIds.includes(node.id),
    })),
  );

  setIsDraggingArea(false);
  setDragStart(null);
  setDragCurrent(null);
};
```

### 3. Rendering the rectangle

When `isDraggingArea` is true and both `dragStart` and `dragCurrent` exist, render a translucent rectangle overlay.

```tsx
const renderSelectionRect = () => {
  if (!isDraggingArea || !dragStart || !dragCurrent) return null;

  const left = Math.min(dragStart.x, dragCurrent.x);
  const top = Math.min(dragStart.y, dragCurrent.y);
  const width = Math.abs(dragCurrent.x - dragStart.x);
  const height = Math.abs(dragCurrent.y - dragStart.y);

  return (
    <div
      className="absolute pointer-events-none border border-blue-400/70 bg-blue-400/10"
      style={{
        left,
        top,
        width,
        height,
      }}
    />
  );
};
```

> If your canvas container uses transforms / zoom, you may need to place this rectangle in the same transformed layer or use React Flow’s built-in selection rectangle support. Adjust accordingly.

### 4. Hook into the canvas JSX

Wrap your React Flow or canvas in a container that captures mouse events:

```tsx
return (
  <div className="relative w-full h-full">
    <div
      className="absolute inset-0"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <ReactFlow nodes={nodes} /* ...other props */ />
      {renderSelectionRect()}
    </div>
  </div>
);
```

Make sure the overlay doesn’t block internal events when other tools are active. You can conditionally use `pointer-events-none` / `pointer-events-auto` depending on `activeTool`.

---

## Group move behavior (move all nodes inside selection)

Once nodes are marked `selected: true`, you want dragging one selected node to move all selected nodes together.

If you use React Flow, it already supports multi-node selection, but you may want to enforce group move behavior manually.

### 1. Track drag deltas

Use `onNodesChange` or `onNodeDrag` / `onNodeDragStart` / `onNodeDragStop` (React Flow) to move selected nodes.

Pseudo-example using `onNodeDrag` callback:

```tsx
const onNodeDragStart: OnNodeDragStart = (_event, node) => {
  // Save initial positions of all selected nodes
  const selectedNodes = nodes.filter((n) => n.selected);
  dragStateRef.current = {
    basePositions: Object.fromEntries(selectedNodes.map((n) => [n.id, n.position])),
    dragNodeId: node.id,
  };
};

const onNodeDrag: OnNodeDrag = (event, node) => {
  const dragState = dragStateRef.current;
  if (!dragState) return;

  const { basePositions } = dragState;
  const draggedBasePos = basePositions[node.id];
  if (!draggedBasePos) return;

  const dx = node.position.x - draggedBasePos.x;
  const dy = node.position.y - draggedBasePos.y;

  setNodes((prevNodes) =>
    prevNodes.map((n) => {
      if (!n.selected || n.id === node.id) return n;
      const base = basePositions[n.id];
      if (!base) return n;
      return {
        ...n,
        position: {
          x: base.x + dx,
          y: base.y + dy,
        },
      };
    }),
  );
};

const onNodeDragStop: OnNodeDragStop = () => {
  dragStateRef.current = null;
};
```

Then pass these to `<ReactFlow>`:

```tsx
<ReactFlow
  nodes={nodes}
  onNodesChange={onNodesChange}
  onNodeDragStart={onNodeDragStart}
  onNodeDrag={onNodeDrag}
  onNodeDragStop={onNodeDragStop}
  // ...
/>
```

This ensures that **dragging a selected node** moves all selected nodes preserving their relative distances.

---

## UX & cleanup

1. **Cursor changes**:
   - When `activeTool === "area-select"`, use a crosshair cursor on the canvas.
   - When dragging selection, keep the same or a suitable drag cursor.

2. **Deactivate area select on escape**:
   - Optionally, pressing `Esc` can clear selection and/or switch back to `select` tool.

3. **Avoid interfering with existing behaviors**:
   - When `activeTool !== "area-select"`, don’t intercept mouse events for marquee selection.
   - Don’t break existing pan/zoom/drag behaviors.

4. **Testing**:
   - Create scattered nodes, highlight an area → all nodes inside are selected.
   - Drag any selected node → all selected nodes move together.
   - Highlight an empty area → no nodes selected, no crash.
   - Switch tools (e.g. to connect/pan) → area selection no longer active.

---

## Definition of done

- There is a **toolbar button** that toggles an **area selection mode**.
- User can click-drag on the canvas to draw a **selection rectangle**.
- All nodes fully inside the rectangle become selected.
- Dragging any selected node moves **all selected nodes together**.
- Existing canvas tools (pan, regular selection, connect, etc.) still work as before when area-select is not active.
