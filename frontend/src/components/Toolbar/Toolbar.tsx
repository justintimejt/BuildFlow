import { useRef } from 'react';
import { useProjectContext } from '../../contexts/ProjectContext';
import { useStorage } from '../../hooks/useStorage';
import { useExport } from '../../hooks/useExport';
import { FaSave, FaFolderOpen, FaDownload, FaFileExport, FaTrash } from 'react-icons/fa';

export function Toolbar() {
  const { getProject, loadProject, clearProject } = useProjectContext();
  const { saveProject, exportToJSON, importFromJSON } = useStorage();
  const { exportAsPNG } = useExport();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    const project = getProject();
    const name = prompt('Enter project name (optional):') || undefined;
    try {
      saveProject(project, name);
      alert('Project saved successfully!');
    } catch (error) {
      alert('Failed to save project');
      console.error(error);
    }
  };

  const handleExportJSON = () => {
    const project = getProject();
    const json = exportToJSON(project);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `project-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const project = importFromJSON(json);
        if (project) {
          loadProject(project);
          alert('Project loaded successfully!');
        } else {
          alert('Invalid project file');
        }
      } catch (error) {
        alert('Failed to load project');
        console.error(error);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportPNG = async () => {
    try {
      await exportAsPNG('canvas-container', `diagram-${Date.now()}.png`);
    } catch (error) {
      alert('Failed to export image');
      console.error(error);
    }
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear the canvas? This cannot be undone.')) {
      clearProject();
    }
  };

  return (
    <div className="h-14 bg-white border-b border-gray-200 flex items-center gap-2 px-4 shadow-sm">
      <button
        onClick={handleSave}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        title="Save to localStorage"
      >
        <FaSave />
        Save
      </button>

      <button
        onClick={handleImportJSON}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        title="Import JSON file"
      >
        <FaFolderOpen />
        Load
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />

      <button
        onClick={handleExportJSON}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        title="Export as JSON"
      >
        <FaFileExport />
        Export JSON
      </button>

      <button
        onClick={handleExportPNG}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
        title="Export as PNG"
      >
        <FaDownload />
        Export PNG
      </button>

      <div className="flex-1" />

      <button
        onClick={handleClear}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
        title="Clear canvas"
      >
        <FaTrash />
        Clear
      </button>
    </div>
  );
}

