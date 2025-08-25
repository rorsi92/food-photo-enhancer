const express = require('express');
const multer = require('multer');
const path = require('path');
const openaiService = require('../services/openai');
const simpleEnhance = require('../services/simple-enhance');

const router = express.Router();

// File upload setup
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    const fs = require('fs').promises;
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, uniqueSuffix + '_' + sanitizedName);
  }
});

const upload = multer({
  storage,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 50
  },
  fileFilter: (req, file, cb) => {
    const allowedFormats = ['jpg', 'jpeg', 'png', 'webp'];
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    
    const ext = path.extname(file.originalname).toLowerCase().substring(1);
    const mimeType = file.mimetype.toLowerCase();
    
    if (allowedFormats.includes(ext) && allowedMimeTypes.includes(mimeType)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed: ${allowedFormats.join(', ')}`));
    }
  }
});

// Single photo enhancement
router.post('/single', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      console.log('❌ No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('📁 File received:', req.file.originalname, 'Size:', req.file.size, 'bytes');
    
    // Ensure processed directory exists
    const processedDir = path.join(process.cwd(), 'processed');
    const fs = require('fs').promises;
    await fs.mkdir(processedDir, { recursive: true });
    
    const outputFilename = `enhanced_${Date.now()}${path.extname(req.file.originalname)}`;
    const outputPath = path.join(processedDir, outputFilename);
    
    console.log('🔄 Starting enhancement...');
    const startTime = Date.now();
    
    let result;
    try {
      // Try DALL-E 3 enhancement first - new AI generation method
      console.log('🎨 Trying DALL-E 3 generation...');
      result = await openaiService.enhancePhoto(req.file.path, outputPath);
    } catch (dalleError) {
      console.log('❌ DALL-E 3 failed, trying simple enhancement...');
      try {
        result = await simpleEnhance.enhancePhoto(req.file.path, outputPath);
      } catch (enhancementError) {
        console.error('❌ Both enhancement methods failed');
        throw new Error(`Image enhancement failed: ${enhancementError.message}`);
      }
    }
    
    const processingTime = Date.now() - startTime;
    console.log('✅ Enhancement finished in', processingTime, 'ms');

    // Verify file exists and has content
    const fsSync = require('fs');
    if (!fsSync.existsSync(outputPath)) {
      throw new Error('Enhanced image file was not created');
    }
    
    const stats = fsSync.statSync(outputPath);
    if (stats.size === 0) {
      throw new Error('Enhanced image file is empty');
    }
    console.log('✅ Output file verified:', stats.size, 'bytes');

    const responseData = {
      id: Date.now().toString(),
      fileName: req.file.originalname,
      originalUrl: `/uploads/${req.file.filename}`,
      enhancedUrl: `/processed/${outputFilename}`,
      processingTime,
      aiAnalysis: result.analysis,
      fileSize: {
        original: req.file.size,
        enhanced: stats.size
      }
    };

    console.log('🚀 Sending response to frontend');
    res.json(responseData);
    console.log('✅ Response sent successfully');
  } catch (error) {
    console.error('❌ Enhancement error:', error.message);
    console.error('❌ Error stack:', error.stack);
    
    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      try {
        const fs = require('fs');
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('❌ Failed to cleanup uploaded file:', cleanupError.message);
      }
    }
    
    res.status(500).json({ 
      error: 'Failed to enhance image',
      details: error.message 
    });
  }
});

// Batch photo enhancement
router.post('/batch', upload.array('photos', 50), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const results = [];
    const errors = [];

    for (const file of req.files) {
      try {
        const outputFilename = `enhanced_${Date.now()}_${Math.random()}${path.extname(file.originalname)}`;
        const outputPath = path.join(process.cwd(), 'processed', outputFilename);
        
        const startTime = Date.now();
        const result = await openaiService.enhancePhoto(file.path, outputPath);
        const processingTime = Date.now() - startTime;

        results.push({
          id: Date.now().toString() + Math.random(),
          fileName: file.originalname,
          originalUrl: `/uploads/${file.filename}`,
          enhancedUrl: `/processed/${outputFilename}`,
          processingTime,
          aiAnalysis: result.analysis
        });
      } catch (error) {
        errors.push({
          file: file.originalname,
          error: error.message
        });
      }
    }

    res.json({
      success: results,
      errors,
      summary: {
        total: req.files.length,
        succeeded: results.length,
        failed: errors.length
      }
    });
  } catch (error) {
    console.error('Batch enhancement error:', error);
    res.status(500).json({ error: 'Failed to enhance images' });
  }
});

module.exports = router;