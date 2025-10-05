import type { RequestHandler } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Input payload types (kept local to the server)
interface ImageData {
  base64: string;
  mimeType: string;
}

interface GenerateBody {
  prompt: string;
  linkedImages?: ImageData[];
  aspectRatio?: string;
}

export const handleGenerateImage: RequestHandler = async (req, res) => {
  try {
    const { prompt, linkedImages, aspectRatio } = req.body as GenerateBody;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt é obrigatório" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Server is missing GEMINI_API_KEY" });
    }

    const MODEL_NAME = "gemini-2.5-flash-image";
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const parts: any[] = [];
    
    // Add linked images to the context if provided
    if (linkedImages && linkedImages.length > 0) {
      linkedImages.forEach((linkedImg, index) => {
        parts.push({ inlineData: { data: linkedImg.base64, mimeType: linkedImg.mimeType } });
      });
    }
    
    // Enhanced prompt for image generation
    let enhancedPrompt = `Generate a high-quality image based on this description: ${prompt}`;
    
    if (linkedImages && linkedImages.length > 0) {
      enhancedPrompt = `Generate a high-quality image based on this description: ${prompt}\n\nIMPORTANT CONTEXT: You have access to ${linkedImages.length} reference image(s). Carefully analyze these reference images and incorporate their key visual elements, styles, objects, or characteristics into the generated image in a natural and harmonious way. The goal is to create a cohesive composition that draws inspiration from the reference images while fulfilling the main prompt. Pay attention to lighting, color palette, textures, and objects from the reference images.`;
    }
    
    parts.push({ text: enhancedPrompt });

    const response: any = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig: {
        temperature: 0.7,
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
        // Keep the generated image as-is to preserve quality
        result.image = {
          base64: part.inlineData.data,
          mimeType: part.inlineData.mimeType || "image/png",
        };
      }
    }

    return res.json(result);
  } catch (err: any) {
    console.error("[appedio] generate-image error", err);
    return res.status(500).json({ error: "Falha ao gerar imagem com o modelo de IA" });
  }
};