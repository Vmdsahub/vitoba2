import type { RequestHandler } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from "sharp";

// Input payload types (kept local to the server)
interface ImageData {
  base64: string;
  mimeType: string;
}

interface EditBody {
  prompt: string;
  image: ImageData;
  mask?: ImageData;
  linkedImages?: ImageData[];
  aspectRatio?: string;
}

export const handleEditImage: RequestHandler = async (req, res) => {
  try {
    const { prompt, image, mask, linkedImages, aspectRatio } = req.body as EditBody;
    if (!prompt || !image?.base64 || !image?.mimeType) {
      return res.status(400).json({ error: "Invalid request body" });
    }

    // Get original image dimensions
    const originalImageBuffer = Buffer.from(image.base64, 'base64');
    const originalMetadata = await sharp(originalImageBuffer).metadata();
    const originalWidth = originalMetadata.width!;
    const originalHeight = originalMetadata.height!;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Server is missing GEMINI_API_KEY" });
    }

    const MODEL_NAME = "gemini-2.5-flash-image";
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const parts: any[] = [
      { inlineData: { data: image.base64, mimeType: image.mimeType } },
    ];
    if (mask) parts.push({ inlineData: { data: mask.base64, mimeType: mask.mimeType } });
    
    // Add linked images to the context
    if (linkedImages && linkedImages.length > 0) {
      linkedImages.forEach((linkedImg, index) => {
        parts.push({ inlineData: { data: linkedImg.base64, mimeType: linkedImg.mimeType } });
      });
    }
    
    // Enhanced prompt for better element incorporation
    let enhancedPrompt = prompt;
    
    if (linkedImages && linkedImages.length > 0) {
      enhancedPrompt = `${prompt}\n\nIMPORTANT CONTEXT: You have access to ${linkedImages.length} additional reference image(s). Carefully analyze these reference images and incorporate their key visual elements, styles, objects, or characteristics into the main image in a natural and harmonious way. The goal is to blend elements from the reference images with the main image to create a cohesive composition. Pay attention to lighting, color palette, textures, and objects from the reference images.`;
    }
    
    parts.push({ text: enhancedPrompt });

    const response: any = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig: {
        temperature: 0.4,
        topK: 32,
        topP: 1,
        maxOutputTokens: 8192,
        ...(aspectRatio && {
          imageConfig: {
            aspectRatio: aspectRatio,
          },
        }),
      },
    } as any);

    const result: { text: string | null; image: ImageData | null } = {
      text: null,
      image: null,
    };

    const candidates = response?.candidates || response?.response?.candidates || [];
    if (!Array.isArray(candidates) || candidates.length === 0) {
      return res.status(200).json(result);
    }

    const partsOut = candidates[0]?.content?.parts || [];
    for (const part of partsOut) {
      if (part.text) {
        result.text = (result.text || "") + part.text;
      } else if (part.inlineData) {
        // Keep the generated image as-is to preserve quality and avoid distortion
        result.image = {
          base64: part.inlineData.data,
          mimeType: part.inlineData.mimeType || "image/png",
        };
      }
    }

    return res.json(result);
  } catch (err: any) {
    console.error("[appedio] edit-image error", err);
    return res.status(500).json({ error: "Falha ao comunicar com o modelo de IA" });
  }
};
