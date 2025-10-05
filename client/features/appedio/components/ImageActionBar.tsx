import React, { useState } from "react";
import type { ImageObject } from "../types";
import { 
  Expand, 
  Trash2, 
  Download, 
  Eye, 
  FileText,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface ImageActionBarProps {
  image: ImageObject;
  onExpand: () => void;
  onDelete: () => void;
  onDownload: () => void;
  onViewPrompt?: () => void;
  onExtractPrompt?: () => void;
  prompt?: string; // O prompt usado para gerar/editar a imagem
}

export const ImageActionBar: React.FC<ImageActionBarProps> = ({
  image,
  onExpand,
  onDelete,
  onDownload,
  onViewPrompt,
  onExtractPrompt,
  prompt
}) => {
  const [showPrompt, setShowPrompt] = useState(false);
  
  // Determinar se deve mostrar o botão "Ver Prompt"
  const hasPrompt = prompt && prompt.trim().length > 0;
  const isGeneratedOrEdited = !image.isOriginal || image.originalImageId;

  // Calcular largura responsiva baseada no aspect ratio da imagem
  const getBarWidth = () => {
    const aspectRatio = image.width / image.height;
    
    // Para aspect ratios muito largos (como 32:9), usar largura maior
    if (aspectRatio >= 3.5) return "min-w-[400px] max-w-[500px]";
    // Para aspect ratios largos (como 16:9), usar largura média
    if (aspectRatio >= 1.5) return "min-w-[300px] max-w-[400px]";
    // Para aspect ratios quadrados ou verticais, usar largura menor
    return "min-w-[250px] max-w-[300px]";
  };

  const ActionButton: React.FC<{
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    variant?: "default" | "danger";
    disabled?: boolean;
  }> = ({ icon, label, onClick, variant = "default", disabled = false }) => {
    const baseClasses = "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-1";
    
    const variantClasses = {
      default: "bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-800 focus:ring-blue-500",
      danger: "bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 focus:ring-red-500"
    };

    const disabledClasses = "opacity-50 cursor-not-allowed";

    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${baseClasses} ${variantClasses[variant]} ${disabled ? disabledClasses : ""}`}
        title={label}
        aria-label={label}
      >
        {icon}
      </button>
    );
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      {/* Barra de ações principal */}
      <div className={`${getBarWidth()} bg-white/95 backdrop-blur-sm border border-gray-200/80 rounded-xl shadow-lg shadow-black/5 px-3 py-2`}>
        <div className="flex items-center justify-center space-x-2">
          {/* Botão Expandir */}
          <ActionButton
            icon={<Expand className="w-4 h-4" />}
            label="Expandir imagem"
            onClick={onExpand}
          />

          {/* Botão Download */}
          <ActionButton
            icon={<Download className="w-4 h-4" />}
            label="Baixar imagem"
            onClick={onDownload}
          />

          {/* Botão Ver Prompt - só aparece se a imagem foi gerada/editada e tem prompt */}
          {hasPrompt && isGeneratedOrEdited && (
            <ActionButton
              icon={<Eye className="w-4 h-4" />}
              label="Ver prompt usado"
              onClick={() => {
                setShowPrompt(!showPrompt);
                onViewPrompt?.();
              }}
            />
          )}

          {/* Botão Extrair Prompt - placeholder para desenvolvimento futuro */}
          <ActionButton
            icon={<FileText className="w-4 h-4" />}
            label="Extrair prompt (em desenvolvimento)"
            onClick={() => {
              // Placeholder - será implementado futuramente
              console.log("Extrair prompt - funcionalidade em desenvolvimento");
              onExtractPrompt?.();
            }}
            disabled={true}
          />

          {/* Separador visual */}
          <div className="w-px h-6 bg-gray-200" />

          {/* Botão Deletar */}
          <ActionButton
            icon={<Trash2 className="w-4 h-4" />}
            label="Excluir imagem"
            onClick={onDelete}
            variant="danger"
          />
        </div>
      </div>

      {/* Área do prompt - aparece quando "Ver Prompt" é clicado */}
      {hasPrompt && isGeneratedOrEdited && showPrompt && (
        <div className={`${getBarWidth()} bg-white/95 backdrop-blur-sm border border-gray-200/80 rounded-xl shadow-lg shadow-black/5 p-4 animate-in slide-in-from-top-2 duration-200`}>
          <div className="flex items-start justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-800 flex items-center">
              <FileText className="w-4 h-4 mr-2 text-gray-600" />
              Prompt usado:
            </h4>
            <button
              onClick={() => setShowPrompt(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Fechar prompt"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
            <p className="text-sm text-gray-700 leading-relaxed break-words">
              {prompt}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};