import { Quill } from 'react-quill';

const Embed = Quill.import('blots/embed');

class AudioBlot extends Embed {
  static create(value) {
    const node = super.create();
    const { id, url, filename } = value;
    
    // Configurar o blot como um container único
    node.setAttribute('data-audio-id', id);
    node.setAttribute('data-audio-url', url);
    node.setAttribute('data-audio-filename', filename);
    node.setAttribute('contenteditable', 'false');
    
    // Estilos do container principal - design moderno e minimalista
    node.style.cssText = `
      position: relative;
      width: 350px;
      height: 25px;
      display: inline-block;
      vertical-align: middle;
      margin: 0 4px;
      border-radius: 6px;
      overflow: hidden;
      cursor: pointer;
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      line-height: 1;
    `;
    
    // Criar estrutura HTML do player com design moderno
    node.innerHTML = `
      <div class="audio-player-container" style="
        display: flex;
        align-items: center;
        height: 25px;
        padding: 0 12px;
        gap: 8px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
        box-sizing: border-box;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        margin: 0;
      ">
        <!-- Audio filename - posicionado dentro do reprodutor -->
        <div class="audio-filename" style="
          font-size: 9px;
          color: #495057;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
          min-width: 0;
          margin-right: 4px;
        ">${filename}</div>

        <!-- Play/Pause Button -->
        <button class="play-pause-btn" style="
          width: 16px;
          height: 16px;
          border: none;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          flex-shrink: 0;
          box-sizing: border-box;
          position: relative;
          margin: 0;
          padding: 0;
        " title="Play/Pause">
          <svg class="play-icon" width="10" height="10" viewBox="0 0 24 24" fill="#000000" style="position: relative; margin-left: 1px;">
            <path d="M8 5v14l11-7z"/>
          </svg>
          <svg class="pause-icon" width="10" height="10" viewBox="0 0 24 24" fill="#000000" style="display: none; position: relative;">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
          </svg>
        </button>

        <!-- Progress Bar -->
        <div class="progress-container" style="
          flex: 1;
          height: 3px;
          background: #e9ecef;
          border-radius: 2px;
          position: relative;
          cursor: pointer;
          box-sizing: border-box;
          margin: 0 4px;
          overflow: hidden;
          min-width: 40px;
        ">
          <div class="progress-bar" style="
            height: 100%;
            background: linear-gradient(90deg, #000000 0%, #333333 100%);
            border-radius: 2px;
            width: 0%;
            transition: width 0.15s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            box-shadow: 0 0 8px rgba(0, 0, 0, 0.3);
          "></div>
          <div class="progress-thumb" style="
            position: absolute;
            top: 50%;
            left: 0%;
            width: 10px;
            height: 10px;
            background: linear-gradient(135deg, #000000 0%, #333333 100%);
            border: 2px solid white;
            border-radius: 50%;
            transform: translate(-50%, -50%);
            opacity: 0;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
          "></div>
        </div>

        <!-- Time Display -->
        <span class="time-display" style="
          font-size: 8px;
          color: #6c757d;
          font-weight: 500;
          min-width: 45px;
          text-align: center;
          flex-shrink: 0;
          line-height: 1;
          box-sizing: border-box;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          margin: 0;
          padding: 0;
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
        ">0:00 / 0:00</span>

        <!-- Volume Control -->
        <div class="volume-container" style="
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          flex-shrink: 0;
          box-sizing: border-box;
          position: relative;
          height: 100%;
          margin: 0;
          padding: 0;
        ">
          <button class="volume-btn" style="
            width: 16px;
            height: 16px;
            border: none;
            background: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #64748b;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            box-sizing: border-box;
            position: relative;
            margin: 0;
            padding: 0;
            border-radius: 4px;
          " title="Volume">
            <svg class="volume-icon" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="position: relative;">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
            </svg>
          </button>
          <div class="volume-slider-container" style="
            width: 24px;
            height: 3px;
            background: #e9ecef;
            border-radius: 2px;
            position: relative;
            cursor: pointer;
            overflow: hidden;
          ">
            <div class="volume-fill" style="
              height: 100%;
              background: #000000;
              border-radius: 2px;
              width: 100%;
              transition: width 0.15s cubic-bezier(0.4, 0, 0.2, 1);
            "></div>
            <input class="volume-slider" type="range" min="0" max="1" step="0.05" value="1" style="
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              opacity: 0;
              cursor: pointer;
              -webkit-appearance: none;
              appearance: none;
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            " title="Volume">
          </div>
        </div>

        <!-- Download Button -->
        <button class="download-btn" style="
          width: 16px;
          height: 16px;
          border: none;
          background: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          flex-shrink: 0;
          box-sizing: border-box;
          position: relative;
          margin: 0;
          padding: 0;
          border-radius: 4px;
        " title="Download">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="position: relative;">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
          </svg>
        </button>
      </div>

      <!-- Hidden Audio Element -->
      <audio class="audio-element" preload="metadata" style="display: none;">
        <source src="${url}" type="audio/mpeg">
        Seu navegador não suporta áudio HTML5.
      </audio>
    `;
    
    // Configurar funcionalidades do player
    AudioBlot.setupPlayer(node);
    
    return node;
  }
  
  static setupPlayer(node) {
    const audio = node.querySelector('.audio-element');
    const playPauseBtn = node.querySelector('.play-pause-btn');
    const playIcon = node.querySelector('.play-icon');
    const pauseIcon = node.querySelector('.pause-icon');
    const progressContainer = node.querySelector('.progress-container');
    const progressBar = node.querySelector('.progress-bar');
    const progressThumb = node.querySelector('.progress-thumb');
    const timeDisplay = node.querySelector('.time-display');
    const volumeBtn = node.querySelector('.volume-btn');
    const volumeSlider = node.querySelector('.volume-slider');
    const volumeFill = node.querySelector('.volume-fill');
    const downloadBtn = node.querySelector('.download-btn');
    const volumeIcon = node.querySelector('.volume-icon');
    
    let isPlaying = false;
    let isDragging = false;
    let currentVolume = 1;
    
    // Função para formatar tempo
    const formatTime = (seconds) => {
      if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) return '0:00';
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
    
    // Função para atualizar display de tempo
    const updateTimeDisplay = () => {
      const currentTime = audio.currentTime || 0;
      const duration = audio.duration;
      
      // Verificar se a duração é válida
      const validDuration = duration && isFinite(duration) && !isNaN(duration) && duration > 0;
      
      const current = formatTime(currentTime);
      const total = validDuration ? formatTime(duration) : '0:00';
      
      timeDisplay.textContent = `${current} / ${total}`;
    };
    
    // Função para atualizar barra de progresso
    const updateProgress = () => {
      const duration = audio.duration;
      const validDuration = duration && isFinite(duration) && !isNaN(duration) && duration > 0;
      
      if (!isDragging && validDuration) {
        const progress = Math.max(0, Math.min(100, (audio.currentTime / duration) * 100));
        progressBar.style.width = `${progress}%`;
        progressThumb.style.left = `${progress}%`;
      }
    };
    
    // Função para atualizar volume visual
    const updateVolumeDisplay = () => {
      const volumePercentage = audio.volume * 100;
      if (volumeSlider) {
        volumeSlider.value = audio.volume;
      }
      if (volumeFill) {
        volumeFill.style.width = `${volumePercentage}%`;
      }
      
      // Atualizar ícone baseado no volume
      if (volumeIcon) {
        if (audio.volume === 0) {
          volumeIcon.innerHTML = '<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" fill="#000000"/>';
        } else if (audio.volume < 0.5) {
          volumeIcon.innerHTML = '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" fill="#000000"/>';
        } else {
          volumeIcon.innerHTML = '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" fill="#000000"/>';
        }
      }
    };
    
    // Função para verificar se os metadados estão carregados
    const checkMetadataLoaded = () => {
      const duration = audio.duration;
      return duration && isFinite(duration) && !isNaN(duration) && duration > 0;
    };
    
    // Função para forçar carregamento dos metadados
    const forceLoadMetadata = () => {
      if (!checkMetadataLoaded()) {
        // Tentar carregar os metadados
        audio.load();
        
        // Definir currentTime para 0 para forçar carregamento
        setTimeout(() => {
          if (!checkMetadataLoaded()) {
            audio.currentTime = 0;
          }
        }, 50);
      }
    };
    
    // Event listeners do áudio - melhorados para exibir tempo imediatamente
    audio.addEventListener('loadstart', () => {
      updateTimeDisplay();
      updateProgress();
    });
    
    audio.addEventListener('loadedmetadata', () => {
      updateTimeDisplay();
      updateProgress();
    });

    audio.addEventListener('loadeddata', () => {
      updateTimeDisplay();
      updateProgress();
    });

    audio.addEventListener('canplay', () => {
      updateTimeDisplay();
      updateProgress();
    });
    
    audio.addEventListener('canplaythrough', () => {
      updateTimeDisplay();
      updateProgress();
    });
    
    audio.addEventListener('durationchange', () => {
      updateTimeDisplay();
      updateProgress();
    });
    
    // Forçar carregamento inicial dos metadados
    forceLoadMetadata();
    
    // Verificação imediata se já temos metadados
    if (checkMetadataLoaded()) {
      updateTimeDisplay();
      updateProgress();
    }
    
    // Fallback com múltiplas tentativas
    let attempts = 0;
    const maxAttempts = 10;
    
    const metadataCheckInterval = setInterval(() => {
      attempts++;
      
      if (checkMetadataLoaded()) {
        updateTimeDisplay();
        updateProgress();
        clearInterval(metadataCheckInterval);
      } else if (attempts >= maxAttempts) {
        // Após várias tentativas, parar de verificar
        clearInterval(metadataCheckInterval);
        console.warn('Não foi possível carregar metadados do áudio:', audio.src);
      } else if (attempts % 3 === 0) {
        // A cada 3 tentativas, forçar carregamento novamente
        forceLoadMetadata();
      }
    }, 200);
    
    audio.addEventListener('timeupdate', () => {
      updateTimeDisplay();
      updateProgress();
    });
    
    audio.addEventListener('ended', () => {
      isPlaying = false;
      playIcon.style.display = 'block';
      pauseIcon.style.display = 'none';
      progressBar.style.width = '0%';
      progressThumb.style.left = '0%';
      audio.currentTime = 0;
      updateTimeDisplay();
    });
    
    // Play/Pause
    playPauseBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (isPlaying) {
        audio.pause();
        isPlaying = false;
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
      } else {
        // Pausar outros áudios na página
        document.querySelectorAll('.audio-element').forEach(otherAudio => {
          if (otherAudio !== audio && !otherAudio.paused) {
            otherAudio.pause();
          }
        });
        audio.play();
        isPlaying = true;
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
      }
    });
    
    // Controle de progresso melhorado
    progressContainer.addEventListener('mouseenter', () => {
      progressThumb.style.opacity = '1';
    });
    
    progressContainer.addEventListener('mouseleave', () => {
      if (!isDragging) {
        progressThumb.style.opacity = '0';
      }
    });
    
    // Função para calcular posição precisa do clique
    const handleProgressClick = (e) => {
      const duration = audio.duration;
      const validDuration = duration && isFinite(duration) && !isNaN(duration) && duration > 0;
      
      if (!validDuration) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      const rect = progressContainer.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const containerWidth = rect.width;
      
      // Garantir que o clique está dentro dos limites
      const clampedX = Math.max(0, Math.min(clickX, containerWidth));
      const percentage = clampedX / containerWidth;
      
      // Calcular novo tempo com maior precisão
      const newTime = percentage * duration;
      const clampedTime = Math.max(0, Math.min(duration, newTime));
      
      // Definir novo tempo
      audio.currentTime = clampedTime;
      
      // Atualizar visualmente imediatamente
      const visualPercentage = (clampedTime / duration) * 100;
      progressBar.style.width = `${visualPercentage}%`;
      progressThumb.style.left = `${visualPercentage}%`;
      
      updateTimeDisplay();
    };
    
    progressContainer.addEventListener('click', handleProgressClick);
    
    // Adicionar suporte para arrastar na barra de progresso
    let isProgressDragging = false;
    
    progressContainer.addEventListener('mousedown', (e) => {
      const duration = audio.duration;
      const validDuration = duration && isFinite(duration) && !isNaN(duration) && duration > 0;
      
      if (!validDuration) return;
      
      isProgressDragging = true;
      isDragging = true;
      progressThumb.style.opacity = '1';
      
      handleProgressClick(e);
      
      const handleMouseMove = (e) => {
        if (!isProgressDragging) return;
        handleProgressClick(e);
      };
      
      const handleMouseUp = () => {
        isProgressDragging = false;
        isDragging = false;
        progressThumb.style.opacity = '0';
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    });
    
    // Controle de volume
    volumeSlider.addEventListener('input', (e) => {
      audio.volume = parseFloat(e.target.value);
      updateVolumeDisplay();
    });
    
    volumeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (audio.volume > 0) {
        currentVolume = audio.volume;
        audio.volume = 0;
      } else {
        audio.volume = currentVolume;
      }
      updateVolumeDisplay();
    });
    
    // Download
    downloadBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const audioUrl = node.getAttribute('data-audio-url');
      const filename = node.getAttribute('data-audio-filename') || 'audio';
      
      console.log('🔽 Iniciando download:', { audioUrl, filename });
      
      // Criar link de download com a URL original do arquivo
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = filename;
      link.target = '_blank';
      
      // Adicionar ao DOM temporariamente para garantir compatibilidade
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('✅ Download iniciado para:', filename);
    });
    
    // Hover effects modernos
    playPauseBtn.addEventListener('mouseenter', () => {
      playPauseBtn.style.transform = 'scale(1.05)';
      playPauseBtn.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
    });
    
    playPauseBtn.addEventListener('mouseleave', () => {
      playPauseBtn.style.transform = 'scale(1)';
      playPauseBtn.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
    });
    
    downloadBtn.addEventListener('mouseenter', () => {
      downloadBtn.style.color = '#374151';
      downloadBtn.style.background = '#f3f4f6';
    });
    
    downloadBtn.addEventListener('mouseleave', () => {
      downloadBtn.style.color = '#64748b';
      downloadBtn.style.background = 'none';
    });
    
    volumeBtn.addEventListener('mouseenter', () => {
      volumeBtn.style.color = '#374151';
      volumeBtn.style.background = '#f3f4f6';
    });
    
    volumeBtn.addEventListener('mouseleave', () => {
      volumeBtn.style.color = '#64748b';
      volumeBtn.style.background = 'none';
    });
    
    // Hover effects do container principal
    node.addEventListener('mouseenter', () => {
      node.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      node.style.transform = 'translateY(-1px)';
    });
    
    node.addEventListener('mouseleave', () => {
      node.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)';
      node.style.transform = 'translateY(0)';
    });
    
    // Inicializar
    updateVolumeDisplay();
    updateTimeDisplay();
  }
  
  static value(node) {
    return {
      id: node.getAttribute('data-audio-id'),
      url: node.getAttribute('data-audio-url'),
      filename: node.getAttribute('data-audio-filename')
    };
  }
  
  static formats(node) {
    return {
      id: node.getAttribute('data-audio-id'),
      url: node.getAttribute('data-audio-url'),
      filename: node.getAttribute('data-audio-filename')
    };
  }
}

AudioBlot.blotName = 'audio';
AudioBlot.tagName = 'div';
AudioBlot.className = 'ql-audio-embed';

Quill.register(AudioBlot);

// Função para processar áudios existentes na página
AudioBlot.processExistingAudios = function() {
  console.log('🔊 Processando áudios existentes na página...');
  
  const existingAudios = document.querySelectorAll('.ql-audio-embed');
  console.log(`🎵 Total de elementos de áudio encontrados: ${existingAudios.length}`);
  
  existingAudios.forEach((node, index) => {
    let url = node.getAttribute('data-audio-url');
    let id = node.getAttribute('data-audio-id');
    let filename = node.getAttribute('data-audio-filename');
    
    if (url && !node.querySelector('.audio-player-container')) {
      console.log(`🎵 Processando áudio ${index + 1}:`, { id, url, filename });
      
      // Gerar ID se não existir
      if (!id) {
        id = 'audio-' + Date.now() + '-' + index;
        node.setAttribute('data-audio-id', id);
      }
      
      // Recriar o player se necessário
      AudioBlot.setupPlayer(node);
    }
  });
};

// Processar áudios existentes quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', AudioBlot.processExistingAudios);
} else {
  setTimeout(AudioBlot.processExistingAudios, 100);
}

// Processar quando houver mudanças no DOM
const observer = new MutationObserver((mutations) => {
  let hasNewAudios = false;
  
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node;
        if (element.classList && element.classList.contains('ql-audio-embed') || 
            element.querySelector && element.querySelector('.ql-audio-embed')) {
          hasNewAudios = true;
        }
      }
    });
  });
  
  if (hasNewAudios) {
    console.log('🔄 Novos áudios detectados, processando...');
    setTimeout(AudioBlot.processExistingAudios, 100);
  }
});

// Observar mudanças no body
if (document.body) {
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

export default AudioBlot;