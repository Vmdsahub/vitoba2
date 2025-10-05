import { Quill } from 'react-quill';

const Embed = Quill.import('blots/embed');

class VideoBlot extends Embed {
  static create(value) {
    const node = super.create();
    const { id, url, filename } = value;
    
    // Configurar o blot como um container único
    node.setAttribute('data-video-id', id);
    node.setAttribute('data-video-url', url);
    node.setAttribute('data-video-filename', filename);
    node.setAttribute('contenteditable', 'false');
    
    // Estilos do container principal (sem elementos filhos)
    node.style.cssText = `
      position: relative;
      width: 200px;
      height: 150px;
      display: inline-block;
      vertical-align: top;
      margin: 4px;
      border-radius: 8px;
      overflow: hidden;
      cursor: pointer;
      background: #000;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
    `;
    
    // Criar ícone de play usando CSS puro (apenas triângulo, sem círculo)
    node.style.setProperty('--play-icon', `url("data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='63' height='63' viewBox='0 0 63 63'%3E%3Cpath d='M23.625 15.75l23.625 15.75-23.625 15.75z' fill='rgba(255,255,255,0.9)' stroke='rgba(0,0,0,0.3)' stroke-width='1'/%3E%3C/svg%3E")`);        
    node.style.setProperty('--play-icon-small', `url("data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Cpath d='M18 12l18 12-18 12z' fill='rgba(255,255,255,0.9)' stroke='rgba(0,0,0,0.3)' stroke-width='1'/%3E%3C/svg%3E")`);
    
    // Adicionar pseudo-elemento para o ícone de play
    const style = document.createElement('style');
    if (!document.querySelector('#video-blot-styles')) {
      style.id = 'video-blot-styles';
      style.textContent = `
        .ql-video-embed::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 63px;
           height: 63px;
          transform: translate(-50%, -50%);
          background-image: var(--play-icon);
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center;
          transition: all 0.3s ease;
          filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15));
        }
        
        .ql-video-embed.vertical::after {
          width: 48px;
          height: 48px;
          background-image: var(--play-icon-small);
        }
        
        .ql-video-embed:hover::after {
          transform: translate(-50%, -50%) scale(1.1);
          filter: drop-shadow(0 6px 20px rgba(0, 0, 0, 0.25));
        }
        
        .ql-video-embed:hover {
          transform: scale(1.02);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }
      `;
      document.head.appendChild(style);
    }
    
    // Gerar thumbnail do vídeo
    console.log('🎬 Iniciando geração de thumbnail para:', { id, url, filename });
    VideoBlot.generateThumbnail(node, url);
    
    // Evento de clique
    node.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (window.openVideoModal) {
        window.openVideoModal(url, filename);
      } else {
        window.open(url, '_blank');
      }
    });
    
    return node;
  }
  
  static generateThumbnail(node, url) {
    console.log('🎥 generateThumbnail chamada:', { url, nodeId: node.getAttribute('data-video-id') });
    
    const video = document.createElement('video');
    video.style.cssText = 'position: absolute; top: -9999px; left: -9999px; opacity: 0;';
    video.setAttribute('preload', 'metadata');
    video.setAttribute('muted', 'true');
    video.setAttribute('crossorigin', 'anonymous');
    video.src = url;
    
    console.log('🎥 Elemento de vídeo criado e configurado');
    
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position: absolute; top: -9999px; left: -9999px; opacity: 0;';
    
    let cleanupExecuted = false;
    
    const cleanup = () => {
      if (cleanupExecuted) return;
      cleanupExecuted = true;
      
      try {
        if (video.parentNode) document.body.removeChild(video);
        if (canvas.parentNode) document.body.removeChild(canvas);
      } catch (e) {
        console.warn('Erro na limpeza dos elementos temporários:', e);
      }
    };
    
    const handleError = (error) => {
      console.error('Erro ao gerar thumbnail:', error);
      cleanup();
    };
    
    video.addEventListener('error', (e) => {
      console.error('Erro no carregamento do vídeo:', e, url);
      // Fallback: definir dimensões padrão se não conseguir carregar metadados
      const isVertical = url.includes('vertical') || url.includes('portrait') || Math.random() < 0.3; // Heurística simples
      const fixedHeight = 150;
      const fallbackWidth = isVertical ? Math.round(fixedHeight * 0.56) : Math.round(fixedHeight * 1.78); // 9:16 ou 16:9
      
      node.style.width = fallbackWidth + 'px';
      node.style.height = fixedHeight + 'px';
      node.style.backgroundColor = '#1a1a1a';
      
      console.log(`Usando dimensões fallback: ${fallbackWidth}x${fixedHeight} (${isVertical ? 'vertical' : 'horizontal'})`);
      handleError(e);
    });
    
    let metadataProcessed = false;
    
    const processVideoMetadata = () => {
      if (metadataProcessed) return;
      metadataProcessed = true;
      
      try {
        console.log('Processando metadados:', {
          width: video.videoWidth,
          height: video.videoHeight,
          duration: video.duration,
          url: url
        });
        
        const aspectRatio = video.videoWidth / video.videoHeight;
        const fixedHeight = 150;
        const calculatedWidth = Math.max(50, Math.round(fixedHeight * aspectRatio)); // Mínimo de 50px
        const isVertical = aspectRatio < 1;
        
        // Ajustar dimensões do blot proporcionalmente
        node.style.width = calculatedWidth + 'px';
        node.style.height = fixedHeight + 'px';
        
        // Adicionar classe vertical se necessário
        if (isVertical) {
          node.classList.add('vertical');
        } else {
          node.classList.remove('vertical');
        }
        
        // Configurar canvas com as dimensões do vídeo
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Frame aleatório para thumbnail (mais robusto)
        const seekToTime = () => {
          if (video.duration && !isNaN(video.duration) && video.duration > 0) {
            const minTime = Math.max(0.1, video.duration * 0.1);
            const maxTime = Math.min(video.duration - 0.1, video.duration * 0.9);
            const randomTime = Math.random() * (maxTime - minTime) + minTime;
            console.log(`Buscando frame em: ${randomTime.toFixed(2)}s de ${video.duration.toFixed(2)}s`);
            video.currentTime = randomTime;
          } else {
            console.log('Usando fallback: 0.5s');
            video.currentTime = 0.5; // Fallback para 0.5 segundos
          }
        };
        
        // Aguardar um pouco antes de buscar o frame
        setTimeout(seekToTime, 100);
        
        console.log(`Vídeo ${aspectRatio < 1 ? 'vertical' : 'horizontal'}: ${calculatedWidth}x${fixedHeight} (aspect: ${aspectRatio.toFixed(2)})`);
      } catch (error) {
        handleError(error);
      }
    };
    
    video.addEventListener('loadedmetadata', processVideoMetadata);
    video.addEventListener('canplay', processVideoMetadata); // Fallback para alguns formatos
    
    video.addEventListener('seeked', () => {
      try {
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Não foi possível obter contexto do canvas');
        }
        
        // Desenhar frame no canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Converter para data URL e aplicar como background
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        node.style.backgroundImage = `url(${dataUrl})`;
        
        console.log('Thumbnail gerada com sucesso para:', url);
        
        cleanup();
      } catch (error) {
        handleError(error);
      }
    });
    
    // Timeout de segurança
    setTimeout(() => {
      if (!cleanupExecuted) {
        console.warn('Timeout na geração de thumbnail para:', url);
        cleanup();
      }
    }, 10000);
    
    // Adicionar ao DOM temporariamente
    document.body.appendChild(video);
    document.body.appendChild(canvas);
  }
  
  static value(node) {
    return {
      id: node.getAttribute('data-video-id'),
      url: node.getAttribute('data-video-url'),
      filename: node.getAttribute('data-video-filename')
    };
  }
  
  static formats(node) {
    return {
      id: node.getAttribute('data-video-id'),
      url: node.getAttribute('data-video-url'),
      filename: node.getAttribute('data-video-filename')
    };
  }
}

VideoBlot.blotName = 'video';
VideoBlot.tagName = 'div';
VideoBlot.className = 'ql-video-embed';

Quill.register(VideoBlot);

// Função para processar vídeos existentes na página
VideoBlot.processExistingVideos = function() {
  console.log('🔄 Processando vídeos existentes na página...');
  console.warn('🚨 VIDEOBOT EXECUTANDO - Se você vê esta mensagem, o código está rodando!');
  
  // Log mais visível para debug
  console.log('%c🎬 VIDEOBOT DEBUG', 'background: #ff0000; color: #ffffff; font-size: 16px; padding: 4px;');
  
  // Analisar toda a estrutura HTML para encontrar vídeos
  console.log('🔍 Analisando estrutura HTML da página...');
  
  // Buscar todos os iframes
  const allIframes = document.querySelectorAll('iframe');
  console.log(`📺 Total de iframes encontrados: ${allIframes.length}`);
  allIframes.forEach((iframe, i) => {
    console.log(`📺 Iframe ${i + 1}:`, {
      src: iframe.src,
      className: iframe.className,
      parentElement: iframe.parentElement?.tagName,
      parentClass: iframe.parentElement?.className,
      outerHTML: iframe.outerHTML.substring(0, 150) + '...'
    });
  });
  
  // Buscar elementos que podem conter vídeos
  const videoContainers = document.querySelectorAll('div[class*="video"], div[class*="embed"], div[data-video], [data-video-url]');
  console.log(`📦 Containers de vídeo encontrados: ${videoContainers.length}`);
  videoContainers.forEach((container, i) => {
    console.log(`📦 Container ${i + 1}:`, {
      tagName: container.tagName,
      className: container.className,
      attributes: Array.from(container.attributes).map(attr => `${attr.name}="${attr.value}"`),
      innerHTML: container.innerHTML.substring(0, 100) + '...'
    });
  });
  
  // Buscar tanto nossos vídeos customizados quanto os nativos do Quill
  const customVideos = document.querySelectorAll('.ql-video-embed');
  const nativeVideos = document.querySelectorAll('iframe[src*="youtube"], iframe[src*="vimeo"], iframe[src*="secure-file"]');
  
  console.log(`📹 Encontrados ${customVideos.length} vídeos customizados e ${nativeVideos.length} vídeos nativos`);
  
  // Processar vídeos nativos do Quill primeiro (convertê-los)
  nativeVideos.forEach((iframe, index) => {
    if (!iframe.closest('.ql-video-embed')) {
      console.log(`🔄 Convertendo vídeo nativo ${index + 1}:`, iframe.src);
      
      // Criar wrapper customizado
      const wrapper = document.createElement('div');
      wrapper.className = 'ql-video-embed';
      wrapper.setAttribute('data-video-url', iframe.src);
      wrapper.setAttribute('data-video-id', 'converted-' + Date.now() + '-' + index);
      wrapper.setAttribute('contenteditable', 'false');
      
      // Aplicar estilos do VideoBlot
      wrapper.style.cssText = `
        position: relative;
        width: 200px;
        height: 150px;
        display: inline-block;
        vertical-align: top;
        margin: 4px;
        border-radius: 8px;
        overflow: hidden;
        cursor: pointer;
        background: #000;
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
      `;
      
      // Substituir iframe pelo wrapper
      iframe.parentNode.replaceChild(wrapper, iframe);
      
      // Gerar thumbnail
      VideoBlot.generateThumbnail(wrapper, iframe.src);
    }
  });
  
  const existingVideos = document.querySelectorAll('.ql-video-embed');
  console.log(`📹 Total de elementos de vídeo após conversão: ${existingVideos.length}`);
  
  existingVideos.forEach((node, index) => {
    let url = node.getAttribute('data-video-url');
    let id = node.getAttribute('data-video-id');
    
    // Se não tem os atributos customizados, tentar extrair do iframe
    if (!url) {
      const iframe = node.querySelector('iframe');
      if (iframe) {
        url = iframe.src;
        console.log(`🔍 URL extraída do iframe:`, url);
      }
    }
    
    // Se ainda não tem URL, tentar outros métodos
    if (!url) {
      // Verificar se há um atributo src diretamente no elemento
      url = node.getAttribute('src') || node.getAttribute('data-src');
      console.log(`🔍 URL extraída de atributos:`, url);
    }
    
    if (url && !node.style.backgroundImage) {
      console.log(`🎬 Processando vídeo ${index + 1}:`, { id, url });
      
      // Gerar ID se não existir
      if (!id) {
        id = 'video-' + Date.now() + '-' + index;
        node.setAttribute('data-video-id', id);
      }
      
      // Adicionar URL como atributo se não existir
      if (!node.getAttribute('data-video-url')) {
        node.setAttribute('data-video-url', url);
      }
      
      VideoBlot.generateThumbnail(node, url);
    } else if (!url) {
      console.warn('⚠️ Vídeo sem URL encontrado:', node);
      console.log('📋 Conteúdo do elemento:', node.outerHTML.substring(0, 200));
    } else {
      console.log('✅ Vídeo já processado:', { id, url });
    }
  });
};

// Processar vídeos existentes quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', VideoBlot.processExistingVideos);
} else {
  // Se o DOM já estiver carregado, processar imediatamente
  setTimeout(VideoBlot.processExistingVideos, 100);
}

// Forçar execução imediata para debug
console.log('🚨 VIDEOBOT CARREGADO - Executando processamento imediato');
setTimeout(() => {
  console.log('⏰ Timeout executado - chamando processExistingVideos');
  VideoBlot.processExistingVideos();
}, 500);

// Também executar quando a página mudar (para SPAs)
setTimeout(() => {
  console.log('⏰ Segundo timeout - verificando novamente');
  VideoBlot.processExistingVideos();
}, 2000);

// Também processar quando houver mudanças no DOM (para conteúdo dinâmico)
const observer = new MutationObserver((mutations) => {
  let hasNewVideos = false;
  
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node;
        if (element.classList && element.classList.contains('ql-video-embed') || 
            element.querySelector && element.querySelector('.ql-video-embed')) {
          hasNewVideos = true;
        }
      }
    });
  });
  
  if (hasNewVideos) {
    console.log('🔄 Novos vídeos detectados, processando...');
    setTimeout(VideoBlot.processExistingVideos, 100);
  }
});

// Observar mudanças no body
if (document.body) {
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

export default VideoBlot;