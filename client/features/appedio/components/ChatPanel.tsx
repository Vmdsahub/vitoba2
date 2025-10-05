import React, { useRef, useEffect, useState } from "react";
import type { ChatMessage, ImageData } from "../types";
import { Tool } from "../types";
import { LoadingSpinner, UploadIcon, SelectionIcon, BrushIcon, LinkIcon, UpscaleIcon, CenterIcon } from "./Icons";
import { AIModelSelector } from "@/components/AIModelSelector";
import { AspectRatioSelector } from "@/components/AspectRatioSelector";
import { getDefaultModel } from "@/config/aiModels";

interface ChatPanelProps {
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  loading?: boolean;
  onImageUpload: (imageData: ImageData) => void;
  activeTool: Tool | null;
  onToolChange: (tool: Tool | null) => void;
  onCenterCanvas?: () => void;
  selectedAspectRatio?: string;
  onAspectRatioChange?: (ratio: string) => void;
  selectedModel?: string;
  onModelChange?: (modelId: string) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ 
  input, 
  onInputChange, 
  onSend, 
  loading,
  onImageUpload,
  activeTool,
  onToolChange,
  onCenterCanvas,
  selectedAspectRatio = "1:1",
  onAspectRatioChange,
  selectedModel,
  onModelChange
}) => {
  const [internalSelectedModel, setInternalSelectedModel] = useState(getDefaultModel().id);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use external selectedModel if provided, otherwise use internal state
  const currentSelectedModel = selectedModel || internalSelectedModel;

  const handleModelChange = (modelId: string) => {
    if (onModelChange) {
      onModelChange(modelId);
    } else {
      setInternalSelectedModel(modelId);
    }
    console.log("Modelo selecionado:", modelId);
  };

  const handleAspectRatioChange = (ratio: string) => {
    onAspectRatioChange?.(ratio);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !loading) {
        onSend();
      }
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const newHeight = Math.min(textarea.scrollHeight, 60);
      textarea.style.height = `${newHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      const base64Data = base64.split(",")[1];
      onImageUpload({
        base64: base64Data,
        mimeType: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const COLORS = {
    upload: { 
      border: "border-orange-700", 
      ring: "ring-orange-700", 
      rgb: "251, 146, 60",
      bg: "bg-orange-500",
      bgHover: "hover:bg-orange-600",
      shadow: "shadow-orange-500/50"
    },
    upscale: { 
      border: "border-purple-700", 
      ring: "ring-purple-700", 
      rgb: "168, 85, 247",
      bg: "bg-purple-500",
      bgHover: "hover:bg-purple-600",
      shadow: "shadow-purple-500/50"
    },
    select: { 
      border: "border-blue-700", 
      ring: "ring-blue-700", 
      rgb: "59, 130, 246",
      bg: "bg-blue-500",
      bgHover: "hover:bg-blue-600",
      shadow: "shadow-blue-500/50"
    },
    brush: { 
      border: "border-green-700", 
      ring: "ring-green-700", 
      rgb: "34, 197, 94",
      bg: "bg-green-500",
      bgHover: "hover:bg-green-600",
      shadow: "shadow-green-500/50"
    },
    link: { 
      border: "border-red-700", 
      ring: "ring-red-700", 
      rgb: "239, 68, 68",
      bg: "bg-red-500",
      bgHover: "hover:bg-red-600",
      shadow: "shadow-red-500/50"
    },
    center: { 
      border: "border-orange-700", 
      ring: "ring-orange-600", 
      rgb: "194,65,12",
      bg: "bg-orange-500",
      bgHover: "hover:bg-orange-600",
      shadow: "shadow-orange-500/50"
    },
  };

  // Novos ícones mais modernos e apropriados
  const ModernIcons = {
    upload: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="7,10 12,5 17,10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="12" y1="5" x2="12" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    upscale: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
        <path d="M8 3H5a2 2 0 0 0-2 2v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M21 8V5a2 2 0 0 0-2-2h-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M3 16v3a2 2 0 0 0 2 2h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16 21h3a2 2 0 0 0 2-2v-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M15 9l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    select: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
        <path d="M3 7V5a2 2 0 0 1 2-2h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M17 3h2a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M21 17v2a2 2 0 0 1-2 2h-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7 21H5a2 2 0 0 1-2-2v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="7" y="7" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="2" fill="none"/>
      </svg>
    ),
    brush: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
        <path d="M15.5 2.5L21.5 8.5L8.5 21.5L2.5 15.5L15.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M18 11L13 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="5" cy="19" r="2" stroke="currentColor" strokeWidth="2" fill="none"/>
      </svg>
    ),
    link: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    center: (
      <svg viewBox="0 0 48 48" fill="none" className="w-5 h-5">
        <path d="M10,22v2c0,7.72,6.28,14,14,14s14-6.28,14-14s-6.28-14-14-14h-4V4l-8,8l8,8v-6h4c5.514,0,10,4.486,10,10s-4.486,10-10,10 s-10-4.486-10-10v-2H10z" stroke="currentColor" strokeWidth="2" fill="currentColor"/>
      </svg>
    )
  };

  const ToolButton: React.FC<{
    label: string;
    children: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
    colorKey: keyof typeof COLORS;
  }> = ({ label, children, isActive, onClick, colorKey }) => {
    
    // Design minimalista e moderno
    const baseStyle = {
      width: '40px',
      height: '40px',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      border: 'none',
      outline: 'none',
      position: 'relative' as const,
    };

    // Cores mais sutis e elegantes
    const colors = {
      upload: { bg: '#f97316', hover: '#ea580c' },
      upscale: { bg: '#8b5cf6', hover: '#7c3aed' },
      select: { bg: '#3b82f6', hover: '#2563eb' },
      brush: { bg: '#10b981', hover: '#059669' },
      link: { bg: '#ef4444', hover: '#dc2626' },
      center: { bg: '#f97316', hover: '#ea580c' },
    };

    const color = colors[colorKey];

    const activeStyle = {
      ...baseStyle,
      backgroundColor: color.bg,
      boxShadow: `0 4px 12px ${color.bg}40, 0 2px 4px ${color.bg}20`,
      transform: 'translateY(-1px)',
    };

    const inactiveStyle = {
      ...baseStyle,
      backgroundColor: '#f8fafc',
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    };

    const hoverStyle = isActive 
      ? { backgroundColor: color.hover }
      : { backgroundColor: '#f1f5f9', borderColor: '#cbd5e1' };

    return (
      <button
        onClick={onClick}
        style={isActive ? activeStyle : inactiveStyle}
        className="group"
        aria-label={label}
        title={label}
        onMouseEnter={(e) => {
          Object.assign(e.currentTarget.style, hoverStyle);
        }}
        onMouseLeave={(e) => {
          Object.assign(e.currentTarget.style, isActive ? activeStyle : inactiveStyle);
        }}
      >
        <div 
          style={{ 
            color: isActive ? '#ffffff' : '#64748b',
            transition: 'all 0.2s ease'
          }}
          className="group-hover:scale-110"
        >
          {ModernIcons[colorKey]}
        </div>
      </button>
    );
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-4xl px-6 z-50 pointer-events-none">
        <div className="pointer-events-auto">{/* Wrapper para permitir interação apenas com o conteúdo */}
      <div className="bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-xl overflow-hidden">
        {/* Toolbar de ferramentas no topo */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50/80 border-b border-gray-200/50">
          <div className="flex items-center space-x-4">
            <ToolButton label="Upload Image" colorKey="upload" isActive={false} onClick={handleUploadClick}>
              <UploadIcon className="w-4 h-4" />
            </ToolButton>
            <ToolButton label="Upscale Tool" colorKey="upscale" isActive={activeTool === Tool.UPSCALE} onClick={() => onToolChange(activeTool === Tool.UPSCALE ? null : Tool.UPSCALE)}>
              <UpscaleIcon className="w-4 h-4" />
            </ToolButton>
            <ToolButton label="Selection Tool" colorKey="select" isActive={activeTool === Tool.SELECT} onClick={() => onToolChange(activeTool === Tool.SELECT ? null : Tool.SELECT)}>
              <SelectionIcon className="w-4 h-4" />
            </ToolButton>
            <ToolButton label="Mask Brush" colorKey="brush" isActive={activeTool === Tool.BRUSH} onClick={() => onToolChange(activeTool === Tool.BRUSH ? null : Tool.BRUSH)}>
              <BrushIcon className="w-4 h-4" />
            </ToolButton>
            <ToolButton label="Link Tool" colorKey="link" isActive={activeTool === Tool.LINK} onClick={() => onToolChange(activeTool === Tool.LINK ? null : Tool.LINK)}>
              <LinkIcon className="w-4 h-4" />
            </ToolButton>
          </div>
          
          {/* Botão de centralizar canvas no canto direito */}
          <div className="flex-shrink-0">
            <ToolButton 
              label="Centralizar Canvas" 
              colorKey="center" 
              isActive={false} 
              onClick={() => onCenterCanvas?.()}
            >
              <CenterIcon className="w-4 h-4" />
            </ToolButton>
          </div>
        </div>
        
        {/* Input area */}
        <div className="flex items-end p-4 space-x-3 relative">
          {/* Seletores de modelo e aspect ratio */}
          <div className="flex-shrink-0 flex space-x-2">
            {/* Seletor de modelo */}
            <div className="w-10 h-10 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200">
              <AIModelSelector
                selectedModel={currentSelectedModel}
                onModelChange={handleModelChange}
                className="border-0 bg-transparent text-xs font-medium text-gray-600 hover:text-gray-800 w-8 h-8 p-0 rounded-full"
              />
            </div>
            
            {/* Seletor de aspect ratio */}
            <div className="w-10 h-10 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200">
              <AspectRatioSelector
                selectedRatio={selectedAspectRatio}
                onRatioChange={handleAspectRatioChange}
                selectedModel={currentSelectedModel}
                className="border-0 bg-transparent text-xs font-medium text-gray-600 hover:text-gray-800 w-8 h-8 p-0 rounded-full"
              />
            </div>
          </div>

          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Descreva sua edição ou o que deseja criar..."
              className="w-full resize-none border-0 bg-transparent text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-0 text-base leading-relaxed min-h-[24px] max-h-[60px] overflow-y-auto"
              rows={1}
              style={{ height: "24px" }}
            />
          </div>
          
          {/* Send button - agora preto */}
          <button
            onClick={onSend}
            disabled={loading || input.trim().length === 0}
            className="flex-shrink-0 w-10 h-10 bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white rounded-xl disabled:cursor-not-allowed transition-all duration-200 ease-out shadow-lg hover:shadow-xl disabled:shadow-md flex items-center justify-center group"
            aria-label="Send message"
          >
            {loading ? (
              <LoadingSpinner className="w-5 h-5" />
            ) : (
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="w-5 h-5 transform group-hover:-translate-y-0.5 transition-transform duration-200"
              >
                <path d="M12 19V5" />
                <path d="m5 12 7-7 7 7" />
              </svg>
            )}
          </button>
        </div>
      </div>
      
      {/* Input file oculto */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/png, image/jpeg, image/webp" 
      />
        </div> {/* Fechando wrapper pointer-events-auto */}
      </div>
    );
  };
