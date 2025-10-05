import React, { useEffect, useRef, useState } from 'react';
import ReactQuill from 'react-quill';
import { modules, formats } from '../utils/quillConfig';
import ImageModal from './ImageModal';

import '../styles/topic.css';

interface TopicViewProps {
  delta: any;
  imageUrl?: string;
}

function TopicView({ delta, imageUrl }: TopicViewProps) {
  const quillRef = useRef<ReactQuill>(null);
  const [modalImage, setModalImage] = useState<{ src: string; alt: string; isVideo: boolean } | null>(null);

  // Função para lidar com cliques nas imagens
  const handleImageClick = (src: string, alt: string) => {
    console.log("🖼️ Image clicked:", src);
    setModalImage({ src, alt, isVideo: false });
  };

  // Configurar função global para abrir modal de imagem
  useEffect(() => {
    (window as any).openImageModal = (src: string, alt: string, isVideo: boolean) => {
      setModalImage({ src, alt, isVideo });
    };

    return () => {
      delete (window as any).openImageModal;
    };
  }, []);

  // Configurar handlers de clique nas imagens
  useEffect(() => {
    const setupImageClickHandlers = () => {
      const quillContainer = quillRef.current?.getEditor()?.container;
      if (!quillContainer) return;

      const images = quillContainer.querySelectorAll('.ql-editor img:not([data-click-handled])');
      images.forEach((img) => {
        const imageEl = img as HTMLImageElement;
        imageEl.setAttribute('data-click-handled', 'true');
        imageEl.style.cursor = 'pointer';

        imageEl.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const src = imageEl.src;
          const alt = imageEl.alt || 'Imagem';
          handleImageClick(src, alt);
        });
      });
    };

    // Configurar handlers após renderização
    const timer = setTimeout(setupImageClickHandlers, 100);
    return () => clearTimeout(timer);
  }, [delta]);

  // Processar vídeos após a renderização
  useEffect(() => {
    const processVideos = () => {
      console.log('🎬 TopicView: Processando vídeos...');
      
      // Buscar todos os iframes na área do Quill
      const quillContainer = quillRef.current?.getEditor()?.container;
      if (!quillContainer) {
        console.log('❌ Container do Quill não encontrado');
        return;
      }
      
      const iframes = quillContainer.querySelectorAll('iframe');
      console.log(`📺 Encontrados ${iframes.length} iframes no Quill`);
      
      iframes.forEach((iframe, index) => {
        console.log(`📺 Iframe ${index + 1}:`, {
          src: iframe.src,
          width: iframe.width,
          height: iframe.height,
          style: iframe.style.cssText
        });
        
        // Aplicar correção de proporção para vídeos
         if (iframe.src && (iframe.src.includes('secure-file') || iframe.src.includes('youtube') || iframe.src.includes('vimeo'))) {
           // Detectar proporção baseada nas dimensões atuais
           const currentWidth = iframe.offsetWidth || parseInt(iframe.width) || 560;
           const currentHeight = iframe.offsetHeight || parseInt(iframe.height) || 315;
           const aspectRatio = currentWidth / currentHeight;
           
           console.log(`📐 Analisando vídeo - Dimensões: ${currentWidth}x${currentHeight}, Proporção: ${aspectRatio.toFixed(2)}`);
           
           // Aplicar estilos baseados na proporção
           if (aspectRatio < 1) {
             // Vídeo vertical (proporção menor que 1:1)
             console.log(`📱 Vídeo VERTICAL detectado (${aspectRatio.toFixed(2)}:1)`);
             
             iframe.style.width = '200px';
             iframe.style.height = '356px';
             iframe.style.maxWidth = '200px';
             iframe.style.minWidth = '150px';
           } else if (aspectRatio < 1.5) {
             // Vídeo quadrado ou quase quadrado
             console.log(`⏹️ Vídeo QUADRADO detectado (${aspectRatio.toFixed(2)}:1)`);
             
             iframe.style.width = '280px';
             iframe.style.height = '280px';
             iframe.style.maxWidth = '280px';
           } else {
             // Vídeo horizontal (proporção maior que 1.5:1)
             console.log(`📺 Vídeo HORIZONTAL detectado (${aspectRatio.toFixed(2)}:1)`);
             
             iframe.style.width = '400px';
             iframe.style.height = '225px';
             iframe.style.maxWidth = '400px';
           }
           
           // Estilos comuns para todos os vídeos
           iframe.style.display = 'inline-block';
           iframe.style.verticalAlign = 'top';
           iframe.style.margin = '4px';
           iframe.style.borderRadius = '8px';
           iframe.style.border = 'none';
           
           console.log(`✅ Vídeo ajustado:`, {
             finalWidth: iframe.style.width,
             finalHeight: iframe.style.height,
             aspectRatio: aspectRatio.toFixed(2)
           });
         }
      });
    };
    
    // Processar após um pequeno delay para garantir que o Quill terminou de renderizar
    const timer = setTimeout(processVideos, 500);
    
    return () => clearTimeout(timer);
  }, [delta]);

  return (
    <>
      <div className="topic-shell topic-view">
        {imageUrl && (
          <img 
            src={imageUrl} 
            className="rounded-2xl mb-4 w-auto max-h-96 object-cover" 
            alt="" 
          />
        )}
        <ReactQuill 
          ref={quillRef}
          theme="snow" 
          value={delta} 
          readOnly 
          modules={{ ...modules, toolbar: false }} 
          formats={formats} 
        />
      </div>

      {/* Modal de imagem */}
      <ImageModal
        isOpen={!!modalImage}
        onClose={() => setModalImage(null)}
        src={modalImage?.src || ""}
        alt={modalImage?.alt || ""}
        isVideo={modalImage?.isVideo || false}
      />
    </>
  );
}

export { TopicView };
export default TopicView;