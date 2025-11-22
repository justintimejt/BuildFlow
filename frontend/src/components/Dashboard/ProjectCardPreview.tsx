import { useState } from 'react';
import { FaFolder, FaImage } from 'react-icons/fa';
import { createPlaceholderThumbnail } from '../../utils/thumbnail';
import { Project } from '../../types';

interface ProjectCardPreviewProps {
  thumbnail?: string;
  project: Project;
  className?: string;
}

export function ProjectCardPreview({ thumbnail, project, className = '' }: ProjectCardPreviewProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // If no thumbnail or error, show placeholder
  if (!thumbnail || imageError) {
    const placeholder = createPlaceholderThumbnail(project);
    return (
      <div className={`w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center ${className}`}>
        {placeholder ? (
          <img
            src={placeholder}
            alt={`${project.name || 'Project'} preview`}
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-400">
            <FaFolder className="text-4xl mb-2" />
            <span className="text-sm">No preview</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative w-full h-48 bg-gray-100 overflow-hidden flex items-center justify-center ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <FaImage className="text-gray-400 text-2xl" />
        </div>
      )}
      <img
        src={thumbnail}
        alt={`${project.name || 'Project'} preview`}
        className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setImageError(true);
          setIsLoading(false);
        }}
      />
    </div>
  );
}

