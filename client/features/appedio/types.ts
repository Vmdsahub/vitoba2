export enum Tool {
  MOVE = "MOVE",
  PAN = "PAN",
  SELECT = "SELECT",
  BRUSH = "BRUSH",
  LINK = "LINK",
  UPSCALE = "UPSCALE",
}

export interface ImageData {
  base64: string;
  mimeType: string;
}

export interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageObject {
  id: string;
  imageData: ImageData;
  x: number;
  y: number;
  width: number;
  height: number;
  selection?: SelectionRect;
  mask?: ImageData;
  originalImageId?: string; // Reference to the original image if this is an edited version
  isOriginal?: boolean; // Flag to identify original images
  linkedTo?: string[]; // Array of image IDs that this image is linked to
  linkedFrom?: string[]; // Array of image IDs that are linked to this image
  prompt?: string; // Prompt usado para gerar ou editar a imagem
  generatedAt?: Date; // Data de geração/edição
}

export interface ImageLink {
  id: string;
  sourceImageId: string;
  targetImageId: string;
  createdAt: Date;
}

export interface LinkingState {
  isLinking: boolean;
  sourceImageId: string | null;
  targetImageId: string | null;
}

export interface ChatMessage {
  role: "user" | "model";
  text: string;
  image: ImageData | null;
}

export interface EditResult {
  text: string | null;
  image: ImageData | null;
}

export enum AppState {
  IDLE = "IDLE",
  LOADING = "LOADING",
  ERROR = "ERROR",
}
