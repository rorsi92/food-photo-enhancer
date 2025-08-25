import type { EnhancementOptions } from '../types';

export const createImagePreview = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const validateImageFile = (file: File): boolean => {
  const allowedFormats = (import.meta.env.VITE_ALLOWED_FORMATS || 'jpg,jpeg,png,webp').split(',');
  const maxFileSize = parseInt(import.meta.env.VITE_MAX_FILE_SIZE || '10485760');
  
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  const isValidFormat = fileExtension && allowedFormats.includes(fileExtension);
  const isValidSize = file.size <= maxFileSize;
  
  return isValidFormat && isValidSize;
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const applyCanvasEnhancement = async (
  imageUrl: string,
  options: EnhancementOptions
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      canvas.width = img.width;
      canvas.height = img.height;
      
      ctx.filter = buildFilterString(options);
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(URL.createObjectURL(blob));
        } else {
          reject(new Error('Failed to create blob'));
        }
      }, 'image/jpeg', 0.95);
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
};

const buildFilterString = (options: EnhancementOptions): string => {
  const filters: string[] = [];
  
  const enhancementMultipliers = {
    low: 1.1,
    medium: 1.3,
    high: 1.5,
    auto: 1.3
  };
  
  const multiplier = enhancementMultipliers[options.level];
  
  filters.push(`brightness(${(options.brightness || 100) * multiplier / 100})`);
  filters.push(`contrast(${(options.contrast || 100) * multiplier / 100})`);
  filters.push(`saturate(${(options.saturation || 100) * multiplier / 100})`);
  
  return filters.join(' ');
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};