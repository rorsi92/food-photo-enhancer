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
      console.log('📸 Starting DALL-E 3 photo enhancement...');
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

      // Read the image and convert to base64 for analysis
      const imageBuffer = await fs.readFile(imagePath);
      const base64Image = imageBuffer.toString('base64');
      
      // Validate image format
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
      const imageInfo = await sharp(imagePath).metadata();
      if (!allowedMimeTypes.includes(`image/${imageInfo.format}`)) {
        throw new Error(`Unsupported image format: ${imageInfo.format}`);
      }
      
      console.log('🤖 Analyzing image with GPT-4o...');
      
      // First, analyze the image to understand what food it is
      const analysisCall = this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { 
                type: "text", 
                text: `Analise esta imagem de comida e retorne APENAS um objeto JSON com a descrição detalhada:

                {
                  "produto": "[tipo específico de comida identificado]",
                  "descricao_detalhada": "[descrição completa da comida, ingredientes visíveis, apresentação, cores, texturas]",
                  "observacoes": "[características específicas desta comida que devem ser realçadas]"
                }

                Seja muito específico e detalhado na descrição para gerar uma imagem melhorada.`
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
        max_tokens: 500,
        response_format: { type: "json_object" }
      });

      const analysisResponse = await Promise.race([
        analysisCall,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('OpenAI Analysis timeout')), 30000)
        )
      ]);

      let analysis;
      try {
        analysis = JSON.parse(analysisResponse.choices[0].message.content);
        console.log('📊 Food Analysis:', analysis);
      } catch (parseError) {
        console.warn('⚠️ Failed to parse analysis, using generic description');
        analysis = {
          produto: 'prato de comida',
          descricao_detalhada: 'prato de comida apetitoso',
          observacoes: 'realçar cores e apresentação'
        };
      }

      // Now generate enhanced image with DALL-E 3
      console.log('🎨 Generating enhanced image with DALL-E 3...');
      
      const enhancementPrompt = `Crie uma versão melhorada e profissional desta comida: ${analysis.descricao_detalhada}.

Aspectos a melhorar:
- Aumentar brilho e contraste para realçar cores vibrantes
- Melhorar iluminação profissional tipo fotografia gastronômica
- Realçar texturas e frescor dos ingredientes
- Deixar mais apetitoso e atrativo para delivery/iFood
- Manter o realismo, mas com qualidade de fotografia profissional
- Foco em gerar desejo de consumo imediato

Estilo: fotografia gastronômica profissional, iluminação perfeita, cores vibrantes, apresentação impecável, fundo limpo, alta qualidade, 4K.

${analysis.observacoes}`;

      const imageGeneration = this.openai.images.generate({
        model: "dall-e-3",
        prompt: enhancementPrompt,
        size: "1024x1024",
        quality: "hd",
        style: "natural",
        n: 1
      });

      const imageResponse = await Promise.race([
        imageGeneration,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('DALL-E generation timeout')), 60000)
        )
      ]);

      const imageUrl = imageResponse.data[0].url;
      console.log('✅ DALL-E image generated');

      // Download and save the generated image
      console.log('💾 Downloading generated image...');
      const axios = require('axios');
      const imageDownload = await axios.get(imageUrl, { 
        responseType: 'arraybuffer',
        timeout: 30000
      });

      await fs.writeFile(outputPath, imageDownload.data);
      console.log('✅ Enhanced image saved');

      // Verify output file was created
      try {
        await fs.access(outputPath);
      } catch (error) {
        throw new Error('Enhanced image file was not created successfully');
      }

      console.log('✨ DALL-E 3 enhancement completed successfully!');

      return {
        success: true,
        analysis: {
          produto: analysis.produto,
          metodo: 'DALL-E 3 Generation',
          descricao: analysis.descricao_detalhada,
          observacoes: 'Nova imagem gerada com DALL-E 3 baseada na original',
          dalle_prompt: enhancementPrompt
        },
        enhancedPath: outputPath
      };
      
    } catch (error) {
      console.error('❌ DALL-E enhancement error:', error.message);
      console.log('🔄 Falling back to Sharp enhancement...');
      
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