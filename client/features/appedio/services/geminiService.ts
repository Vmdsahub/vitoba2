import type { ImageData, EditResult } from "../types";

export async function editImage(prompt: string, image: ImageData, mask?: ImageData, linkedImages?: ImageData[], aspectRatio?: string, modelId?: string): Promise<EditResult> {
  // Determine the endpoint based on the model
  const endpoint = modelId === "seedream-4" ? "/api/appedio/seedream/edit-image" : "/api/appedio/edit-image";
  
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, image, mask, linkedImages, aspectRatio }),
  });

  if (!res.ok) {
    const { error } = await res.json().catch(() => ({ error: "Erro" }));
    throw new Error(error || "Falha ao comunicar com o modelo de IA.");
  }

  const data = (await res.json()) as EditResult;
  return data;
}

export async function generateImage(prompt: string, linkedImages?: ImageData[], aspectRatio?: string, modelId?: string): Promise<EditResult> {
  // Determine the endpoint based on the model
  const endpoint = modelId === "seedream-4" ? "/api/appedio/seedream/generate-image" : "/api/appedio/generate-image";
  
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, linkedImages, aspectRatio }),
  });

  if (!res.ok) {
    const { error } = await res.json().catch(() => ({ error: "Erro" }));
    throw new Error(error || "Falha ao gerar imagem.");
  }

  const data = (await res.json()) as EditResult;
  return data;
}
