import React, { memo } from 'react';
import { FileData, ConversionStatus } from '../types';
import { CheckCircle2, Loader2, XCircle, FileImage, Clock } from 'lucide-react';

interface FileListProps {
  files: FileData[];
  onRemove: (id: string) => void;
  isProcessing: boolean;
}

const FileItem = memo(({ file, onRemove, isProcessing }: { file: FileData; onRemove: (id: string) => void; isProcessing: boolean }) => {
  const getStatusIcon = () => {
    switch (file.status) {
      case ConversionStatus.COMPLETED:
        return <CheckCircle2 className="text-green-500" size={20} />;
      case ConversionStatus.PROCESSING:
        return <Loader2 className="text-indigo-400 animate-spin" size={20} />;
      case ConversionStatus.ERROR:
        return <XCircle className="text-red-500" size={20} />;
      case ConversionStatus.QUEUED:
        return <Clock className="text-slate-500" size={20} />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-slate-600" />;
    }
  };

  return (
    <div className="flex items-center p-3 bg-slate-900 border border-slate-800 rounded-lg group hover:border-slate-700 transition-colors">
      {/* Thumbnail Preview */}
      <div className="w-12 h-12 bg-slate-950 rounded overflow-hidden flex-shrink-0 relative border border-slate-800">
        <img src={file.previewUrl} alt="preview" className="w-full h-full object-cover opacity-80" />
      </div>

      <div className="ml-4 flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-200 truncate pr-4" title={file.file.name}>
          {file.file.name}
        </p>
        <p className="text-xs text-slate-500 flex items-center mt-0.5">
          {(file.file.size / 1024).toFixed(1)} KB
          {file.status === ConversionStatus.ERROR && <span className="text-red-400 ml-2">- {file.error}</span>}
        </p>
      </div>

      <div className="flex items-center space-x-4 pl-2">
        {getStatusIcon()}
        {!isProcessing && file.status === ConversionStatus.IDLE && (
          <button
            onClick={() => onRemove(file.id)}
            className="text-slate-500 hover:text-red-400 transition-colors p-1"
            title="Remove file"
          >
            <XCircle size={18} />
          </button>
        )}
      </div>
    </div>
  );
});

const FileList: React.FC<FileListProps> = ({ files, onRemove, isProcessing }) => {
  if (files.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2 px-1">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
          Queue ({files.length})
        </h3>
        <span className="text-xs text-slate-600 bg-slate-900 px-2 py-1 rounded">
          {files.filter(f => f.status === ConversionStatus.COMPLETED).length} Done
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2 space-y-2 min-h-0">
        {files.map((file) => (
          <FileItem 
            key={file.id} 
            file={file} 
            onRemove={onRemove} 
            isProcessing={isProcessing} 
          />
        ))}
      </div>
    </div>
  );
};

export default FileList;
