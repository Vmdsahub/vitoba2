export interface AIModel {
  id: string;
  name: string;
  status: "available" | "coming-soon";
  description?: string;
  apiEndpoint?: string;
  provider?: "gemini" | "openai" | "custom";
}

export const AI_MODELS: AIModel[] = [
  {
    id: "nano-banana",
    name: "Nano Banana",
    status: "available",
    description: "Modelo atual de geração de IA",
    provider: "gemini",
    apiEndpoint: "/api/appedio/generate"
  },
  {
    id: "seedream-4",
    name: "Seedream 4.0",
    status: "available",
    description: "Modelo avançado via Replicate",
    provider: "custom",
    apiEndpoint: "/api/appedio/seedream/generate-image"
  },
  {
    id: "chatgpt-5",
    name: "ChatGPT 5.0",
    status: "coming-soon",
    description: "Em breve",
    provider: "openai"
  }
];

export const getAvailableModels = () => AI_MODELS.filter(model => model.status === "available");

export const getModelById = (id: string) => AI_MODELS.find(model => model.id === id);

export const getDefaultModel = () => AI_MODELS[0]; // Nano Banana como padrão