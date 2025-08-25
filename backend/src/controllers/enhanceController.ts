import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest, SUBSCRIPTION_LIMITS } from '../types/index';
import { OpenAIService } from '../services/openaiService';
import path from 'path';
import fs from 'fs/promises';

const openAIService = new OpenAIService();

export const enhanceWithAI = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const customPrompt = req.body.prompt;

    // Check subscription limits
    const subscription = await prisma.subscription.findUnique({
      where: { userId: req.user.userId },
    });

    if (!subscription) {
      res.status(403).json({ error: 'No active subscription' });
      return;
    }

    const limits = SUBSCRIPTION_LIMITS[subscription.plan];
    
    if (limits.monthlyPhotos !== -1 && subscription.photosProcessed >= limits.monthlyPhotos) {
      res.status(403).json({ error: 'Monthly photo limit reached' });
      return;
    }

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
        status: 'PROCESSING',
      },
    });

    try {
      const startTime = Date.now();
      
      // Process with OpenAI
      const outputPath = path.join(
        process.cwd(),
        'processed',
        `enhanced_${photo.id}${path.extname(req.file.originalname)}`
      );

      const result = await openAIService.processWithPrompt(
        req.file.path,
        outputPath,
        customPrompt
      );

      if (!result.success) {
        throw new Error(result.error || 'Enhancement failed');
      }

      const processingTime = Date.now() - startTime;

      // Update photo record
      const updatedPhoto = await prisma.photo.update({
        where: { id: photo.id },
        data: {
          enhancedUrl: result.enhancedPath,
          width: result.metadata.width,
          height: result.metadata.height,
          processingTime,
          status: 'COMPLETED',
          metadata: result.aiAnalysis,
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
          action: 'AI_ENHANCE_PHOTO',
          photosProcessed: 1,
          metadata: {
            photoId: photo.id,
            aiAnalysis: result.aiAnalysis,
          },
        },
      });

      // Convert to base64 for immediate display
      const enhancedBuffer = await fs.readFile(result.enhancedPath);
      const enhancedBase64 = `data:${req.file.mimetype};base64,${enhancedBuffer.toString('base64')}`;

      res.json({
        id: updatedPhoto.id,
        enhancedUrl: enhancedBase64,
        processingTime: updatedPhoto.processingTime,
        aiAnalysis: result.aiAnalysis,
        metadata: {
          width: updatedPhoto.width,
          height: updatedPhoto.height,
          fileSize: updatedPhoto.fileSize,
        },
      });
    } catch (error) {
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
    console.error('AI enhancement error:', error);
    res.status(500).json({ error: 'Failed to enhance image' });
  }
};

export const batchEnhanceWithAI = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!req.files || !Array.isArray(req.files)) {
      res.status(400).json({ error: 'No files uploaded' });
      return;
    }

    const customPrompt = req.body.prompt;

    // Check subscription
    const subscription = await prisma.subscription.findUnique({
      where: { userId: req.user.userId },
    });

    if (!subscription) {
      res.status(403).json({ error: 'No active subscription' });
      return;
    }

    const limits = SUBSCRIPTION_LIMITS[subscription.plan];

    if (req.files.length > limits.maxBatchSize) {
      res.status(400).json({ error: `Batch size exceeds limit of ${limits.maxBatchSize}` });
      return;
    }

    if (limits.monthlyPhotos !== -1 && 
        subscription.photosProcessed + req.files.length > limits.monthlyPhotos) {
      res.status(403).json({ error: 'Monthly photo limit would be exceeded' });
      return;
    }

    const results = [];
    const errors = [];

    for (const file of req.files) {
      try {
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
            status: 'PROCESSING',
          },
        });

        const startTime = Date.now();
        
        // Process with OpenAI
        const outputPath = path.join(
          process.cwd(),
          'processed',
          `enhanced_${photo.id}${path.extname(file.originalname)}`
        );

        const result = await openAIService.processWithPrompt(
          file.path,
          outputPath,
          customPrompt
        );

        if (!result.success) {
          throw new Error(result.error || 'Enhancement failed');
        }

        const processingTime = Date.now() - startTime;

        // Update photo record
        const updatedPhoto = await prisma.photo.update({
          where: { id: photo.id },
          data: {
            enhancedUrl: result.enhancedPath,
            width: result.metadata.width,
            height: result.metadata.height,
            processingTime,
            status: 'COMPLETED',
            metadata: result.aiAnalysis,
          },
        });

        // Convert to base64
        const enhancedBuffer = await fs.readFile(result.enhancedPath);
        const enhancedBase64 = `data:${file.mimetype};base64,${enhancedBuffer.toString('base64')}`;

        results.push({
          id: updatedPhoto.id,
          fileName: file.originalname,
          enhancedUrl: enhancedBase64,
          processingTime: updatedPhoto.processingTime,
          aiAnalysis: result.aiAnalysis,
        });
      } catch (error) {
        errors.push({
          file: file.originalname,
          error: error instanceof Error ? error.message : 'Processing failed',
        });
      }
    }

    if (results.length > 0) {
      await prisma.subscription.update({
        where: { userId: req.user.userId },
        data: {
          photosProcessed: { increment: results.length },
        },
      });

      await prisma.usageHistory.create({
        data: {
          userId: req.user.userId,
          action: 'BATCH_AI_ENHANCE',
          photosProcessed: results.length,
          metadata: {
            photoIds: results.map(r => r.id),
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
    console.error('Batch AI enhancement error:', error);
    res.status(500).json({ error: 'Failed to enhance images' });
  }
};