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
      <div className={`w-full h-48 bg-[#171717] flex items-center justify-center ${className}`}>
        {placeholder ? (
          <img
            src={placeholder}
            alt={`${project.name || 'Project'} preview`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-white/50">
            <FaFolder className="text-4xl mb-2" />
            <span className="text-sm">No preview</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative w-full h-48 bg-[#171717] overflow-hidden flex items-center justify-center ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-[#171717] animate-pulse flex items-center justify-center">
          <FaImage className="text-white/30 text-2xl" />
        </div>
      )}
      <img
        src={thumbnail}
        alt={`${project.name || 'Project'} preview`}
        className={`max-w-full max-h-full object-center transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          objectFit: 'contain',
          objectPosition: 'center',
        }}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setImageError(true);
          setIsLoading(false);
        }}
      />
    </div>
  );
}

