import React, { useState, useCallback } from "react";
import { Canvas } from "@/features/appedio/components/Canvas";
import { ChatPanel } from "@/features/appedio/components/ChatPanel";
import type { ImageObject, ChatMessage, EditResult, LinkingState } from "@/features/appedio/types";
import { AppState, Tool } from "@/features/appedio/types";
import { editImage, generateImage } from "@/features/appedio/services/geminiService";
import { upscaleService } from "@/services/upscaleService";
import { toast } from "sonner";

export default function EditorPage() {
  const [images, setImages] = useState<ImageObject[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<Tool | null>(null);
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [promptInput, setPromptInput] = useState<string>("");
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [linkingState, setLinkingState] = useState<LinkingState>({
    isLinking: false,
    sourceImageId: null,
    targetImageId: null,
  });
  const [canvasView, setCanvasView] = useState({ x: 0, y: 0, zoom: 1 });
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<string>("1:1");
  const [selectedModel, setSelectedModel] = useState<string>("nano-banana");

  const handleImageUpload = useCallback((imageData: { base64: string; mimeType: string }) => {
    const img = new Image();
    img.onload = () => {
      // Sistema de miniaturização proporcional - mostra tamanho real em escala reduzida
      // Todas as imagens mantêm sua proporção real, apenas reduzidas por um fator fixo
      const aspectRatio = img.width / img.height;
      
      // Fator de miniaturização: divide por 4 para criar miniaturas proporcionais
       // Isso significa que uma imagem 4096x1152 aparecerá como ~1024x288
       // E uma imagem 1024x1024 aparecerá como ~256x256
       const MINIATURE_FACTOR = 4;
      
      // Calcular dimensões reais em miniatura
      const displayWidth = img.width / MINIATURE_FACTOR;
      const displayHeight = img.height / MINIATURE_FACTOR;
      
      // Centralizar na visão atual do usuário considerando o view state do Canvas
      const canvasContainer = document.querySelector('[data-canvas-container]') as HTMLElement;
      
      let centerX = 100; // Posição padrão
      let centerY = 100; // Posição padrão
      
      if (canvasContainer) {
        // Obter o centro da viewport do canvas
        const containerRect = canvasContainer.getBoundingClientRect();
        const viewportCenterX = containerRect.width / 2;
        const viewportCenterY = containerRect.height / 2;
        
        // Calcular posição centralizada considerando o transform atual do canvas
        centerX = (viewportCenterX - canvasView.x) / canvasView.zoom - (displayWidth / 2);
        centerY = (viewportCenterY - canvasView.y) / canvasView.zoom - (displayHeight / 2);
      }
      
      const newImage: ImageObject = {
        id: Math.random().toString(36).slice(2),
        x: centerX,
        y: centerY,
        width: Math.round(displayWidth),
        height: Math.round(displayHeight),
        imageData,
        isOriginal: true,
      };
      setImages((prev) => [...prev, newImage]);
      setSelectedImageId(newImage.id);
    };
    img.src = `data:${imageData.mimeType};base64,${imageData.base64}`;
  }, [canvasView]);

  const handleImageSelect = (id: string | null) => setSelectedImageId(id);

  const handleImageUpdate = (id: string, updates: Partial<Omit<ImageObject, "id" | "imageData">>) => {
    setImages((prev) => prev.map((img) => (img.id === id ? { ...img, ...updates } : img)));
  };

  const handleImageRemove = useCallback((id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
    if (selectedImageId === id) {
      setSelectedImageId(null);
    }
    toast.success("Imagem removida com sucesso!");
  }, [selectedImageId]);

  const handleImageLink = useCallback((sourceId: string, targetId: string) => {
    setImages((prev) => prev.map((img) => {
      if (img.id === sourceId) {
        const linkedTo = img.linkedTo || [];
        if (!linkedTo.includes(targetId)) {
          return { ...img, linkedTo: [...linkedTo, targetId] };
        }
      }
      if (img.id === targetId) {
        const linkedFrom = img.linkedFrom || [];
        if (!linkedFrom.includes(sourceId)) {
          return { ...img, linkedFrom: [...linkedFrom, sourceId] };
        }
      }
      return img;
    }));
    toast.success("Imagens linkadas com sucesso!");
  }, []);

  const handleLinkingStateChange = useCallback((newState: Partial<LinkingState>) => {
    setLinkingState((prev) => ({ ...prev, ...newState }));
  }, []);

  const handleUpscaleImage = useCallback(async (imageId: string, modelId: string) => {
    const image = images.find(img => img.id === imageId);
    if (!image) {
      toast.error("Imagem não encontrada");
      return;
    }

    try {
      setState(AppState.LOADING);
      toast.info(`Iniciando upscale com modelo ${modelId}...`);
      
      const result = await upscaleService.upscaleImage({
        imageData: image.imageData,
        modelId,
        scale: 2 // Default scale
      });

      if (result.success && result.upscaledImage) {
        const img = new Image();
        img.onload = () => {
          // Sistema de miniaturização proporcional - mostra tamanho real em escala reduzida
          // Todas as imagens mantêm sua proporção real, apenas reduzidas por um fator fixo
          const aspectRatio = img.width / img.height;
          
          // Fator de miniaturização: divide por 4 para criar miniaturas proporcionais
           // Isso significa que uma imagem 4096x1152 aparecerá como ~1024x288
           // E uma imagem 1024x1024 aparecerá como ~256x256
           const MINIATURE_FACTOR = 4;
          
          // Calcular dimensões reais em miniatura
          const displayWidth = img.width / MINIATURE_FACTOR;
          const displayHeight = img.height / MINIATURE_FACTOR;
          
          const newImage: ImageObject = {
            id: Math.random().toString(36).slice(2),
            x: image.x + image.width + 50,
            y: image.y,
            width: Math.round(displayWidth),
            height: Math.round(displayHeight),
            imageData: result.upscaledImage!,
            originalImageId: image.id,
            isOriginal: false,
            prompt: `Upscale da imagem usando modelo ${modelId}`,
            generatedAt: new Date(),
          };
          
          setImages((prev) => [...prev, newImage]);
          setSelectedImageId(newImage.id);
          toast.success(`Upscale concluído com sucesso usando ${modelId}!`);
        };
        img.src = `data:${result.upscaledImage.mimeType};base64,${result.upscaledImage.base64}`;
      } else {
        toast.error(result.error || "Falha no upscale da imagem");
      }
    } catch (error: any) {
      console.error("Erro no upscale:", error);
      toast.error(error?.message || "Erro inesperado durante o upscale");
    } finally {
      setState(AppState.IDLE);
    }
  }, [images]);

  const pushMessage = useCallback((role: "user" | "model", content: string) => {
    setMessages((prev) => [...prev, { id: Math.random().toString(36).slice(2), role, content, createdAt: new Date().toISOString() }]);
  }, []);

  const handleSend = useCallback(async () => {
    const prompt = promptInput.trim();
    if (!prompt) return;

    pushMessage("user", prompt);
    setPromptInput("");
    setIsThinking(true);
    setState(AppState.LOADING);

    try {
      let result: EditResult;
      
      if (!selectedImageId) {
        // Generate new image when no image is selected - no context from existing images
        result = await generateImage(prompt, [], selectedAspectRatio, selectedModel);
      } else {
        // Edit existing image when one is selected
        const selectedImage = images.find((img) => img.id === selectedImageId);
        if (!selectedImage) return;
        
        const mask = selectedImage.mask;
        
        // Prepare context with linked images
        let contextualPrompt = prompt;
        const linkedImages = images.filter(img => 
          selectedImage.linkedFrom && selectedImage.linkedFrom.includes(img.id)
        );
        
        if (linkedImages.length > 0) {
          contextualPrompt = `${prompt}\n\nCONTEXTO DE LINKAGEM: Você tem acesso a ${linkedImages.length} imagem(ns) de referência linkada(s). Analise cuidadosamente cada imagem de referência e incorpore seus elementos visuais chave (objetos, texturas, cores, estilos, iluminação) na imagem principal de forma natural e harmoniosa. O objetivo é criar uma composição coesa que combine elementos das imagens de referência com a imagem principal, mantendo a qualidade e realismo.`;
        }
        
        result = await editImage(contextualPrompt, selectedImage.imageData, mask, linkedImages.map(img => img.imageData), selectedAspectRatio, selectedModel);
      }

      if (result.text) {
        pushMessage("model", result.text);
      }
      if (result.image) {
        const img = new Image();
        img.onload = () => {
          // Sistema de miniaturização proporcional - fator fixo para todas as imagens
          // Uma imagem 4096x1152 aparecerá como ~1024x288
          // E uma imagem 1024x1024 aparecerá como ~256x256
          const MINIATURE_FACTOR = 4;
          
          // Calcular dimensões reais em miniatura
          const displayWidth = img.width / MINIATURE_FACTOR;
          const displayHeight = img.height / MINIATURE_FACTOR;
          
          let newImage: ImageObject;
          
          if (selectedImageId) {
            // Editing existing image - position next to original
            const originalImage = images.find(img => img.id === selectedImageId);
            if (!originalImage) return;
            
            newImage = {
              id: Math.random().toString(36).slice(2),
              x: originalImage.x + originalImage.width + 50,
              y: originalImage.y,
              width: Math.round(displayWidth),
              height: Math.round(displayHeight),
              imageData: result.image!,
              originalImageId: originalImage.id,
              isOriginal: false,
              prompt: prompt,
              generatedAt: new Date(),
            };
            
            setImages((prev) => [
              ...prev.map((img) =>
                img.id === selectedImageId
                  ? { ...img, selection: undefined, mask: undefined }
                  : img
              ),
              newImage
            ]);
          } else {
            // Generating new image - position in center of current viewport
            const canvasContainer = document.querySelector('[data-canvas-container]') as HTMLElement;
            
            if (canvasContainer) {
              // Obter o centro da viewport do canvas
              const containerRect = canvasContainer.getBoundingClientRect();
              const viewportCenterX = containerRect.width / 2;
              const viewportCenterY = containerRect.height / 2;
              
              // Calcular posição centralizada considerando o transform atual do canvas
              const centerX = (viewportCenterX - canvasView.x) / canvasView.zoom - (displayWidth / 2);
              const centerY = (viewportCenterY - canvasView.y) / canvasView.zoom - (displayHeight / 2);
              
              newImage = {
                id: Math.random().toString(36).slice(2),
                x: centerX,
                y: centerY,
                width: Math.round(displayWidth),
                height: Math.round(displayHeight),
                imageData: result.image!,
                isOriginal: true,
                prompt: prompt,
                generatedAt: new Date(),
              };
              
              setImages((prev) => [...prev, newImage]);
            } else {
              // Fallback caso não encontre o container do canvas
              newImage = {
                id: Math.random().toString(36).slice(2),
                x: 100,
                y: 100,
                width: Math.round(displayWidth),
                height: Math.round(displayHeight),
                imageData: result.image!,
                isOriginal: true,
                prompt: prompt,
                generatedAt: new Date(),
              };
              
              setImages((prev) => [...prev, newImage]);
            }
          }
          
          // Só definir selectedImageId se newImage foi criado
          if (newImage) {
            setSelectedImageId(newImage.id);
          }
        };
        img.src = `data:${result.image.mimeType};base64,${result.image.base64}`;
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Falha ao editar a imagem. Tente novamente.");
    } finally {
      setIsThinking(false);
      setState(AppState.IDLE);
    }
  }, [promptInput, selectedImageId, images, pushMessage, canvasView]);

  // Função para centralizar o canvas
  const handleCenterCanvas = useCallback(() => {
    // Buscar a função centerCanvas do Canvas component
    const canvasElement = document.querySelector('[data-canvas-container]') as HTMLElement;
    if (canvasElement) {
      // Disparar evento customizado para centralizar
      const centerEvent = new CustomEvent('centerCanvas');
      canvasElement.dispatchEvent(centerEvent);
    }
  }, []);

  return (
    <div className="h-screen w-screen flex bg-gray-100">
      <main className="flex-1 relative flex flex-col">
        <div className="flex-1 relative">
          <Canvas
            images={images}
            state={state}
            activeTool={activeTool}
            selectedImageId={selectedImageId}
            onImageSelect={handleImageSelect}
            onImageUpdate={handleImageUpdate}
            onImageRemove={handleImageRemove}
            linkingState={linkingState}
            onImageLink={handleImageLink}
            onLinkingStateChange={handleLinkingStateChange}
            onUpscaleImage={handleUpscaleImage}
            onViewChange={setCanvasView}
          />
        </div>
        <ChatPanel
          input={promptInput}
          onInputChange={setPromptInput}
          onSend={handleSend}
          loading={isThinking}
          onImageUpload={handleImageUpload}
          activeTool={activeTool}
          onToolChange={setActiveTool}
          onCenterCanvas={handleCenterCanvas}
          selectedAspectRatio={selectedAspectRatio}
          onAspectRatioChange={setSelectedAspectRatio}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
        />
      </main>
    </div>
  );
}