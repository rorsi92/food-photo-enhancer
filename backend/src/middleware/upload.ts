import multer from 'multer';
import path from 'path';
import { Request } from 'express';

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedFormats = (process.env.ALLOWED_FORMATS || 'jpg,jpeg,png,webp').split(',');
  const ext = path.extname(file.originalname).toLowerCase().substring(1);
  
  if (allowedFormats.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed formats: ${allowedFormats.join(', ')}`));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
  }
});