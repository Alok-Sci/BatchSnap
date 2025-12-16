import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { FileData } from '../types';

export const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = url;
  });
};

export const convertImageToPDF = async (fileData: FileData): Promise<Blob> => {
  try {
    const { width, height } = await getImageDimensions(fileData.previewUrl);
    
    // Create PDF with exact image dimensions (1px = 1 unit)
    const orientation = width > height ? 'l' : 'p';
    const pdf = new jsPDF({
      orientation,
      unit: 'px',
      format: [width, height],
      hotfixes: ['px_scaling'],
    });

    // CRITICAL FOR LOSSLESS: Read the file as a raw buffer.
    // Passing the raw Uint8Array with 'JPEG' format prevents jsPDF from re-compressing the image.
    const arrayBuffer = await fileData.file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // 'FAST' or 'NONE' tells jsPDF to avoid re-compression if possible when format matches.
    // For raw JPEG data, this simply embeds the stream.
    pdf.addImage(uint8Array, 'JPEG', 0, 0, width, height, undefined, 'FAST');
    
    return pdf.output('blob');
  } catch (error) {
    console.error(`Error converting ${fileData.file.name}:`, error);
    throw error;
  }
};

export const createZipFromFiles = async (files: FileData[]): Promise<Blob> => {
  const zip = new JSZip();
  const folder = zip.folder("converted_pdfs");

  files.forEach((file) => {
    if (file.pdfBlob) {
      // Replace extension with .pdf
      const fileName = file.file.name.replace(/\.[^/.]+$/, "") + ".pdf";
      folder?.file(fileName, file.pdfBlob);
    }
  });

  return await zip.generateAsync({ type: "blob" });
};