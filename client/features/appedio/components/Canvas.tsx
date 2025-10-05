import React, { useState, useRef, useEffect } from "react";
import type { ImageObject, SelectionRect, LinkingState } from "../types";
import { AppState, Tool } from "../types";
import { LoadingSpinner, ImageIcon } from "./Icons";
import { UpscaleModal } from "../../../components/UpscaleModal";
import ImageModal from "../../../components/ImageModal";
import { ImageActionBar } from "./ImageActionBar";

interface CanvasProps {
  images: ImageObject[];
  state: AppState;
  activeTool: Tool | null;
  selectedImageId: string | null;
  onImageSelect: (id: string | null) => void;
  onImageUpdate: (id: string, updates: Partial<Omit<ImageObject, "id" | "imageData">>) => void;
  onImageRemove?: (id: string) => void;
  linkingState?: LinkingState;
  onImageLink?: (sourceId: string, targetId: string) => void;
  onLinkingStateChange?: (newState: Partial<LinkingState>) => void;
  onUpscaleImage?: (imageId: string, modelId: string) => void;
  onViewChange?: (view: { x: number; y: number; zoom: number }) => void;
}

export const Canvas: React.FC<CanvasProps> = ({ images, state, activeTool, selectedImageId, onImageSelect, onImageUpdate, onImageRemove, linkingState, onImageLink, onLinkingStateChange, onUpscaleImage, onViewChange }) => {
  // Inicializar com posição centralizada
  const [view, setView] = useState(() => {
    // Posição inicial centralizada (será ajustada no useEffect)
    return { x: 0, y: 0, zoom: 1 };
  });
  const [interaction, setInteraction] = useState<any>(null);
  const [hoveredImageId, setHoveredImageId] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [upscaleModal, setUpscaleModal] = useState<{ isOpen: boolean; imageId: string | null }>({ isOpen: false, imageId: null });
  const [expandedImage, setExpandedImage] = useState<{ src: string; alt: string } | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);

  // Constantes do canvas
  const CANVAS_SIZE = 5000;
  const CANVAS_HALF = CANVAS_SIZE / 2;

  // Utilitários de geometria para âncoras em 360° nas bordas
  const getRectCenter = (rect: { x: number; y: number; width: number; height: number }) => ({
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  });

  // Retorna o ponto de interseção da reta (do centro do retângulo na direção de 'towards') com a borda do retângulo
  const getBorderAnchor = (
    rect: { x: number; y: number; width: number; height: number },
    towards: { x: number; y: number }
  ) => {
    const cx = rect.x + rect.width / 2;
    const cy = rect.y + rect.height / 2;
    const dx = towards.x - cx;
    const dy = towards.y - cy;

    // Evitar divisão por zero — se direção nula, ancorar no topo por padrão
    const epsilon = 1e-6;
    const candidates: { x: number; y: number; t: number }[] = [];

    // Interseções com lados verticais: x = rect.x e x = rect.x + rect.width
    if (Math.abs(dx) > epsilon) {
      const tLeft = (rect.x - cx) / dx;
      const yLeft = cy + tLeft * dy;
      if (tLeft > 0 && yLeft >= rect.y - epsilon && yLeft <= rect.y + rect.height + epsilon) {
        candidates.push({ x: rect.x, y: yLeft, t: tLeft });
      }

      const tRight = (rect.x + rect.width - cx) / dx;
      const yRight = cy + tRight * dy;
      if (tRight > 0 && yRight >= rect.y - epsilon && yRight <= rect.y + rect.height + epsilon) {
        candidates.push({ x: rect.x + rect.width, y: yRight, t: tRight });
      }
    }

    // Interseções com lados horizontais: y = rect.y e y = rect.y + rect.height
    if (Math.abs(dy) > epsilon) {
      const tTop = (rect.y - cy) / dy;
      const xTop = cx + tTop * dx;
      if (tTop > 0 && xTop >= rect.x - epsilon && xTop <= rect.x + rect.width + epsilon) {
        candidates.push({ x: xTop, y: rect.y, t: tTop });
      }

      const tBottom = (rect.y + rect.height - cy) / dy;
      const xBottom = cx + tBottom * dx;
      if (tBottom > 0 && xBottom >= rect.x - epsilon && xBottom <= rect.x + rect.width + epsilon) {
        candidates.push({ x: xBottom, y: rect.y + rect.height, t: tBottom });
      }
    }

    if (candidates.length === 0) {
      // Direção quase nula — retornar topo central como fallback estável
      return { x: cx, y: rect.y };
    }

    // Escolher a interseção mais próxima (menor t positivo)
    candidates.sort((a, b) => a.t - b.t);
    const best = candidates[0];
    return { x: best.x, y: best.y };
  };

  // Função para centralizar o canvas
  const centerCanvas = () => {
    if (!canvasRef.current) return;
    
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const centerX = canvasRect.width / 2 - CANVAS_HALF;
    const centerY = canvasRect.height / 2 - CANVAS_HALF;
    
    const proposedView = { x: centerX, y: centerY, zoom: 1 };
    const limitedView = applyViewportLimits(proposedView);
    setView(limitedView);
    onViewChange?.(limitedView);
  };

  // Inicializar posição centralizada
  useEffect(() => {
    if (!isInitialized && canvasRef.current) {
      centerCanvas();
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Listener para evento de centralização
  useEffect(() => {
    const handleCenterEvent = () => {
      centerCanvas();
    };

    const canvasElement = canvasRef.current;
    if (canvasElement) {
      canvasElement.addEventListener('centerCanvas', handleCenterEvent);
      return () => {
        canvasElement.removeEventListener('centerCanvas', handleCenterEvent);
      };
    }
  }, []);

  // Convert mouse event to canvas-space coordinates (pre-transform),
  // measuring relative to the transformed wrapper's top-left.
  const getCanvasPoint = (e: React.MouseEvent) => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return { x: 0, y: 0 };
    const rect = wrapper.getBoundingClientRect();
    const x = (e.clientX - rect.left) / view.zoom;
    const y = (e.clientY - rect.top) / view.zoom;
    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const canvasPoint = getCanvasPoint(e);

    const clickedImage = [...images].reverse().find(
      (img) =>
        canvasPoint.x >= img.x &&
        canvasPoint.x <= img.x + img.width &&
        canvasPoint.y >= img.y &&
        canvasPoint.y <= img.y + img.height,
    );

    if (clickedImage) {
      // Sempre selecionar a imagem clicada
      onImageSelect(clickedImage.id);
      const imagePoint = { x: canvasPoint.x - clickedImage.x, y: canvasPoint.y - clickedImage.y };

      // Comportamentos específicos por ferramenta
      if (activeTool === Tool.SELECT) {
        // Preparar para possível movimentação ou seleção
        setInteraction({ type: "selecting", imageId: clickedImage.id, start: imagePoint });
        return;
      }
      if (activeTool === Tool.BRUSH) {
        setInteraction({ type: "brushing", imageId: clickedImage.id });
        const ctx = maskCanvasRef.current?.getContext("2d");
        if (ctx) {
          ctx.beginPath();
          ctx.moveTo(imagePoint.x, imagePoint.y);
        }
        return;
      }
      if (activeTool === Tool.LINK) {
        if (!linkingState?.isLinking) {
          // Primeira imagem selecionada (origem)
          onLinkingStateChange?.({
            isLinking: true,
            sourceImageId: clickedImage.id,
            targetImageId: null,
          });
          onImageSelect(clickedImage.id);
        } else if (linkingState.sourceImageId !== clickedImage.id) {
          // Segunda imagem selecionada (destino)
          onImageLink?.(linkingState.sourceImageId!, clickedImage.id);
          onLinkingStateChange?.({
            isLinking: false,
            sourceImageId: null,
            targetImageId: null,
          });
          onImageSelect(null);
        }
        return;
      }
      if (activeTool === Tool.UPSCALE) {
        // Abrir modal de seleção de modelo de upscale
        setUpscaleModal({ isOpen: true, imageId: clickedImage.id });
        return;
      }
      
      // Para qualquer ferramenta, preparar para possível movimentação
      setInteraction({ type: "dragging", imageId: clickedImage.id, offset: imagePoint });
    } else {
      // Clicou no canvas vazio - iniciar pan automático
      if (activeTool === Tool.LINK && linkingState?.isLinking) {
        // Cancelar linkagem se clicar fora
        onLinkingStateChange?.({
          isLinking: false,
          sourceImageId: null,
          targetImageId: null,
        });
      }
      onImageSelect(null);
      // Iniciar pan automático
      setInteraction({ type: "panning", start: { x: e.clientX, y: e.clientY } });
    }
  };

  // Função para aplicar limites de viewport
  const applyViewportLimits = (newView: { x: number; y: number; zoom: number }) => {
    if (!canvasRef.current) return newView;
    
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const scaledCanvasSize = CANVAS_SIZE * newView.zoom;
    
    // Calcular limites para manter o canvas visível - não permitir que as bordas saiam da viewport
    const maxX = 0;
    const minX = canvasRect.width - scaledCanvasSize;
    const maxY = 0;
    const minY = canvasRect.height - scaledCanvasSize;
    
    // Garantir que o zoom mínimo mantenha as bordas sempre visíveis
    const minZoomX = canvasRect.width / CANVAS_SIZE;
    const minZoomY = canvasRect.height / CANVAS_SIZE;
    const minZoom = Math.max(minZoomX, minZoomY, 0.1); // Zoom mínimo absoluto
    
    const limitedZoom = Math.max(minZoom, Math.min(newView.zoom, 5));
    const limitedScaledSize = CANVAS_SIZE * limitedZoom;
    
    // Recalcular limites com o zoom corrigido
    const limitedMinX = canvasRect.width - limitedScaledSize;
    const limitedMinY = canvasRect.height - limitedScaledSize;
    
    return {
      zoom: limitedZoom,
      x: Math.max(limitedMinX, Math.min(maxX, newView.x)),
      y: Math.max(limitedMinY, Math.min(maxY, newView.y)),
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const canvasPoint = getCanvasPoint(e);
    
    // Atualizar posição do mouse para seta de linkagem
    if (activeTool === Tool.LINK && linkingState?.isLinking) {
      setMousePosition({ x: canvasPoint.x, y: canvasPoint.y });
    }
    
    if (!interaction) return;

    if (interaction.type === "panning") {
      setView((prev) => {
        const proposedView = {
          ...prev,
          x: prev.x + (e.clientX - interaction.start.x),
          y: prev.y + (e.clientY - interaction.start.y),
        };
        const limitedView = applyViewportLimits(proposedView);
        onViewChange?.(limitedView);
        return limitedView;
      });
      setInteraction({ ...interaction, start: { x: e.clientX, y: e.clientY } });
    } else if (interaction.type === "dragging") {
      const newX = canvasPoint.x - interaction.offset.x;
      const newY = canvasPoint.y - interaction.offset.y;
      onImageUpdate(interaction.imageId, { x: newX, y: newY });
    } else if (interaction.type === "selecting") {
      const selectedImage = images.find((img) => img.id === interaction.imageId);
      if (!selectedImage) return;

      const end = { x: canvasPoint.x - selectedImage.x, y: canvasPoint.y - selectedImage.y };
      const rect: SelectionRect = {
        x: Math.min(interaction.start.x, end.x),
        y: Math.min(interaction.start.y, end.y),
        width: Math.abs(interaction.start.x - end.x),
        height: Math.abs(interaction.start.y - end.y),
      };
      setInteraction({ ...interaction, rect });
    } else if (interaction.type === "brushing") {
      const selectedImage = images.find((img) => img.id === interaction.imageId);
      if (!selectedImage) return;
      const ctx = maskCanvasRef.current?.getContext("2d");
      if (ctx) {
        ctx.lineTo(canvasPoint.x - selectedImage.x, canvasPoint.y - selectedImage.y);
        ctx.stroke();
      }
    }
  };

  const handleMouseUp = () => {
    if (interaction?.type === "selecting" && interaction.rect) {
      onImageUpdate(interaction.imageId, { selection: interaction.rect, mask: undefined });
    }
    if (interaction?.type === "brushing") {
      const maskCanvas = maskCanvasRef.current;
      if (maskCanvas) {
        const mimeType = "image/png";
        const base64 = maskCanvas.toDataURL(mimeType).split(",")[1];
        if (base64) {
          onImageUpdate(interaction.imageId, { mask: { base64, mimeType }, selection: undefined });
        }
      }
    }
    setInteraction(null);
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const scaleAmount = -e.deltaY * 0.001;
    
    // Obter posição do cursor no canvas antes do zoom
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    
    const rect = wrapper.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    setView((prev) => {
      // Calcular novo zoom limitado
      const newZoom = Math.max(0.2, Math.min(prev.zoom + scaleAmount, 5));
      
      // Se o zoom não mudou, não fazer nada
      if (newZoom === prev.zoom) return prev;
      
      // Calcular a posição do cursor no espaço do canvas antes do zoom
      const canvasMouseX = (mouseX - prev.x) / prev.zoom;
      const canvasMouseY = (mouseY - prev.y) / prev.zoom;
      
      // Calcular nova posição da view para manter o cursor no mesmo ponto do canvas
      const newX = mouseX - canvasMouseX * newZoom;
      const newY = mouseY - canvasMouseY * newZoom;
      
      const proposedView = { x: newX, y: newY, zoom: newZoom };
      const limitedView = applyViewportLimits(proposedView);
      onViewChange?.(limitedView);
      return limitedView;
    });
  };

  const getCursor = () => {
    if (interaction?.type === "panning") return "grabbing";
    if (interaction?.type === "dragging") return "grabbing";
    
    // Cursor inteligente baseado no contexto
    if (hoveredImageId) {
      // Quando hover sobre uma imagem
      if (activeTool === Tool.UPSCALE) return "zoom-in";
      if (activeTool === Tool.BRUSH) return "crosshair";
      if (activeTool === Tool.LINK) return "pointer";
      return "move"; // Cursor de movimentação quando hover sobre imagem
    } else {
      // Quando hover sobre canvas vazio
      if (activeTool === Tool.BRUSH) return "crosshair";
      if (activeTool === Tool.UPSCALE) return "zoom-in";
      if (activeTool === Tool.LINK) return "pointer";
      return "grab"; // Pan será ativado por padrão quando nenhuma ferramenta ativa
    }
  };

  const downloadImage = (image: ImageObject) => {
    const link = document.createElement('a');
    link.href = `data:${image.imageData.mimeType};base64,${image.imageData.base64}`;
    link.download = `image-${image.id}.${image.imageData.mimeType.split('/')[1]}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImageMouseEnter = (imageId: string) => {
    setHoveredImageId(imageId);
  };

  const handleImageMouseLeave = () => {
    setHoveredImageId(null);
  };

  const handleDownloadClick = (e: React.MouseEvent, image: ImageObject) => {
    e.preventDefault();
    e.stopPropagation();
    downloadImage(image);
  };

  const selectedImage = images.find((img) => img.id === selectedImageId);

  useEffect(() => {
    if (selectedImage && maskCanvasRef.current) {
      const canvas = maskCanvasRef.current;
      const ctx = canvas.getContext("2d");
      canvas.width = selectedImage.width;
      canvas.height = selectedImage.height;
      if (ctx) {
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "white";
        ctx.lineWidth = 20;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        if (selectedImage.mask) {
          const img = new Image();
          img.onload = () => ctx.drawImage(img, 0, 0);
          img.src = `data:${selectedImage.mask.mimeType};base64,${selectedImage.mask.base64}`;
        }
      }
    }
  }, [selectedImage, selectedImage?.mask]);

  return (
    <div
      ref={canvasRef}
      data-canvas-container
      className="absolute inset-0 overflow-hidden bg-gray-100"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      style={{ 
        cursor: getCursor(),
        // Grid moderno com padrão mais sutil e contemporâneo que se move com o canvas
        backgroundImage: `
          radial-gradient(circle at 1px 1px, rgba(148, 163, 184, 0.15) 1px, transparent 0),
          radial-gradient(circle at 1px 1px, rgba(148, 163, 184, 0.08) 1px, transparent 0)
        `,
        backgroundSize: `32px 32px, 8px 8px`,
        backgroundPosition: `${view.x % 32}px ${view.y % 32}px, ${(view.x + 16) % 8}px ${(view.y + 16) % 8}px`
      }}
    >
      {state === AppState.LOADING && (
        <div className="absolute inset-0 bg-white/70 z-30 flex flex-col items-center justify-center backdrop-blur-sm">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">AI is thinking...</p>
        </div>
      )}
      {images.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-gray-500 pointer-events-none">
          <ImageIcon className="w-16 h-16 mx-auto mb-4" />
          <p className="font-semibold">Upload an image to start editing</p>
          <p className="text-sm">Use the upload button on the left.</p>
        </div>
      )}

      <div ref={wrapperRef} className="relative" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})`, transformOrigin: "top left" }}>
        {/* Canvas bounds - área delimitada de 5000x5000 */}
        <div 
          className="absolute border-4 border-black border-dashed bg-white/5"
          style={{
            left: 0,
            top: 0,
            width: CANVAS_SIZE,
            height: CANVAS_SIZE,
            pointerEvents: 'none'
          }}
        />
        
        {/* Connection lines between original and edited images */}
        {images.filter(img => img.originalImageId).map((editedImage) => {
          const originalImage = images.find(img => img.id === editedImage.originalImageId);
          if (!originalImage) return null;
          
          // Âncoras nas bordas em 360°, sem flips
          const originalRect = { x: originalImage.x, y: originalImage.y, width: originalImage.width, height: originalImage.height };
          const editedRect = { x: editedImage.x, y: editedImage.y, width: editedImage.width, height: editedImage.height };
          const editedCenter = getRectCenter(editedRect);
          const originalCenter = getRectCenter(originalRect);
          const start = getBorderAnchor(originalRect, editedCenter);
          const end = getBorderAnchor(editedRect, originalCenter);
          const startX = start.x, startY = start.y;
          const endX = end.x, endY = end.y;
          
          return (
            <svg
              key={`connection-${editedImage.id}`}
              className="absolute pointer-events-none"
              style={{
                left: Math.min(startX, endX) - 10,
                top: Math.min(startY, endY) - 10,
                width: Math.abs(endX - startX) + 20,
                height: Math.abs(endY - startY) + 20,
              }}
            >
              <defs>
                <marker
                  id={`arrowhead-${editedImage.id}`}
                  markerWidth="12"
                  markerHeight="8"
                  refX="10"
                  refY="4"
                  orient="auto"
                  markerUnits="userSpaceOnUse"
                >
                  <polygon points="0 0, 12 4, 0 8" fill="#8b5cf6" />
                </marker>
              </defs>
              <line
                x1={startX > endX ? Math.abs(endX - startX) + 10 : 10}
                y1={startY > endY ? Math.abs(endY - startY) + 10 : 10}
                x2={startX > endX ? 10 : Math.abs(endX - startX) + 10}
                y2={startY > endY ? 10 : Math.abs(endY - startY) + 10}
                stroke="#8b5cf6"
                strokeWidth="3"
                strokeDasharray="10,5"
                markerEnd={`url(#arrowhead-${editedImage.id})`}
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeLinejoin="round"
                shapeRendering="geometricPrecision"
              />
            </svg>
          );
        })}

        {/* Render existing links */}
        {images.filter(img => img.linkedTo && img.linkedTo.length > 0).map((sourceImage) => {
          return sourceImage.linkedTo!.map((targetId) => {
            const targetImage = images.find(img => img.id === targetId);
            if (!targetImage) return null;
            
            // Âncoras dinâmicas nas bordas para links existentes
            const sourceRect = { x: sourceImage.x, y: sourceImage.y, width: sourceImage.width, height: sourceImage.height };
            const targetRect = { x: targetImage.x, y: targetImage.y, width: targetImage.width, height: targetImage.height };
            const sourceCenter = getRectCenter(sourceRect);
            const targetCenter = getRectCenter(targetRect);
            const startPt = getBorderAnchor(sourceRect, targetCenter);
            const endPt = getBorderAnchor(targetRect, sourceCenter);
            const startX = startPt.x, startY = startPt.y;
            const endX = endPt.x, endY = endPt.y;
            
            return (
              <svg
                key={`link-${sourceImage.id}-${targetId}`}
                className="absolute pointer-events-none"
                style={{
                  left: Math.min(startX, endX) - 10,
                  top: Math.min(startY, endY) - 10,
                  width: Math.abs(endX - startX) + 20,
                  height: Math.abs(endY - startY) + 20,
                }}
              >
                <defs>
                  <marker
                    id={`link-arrowhead-${sourceImage.id}-${targetId}`}
                    markerWidth="12"
                    markerHeight="8"
                    refX="10"
                    refY="4"
                    orient="auto"
                    markerUnits="userSpaceOnUse"
                  >
                    <polygon 
                      points="0 0, 12 4, 0 8" 
                      fill="#ef4444" 
                    />
                  </marker>
                </defs>
                <line
                  x1={startX > endX ? Math.abs(endX - startX) + 10 : 10}
                  y1={startY > endY ? Math.abs(endY - startY) + 10 : 10}
                  x2={startX > endX ? 10 : Math.abs(endX - startX) + 10}
                  y2={startY > endY ? 10 : Math.abs(endY - startY) + 10}
                  stroke="#ef4444"
                  strokeWidth="3"
                  strokeDasharray="10,5"
                  markerEnd={`url(#link-arrowhead-${sourceImage.id}-${targetId})`}
                  opacity="0.9"
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  shapeRendering="geometricPrecision"
                />
              </svg>
            );
          });
        }).flat()}
        
        {/* Render dynamic linking arrow */}
        {activeTool === Tool.LINK && linkingState?.isLinking && linkingState.sourceImageId && (() => {
          const sourceImage = images.find(img => img.id === linkingState.sourceImageId);
          if (!sourceImage) return null;
          
          // Calcular ponto de início na borda da imagem source baseado na posição do mouse
          const sourceRect = { x: sourceImage.x, y: sourceImage.y, width: sourceImage.width, height: sourceImage.height };
          const endX = mousePosition.x;
          const endY = mousePosition.y;
          const startPt = getBorderAnchor(sourceRect, { x: endX, y: endY });
          const startX = startPt.x;
          const startY = startPt.y;

          // Evitar flicker em distâncias muito curtas
          const dx = endX - startX;
          const dy = endY - startY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 12) return null;
          
          return (
            <svg
              key="dynamic-link-arrow"
              className="absolute pointer-events-none z-50"
              style={{
                left: Math.min(startX, endX) - 15,
                top: Math.min(startY, endY) - 15,
                width: Math.abs(endX - startX) + 30,
                height: Math.abs(endY - startY) + 30,
              }}
            >
              <defs>
                <marker
                  id="dynamic-link-arrowhead"
                  markerWidth="12"
                  markerHeight="8"
                  refX="10"
                  refY="4"
                  orient="auto"
                  markerUnits="userSpaceOnUse"
                >
                  <polygon points="0 0, 12 4, 0 8" fill="#3b82f6" />
                </marker>
              </defs>
              <line
                x1={startX > endX ? Math.abs(endX - startX) + 15 : 15}
                y1={startY > endY ? Math.abs(endY - startY) + 15 : 15}
                x2={startX > endX ? 15 : Math.abs(endX - startX) + 15}
                y2={startY > endY ? 15 : Math.abs(endY - startY) + 15}
                stroke="#3b82f6"
                strokeWidth="3"
                strokeDasharray="10,5"
                markerEnd="url(#dynamic-link-arrowhead)"
                opacity="0.9"
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeLinejoin="round"
                shapeRendering="geometricPrecision"
              />
            </svg>
          );
        })()}
        
        {images.map((image) => {
          const isSelected = image.id === selectedImageId;
          const currentSelection = interaction?.type === "selecting" && interaction.imageId === image.id ? interaction.rect : image.selection;
          const isOriginal = image.isOriginal;
          const isEdited = !isOriginal && image.originalImageId;
          const isLinkingSource = linkingState?.isLinking && linkingState.sourceImageId === image.id;

          return (
            <React.Fragment key={image.id}>
              {/* Área de hover expandida (30% maior que a imagem) */}
              <div
                className="absolute pointer-events-auto"
                style={{ 
                  left: image.x - (image.width * 0.15), 
                  top: image.y - (image.height * 0.15), 
                  width: image.width * 1.3, 
                  height: image.height * 1.3 + 60 // +60 para incluir a área da barra de ações
                }}
                onMouseEnter={() => handleImageMouseEnter(image.id)}
                onMouseLeave={handleImageMouseLeave}
              >
                {/* Imagem real */}
                <div
                  className={`absolute ${
                    isLinkingSource
                      ? "ring-2 ring-green-500 ring-offset-2 animate-pulse"
                      : isSelected 
                      ? "ring-2 ring-blue-500 ring-offset-2" 
                      : isOriginal 
                      ? "ring-1 ring-green-400" 
                      : isEdited 
                      ? "ring-1 ring-purple-400" 
                      : ""
                  }`}
                  style={{ 
                    left: image.width * 0.15, 
                    top: image.height * 0.15, 
                    width: image.width, 
                    height: image.height 
                  }}
                >
                  {/* Image label */}
                  <div className={`absolute -top-6 left-0 px-2 py-1 text-xs font-medium rounded ${
                    isOriginal 
                      ? "bg-green-100 text-green-800" 
                      : isEdited 
                      ? "bg-purple-100 text-purple-800" 
                      : "bg-gray-100 text-gray-800"
                  }`}>
                    {isOriginal ? "Original" : isEdited ? "Edited" : "Image"}
                  </div>
                  
                  <img src={`data:${image.imageData.mimeType};base64,${image.imageData.base64}`} alt="Editable content" className="w-full h-full object-cover pointer-events-none" draggable="false" />
                  
                  {isSelected && currentSelection && (
                    <div className="absolute border-2 border-dashed border-blue-500 bg-blue-500/20 pointer-events-none" style={{ left: currentSelection.x, top: currentSelection.y, width: currentSelection.width, height: currentSelection.height }} />
                  )}
                  {isSelected && (activeTool === Tool.BRUSH || image.mask) && <canvas ref={maskCanvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-50" />}
                </div>
                
                {/* Barra de ações moderna abaixo da imagem */}
                {hoveredImageId === image.id && (
                  <div 
                    className="absolute z-20 pointer-events-none"
                    style={{ 
                      left: image.width * 0.15, 
                      top: image.height * 0.15 + image.height + 8,
                      width: image.width 
                    }}
                  >
                    <div className="flex justify-center pointer-events-auto">
                      <ImageActionBar
                        image={image}
                        onExpand={() => {
                          setExpandedImage({
                            src: `data:${image.imageData.mimeType};base64,${image.imageData.base64}`,
                            alt: "Imagem expandida"
                          });
                        }}
                        onDelete={() => {
                          if (confirm("Tem certeza que deseja excluir esta imagem?")) {
                            if (selectedImageId === image.id) {
                              onImageSelect(null);
                            }
                            onImageRemove?.(image.id);
                          }
                        }}
                        onDownload={() => downloadImage(image)}
                        onViewPrompt={() => {
                          console.log("Ver prompt:", image.prompt);
                        }}
                        onExtractPrompt={() => {
                          console.log("Extrair prompt - funcionalidade em desenvolvimento");
                        }}
                        prompt={image.prompt}
                      />
                    </div>
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>
      
      {/* Modal de Upscale */}
      <UpscaleModal
        isOpen={upscaleModal.isOpen}
        onClose={() => setUpscaleModal({ isOpen: false, imageId: null })}
        onSelectModel={(modelId) => {
          if (upscaleModal.imageId && onUpscaleImage) {
            onUpscaleImage(upscaleModal.imageId, modelId);
          }
        }}
        imageId={upscaleModal.imageId || ""}
      />

      {/* Modal de visualização expandida */}
      <ImageModal
        isOpen={!!expandedImage}
        onClose={() => setExpandedImage(null)}
        src={expandedImage?.src || ""}
        alt={expandedImage?.alt || ""}
        isVideo={false}
      />
    </div>
  );
};
