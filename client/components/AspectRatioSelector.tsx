import React from "react";
import { ChevronDown, Crop } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface AspectRatio {
  id: string;
  label: string;
  value: string;
  resolution: string;
  tokens: number;
  icon?: React.ReactNode;
}

// Aspect ratios base (sem as opções riscadas)
export const BASE_ASPECT_RATIOS: AspectRatio[] = [
  {
    id: "1:1",
    label: "Quadrado",
    value: "1:1",
    resolution: "1024x1024",
    tokens: 1290,
    icon: <div className="w-3 h-3 border border-gray-400 rounded-sm" />
  },
  {
    id: "3:4",
    label: "Retrato Alto",
    value: "3:4",
    resolution: "864x1184",
    tokens: 1290,
    icon: <div className="w-2.5 h-3.5 border border-gray-400 rounded-sm" />
  },
  {
    id: "4:3",
    label: "Paisagem Clássica",
    value: "4:3",
    resolution: "1184x864",
    tokens: 1290,
    icon: <div className="w-3.5 h-2.5 border border-gray-400 rounded-sm" />
  },
  {
    id: "9:16",
    label: "Vertical Mobile",
    value: "9:16",
    resolution: "768x1344",
    tokens: 1290,
    icon: <div className="w-1.5 h-4 border border-gray-400 rounded-sm" />
  },
  {
    id: "16:9",
    label: "Widescreen",
    value: "16:9",
    resolution: "1344x768",
    tokens: 1290,
    icon: <div className="w-4 h-1.5 border border-gray-400 rounded-sm" />
  },
  {
    id: "21:9",
    label: "Ultra Wide",
    value: "21:9",
    resolution: "1536x672",
    tokens: 1290,
    icon: <div className="w-5 h-1.5 border border-gray-400 rounded-sm" />
  }
];

// Aspect ratios específicos para Seedream 4.0
export const SEEDREAM_ASPECT_RATIOS: AspectRatio[] = [
  ...BASE_ASPECT_RATIOS,
  {
    id: "32:9",
    label: "Ultra Panorâmico",
    value: "32:9",
    resolution: "4096x1152",
    tokens: 1290,
    icon: <div className="w-6 h-1 border border-gray-400 rounded-sm" />
  }
];

// Função para obter aspect ratios baseado no modelo selecionado
export const getAspectRatiosForModel = (modelId?: string): AspectRatio[] => {
  switch (modelId) {
    case "seedream-4":
      return SEEDREAM_ASPECT_RATIOS;
    default:
      return BASE_ASPECT_RATIOS;
  }
};

interface AspectRatioSelectorProps {
  selectedRatio: string;
  onRatioChange: (ratioValue: string) => void;
  selectedModel?: string;
  className?: string;
}

export const AspectRatioSelector: React.FC<AspectRatioSelectorProps> = ({
  selectedRatio,
  onRatioChange,
  selectedModel,
  className
}) => {
  const availableRatios = getAspectRatiosForModel(selectedModel);
  const currentRatio = availableRatios.find(ratio => ratio.value === selectedRatio) || availableRatios[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center justify-center px-3 py-2 text-sm hover:bg-gray-100 focus:outline-none min-w-[44px] h-[40px] transition-colors",
            className
          )}
          title={`Aspect Ratio: ${currentRatio.label} (${currentRatio.value})`}
        >
          <Crop className="w-4 h-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b">
          Proporções de Imagem
          {selectedModel === "seedream-4" && (
            <span className="ml-2 text-green-600">(Seedream 4.0)</span>
          )}
        </div>
        {availableRatios.map((ratio) => (
          <DropdownMenuItem
            key={ratio.id}
            onClick={() => onRatioChange(ratio.value)}
            className={cn(
              "flex items-center gap-3 p-3 cursor-pointer",
              selectedRatio === ratio.value && "bg-blue-50"
            )}
          >
            <div className="flex items-center justify-center w-6 h-6">
              {ratio.icon}
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm">{ratio.label}</div>
              <div className="text-xs text-gray-500">
                {ratio.value} • {ratio.resolution}
              </div>
            </div>
            <div className="text-xs text-gray-400">
              {ratio.tokens} tokens
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AspectRatioSelector;