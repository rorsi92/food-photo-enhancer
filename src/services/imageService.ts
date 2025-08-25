import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

type EnhancementLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'AUTO';

interface EnhancementOptions {
  level: EnhancementLevel;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  sharpness?: number;
  vibrance?: number;
}

const ENHANCEMENT_PRESETS = {
  LOW: {
    brightness: 1.05,
    contrast: 1.1,
    saturation: 1.1,
    sharpen: { sigma: 0.5 }
  },
  MEDIUM: {
    brightness: 1.1,
    contrast: 1.2,
    saturation: 1.3,
    sharpen: { sigma: 1 }
  },
  HIGH: {
    brightness: 1.15,
    contrast: 1.3,
    saturation: 1.5,
    sharpen: { sigma: 1.5 }
  },
  AUTO: {
    brightness: 1.1,
    contrast: 1.2,
    saturation: 1.4,
    sharpen: { sigma: 1 },
    normalize: true
  }
};

export class ImageService {
  private uploadDir: string;
  private processedDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.processedDir = path.join(process.cwd(), 'processed');
    this.ensureDirectories();
  }

  private async ensureDirectories(): Promise<void> {
    await fs.mkdir(this.uploadDir, { recursive: true });
    await fs.mkdir(this.processedDir, { recursive: true });
  }

  async enhanceImage(
    inputPath: string,
    outputFilename: string,
    options: EnhancementOptions
  ): Promise<{ path: string; metadata: sharp.Metadata }> {
    const preset = ENHANCEMENT_PRESETS[options.level];
    const outputPath = path.join(this.processedDir, outputFilename);

    const image = sharp(inputPath);
    const metadata = await image.metadata();

    let pipeline = image
      .rotate() // Auto-rotate based on EXIF
      .modulate({
        brightness: options.brightness || preset.brightness,
        saturation: options.saturation || preset.saturation,
      });

    if (preset.normalize || options.level === 'AUTO') {
      pipeline = pipeline.normalize();
    }

    pipeline = pipeline
      .linear(options.contrast || preset.contrast, -(128 * (options.contrast || preset.contrast - 1)))
      .sharpen(preset.sharpen)
      .jpeg({ quality: 95, mozjpeg: true });

    await pipeline.toFile(outputPath);

    return { path: outputPath, metadata };
  }

  async createThumbnail(inputPath: string, outputFilename: string): Promise<string> {
    const outputPath = path.join(this.processedDir, `thumb_${outputFilename}`);
    
    await sharp(inputPath)
      .resize(300, 300, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toFile(outputPath);

    return outputPath;
  }

  async getImageMetadata(imagePath: string): Promise<sharp.Metadata> {
    return await sharp(imagePath).metadata();
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error(`Error deleting file ${filePath}:`, error);
    }
  }

  async cleanupOldFiles(daysOld: number = 7): Promise<void> {
    const dirs = [this.uploadDir, this.processedDir];
    const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;

    for (const dir of dirs) {
      const files = await fs.readdir(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtimeMs < cutoffTime) {
          await this.deleteFile(filePath);
        }
      }
    }
  }
}