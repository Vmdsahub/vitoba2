import React, { useEffect, useRef, useState } from 'react';
import ReactQuill from 'react-quill';
import { modules, formats } from '../utils/quillConfig';
import ImageModal from './ImageModal';
import VideoPlayer from './VideoPlayer';

import '../styles/topic.css';

interface CommentRendererProps {
  delta?: any;
  content?: string;
}

function CommentRenderer({ delta, content }: CommentRendererProps) {
  // Se content for fornecido, tentar fazer parse para delta
  const actualDelta = delta || (content ? (() => {
    try {
      return JSON.parse(content);
    } catch {
      // Se não conseguir fazer parse, criar um delta simples com o texto
      return { ops: [{ insert: content }] };
    }
  })() : null);
  const quillRef = useRef<ReactQuill>(null);
  const [modalImage, setModalImage] = useState<{ src: string; alt: string; isVideo: boolean } | null>(null);
  const [videoModal, setVideoModal] = useState<{
    src: string;
    filename: string;
  } | null>(null);

  // Função para lidar com cliques nas imagens
  const handleImageClick = (src: string, alt: string) => {
    console.log("🖼️ Comment Image clicked:", src);
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

  // Configurar função global para abrir modal de vídeo
  useEffect(() => {
    (window as any).openVideoModal = (src: string, filename: string) => {
      setVideoModal({ src, filename });
    };
    
    return () => {
      delete (window as any).openVideoModal;
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
      console.log('🎬 CommentRenderer: Processando vídeos...');
      
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
  }, [actualDelta]);

  return (
    <>
      <div className="comment-shell comment-view">
        <ReactQuill 
          ref={quillRef}
          theme="snow" 
          value={actualDelta} 
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

      {/* Modal de vídeo */}
      <VideoPlayer
        isOpen={!!videoModal}
        onClose={() => setVideoModal(null)}
        src={videoModal?.src || ""}
        filename={videoModal?.filename || ""}
      />
    </>
  );
}

export { CommentRenderer };
export default CommentRenderer;