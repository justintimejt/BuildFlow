# Dark Mode Toggle Prompt (Bottom-left Sun/Moon Control) – Cursor-ready

You are an AI pair programmer working in the **BuildFlow / ArchCoach** repo.

Your task: **implement a global light/dark theme with a sun/moon toggle button located in the bottom-left control panel of the UI.** The toggle must be visually clean, robust, and persist the user’s choice.

---

## High-level requirements

1. **Global theming**
   - Add a **light theme** and **dark theme** that affect the entire app (canvas, sidebars, control panels, dialogs, etc.).
   - Use a single source of truth for the current theme (e.g. React context, Zustand store, or similar).
   - The theme should be represented as a simple string: `"light"` or `"dark"`.

2. **Sun/Moon toggle button**
   - Add a **circular toggle button** in the **bottom-left control panel** (same area where canvas controls / editor controls live).
   - The button should show:
     - **Sun icon** when the current theme is **light**.
     - **Moon icon** when the current theme is **dark**.
   - Clicking the button toggles between `"light"` and `"dark"`.

3. **Placement**
   - The toggle **must appear in the bottom-left control panel**, not floating randomly.
   - Use the existing layout components (control panel / bottom bar container) and add the toggle there with consistent spacing and alignment.
   - It should not overlap with other controls; treat it as a first-class control.

4. **Persistence**
   - Persist the theme to `localStorage` (e.g. key: `"archcoach-theme"`).
   - On app load:
     - If there is a saved theme in `localStorage`, use that.
     - Otherwise, fall back to system preference (`prefers-color-scheme: dark`) when possible.
   - Make sure the initial theme is applied **before** the app visibly renders in the “wrong” theme to avoid flash of incorrect theme as much as possible.

5. **Styling**
   - Use the framework already in the project (likely Tailwind or CSS modules); do **not** introduce a new styling library.
   - Define a consistent theme mechanism, e.g.:
     - Add a `data-theme="light"` / `data-theme="dark"` attribute on the root element, **or**
     - Add a top-level class like `"theme-light"` / `"theme-dark"` on the `<body>` or root app container.
   - Replace hard-coded colors with **semantic tokens** (e.g. `bg-surface`, `text-primary`, `border-subtle` if Tailwind/CSS variables permit).
   - Ensure good contrast and readability in dark mode (no low-contrast gray-on-gray).

6. **Accessibility**
   - The toggle must have:
     - An accessible label (e.g. `aria-label="Toggle dark mode"`).
     - A focus ring / outline when tabbed to.
   - The icon alone must not be the only accessible element; screen readers should announce the purpose.

---

## Implementation details

Follow these steps in the existing React codebase (update file paths and component names based on the repo structure).

### 1. Create a theme context / hook

- Introduce a `ThemeProvider` and `useTheme` hook in a suitable shared location, e.g.:

  - `frontend/src/context/ThemeContext.tsx`
  - or `frontend/src/hooks/useTheme.ts`

- The provider should:
  - Hold `theme` in state (`"light"` | `"dark"`).
  - On mount, read from `localStorage` and/or system preference.
  - Sync the theme to:
    - `localStorage`
    - a root attribute or class (`document.documentElement` or root app container)

Example shape (pseudocode; adapt to the actual project):

```ts
type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    // 1. Check localStorage
    const stored = window.localStorage.getItem("archcoach-theme") as Theme | null;

    if (stored === "light" || stored === "dark") {
      setThemeState(stored);
      return;
    }

    // 2. Fallback to system preference
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    setThemeState(prefersDark ? "dark" : "light");
  }, []);

  useEffect(() => {
    // Persist to localStorage
    window.localStorage.setItem("archcoach-theme", theme);

    // Apply class or data attribute to root
    const root = document.documentElement; // or app root element
    root.setAttribute("data-theme", theme);
  }, [theme]);

  const setTheme = (value: Theme) => setThemeState(value);
  const toggleTheme = () => setThemeState((prev) => (prev === "light" ? "dark" : "light"));

  const value = { theme, toggleTheme, setTheme };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
```

### 2. Wrap the top-level app with ThemeProvider

- In the main app entry (e.g. `App.tsx`, `main.tsx`, or similar), wrap the root component tree with `ThemeProvider` so every component (including the bottom-left control panel) can access `useTheme`.

Example:

```tsx
import { ThemeProvider } from "./context/ThemeContext";

const Root = () => (
  <ThemeProvider>
    <App />
  </ThemeProvider>
);
```

### 3. Implement the bottom-left sun/moon toggle component

- Locate the bottom-left control panel container component (e.g. `CanvasControls`, `BottomPanel`, or similar). If none exists yet, use the component that renders the controls in the bottom-left area.
- Inside that control panel, add a `ThemeToggle` component that uses `useTheme`.

Example:

```tsx
import { useTheme } from "../context/ThemeContext";
import { SunIcon, MoonIcon } from "../components/icons"; // adapt to actual icons

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border-subtle bg-surface shadow-sm hover:bg-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent"
    >
      {isDark ? (
        <MoonIcon className="h-5 w-5" />
      ) : (
        <SunIcon className="h-5 w-5" />
      )}
    </button>
  );
};
```

- Place this `ThemeToggle` in the **bottom-left control panel** layout, respecting existing spacing / alignment rules.

### 4. Theme-aware styling

- Add theme-aware styles:
  - If using Tailwind with `data-theme`, configure `:root[data-theme="dark"]` and `:root[data-theme="light"]` based CSS variables for colors.
  - If using plain CSS or CSS modules, define top-level classes `.theme-light` / `.theme-dark` and apply them to the root, then define color tokens accordingly.

- Replace any hard-coded colors that break dark mode.
  - Example: background colors, text colors, panel borders.

Ensure the following look good in both themes:

- Canvas background
- Sidebars (left components sidebar, right inspector if present)
- Control panels (top/bottom/left/right)
- Node cards / edges (contrast against canvas)
- Modals and popovers

### 5. No breaking changes

- Do not change existing behavior of other controls.
- Make sure the dark mode toggle is additive, not destructive.
- Run TypeScript/build checks, fix any type errors you introduce.

---

## Final sanity checks

Before finishing, verify:

1. **Toggle behavior**
   - Starting in light mode, click toggle → dark mode, UI updates instantly.
   - Click again → back to light mode.

2. **Persistence**
   - Set to dark, reload page → stays dark.
   - Set to light, reload page → stays light.

3. **System preference fallback**
   - When no value in `localStorage`, initial theme follows `prefers-color-scheme`.

4. **Location**
   - The sun/moon button is in the **bottom-left control panel**, aligned with other controls.

5. **Accessibility**
   - You can tab to the toggle.
   - It has a visible focus ring.
   - Screen reader reads a clear label like “Switch to dark mode” / “Switch to light mode”.

After all this, the BuildFlow / ArchCoach app should have a **clean dark mode experience** controlled by a **sun/moon toggle button in the bottom-left control panel**.
