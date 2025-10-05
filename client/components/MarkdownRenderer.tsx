import { useState, useEffect } from "react";
import ImageModal from "@/components/ImageModal";
import VideoPlayer from "@/components/VideoPlayer";
import { cleanContentForDisplay } from "@/utils/contentCleaner";

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const [modalImage, setModalImage] = useState<{
    src: string;
    alt: string;
    isVideo: boolean;
  } | null>(null);
  const [videoModal, setVideoModal] = useState<{
    src: string;
    filename: string;
  } | null>(null);

  // Simple function to handle video clicks
  const handleVideoClick = (src: string, name: string) => {
    console.log("🎬 Video clicked:", src);
    setModalImage({ src, alt: name, isVideo: true });
  };

  // Simple function to handle image clicks
  const handleImageClick = (src: string, alt: string) => {
    console.log("🖼️ Image clicked:", src);
    setModalImage({ src, alt, isVideo: false });
  };

  // Criar thumbnail de vídeo com DOM
  const createVideoThumbnail = (id: string, url: string, filename: string) => {
    const videoId = `video_${id}`;
    const decodedUrl = decodeURIComponent(url);
    const decodedFilename = decodeURIComponent(filename);
    
    // Registrar handler globalmente
    setTimeout(() => {
      const element = document.getElementById(videoId);
      if (element) {
        element.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          handleVideoClick(decodedUrl, decodedFilename);
        };
        
        // Adicionar eventos de hover
        element.addEventListener('mouseenter', () => {
          element.style.transform = 'scale(1.02)';
          element.style.boxShadow = '0 12px 40px rgba(0,0,0,0.25)';
          const overlay = element.querySelector('.video-overlay') as HTMLElement;
          if (overlay) {
            overlay.style.background = 'rgba(0,0,0,0.4)';
            overlay.style.backdropFilter = 'blur(4px)';
          }
          const playBtn = element.querySelector('.play-button') as HTMLElement;
          if (playBtn) {
            playBtn.style.transform = 'scale(1.15)';
            playBtn.style.background = 'rgba(255,255,255,0.25)';
            playBtn.style.boxShadow = '0 12px 48px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3)';
          }
        });
        
        element.addEventListener('mouseleave', () => {
          element.style.transform = 'scale(1)';
          element.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          const overlay = element.querySelector('.video-overlay') as HTMLElement;
          if (overlay) {
            overlay.style.background = 'rgba(0,0,0,0.2)';
            overlay.style.backdropFilter = 'blur(2px)';
          }
          const playBtn = element.querySelector('.play-button') as HTMLElement;
          if (playBtn) {
            playBtn.style.transform = 'scale(1)';
            playBtn.style.background = 'rgba(255,255,255,0.15)';
            playBtn.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)';
          }
        });
      }
    }, 0);

    return `
      <div id="${videoId}" class="video-thumbnail-container" style="
        position: relative;
        display: inline-block;
        width: var(--thumbnail-width, 200px);
        height: var(--thumbnail-height, 150px);
        margin: 8px 4px;
        border-radius: 8px;
        overflow: hidden;
        cursor: pointer;
        border: 1px solid #e5e7eb;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        transition: all 0.2s ease;
        background: #000;
      ">
        <video style="
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        " preload="metadata" muted onloadedmetadata="
          const video = this;
          const container = this.parentElement;
          if (video.videoWidth && video.videoHeight) {
            const aspectRatio = video.videoWidth / video.videoHeight;
            const isVertical = aspectRatio < 1;
            // Altura fixa de 150px para todos os tipos de mídia
            const fixedHeight = 150;
            const width = Math.round(fixedHeight * aspectRatio);
            
            container.style.setProperty('--thumbnail-width', width + 'px');
            container.style.setProperty('--thumbnail-height', fixedHeight + 'px');
            container.style.width = width + 'px';
            container.style.height = fixedHeight + 'px';
            
            // Ajustar tamanho do botão de play baseado no aspect ratio
            const playButton = container.querySelector('[data-play-button]');
            const playIcon = container.querySelector('[data-play-button] svg');
            if (playButton && playIcon && !isVertical) {
                    // Tamanho otimizado para vídeos não verticais (reduzido 30%)
                    playButton.style.width = '73px';
                    playButton.style.height = '73px';
                    playIcon.setAttribute('width', '31');
                    playIcon.setAttribute('height', '31');
                  }
            
            // Generate random time for thumbnail
            const minTime = video.duration * 0.1;
            const maxTime = video.duration * 0.9;
            const randomTime = Math.random() * (maxTime - minTime) + minTime;
            video.currentTime = randomTime;
          }
        ">
          <source src="${decodedUrl}" type="video/mp4">
        </video>
        <div class="video-overlay" style="
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0,0,0,0.2);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          backdrop-filter: blur(2px);
        ">
          <div class="play-button" style="
            width: 56px;
            height: 56px;
            background: rgba(255,255,255,0.15);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255,255,255,0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2);
            cursor: pointer;
          " data-play-button>
            <svg width="24" height="24" viewBox="0 0 24 24" style="margin-left: 3px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
              <path d="M8 5v14l11-7z" fill="rgba(255,255,255,0.95)"/>
            </svg>
          </div>
        </div>
      </div>
    `;
  };

  // Process content and add click handlers
  const processContent = () => {
    // First clean any edit-mode attributes from content
    let processedContent = cleanContentForDisplay(content);

    // Preserve line breaks: convert <div><br></div> to proper line breaks
    processedContent = processedContent.replace(/<div><br><\/div>/g, "<br>");
    processedContent = processedContent.replace(/<div><br\/><\/div>/g, "<br>");

    // Convert empty divs to line breaks
    processedContent = processedContent.replace(/<div>\s*<\/div>/g, "<br>");

    // Ensure <br> tags are properly preserved
    processedContent = processedContent.replace(/<br><br>/g, "<br><br>");

    // Replace image patterns with clickable images
    processedContent = processedContent.replace(
      /!\[(.*?)\]\((.*?)\)/g,
      (match, alt, src) => {
        const imageId = `img_${Math.random().toString(36).substr(2, 9)}`;
        // Store handler in a global registry
        setTimeout(() => {
          const element = document.getElementById(imageId);
          if (element) {
            element.onclick = (e) => {
              e.preventDefault();
              e.stopPropagation();
              handleImageClick(src, alt);
            };
          }
        }, 0);

        return `<img id="${imageId}" src="${src}" alt="${alt}" style="max-width: 120px; width: 120px; height: auto; border-radius: 8px; border: 1px solid #e5e7eb; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin: 0 8px 8px 0; display: inline-block; vertical-align: top; cursor: pointer;" />`;
      },
    );

    // Replace video patterns with clickable video previews (old format)
    processedContent = processedContent.replace(
      /\[Vídeo: (.*?)\]\((.*?)\)/g,
      (match, name, src) => {
        const videoId = Math.random().toString(36).substr(2, 9);
        return createVideoThumbnail(videoId, src, name);
      },
    );

    // Replace new video placeholder format: [VIDEO:id:url:filename]
    processedContent = processedContent.replace(
      /\[VIDEO:([^:]+):([^:]+):([^\]]+)\]/g,
      (match, id, url, filename) => {
        return createVideoThumbnail(id, url, filename);
      },
    );

    return processedContent;
  };

  const closeModal = () => {
    console.log("❌ Closing modal");
    setModalImage(null);
  };

  // Setup global function for image modal
  useEffect(() => {
    (window as any).openImageModal = (
      src: string,
      alt: string,
      isVideo: boolean,
    ) => {
      setModalImage({ src, alt, isVideo });
    };

    // Setup global function for video modal
    (window as any).openVideoModal = (src: string, filename: string) => {
      setVideoModal({ src, filename });
    };

    return () => {
      delete (window as any).openImageModal;
      delete (window as any).openVideoModal;
    };
  }, []);

  return (
    <>
      <div
        className="max-w-none text-gray-700 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: processContent() }}
        style={{
          wordBreak: "break-word",
          overflowWrap: "break-word",
          whiteSpace: "pre-wrap",
          lineHeight: "1.6",
        }}
      />

      <ImageModal
        isOpen={!!modalImage}
        onClose={closeModal}
        src={modalImage?.src || ""}
        alt={modalImage?.alt || ""}
        isVideo={modalImage?.isVideo || false}
      />
      
      <VideoPlayer
        isOpen={!!videoModal}
        onClose={() => setVideoModal(null)}
        src={videoModal?.src || ""}
        filename={videoModal?.filename || ""}
      />
    </>
  );
}