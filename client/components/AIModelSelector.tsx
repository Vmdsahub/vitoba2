import React from "react";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { AI_MODELS, type AIModel } from "@/config/aiModels";

interface AIModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  className?: string;
}

export const AIModelSelector: React.FC<AIModelSelectorProps> = ({
  selectedModel,
  onModelChange,
  className
}) => {
  const currentModel = AI_MODELS.find(model => model.id === selectedModel) || AI_MODELS[0];

  const getModelIcon = (modelId: string, status: string) => {
    switch (modelId) {
      case 'nano-banana':
        return <span className="text-lg">🍌</span>;
      case 'seedream-4':
        return <span className="text-lg">🌱</span>;
      case 'chatgpt-5':
        return <span className="text-lg">🤖</span>;
      default:
        return <div className="w-2 h-2 bg-gray-400 rounded-full" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center justify-center px-3 py-2 text-sm hover:bg-gray-100 focus:outline-none min-w-[44px] h-[40px] transition-colors",
            className
          )}
          title={currentModel.name}
        >
          {getModelIcon(currentModel.id, currentModel.status)}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {AI_MODELS.map((model) => (
          <DropdownMenuItem
            key={model.id}
            onClick={() => model.status === "available" && onModelChange(model.id)}
            disabled={model.status === "coming-soon"}
            className={cn(
              "flex items-center gap-3 p-3 cursor-pointer",
              model.status === "coming-soon" && "opacity-50 cursor-not-allowed",
              selectedModel === model.id && "bg-blue-50"
            )}
          >
            {getModelIcon(model.id, model.status)}
            <div className="flex-1">
              <div className="font-medium text-sm">{model.name}</div>
              {model.description && (
                <div className="text-xs text-gray-500">{model.description}</div>
              )}
            </div>
            {model.status === "coming-soon" && (
              <span className="text-xs text-yellow-600 font-medium">Em breve</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AIModelSelector;