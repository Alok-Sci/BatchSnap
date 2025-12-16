import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { FileData, ConversionStatus, ProcessingStats } from './types';
import DropZone from './components/DropZone';
import FileList from './components/FileList';
import { convertImageToPDF, createZipFromFiles } from './utils/pdfConverter';
import saveAs from 'file-saver';
import { Trash2, Download, Zap, RefreshCw, FileText, FileImage } from 'lucide-react';

const App: React.FC = () => {
  const [files, setFiles] = useState<FileData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState<ProcessingStats>({
    total: 0,
    processed: 0,
    success: 0,
    failed: 0,
    startTime: null,
    endTime: null,
  });

  // Cleanup object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      files.forEach(f => URL.revokeObjectURL(f.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on unmount of the entire app, essentially

  const handleFilesAdded = useCallback((newFiles: File[]) => {
    const newFileData: FileData[] = newFiles.map(f => ({
      id: crypto.randomUUID(),
      file: f,
      previewUrl: URL.createObjectURL(f),
      status: ConversionStatus.IDLE,
    }));
    
    setFiles(prev => [...prev, ...newFileData]);
  }, []);

  const handleRemoveFile = useCallback((id: string) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.previewUrl);
      }
      return prev.filter(f => f.id !== id);
    });
  }, []);

  const handleClearAll = useCallback(() => {
    files.forEach(f => URL.revokeObjectURL(f.previewUrl));
    setFiles([]);
    setStats({
      total: 0,
      processed: 0,
      success: 0,
      failed: 0,
      startTime: null,
      endTime: null,
    });
  }, [files]);

  const processQueue = useCallback(async () => {
    setIsProcessing(true);
    setStats(prev => ({
      ...prev,
      total: files.length,
      processed: 0,
      startTime: Date.now(),
    }));

    // Mark all IDLE as QUEUED
    setFiles(prev => prev.map(f => 
      f.status === ConversionStatus.IDLE ? { ...f, status: ConversionStatus.QUEUED } : f
    ));

    // Process in batches to prevent UI blocking
    const BATCH_SIZE = 5; // Parallel processing limit
    const queue = files.filter(f => f.status === ConversionStatus.IDLE || f.status === ConversionStatus.ERROR);
    
    // We need a way to update the specific file in the array safely
    const updateFileStatus = (id: string, updates: Partial<FileData>) => {
      setFiles(currentFiles => 
        currentFiles.map(f => f.id === id ? { ...f, ...updates } : f)
      );
    };

    // Helper to process a single file
    const processFile = async (file: FileData) => {
      updateFileStatus(file.id, { status: ConversionStatus.PROCESSING });
      try {
        const pdfBlob = await convertImageToPDF(file);
        updateFileStatus(file.id, { status: ConversionStatus.COMPLETED, pdfBlob });
        setStats(prev => ({ ...prev, processed: prev.processed + 1, success: prev.success + 1 }));
      } catch (err) {
        updateFileStatus(file.id, { status: ConversionStatus.ERROR, error: "Failed to convert" });
        setStats(prev => ({ ...prev, processed: prev.processed + 1, failed: prev.failed + 1 }));
      }
    };

    // Execution loop
    for (let i = 0; i < queue.length; i += BATCH_SIZE) {
      const batch = queue.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(file => processFile(file)));
      // Small delay to let UI breathe
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    setStats(prev => ({ ...prev, endTime: Date.now() }));
    setIsProcessing(false);
  }, [files]);

  const handleDownloadZip = async () => {
    const completedFiles = files.filter(f => f.status === ConversionStatus.COMPLETED && f.pdfBlob);
    if (completedFiles.length === 0) return;

    try {
      const zipBlob = await createZipFromFiles(completedFiles);
      saveAs(zipBlob, "converted_pdfs.zip");
    } catch (error) {
      console.error("Error creating zip", error);
      alert("Failed to create ZIP file.");
    }
  };

  // Derived state
  const hasFiles = files.length > 0;
  const completedCount = files.filter(f => f.status === ConversionStatus.COMPLETED).length;
  const progressPercent = stats.total > 0 ? (stats.processed / stats.total) * 100 : 0;
  const isAllCompleted = hasFiles && completedCount === files.length;

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-200 overflow-hidden">
      {/* Sidebar / Left Panel - Controls & Stats */}
      <div className="w-80 md:w-96 flex flex-col border-r border-slate-800 bg-slate-900/50 backdrop-blur-sm z-10 shadow-2xl">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center space-x-3 mb-1">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <FileText className="text-white" size={24} />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
              BatchSnap PDF
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Convert 100+ JPEGs to PDF instantly. Local & Lossless.
          </p>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <div className="space-y-6">
            <DropZone onFilesAdded={handleFilesAdded} disabled={isProcessing} />

            {/* Stats Card */}
            {hasFiles && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Total Files</span>
                  <span className="font-mono font-medium">{files.length}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Total Size</span>
                  <span className="font-mono font-medium">
                    {(files.reduce((acc, f) => acc + f.file.size, 0) / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>
                
                {stats.processed > 0 && (
                   <div className="pt-2 border-t border-slate-800 space-y-2">
                     <div className="flex justify-between items-end mb-1">
                       <span className="text-xs font-semibold text-indigo-400 uppercase">Progress</span>
                       <span className="text-xs text-slate-400">{Math.round(progressPercent)}%</span>
                     </div>
                     <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-indigo-500 transition-all duration-300 ease-out"
                         style={{ width: `${progressPercent}%` }}
                       />
                     </div>
                     <div className="flex justify-between text-xs text-slate-500 pt-1">
                       <span className="text-green-400">{stats.success} Success</span>
                       <span className="text-red-400">{stats.failed} Failed</span>
                     </div>
                   </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-900 space-y-3">
          {hasFiles && !isProcessing && !isAllCompleted && (
            <button
              onClick={processQueue}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/20 flex items-center justify-center space-x-2 transition-all active:scale-[0.98]"
            >
              <Zap size={20} />
              <span>Convert All Images</span>
            </button>
          )}

          {isProcessing && (
             <button
              disabled
              className="w-full py-3 px-4 bg-slate-800 text-slate-400 rounded-xl font-medium flex items-center justify-center space-x-2 cursor-wait"
            >
              <RefreshCw size={20} className="animate-spin" />
              <span>Processing...</span>
            </button>
          )}

          {completedCount > 0 && !isProcessing && (
            <button
              onClick={handleDownloadZip}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 transition-all active:scale-[0.98]"
            >
              <Download size={20} />
              <span>Download ZIP ({completedCount})</span>
            </button>
          )}

          {hasFiles && !isProcessing && (
            <button
              onClick={handleClearAll}
              className="w-full py-2 px-4 bg-transparent border border-slate-700 hover:border-red-500/50 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-xl text-sm font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <Trash2 size={16} />
              <span>Clear Queue</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content / Right Panel - File List */}
      <div className="flex-1 flex flex-col bg-slate-950/50 h-full min-w-0">
        <div className="flex-1 p-6 md:p-8 overflow-hidden flex flex-col">
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl h-full shadow-inner flex flex-col overflow-hidden backdrop-blur-sm">
             {/* Header inside list */}
             <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
                <h2 className="text-lg font-medium text-slate-200">Files</h2>
                {!hasFiles && <span className="text-sm text-slate-500">Waiting for files...</span>}
             </div>
             
             <div className="flex-1 overflow-hidden p-2">
                {hasFiles ? (
                  <FileList 
                    files={files} 
                    onRemove={handleRemoveFile} 
                    isProcessing={isProcessing} 
                  />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4">
                    <div className="w-24 h-24 rounded-full bg-slate-900 flex items-center justify-center">
                      <FileImage size={48} className="opacity-20" />
                    </div>
                    <p>No images added yet.</p>
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;