const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

class SimpleEnhanceService {
  
  async enhancePhoto(inputPath, outputPath) {
    console.log('🔧 SIMPLE ENHANCE - Starting...');
    console.log('📥 Input:', inputPath);
    console.log('📤 Output:', outputPath);

    try {
      // Ensure directories exist
      const outputDir = path.dirname(outputPath);
      await fs.mkdir(outputDir, { recursive: true });
      
      // Check input file
      await fs.access(inputPath);
      const stats = await fs.stat(inputPath);
      console.log('📊 Input file size:', stats.size, 'bytes');

      // Process with Sharp - SIMPLE AND RELIABLE
      await sharp(inputPath)
        .modulate({
          brightness: 1.1,
          saturation: 1.2
        })
        .linear(1.15, -20)
        .sharpen()
        .jpeg({ quality: 90 })
        .toFile(outputPath);

      // Verify output
      await fs.access(outputPath);
      const outputStats = await fs.stat(outputPath);
      console.log('📊 Output file size:', outputStats.size, 'bytes');
      
      console.log('✅ SIMPLE ENHANCE - SUCCESS!');

      return {
        success: true,
        analysis: {
          produto: 'comida',
          observacoes: 'Processamento simples e confiável aplicado',
          brightness: 1.1,
          contrast: 1.15,
          saturation: 1.2
        },
        enhancedPath: outputPath
      };

    } catch (error) {
      console.error('❌ SIMPLE ENHANCE ERROR:', error.message);
      throw error;
    }
  }
}

module.exports = new SimpleEnhanceService();