import { Request } from 'express';

export interface JWTPayload {
  userId: string;
  email: string;
}

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export interface SubscriptionLimits {
  monthlyPhotos: number;
  maxFileSize: number;
  maxBatchSize: number;
  enhancementLevels: string[];
  features: string[];
}

export const SUBSCRIPTION_LIMITS: Record<string, SubscriptionLimits> = {
  FREE: {
    monthlyPhotos: 10,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxBatchSize: 1,
    enhancementLevels: ['LOW', 'MEDIUM'],
    features: ['basic_enhancement']
  },
  BASIC: {
    monthlyPhotos: 100,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxBatchSize: 10,
    enhancementLevels: ['LOW', 'MEDIUM', 'HIGH'],
    features: ['basic_enhancement', 'batch_processing']
  },
  PRO: {
    monthlyPhotos: 1000,
    maxFileSize: 20 * 1024 * 1024, // 20MB
    maxBatchSize: 50,
    enhancementLevels: ['LOW', 'MEDIUM', 'HIGH', 'AUTO'],
    features: ['basic_enhancement', 'batch_processing', 'ai_enhancement', 'priority_processing']
  },
  ENTERPRISE: {
    monthlyPhotos: -1, // Unlimited
    maxFileSize: 50 * 1024 * 1024, // 50MB
    maxBatchSize: 100,
    enhancementLevels: ['LOW', 'MEDIUM', 'HIGH', 'AUTO'],
    features: ['basic_enhancement', 'batch_processing', 'ai_enhancement', 'priority_processing', 'api_access', 'custom_models']
  }
};