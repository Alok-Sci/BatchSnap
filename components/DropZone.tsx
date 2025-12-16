import React, { useCallback, useState, useRef } from 'react';
import { Upload, FileImage, AlertCircle } from 'lucide-react';

interface DropZoneProps {
  onFilesAdded: (files: File[]) => void;
  disabled?: boolean;
}

const DropZone: React.FC<DropZoneProps> = ({ onFilesAdded, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isValidFile = (file: File) => {
    const validTypes = ['image/jpeg', 'image/jpg'];
    const validExtensions = ['.jpg', '.jpeg'];
    
    return validTypes.includes(file.type) || 
           validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (disabled) return;

    const droppedFiles = Array.from(e.dataTransfer.files).filter(isValidFile);
    
    if (droppedFiles.length > 0) {
      onFilesAdded(droppedFiles);
    }
  }, [disabled, onFilesAdded]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files).filter(isValidFile);
      onFilesAdded(selectedFiles);
    }
    // Reset input so same files can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onFilesAdded]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !disabled && fileInputRef.current?.click()}
      className={`
        relative group border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ease-in-out
        ${disabled ? 'opacity-50 cursor-not-allowed border-slate-700 bg-slate-900' : 
          isDragging 
            ? 'border-indigo-500 bg-indigo-500/10 scale-[1.02] shadow-xl shadow-indigo-500/20' 
            : 'border-slate-700 hover:border-indigo-400 hover:bg-slate-800/50 bg-slate-900'
        }
      `}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInput}
        className="hidden"
        multiple
        accept=".jpg, .jpeg, image/jpeg"
        disabled={disabled}
      />
      
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className={`p-4 rounded-full transition-colors ${isDragging ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white'}`}>
          <Upload size={32} />
        </div>
        <div className="space-y-1">
          <p className="text-lg font-medium text-slate-200">
            {isDragging ? 'Drop JPEG files here' : 'Click or Drag JPEGs here'}
          </p>
          <p className="text-sm text-slate-500">
            Supports bulk upload (100+ files)
          </p>
        </div>
      </div>
      
      {/* Decorative corners */}
      <div className={`absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 rounded-tl-lg transition-colors duration-300 ${isDragging ? 'border-indigo-500' : 'border-slate-700 group-hover:border-indigo-400'}`} />
      <div className={`absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 rounded-tr-lg transition-colors duration-300 ${isDragging ? 'border-indigo-500' : 'border-slate-700 group-hover:border-indigo-400'}`} />
      <div className={`absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 rounded-bl-lg transition-colors duration-300 ${isDragging ? 'border-indigo-500' : 'border-slate-700 group-hover:border-indigo-400'}`} />
      <div className={`absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 rounded-br-lg transition-colors duration-300 ${isDragging ? 'border-indigo-500' : 'border-slate-700 group-hover:border-indigo-400'}`} />
    </div>
  );
};

export default DropZone;
