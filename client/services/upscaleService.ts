import type { ImageData } from "../features/appedio/types";

export interface UpscaleRequest {
  imageData: ImageData;
  modelId: string;
  scale?: number; // 2x, 4x, etc.
}

export interface UpscaleResponse {
  success: boolean;
  imageData?: ImageData;
  error?: string;
  processingTime?: number;
}

export interface UpscaleModel {
  id: string;
  name: string;
  description: string;
  maxScale: number;
  supportedFormats: string[];
  apiEndpoint?: string;
}

// Configuração dos modelos de upscale
export const UPSCALE_MODELS: Record<string, UpscaleModel> = {
  clarity: {
    id: "clarity",
    name: "Clarity",
    description: "Melhor para imagens com detalhes finos e texto",
    maxScale: 4,
    supportedFormats: ["image/jpeg", "image/png", "image/webp"],
    apiEndpoint: "/api/upscale/clarity"
  },
  topaz: {
    id: "topaz",
    name: "Topaz",
    description: "Ideal para fotografias e imagens naturais",
    maxScale: 6,
    supportedFormats: ["image/jpeg", "image/png", "image/webp"],
    apiEndpoint: "/api/upscale/topaz"
  },
  esrgan: {
    id: "esrgan",
    name: "ESRGAN",
    description: "Excelente para arte digital e ilustrações",
    maxScale: 4,
    supportedFormats: ["image/jpeg", "image/png", "image/webp"],
    apiEndpoint: "/api/upscale/esrgan"
  }
};

class UpscaleService {
  private apiKey: string | null = null;
  private baseUrl: string = process.env.REACT_APP_API_URL || "http://localhost:3001";

  /**
   * Configura a chave da API para os serviços de upscale
   */
  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Valida se uma imagem é compatível com o modelo selecionado
   */
  validateImage(imageData: ImageData, modelId: string): boolean {
    const model = UPSCALE_MODELS[modelId];
    if (!model) {
      throw new Error(`Modelo de upscale não encontrado: ${modelId}`);
    }

    if (!model.supportedFormats.includes(imageData.mimeType)) {
      throw new Error(`Formato ${imageData.mimeType} não suportado pelo modelo ${model.name}`);
    }

    return true;
  }

  /**
   * Realiza o upscale de uma imagem usando o modelo especificado
   */
  async upscaleImage(request: UpscaleRequest): Promise<UpscaleResponse> {
    try {
      // Validar entrada
      this.validateImage(request.imageData, request.modelId);
      
      const model = UPSCALE_MODELS[request.modelId];
      const scale = request.scale || 2;

      if (scale > model.maxScale) {
        throw new Error(`Escala ${scale}x excede o máximo suportado (${model.maxScale}x) para o modelo ${model.name}`);
      }

      // Por enquanto, retorna uma simulação
      // TODO: Implementar chamadas reais para as APIs quando estiverem configuradas
      return this.simulateUpscale(request);

      // Código para implementação futura:
      /*
      const response = await fetch(`${this.baseUrl}${model.apiEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          image: request.imageData.base64,
          mimeType: request.imageData.mimeType,
          scale: scale,
          model: request.modelId
        })
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        imageData: {
          base64: result.image,
          mimeType: result.mimeType || request.imageData.mimeType
        },
        processingTime: result.processingTime
      };
      */

    } catch (error) {
      console.error('Erro no upscale:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Simula o processo de upscale para desenvolvimento
   * Remove quando as APIs reais estiverem configuradas
   */
  private async simulateUpscale(request: UpscaleRequest): Promise<UpscaleResponse> {
    // Simular tempo de processamento
    await new Promise(resolve => setTimeout(resolve, 2000));

    const model = UPSCALE_MODELS[request.modelId];
    
    console.log(`🚀 Simulando upscale com ${model.name}:`, {
      modelId: request.modelId,
      scale: request.scale || 2,
      mimeType: request.imageData.mimeType
    });

    // Retornar a mesma imagem (simulação)
    return {
      success: true,
      imageData: request.imageData,
      processingTime: 2000
    };
  }

  /**
   * Obtém informações sobre um modelo de upscale
   */
  getModelInfo(modelId: string): UpscaleModel | null {
    return UPSCALE_MODELS[modelId] || null;
  }

  /**
   * Lista todos os modelos disponíveis
   */
  getAvailableModels(): UpscaleModel[] {
    return Object.values(UPSCALE_MODELS);
  }

  /**
   * Verifica se o serviço está configurado corretamente
   */
  isConfigured(): boolean {
    return this.apiKey !== null;
  }
}

// Instância singleton do serviço
export const upscaleService = new UpscaleService();

// Função utilitária para uso direto
export async function upscaleImage(imageData: ImageData, modelId: string, scale: number = 2): Promise<UpscaleResponse> {
  return upscaleService.upscaleImage({ imageData, modelId, scale });
}