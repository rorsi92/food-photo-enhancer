import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { AuthRequest, SUBSCRIPTION_LIMITS } from '../types/index';
import { ImageService } from '../services/imageService';
import path from 'path';

const imageService = new ImageService();

const enhanceSchema = z.object({
  level: z.enum(['LOW', 'MEDIUM', 'HIGH', 'AUTO']).default('MEDIUM'),
  brightness: z.number().min(0.5).max(2).optional(),
  contrast: z.number().min(0.5).max(2).optional(),
  saturation: z.number().min(0).max(3).optional(),
});

export const uploadAndEnhancePhoto = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const enhancementOptions = enhanceSchema.parse(req.body);

    // Check subscription limits
    const subscription = await prisma.subscription.findUnique({
      where: { userId: req.user.userId },
    });

    if (!subscription) {
      res.status(403).json({ error: 'No active subscription' });
      return;
    }

    const limits = SUBSCRIPTION_LIMITS[subscription.plan];
    
    // Check monthly limit
    if (limits.monthlyPhotos !== -1 && subscription.photosProcessed >= limits.monthlyPhotos) {
      res.status(403).json({ error: 'Monthly photo limit reached' });
      return;
    }

    // Check file size
    if (req.file.size > limits.maxFileSize) {
      res.status(400).json({ error: 'File size exceeds limit' });
      return;
    }

    // Create photo record
    const photo = await prisma.photo.create({
      data: {
        userId: req.user.userId,
        originalUrl: req.file.path,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        enhancementLevel: enhancementOptions.level,
        enhancementSettings: enhancementOptions as any,
        status: 'PROCESSING',
      },
    });

    try {
      const startTime = Date.now();
      
      // Enhance image
      const outputFilename = `enhanced_${photo.id}${path.extname(req.file.originalname)}`;
      const { path: enhancedPath, metadata } = await imageService.enhanceImage(
        req.file.path,
        outputFilename,
        enhancementOptions
      );

      // Create thumbnail
      const thumbnailPath = await imageService.createThumbnail(
        enhancedPath,
        outputFilename
      );

      const processingTime = Date.now() - startTime;

      // Update photo record
      const updatedPhoto = await prisma.photo.update({
        where: { id: photo.id },
        data: {
          enhancedUrl: enhancedPath,
          thumbnailUrl: thumbnailPath,
          width: metadata.width,
          height: metadata.height,
          processingTime,
          status: 'COMPLETED',
        },
      });

      // Update subscription usage
      await prisma.subscription.update({
        where: { userId: req.user.userId },
        data: {
          photosProcessed: { increment: 1 },
        },
      });

      // Log usage
      await prisma.usageHistory.create({
        data: {
          userId: req.user.userId,
          action: 'ENHANCE_PHOTO',
          photosProcessed: 1,
          metadata: {
            photoId: photo.id,
            enhancementLevel: enhancementOptions.level,
          },
        },
      });

      res.json({
        id: updatedPhoto.id,
        originalUrl: `/uploads/${path.basename(updatedPhoto.originalUrl)}`,
        enhancedUrl: `/processed/${path.basename(updatedPhoto.enhancedUrl)}`,
        thumbnailUrl: `/processed/${path.basename(updatedPhoto.thumbnailUrl || '')}`,
        processingTime: updatedPhoto.processingTime,
        metadata: {
          width: updatedPhoto.width,
          height: updatedPhoto.height,
          fileSize: updatedPhoto.fileSize,
        },
      });
    } catch (error) {
      // Update photo status to failed
      await prisma.photo.update({
        where: { id: photo.id },
        data: {
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Processing failed',
        },
      });
      throw error;
    }
  } catch (error) {
    console.error('Photo enhancement error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    res.status(500).json({ error: 'Failed to process image' });
  }
};

export const batchUploadAndEnhance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!req.files || !Array.isArray(req.files)) {
      res.status(400).json({ error: 'No files uploaded' });
      return;
    }

    const enhancementOptions = enhanceSchema.parse(req.body);

    // Check subscription
    const subscription = await prisma.subscription.findUnique({
      where: { userId: req.user.userId },
    });

    if (!subscription) {
      res.status(403).json({ error: 'No active subscription' });
      return;
    }

    const limits = SUBSCRIPTION_LIMITS[subscription.plan];

    // Check batch size limit
    if (req.files.length > limits.maxBatchSize) {
      res.status(400).json({ error: `Batch size exceeds limit of ${limits.maxBatchSize}` });
      return;
    }

    // Check monthly limit
    if (limits.monthlyPhotos !== -1 && 
        subscription.photosProcessed + req.files.length > limits.monthlyPhotos) {
      res.status(403).json({ error: 'Monthly photo limit would be exceeded' });
      return;
    }

    const results = [];
    const errors = [];

    for (const file of req.files) {
      try {
        // Check file size
        if (file.size > limits.maxFileSize) {
          errors.push({ file: file.originalname, error: 'File size exceeds limit' });
          continue;
        }

        // Create photo record
        const photo = await prisma.photo.create({
          data: {
            userId: req.user.userId,
            originalUrl: file.path,
            fileName: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
            enhancementLevel: enhancementOptions.level,
            enhancementSettings: enhancementOptions as any,
            status: 'PROCESSING',
          },
        });

        const startTime = Date.now();
        
        // Enhance image
        const outputFilename = `enhanced_${photo.id}${path.extname(file.originalname)}`;
        const { path: enhancedPath, metadata } = await imageService.enhanceImage(
          file.path,
          outputFilename,
          enhancementOptions
        );

        // Create thumbnail
        const thumbnailPath = await imageService.createThumbnail(
          enhancedPath,
          outputFilename
        );

        const processingTime = Date.now() - startTime;

        // Update photo record
        const updatedPhoto = await prisma.photo.update({
          where: { id: photo.id },
          data: {
            enhancedUrl: enhancedPath,
            thumbnailUrl: thumbnailPath,
            width: metadata.width,
            height: metadata.height,
            processingTime,
            status: 'COMPLETED',
          },
        });

        results.push({
          id: updatedPhoto.id,
          fileName: file.originalname,
          originalUrl: `/uploads/${path.basename(updatedPhoto.originalUrl)}`,
          enhancedUrl: `/processed/${path.basename(updatedPhoto.enhancedUrl)}`,
          thumbnailUrl: `/processed/${path.basename(updatedPhoto.thumbnailUrl || '')}`,
          processingTime: updatedPhoto.processingTime,
        });
      } catch (error) {
        errors.push({
          file: file.originalname,
          error: error instanceof Error ? error.message : 'Processing failed',
        });
      }
    }

    // Update subscription usage
    if (results.length > 0) {
      await prisma.subscription.update({
        where: { userId: req.user.userId },
        data: {
          photosProcessed: { increment: results.length },
        },
      });

      // Log usage
      await prisma.usageHistory.create({
        data: {
          userId: req.user.userId,
          action: 'BATCH_ENHANCE',
          photosProcessed: results.length,
          metadata: {
            photoIds: results.map(r => r.id),
            enhancementLevel: enhancementOptions.level,
          },
        },
      });
    }

    res.json({
      success: results,
      errors,
      summary: {
        total: req.files.length,
        succeeded: results.length,
        failed: errors.length,
      },
    });
  } catch (error) {
    console.error('Batch enhancement error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    res.status(500).json({ error: 'Failed to process images' });
  }
};

export const getUserPhotos = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [photos, total] = await Promise.all([
      prisma.photo.findMany({
        where: { userId: req.user.userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          fileName: true,
          enhancedUrl: true,
          thumbnailUrl: true,
          fileSize: true,
          width: true,
          height: true,
          enhancementLevel: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.photo.count({ where: { userId: req.user.userId } }),
    ]);

    res.json({
      photos: photos.map(photo => ({
        ...photo,
        enhancedUrl: photo.enhancedUrl ? `/processed/${path.basename(photo.enhancedUrl)}` : null,
        thumbnailUrl: photo.thumbnailUrl ? `/processed/${path.basename(photo.thumbnailUrl)}` : null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get user photos error:', error);
    res.status(500).json({ error: 'Failed to fetch photos' });
  }
};

export const deletePhoto = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    const photo = await prisma.photo.findFirst({
      where: {
        id,
        userId: req.user.userId,
      },
    });

    if (!photo) {
      res.status(404).json({ error: 'Photo not found' });
      return;
    }

    // Delete physical files
    if (photo.originalUrl) await imageService.deleteFile(photo.originalUrl);
    if (photo.enhancedUrl) await imageService.deleteFile(photo.enhancedUrl);
    if (photo.thumbnailUrl) await imageService.deleteFile(photo.thumbnailUrl);

    // Delete database record
    await prisma.photo.delete({ where: { id } });

    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Delete photo error:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
};