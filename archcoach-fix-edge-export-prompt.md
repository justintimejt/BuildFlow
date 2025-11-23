# Fix Missing Node Connection Lines in PNG Export – Cursor-ready Prompt

You are an AI pair programmer working in the **BuildFlow / Luna** repo.

**Bug:** When exporting the system design canvas as a PNG, **node connection lines (edges) do not appear** in the exported image. They *do* appear correctly while editing in the UI.

Your task: **Fix the PNG export so that all edges / connections are visible in the exported image**, along with the nodes and labels.

---

## What’s going wrong (likely causes)

This is typically caused by one or more of the following:

1. **Wrong DOM element is being captured**
   - The export function is targeting only the **nodes layer** (or an inner container) instead of the full canvas that also contains the edges layer.
   - Example: Using `document.querySelector(".react-flow__nodes")` instead of the wrapper that includes `.react-flow__edges` as well.

2. **Separate layers / portals**
   - In libraries like React Flow, edges and nodes are rendered in separate absolutely-positioned layers inside the canvas.
   - If the screenshot/export is only capturing one of those layers, edges will be missing.

3. **Canvas / SVG not being included**
   - Edges might be drawn on an `<svg>` or `<canvas>` element that is not inside the DOM subtree being passed to `html-to-image` / `dom-to-image` / `html2canvas`.

4. **Z-index or overflow issues during export**
   - If the export wrapper doesn’t include the full canvas bounds or uses `overflow: hidden` improperly, parts of edges may be clipped or missing.

Your job is to **identify the actual cause in this repo** and then fix it cleanly.

---

## Step 1 – Locate the export logic

1. Search the frontend code for the PNG export function. Likely keywords:
   - `toPng`
   - `toBlob`
   - `html-to-image`
   - `dom-to-image`
   - `html2canvas`
   - `"export"`, `"download"`, `"png"`

2. Common places:
   - A utility file like `exportCanvas.ts` / `downloadImage.ts`.
   - A button handler in a toolbar / top bar / menu component (e.g. `CanvasToolbar`, `EditorToolbar`).

3. Once found, **identify exactly which DOM node is being passed** into the export call, e.g.:

   ```ts
   const element = document.getElementById("canvas-export-target");
   const dataUrl = await toPng(element, options);
   ```

   or

   ```ts
   const reactFlowWrapper = reactFlowWrapperRef.current;
   toPng(reactFlowWrapper, { ... });
   ```

Document in comments which element is currently being targeted and where it sits in the DOM hierarchy relative to nodes/edges.

---

## Step 2 – Confirm the full canvas wrapper includes edges

The goal is to **capture the entire React Flow / canvas area** including both nodes and edges.

1. Identify the main canvas wrapper in the UI, e.g.:
   - The `<ReactFlow>` container.
   - A wrapper with a class like `.react-flow` or `.react-flow__renderer`.
   - A specific element referenced by `reactFlowWrapperRef` or similar.

2. Use React DevTools / DOM inspection to check the structure. You should see something similar to:

   ```html
   <div class="react-flow">
     <div class="react-flow__renderer">
       <svg class="react-flow__edges">...</svg>
       <div class="react-flow__nodes">...</div>
       <!-- other overlays -->
     </div>
   </div>
   ```

3. Ensure the **element you pass to the export function is this outer wrapper** (e.g. `.react-flow` or `.react-flow__renderer`), NOT just `.react-flow__nodes` or a custom nodes-only container.

4. If necessary, add a **dedicated ref** to this wrapper:

   ```tsx
   const canvasRef = useRef<HTMLDivElement | null>(null);

   return (
     <div ref={canvasRef} className="react-flow-wrapper">
       <ReactFlow ... />
     </div>
   );
   ```

   And use `canvasRef.current` for the export instead of a smaller internal element.

---

## Step 3 – Update the export function to target the correct element

Adjust the export function so the **captured element includes both nodes and edges**.

Example (adapt to your actual code):

```ts
import { toPng } from "html-to-image";

const exportCanvasAsPng = async (canvasElement: HTMLElement) => {
  const dataUrl = await toPng(canvasElement, {
    cacheBust: true,
    pixelRatio: 2, // keep hi-res if desired
  });

  const link = document.createElement("a");
  link.download = "architecture.png";
  link.href = dataUrl;
  link.click();
};
```

Usage from a toolbar component:

```tsx
const { canvasRef } = useCanvasContext(); // or pass canvasRef down as prop

const handleExport = async () => {
  if (!canvasRef.current) return;
  await exportCanvasAsPng(canvasRef.current);
};
```

Key point: `canvasRef` must point at the **wrapper that contains both the edge layer and node layer.**

---

## Step 4 – Verify CSS does not hide edges during export

Check CSS for the canvas and edges:

1. Ensure the edges `<svg>` or `<canvas>` is not using styles that cause it to be excluded or visually hidden (e.g. `opacity: 0`, `display: none`).
2. Ensure the outer wrapper has sufficient size and no problematic `overflow` that clips edges when rendered to PNG.
3. If `transform` or scaling is used (e.g. React Flow zoom), `html-to-image` usually handles it, but verify:
   - The export is run on the correctly transformed, visible element.
   - Any CSS `transform-origin` issues do not move edges out of the captured bounds.

If needed, set a neutral background color on the wrapper so edges are clearly visible in both light and dark themes:

```css
.react-flow-wrapper[data-theme="dark"] {
  background-color: var(--canvas-bg-dark);
}

.react-flow-wrapper[data-theme="light"] {
  background-color: var(--canvas-bg-light);
}
```

---

## Step 5 – Test scenarios

1. **Basic simple graph**
   - Create two nodes, connect them with a single edge.
   - Export as PNG.
   - Confirm: both nodes **and the connecting line** are visible.

2. **Multiple edges and types**
   - Add multiple nodes and cross-cross edges.
   - Export and verify **all edges** are present.

3. **Zoom & pan**
   - Pan/zoom the canvas to a non-default position.
   - Export and ensure edges still appear correctly, not cut off or missing.

4. **Dark mode / themes**
   - Test in both light and dark modes if theming exists.
   - Ensure edges are visible and have sufficient contrast against the background.

---

## Cleanup and documentation

1. Add a short comment near the export logic explaining **why the wrapper element is used**, e.g.:

   ```ts
   // Important: we use the outer ReactFlow wrapper here so edges (svg layer)
   // and nodes are both included in the exported PNG.
   ```

2. If you introduced a `canvasRef` or context to share it, keep the API small and focused:
   - `canvasRef` should clearly refer to “exportable canvas root”.

3. Make sure no dead code remains for previous export approaches (old refs, unused DOM selectors, etc.).

---

## Definition of done

- Exported PNG shows:
  - All nodes
  - All edges / connection lines
  - Correct layout, zoom, and position
- The fix is stable across:
  - Simple diagrams
  - Large diagrams with many edges
  - Different zoom levels and themes
- No regressions in existing export features (filename, quality, download behavior).
