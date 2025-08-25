export interface ImageFile {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  enhancedUrl?: string;
  error?: string;
}

export type EnhancementLevel = 'low' | 'medium' | 'high' | 'auto';

export interface EnhancementOptions {
  level: EnhancementLevel;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  sharpness?: number;
  vibrance?: number;
  highlights?: number;
  shadows?: number;
  temperature?: number;
}

export interface ProcessingResult {
  id: string;
  fileName: string;
  originalUrl: string;
  enhancedUrl: string;
  processingTime: number;
  aiAnalysis?: any;
}