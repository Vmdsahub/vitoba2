import React from "react";

interface UpscaleModel {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface UpscaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectModel: (modelId: string) => void;
  imageId: string;
}

const upscaleModels: UpscaleModel[] = [
  {
    id: "clarity",
    name: "Clarity",
    description: "Melhor para imagens com detalhes finos e texto",
    icon: "✨"
  },
  {
    id: "topaz",
    name: "Topaz",
    description: "Ideal para fotografias e imagens naturais",
    icon: "💎"
  },
  {
    id: "esrgan",
    name: "ESRGAN",
    description: "Excelente para arte digital e ilustrações",
    icon: "🎨"
  }
];

export const UpscaleModal: React.FC<UpscaleModalProps> = ({ 
  isOpen, 
  onClose, 
  onSelectModel, 
  imageId 
}) => {
  if (!isOpen) return null;

  const handleModelSelect = (modelId: string) => {
    onSelectModel(modelId);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Escolher Modelo de Upscale
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Selecione o modelo que melhor se adequa à sua imagem
          </p>
        </div>

        {/* Models List */}
        <div className="p-6 space-y-3">
          {upscaleModels.map((model) => (
            <button
              key={model.id}
              onClick={() => handleModelSelect(model.id)}
              className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group"
            >
              <div className="flex items-start space-x-3">
                <span className="text-2xl">{model.icon}</span>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 group-hover:text-blue-700">
                    {model.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {model.description}
                  </p>
                </div>
                <svg 
                  className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              O processo pode levar alguns segundos
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};