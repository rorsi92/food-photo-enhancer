import OpenAI from 'openai';
import fs from 'fs/promises';
import sharp from 'sharp';

export class OpenAIService {
  private openai: OpenAI;
  private enhancementPrompt: string;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    this.enhancementPrompt = `Você é um especialista em fotografia e edição de fotos de comida. 
    Vou te enviar uma imagem de um prato de comida. Primeiro, identifique o tipo de prato/produto na imagem.
    Depois, analise a imagem seguindo esta estrutura e forneça parâmetros específicos de aprimoramento:

    {
      "acao": "aprimorar_imagem",
      "produto": "[identificar automaticamente o tipo de comida]",
      "objetivo": "aumentar_atratividade_ifood",
      "aspectos_melhorar": [
        "nitidez",
        "cores",
        "iluminacao",
        "textura_alimento"
      ],
      "estilo_desejado": "profissional_apetitoso",
      "observacoes": "Manter realismo do prato, realçar ingredientes frescos. Foco em gerar desejo de consumo imediato.",
      "parametros_tecnicos": {
        "brightness": (0.8-1.5),
        "contrast": (0.8-1.5),
        "saturation": (0.8-2.0),
        "warmth": (-100 to 100),
        "highlights": (-100 to 100),
        "shadows": (-100 to 100),
        "vibrance": (0-100),
        "clarity": (0-100),
        "exposure": (-2 to 2)
      }
    }
    
    Retorne APENAS um objeto JSON com a estrutura acima, adaptando o campo "produto" para o prato identificado na imagem e ajustando os parametros_tecnicos para realçar melhor as características específicas desse tipo de alimento.`;
  }

  async analyzeAndEnhanceImage(imagePath: string): Promise<{
    enhancementParams: any;
    description: string;
  }> {
    try {
      // Convert image to base64
      const imageBuffer = await fs.readFile(imagePath);
      const base64Image = imageBuffer.toString('base64');
      
      // Send to OpenAI Vision API
      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { 
                type: "text", 
                text: this.enhancementPrompt 
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 500,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const result = JSON.parse(content);
      
      // Extract technical parameters from the response
      const technicalParams = result.parametros_tecnicos || {
        brightness: 1.1,
        contrast: 1.2,
        saturation: 1.3,
        warmth: 10,
        highlights: 0,
        shadows: 0,
        vibrance: 20,
        clarity: 30,
        exposure: 0.1
      };
      
      return {
        enhancementParams: technicalParams,
        description: `${result.produto || 'Prato'} aprimorado - ${result.observacoes || 'Enhanced using AI recommendations'}`
      };
    } catch (error) {
      console.error('OpenAI analysis error:', error);
      // Fallback to default enhancement if OpenAI fails
      return {
        enhancementParams: {
          brightness: 1.1,
          contrast: 1.2,
          saturation: 1.3,
          warmth: 10,
          highlights: 0,
          shadows: 0,
          vibrance: 20,
          clarity: 30,
          exposure: 0.1
        },
        description: "Default enhancement applied"
      };
    }
  }

  async applyEnhancements(
    inputPath: string,
    outputPath: string,
    params: any
  ): Promise<sharp.Metadata> {
    const image = sharp(inputPath);
    const metadata = await image.metadata();

    // Build the processing pipeline based on OpenAI recommendations
    let pipeline = image
      .rotate() // Auto-rotate based on EXIF
      .modulate({
        brightness: params.brightness || 1,
        saturation: params.saturation || 1,
      });

    // Apply color temperature adjustment (warmth)
    if (params.warmth) {
      const warmthMatrix = this.getWarmthMatrix(params.warmth);
      pipeline = pipeline.recomb(warmthMatrix);
    }

    // Apply contrast
    if (params.contrast && params.contrast !== 1) {
      pipeline = pipeline.linear(
        params.contrast,
        -(128 * (params.contrast - 1))
      );
    }

    // Apply gamma correction for exposure
    if (params.exposure) {
      const gamma = Math.pow(2, -params.exposure);
      pipeline = pipeline.gamma(gamma);
    }

    // Apply sharpening for clarity
    if (params.clarity && params.clarity > 0) {
      pipeline = pipeline.sharpen({
        sigma: 0.5 + (params.clarity / 100),
        flat: 1,
        jagged: 2
      });
    }

    // Normalize to adjust highlights and shadows
    if (params.highlights !== 0 || params.shadows !== 0) {
      pipeline = pipeline.normalize();
    }

    // Output as high-quality JPEG
    await pipeline
      .jpeg({ 
        quality: 95, 
        mozjpeg: true,
        chromaSubsampling: '4:4:4'
      })
      .toFile(outputPath);

    return metadata;
  }

  private getWarmthMatrix(warmth: number): number[][] {
    // Convert warmth (-100 to 100) to color temperature adjustment
    const factor = warmth / 100;
    
    // Warm (positive) adds red/yellow, Cool (negative) adds blue
    return [
      [1 + (factor * 0.2), 0, 0],  // Red channel
      [0, 1, 0],                    // Green channel  
      [0, 0, 1 - (factor * 0.2)]    // Blue channel
    ];
  }

  async processWithPrompt(
    imagePath: string,
    outputPath: string,
    customPrompt?: string
  ): Promise<{
    success: boolean;
    enhancedPath: string;
    metadata: sharp.Metadata;
    aiAnalysis: any;
    error?: string;
  }> {
    try {
      // Use custom prompt if provided
      if (customPrompt) {
        this.enhancementPrompt = customPrompt;
      }

      // Get AI recommendations
      const { enhancementParams, description } = await this.analyzeAndEnhanceImage(imagePath);

      // Apply enhancements
      const metadata = await this.applyEnhancements(
        imagePath,
        outputPath,
        enhancementParams
      );

      return {
        success: true,
        enhancedPath: outputPath,
        metadata,
        aiAnalysis: {
          parameters: enhancementParams,
          description
        }
      };
    } catch (error) {
      console.error('Processing error:', error);
      return {
        success: false,
        enhancedPath: '',
        metadata: {} as sharp.Metadata,
        aiAnalysis: null,
        error: error instanceof Error ? error.message : 'Processing failed'
      };
    }
  }
}