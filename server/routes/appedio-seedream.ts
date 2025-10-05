import type { RequestHandler } from "express";
import Replicate from "replicate";

// Input payload types (kept local to the server)
interface ImageData {
  base64: string;
  mimeType: string;
}

interface SeedreamGenerateBody {
  prompt: string;
  linkedImages?: ImageData[];
  aspectRatio?: string;
}

interface SeedreamEditBody {
  prompt: string;
  image: ImageData;
  mask?: ImageData;
  linkedImages?: ImageData[];
  aspectRatio?: string;
}

// Initialize Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || "",
});

// Helper function to convert base64 to data URL
function base64ToDataUrl(base64: string, mimeType: string): string {
  return `data:${mimeType};base64,${base64}`;
}

// Helper function to convert data URL to base64
function dataUrlToBase64(dataUrl: string): { base64: string; mimeType: string } {
  const [header, base64] = dataUrl.split(',');
  const mimeType = header.match(/data:([^;]+)/)?.[1] || 'image/png';
  return { base64, mimeType };
}

// Map aspect ratios to Seedream format
function mapAspectRatio(ratio?: string): string {
  const aspectRatioMap: Record<string, string> = {
    "1:1": "1:1",
    "3:4": "3:4",
    "4:3": "4:3",
    "16:9": "16:9",
    "9:16": "9:16",
    "21:9": "21:9",
    // 32:9 usa dimensões customizadas
    "32:9": "custom"
  };
  
  return aspectRatioMap[ratio || "1:1"] || "1:1";
}

// Map size and custom dimensions based on aspect ratio
function getSizeAndDimensions(aspectRatio?: string): { size: string; width?: number; height?: number; useCustomDimensions?: boolean } {
  if (aspectRatio === "32:9") {
    // Calculando dimensões para 32:9 dentro do limite de 4096px
    // Para manter a qualidade máxima, usamos a altura máxima possível
    const maxDimension = 4096;
    const height = Math.floor(maxDimension / (32/9)); // ~1152px
    const width = Math.floor(height * (32/9)); // ~4096px
    
    return {
      size: "custom",
      width: width,
      height: height,
      useCustomDimensions: true
    };
  }
  
  // Para outros aspect ratios, usar 4K padrão
  return { size: "4K" };
}

export const handleSeedreamGenerate: RequestHandler = async (req, res) => {
  try {
    const { prompt, linkedImages, aspectRatio }: SeedreamGenerateBody = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Prompt é obrigatório" });
    }

    // Get size and dimensions configuration
    const sizeConfig = getSizeAndDimensions(aspectRatio);
    
    // Build the input for Seedream
    const input: any = {
      prompt: prompt,
      size: sizeConfig.size,
      max_images: 1,
      sequential_image_generation: "disabled"
    };

    // Add aspect_ratio only if not using custom dimensions
    if (!sizeConfig.useCustomDimensions) {
      input.aspect_ratio = mapAspectRatio(aspectRatio);
    }

    // Add custom dimensions if needed
    if (sizeConfig.width && sizeConfig.height) {
      input.width = sizeConfig.width;
      input.height = sizeConfig.height;
    }

    // Add reference images if provided
    if (linkedImages && linkedImages.length > 0) {
      // For Seedream, we can use multiple reference images
      input.image_input = linkedImages.map(img => 
        base64ToDataUrl(img.base64, img.mimeType)
      );
    }

    console.log("[seedream] Generating image with input:", {
      prompt: input.prompt,
      aspect_ratio: input.aspect_ratio,
      size: input.size,
      has_reference: !!input.image_input
    });

    // Call Seedream via Replicate
    const output = await replicate.run(
      "bytedance/seedream-4",
      { input }
    ) as any[];

    if (!output || !Array.isArray(output) || output.length === 0) {
      return res.status(500).json({ error: "Nenhuma imagem foi gerada pelo Seedream" });
    }

    // Get the first generated image URL - Seedream returns file objects
    const imageFile = output[0];
    const imageUrl = typeof imageFile === 'string' ? imageFile : imageFile.url();
    
    // Fetch the image and convert to base64
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch generated image: ${imageResponse.statusText}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    const result = {
      text: null,
      image: {
        base64: base64Image,
        mimeType: "image/png"
      }
    };

    return res.json(result);
  } catch (err: any) {
    console.error("[seedream] generate-image error", err);
    return res.status(500).json({ error: "Falha ao gerar imagem com Seedream 4.0" });
  }
};

export const handleSeedreamEdit: RequestHandler = async (req, res) => {
  try {
    const { prompt, image, mask, linkedImages, aspectRatio }: SeedreamEditBody = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Prompt é obrigatório" });
    }

    if (!image || !image.base64) {
      return res.status(400).json({ error: "Imagem é obrigatória para edição" });
    }

    // Get size and dimensions configuration
    const sizeConfig = getSizeAndDimensions(aspectRatio);

    // Build the input for Seedream image editing
    const input: any = {
      prompt: prompt,
      image_input: [base64ToDataUrl(image.base64, image.mimeType)],
      size: sizeConfig.size,
      max_images: 1,
      sequential_image_generation: "disabled"
    };

    // Add aspect_ratio only if not using custom dimensions
    if (!sizeConfig.useCustomDimensions) {
      input.aspect_ratio = mapAspectRatio(aspectRatio);
    }

    // Add custom dimensions if needed
    if (sizeConfig.width && sizeConfig.height) {
      input.width = sizeConfig.width;
      input.height = sizeConfig.height;
    }

    // Add reference images if provided
    if (linkedImages && linkedImages.length > 0) {
      // Add additional reference images to the input array
      const additionalImages = linkedImages.map(img => 
        base64ToDataUrl(img.base64, img.mimeType)
      );
      input.image_input = [...input.image_input, ...additionalImages];
    }

    console.log("[seedream] Editing image with input:", {
      prompt: input.prompt,
      aspect_ratio: input.aspect_ratio,
      size: input.size,
      image_count: input.image_input.length
    });

    // Call Seedream via Replicate for image editing
    const output = await replicate.run(
      "bytedance/seedream-4",
      { input }
    ) as any[];

    if (!output || !Array.isArray(output) || output.length === 0) {
      return res.status(500).json({ error: "Nenhuma imagem foi editada pelo Seedream" });
    }

    // Get the first edited image URL - Seedream returns file objects
    const imageFile = output[0];
    const imageUrl = typeof imageFile === 'string' ? imageFile : imageFile.url();
    
    // Fetch the image and convert to base64
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch edited image: ${imageResponse.statusText}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    const result = {
      text: null,
      image: {
        base64: base64Image,
        mimeType: "image/png"
      }
    };

    return res.json(result);
  } catch (err: any) {
    console.error("[seedream] edit-image error", err);
    return res.status(500).json({ error: "Falha ao editar imagem com Seedream 4.0" });
  }
};