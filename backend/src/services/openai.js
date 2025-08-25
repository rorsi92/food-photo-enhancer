const OpenAI = require('openai');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

class OpenAIService {
  constructor() {
    console.log('🔧 Initializing OpenAI Service...');
    if (!process.env.OPENAI_API_KEY) {
      console.log('⚠️  OPENAI_API_KEY not found, using ONLY fallback enhancement');
      this.openai = null;
    } else {
      console.log('✅ OPENAI_API_KEY found');
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  async enhancePhoto(imagePath, outputPath) {
    try {
      console.log('📸 Starting photo enhancement...');
      console.log('Input:', imagePath);
      console.log('Output:', outputPath);

      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      await fs.mkdir(outputDir, { recursive: true });

      // Validate input file exists
      try {
        await fs.access(imagePath);
      } catch (error) {
        throw new Error(`Input file not found: ${imagePath}`);
      }

      // Check if OpenAI is available
      if (!this.openai) {
        console.log('🔄 Using fallback enhancement (no OpenAI key)');
        return this.fallbackEnhancement(imagePath, outputPath);
      }

      // Read the image and convert to base64
      const imageBuffer = await fs.readFile(imagePath);
      const base64Image = imageBuffer.toString('base64');
      
      // Validate image format
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
      const imageInfo = await sharp(imagePath).metadata();
      if (!allowedMimeTypes.includes(`image/${imageInfo.format}`)) {
        throw new Error(`Unsupported image format: ${imageInfo.format}`);
      }
      
      console.log('🤖 Calling OpenAI Vision API...');
      
      // Call OpenAI Vision API with timeout
      const apiCall = this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { 
                type: "text", 
                text: `Estou te enviando um prompt em json form, direcionado para melhoria de imagem de um prato de comida. Vou te enviar em anexo uma imagem de outro prato de comida, analise a estrutura do prompt original e adeque ela para este novo prato de comida, mudando somente a estrutura variável do prompt:

                {
                  "acao": "aprimorar_imagem",
                  "produto": "[tipo de comida identificado na imagem]",
                  "objetivo": "aumentar_atratividade_ifood",
                  "aspectos_melhorar": [
                    "nitidez",
                    "cores", 
                    "iluminacao",
                    "textura_alimento"
                  ],
                  "estilo_desejado": "profissional_apetitoso",
                  "brightness": 1.2,
                  "contrast": 1.3,
                  "saturation": 1.4,
                  "observacoes": "Manter realismo do [produto], realçar ingredientes frescos. Foco em gerar desejo de consumo imediato."
                }

                Retorne APENAS o objeto JSON adaptado para o prato específico da imagem enviada.`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/${imageInfo.format};base64,${base64Image}`,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 300,
        response_format: { type: "json_object" }
      });

      const response = await Promise.race([
        apiCall,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('OpenAI API timeout')), 30000)
        )
      ]);

      console.log('✅ OpenAI response received');
      
      let analysis;
      try {
        analysis = JSON.parse(response.choices[0].message.content);
      } catch (parseError) {
        console.warn('⚠️ Failed to parse OpenAI response, using defaults');
        analysis = {
          produto: 'prato de comida',
          brightness: 1.2,
          contrast: 1.3,
          saturation: 1.4,
          observacoes: 'Parâmetros padrão aplicados devido a erro na análise'
        };
      }
      
      console.log('📊 Analysis:', analysis);
      
      // Apply enhancements using Sharp with proper validation
      console.log('🔧 Applying Sharp enhancements...');
      const brightness = Math.max(0.5, Math.min(2.0, analysis.brightness || 1.2));
      const saturation = Math.max(0.5, Math.min(3.0, analysis.saturation || 1.4));
      const contrast = Math.max(0.5, Math.min(3.0, analysis.contrast || 1.3));

      await Promise.race([
        sharp(imagePath)
          .modulate({
            brightness,
            saturation
          })
          .linear(contrast, -(128 * (contrast - 1)))
          .sharpen()
          .jpeg({ quality: 95, progressive: true })
          .toFile(outputPath),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Sharp processing timeout')), 30000)
        )
      ]);
      console.log('✅ Sharp processing completed');

      // Verify output file was created
      try {
        await fs.access(outputPath);
      } catch (error) {
        throw new Error('Enhanced image file was not created successfully');
      }

      console.log('✨ Enhancement completed successfully!');

      return {
        success: true,
        analysis,
        enhancedPath: outputPath
      };
      
    } catch (error) {
      console.error('❌ OpenAI enhancement error:', error.message);
      console.log('🔄 Falling back to basic enhancement...');
      
      // Fallback to basic enhancement
      return this.fallbackEnhancement(imagePath, outputPath);
    }
  }

  async fallbackEnhancement(imagePath, outputPath) {
    try {
      console.log('🔧 Applying basic enhancement...');
      
      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      await fs.mkdir(outputDir, { recursive: true });
      
      // Validate input file exists
      try {
        await fs.access(imagePath);
      } catch (error) {
        throw new Error(`Input file not found: ${imagePath}`);
      }

      // Get image metadata for validation
      const imageInfo = await sharp(imagePath).metadata();
      const allowedFormats = ['jpeg', 'jpg', 'png', 'webp'];
      
      if (!allowedFormats.includes(imageInfo.format)) {
        throw new Error(`Unsupported image format: ${imageInfo.format}`);
      }

      await Promise.race([
        sharp(imagePath)
          .modulate({ 
            brightness: 1.15, 
            saturation: 1.35 
          })
          .linear(1.25, -30)
          .sharpen({ sigma: 1 })
          .jpeg({ quality: 95, progressive: true })
          .toFile(outputPath),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Fallback processing timeout')), 30000)
        )
      ]);
        
      // Verify output file was created
      try {
        await fs.access(outputPath);
      } catch (error) {
        throw new Error('Enhanced image file was not created successfully');
      }
        
      console.log('✅ Basic enhancement completed');
        
      return {
        success: true,
        analysis: { 
          produto: 'prato de comida', 
          observacoes: 'Aprimoramento básico aplicado - brilho, contraste e saturação melhorados para tornar a comida mais atrativa',
          brightness: 1.15,
          contrast: 1.25,
          saturation: 1.35
        },
        enhancedPath: outputPath
      };
    } catch (error) {
      console.error('❌ Fallback enhancement failed:', error);
      throw new Error(`Enhancement failed: ${error.message}`);
    }
  }
}

module.exports = new OpenAIService();