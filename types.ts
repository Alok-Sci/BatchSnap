export enum ConversionStatus {
  IDLE = 'IDLE',
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

export interface FileData {
  id: string;
  file: File;
  previewUrl: string;
  status: ConversionStatus;
  pdfBlob?: Blob;
  error?: string;
  width?: number;
  height?: number;
}

export interface ProcessingStats {
  total: number;
  processed: number;
  success: number;
  failed: number;
  startTime: number | null;
  endTime: number | null;
}
