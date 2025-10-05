import React, { useEffect, useRef } from 'react';
import { X, Download } from 'lucide-react';
import Model3DViewer from './Model3DViewer';

interface Model3DModalProps {
  isOpen: boolean;
  onClose: () => void;
  modelUrl: string;
  modelName?: string;
}

export default function Model3DModal({ 
  isOpen, 
  onClose, 
  modelUrl, 
  modelName 
}: Model3DModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Fechar modal com ESC
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Fechar modal clicando fora
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === modalRef.current) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = modelUrl;
    link.download = modelName || 'modelo-3d';
    link.click();
  };

  return (
    <div 
      ref={modalRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full h-full max-w-6xl max-h-[90vh] m-4">
        {/* Botão X para fechar - apenas símbolo sem fundo */}
        <button
          onClick={onClose}
          className="absolute top-12 z-10 w-10 h-10 flex items-center justify-center text-black hover:text-gray-600 transition-all duration-200"
          style={{ right: '-15px' }}
        >
          <X size={20} />
        </button>

        {/* Viewer 3D com controles habilitados */}
        <div className="w-full h-full flex items-center justify-center">
          <Model3DViewer
            modelUrl={modelUrl}
            width={Math.min(window.innerWidth - 32, 1200)}
            height={Math.min(window.innerHeight - 32, 800)}
            autoRotate={false}
            enableControls={true}
            onError={(error) => {
              console.error('Erro no modal 3D:', error);
            }}
          />
        </div>

        {/* Nome do modelo - texto puro em preto */}
        {modelName && (
          <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-10">
            <span className="text-black text-lg font-medium">
              {modelName}
            </span>
          </div>
        )}

        {/* Botão de download - apenas símbolo sem fundo */}
        <button
          onClick={handleDownload}
          className="absolute bottom-12 z-10 w-10 h-10 flex items-center justify-center text-black hover:text-gray-600 transition-all duration-200"
          style={{ right: '-15px' }}
          title="Download do modelo"
        >
          <Download size={20} />
        </button>
      </div>
    </div>
  );
}