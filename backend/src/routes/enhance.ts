import { Router } from 'express';
import { enhanceWithAI, batchEnhanceWithAI } from '../controllers/enhanceController';
import { getUserPhotos, deletePhoto } from '../controllers/photoController';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

// Single photo enhancement
router.post('/single', authenticate, upload.single('photo'), enhanceWithAI);

// Batch photo enhancement (up to 50 files)
router.post('/batch', authenticate, upload.array('photos', 50), batchEnhanceWithAI);

// Get user's photos
router.get('/photos', authenticate, getUserPhotos);

// Delete a photo
router.delete('/photos/:id', authenticate, deletePhoto);

export default router;