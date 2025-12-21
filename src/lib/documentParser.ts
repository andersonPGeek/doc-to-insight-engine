import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Set the worker source for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export interface ParsedDocument {
  text: string;
  wordCount: number;
  pageCount: number;
  fileName: string;
  fileType: string;
  fileSize: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)}mb`;
};

export const parsePDF = async (file: File): Promise<ParsedDocument> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  const pageCount = Math.min(pdf.numPages, 100); // Limit to 100 pages
  let fullText = '';
  
  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n\n';
    
    // Check word count limit
    const currentWordCount = fullText.split(/\s+/).filter(Boolean).length;
    if (currentWordCount >= 50000) {
      fullText = fullText.split(/\s+/).slice(0, 50000).join(' ');
      break;
    }
  }

  const wordCount = fullText.split(/\s+/).filter(Boolean).length;

  return {
    text: fullText.trim(),
    wordCount,
    pageCount: pdf.numPages,
    fileName: file.name,
    fileType: 'pdf',
    fileSize: formatFileSize(file.size),
  };
};

export const parseDOCX = async (file: File): Promise<ParsedDocument> => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  
  let text = result.value;
  const words = text.split(/\s+/).filter(Boolean);
  
  // Limit to 50000 words
  if (words.length > 50000) {
    text = words.slice(0, 50000).join(' ');
  }
  
  const wordCount = Math.min(words.length, 50000);
  
  // Estimate page count (roughly 500 words per page)
  const pageCount = Math.ceil(wordCount / 500);

  return {
    text: text.trim(),
    wordCount,
    pageCount,
    fileName: file.name,
    fileType: 'docx',
    fileSize: formatFileSize(file.size),
  };
};

export const parseDocument = async (file: File): Promise<ParsedDocument> => {
  const fileType = file.type;
  
  if (fileType === 'application/pdf') {
    return parsePDF(file);
  } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return parseDOCX(file);
  }
  
  throw new Error('Tipo de arquivo não suportado. Use PDF ou DOCX.');
};
