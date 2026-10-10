'use client';

import React from 'react';
import { FaFileVideo, FaLink } from 'react-icons/fa';

interface UploadMethodSelectorProps {
  uploadMethod: 'file' | 'link';
  setUploadMethod: (method: 'file' | 'link') => void;
  disabled: boolean;
}

export const UploadMethodSelector: React.FC<UploadMethodSelectorProps> = ({
  uploadMethod,
  setUploadMethod,
  disabled,
}) => {
  return (
    <div className="flex justify-center mb-5">
      <div className="inline-flex p-1 bg-cc-ground rounded-full border border-border" role="group">
        <button
          type="button"
          onClick={() => setUploadMethod('file')}
          className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
            uploadMethod === 'file'
              ? 'bg-primary text-white shadow-xs'
              : 'text-muted-foreground hover:text-white'
          } flex items-center`}
          disabled={disabled}
        >
          <FaFileVideo className="mr-1.5" size={12} /> Upload File
        </button>
        <button
          type="button"
          onClick={() => setUploadMethod('link')}
          className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
            uploadMethod === 'link'
              ? 'bg-primary text-white shadow-xs'
              : 'text-muted-foreground hover:text-white'
          } flex items-center`}
          disabled={disabled}
        >
          <FaLink className="mr-1.5" size={12} /> Use Link
        </button>
      </div>
    </div>
  );
};

export default UploadMethodSelector;
