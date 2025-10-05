import { Quill } from 'react-quill';

const Embed = Quill.import('blots/embed');

class PdfBlot extends Embed {
  static create(value) {
    const node = super.create();
    const { id, url, filename } = value;
    
    // Configurar o blot como um container único
    node.setAttribute('data-pdf-id', id);
    node.setAttribute('data-pdf-url', url);
    node.setAttribute('data-pdf-filename', filename);
    node.setAttribute('contenteditable', 'false');
    
    // Estilos do container principal - design moderno e minimalista (igual ao audioBlot)
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
      white-space: nowrap;
    `;
    
    // Criar estrutura HTML do componente PDF com design similar ao áudio
    node.innerHTML = `
      <div class="pdf-player-container" style="
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
        <!-- PDF View Button -->
        <button class="pdf-view-btn" style="
          width: 16px;
          height: 16px;
          border: none;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #dc2626;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          flex-shrink: 0;
          box-sizing: border-box;
          position: relative;
          margin: 0;
          padding: 0;
          border-radius: 4px;
        " title="Visualizar PDF">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="position: relative;">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
          </svg>
        </button>

        <!-- PDF filename -->
        <div class="pdf-filename" style="
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

        <!-- PDF Type Display -->
        <div class="pdf-type-display" style="
          font-size: 8px;
          color: #dc2626;
          font-weight: 500;
          white-space: nowrap;
          flex-shrink: 0;
          margin: 0 4px;
          font-variant-numeric: tabular-nums;
        ">PDF</div>

        <!-- Download Button -->
        <button class="download-btn" style="
          width: 16px;
          height: 16px;
          border: none;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
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
    `;
    
    // Configurar funcionalidades do componente
    PdfBlot.setupComponent(node);
    
    return node;
  }

  static setupComponent(node) {
    // Verificar se já foi configurado para evitar duplicação
    if (node.hasAttribute('data-pdf-configured')) {
      return;
    }
    node.setAttribute('data-pdf-configured', 'true');
    
    const pdfViewBtn = node.querySelector('.pdf-view-btn');
    const downloadBtn = node.querySelector('.download-btn');
    const url = node.getAttribute('data-pdf-url');
    const filename = node.getAttribute('data-pdf-filename');

    // Função para abrir modal do PDF
    const openPdfModal = () => {
      // Criar overlay do modal
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        backdrop-filter: blur(4px);
      `;

      // Container do modal
      const modalContent = document.createElement('div');
      modalContent.style.cssText = `
        background: white;
        border-radius: 12px;
        width: 58.5vw;
        height: 90vh;
        max-width: 650px;
        max-height: 950px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      `;

      // Header do modal
      const header = document.createElement('div');
      header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 20px;
        border-bottom: 1px solid #e5e7eb;
        background: #f9fafb;
        flex-shrink: 0;
      `;

      const title = document.createElement('h3');
      title.textContent = filename;
      title.style.cssText = `
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #111827;
      `;

      const headerControls = document.createElement('div');
      headerControls.style.cssText = `
        display: flex;
        align-items: center;
        gap: 12px;
      `;

      const downloadModalBtn = document.createElement('button');
      downloadModalBtn.innerHTML = '↓';
      downloadModalBtn.style.cssText = `
        background: white;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 16px;
        color: #374151;
        transition: all 0.2s;
      `;

      const closeBtn = document.createElement('button');
      closeBtn.innerHTML = '×';
      closeBtn.style.cssText = `
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #6b7280;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      `;

      // Área do PDF
      const pdfContainer = document.createElement('div');
      pdfContainer.style.cssText = `
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        background: white;
        position: relative;
        overflow: hidden;
        padding: 8px;
      `;

      const pdfFrame = document.createElement('iframe');
      pdfFrame.src = `${url}#view=FitH&toolbar=0&navpanes=0&scrollbar=1&page=1&zoom=page-width`;
      pdfFrame.style.cssText = `
        width: 100%;
        height: 100%;
        border: none;
        background: white;
        border-radius: 4px;
        box-shadow: none;
        scrollbar-width: thin;
        scrollbar-color: #cbd5e1 #f1f5f9;
      `;
      
      // Adicionar estilos customizados para scrollbar minimalista
      const style = document.createElement('style');
      style.textContent = `
        .pdf-modal iframe::-webkit-scrollbar {
          width: 6px;
        }
        .pdf-modal iframe::-webkit-scrollbar-track {
          background: transparent;
        }
        .pdf-modal iframe::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 3px;
          transition: background 0.2s ease;
        }
        .pdf-modal iframe::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.4);
        }
        .pdf-modal iframe::-webkit-scrollbar-corner {
          background: transparent;
        }
      `;
      document.head.appendChild(style);
      
      // Adicionar classe ao modal para aplicar os estilos
      modal.classList.add('pdf-modal');



      // Event listener para download
      downloadModalBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
      });

      // Hover effects
      downloadModalBtn.addEventListener('mouseenter', () => {
        downloadModalBtn.style.background = '#f3f4f6';
      });
      downloadModalBtn.addEventListener('mouseleave', () => {
        downloadModalBtn.style.background = 'white';
      });
      headerControls.appendChild(downloadModalBtn);
      headerControls.appendChild(closeBtn);

      // Montar header
      header.appendChild(title);
      header.appendChild(headerControls);

      // Montar PDF container
      pdfContainer.appendChild(pdfFrame);

      // Montar modal
      modalContent.appendChild(header);
      modalContent.appendChild(pdfContainer);
      modal.appendChild(modalContent);
      document.body.appendChild(modal);



      // Event listeners para fechar modal
      closeBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
      });

      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          document.body.removeChild(modal);
        }
      });

      // Fechar com ESC
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          document.body.removeChild(modal);
          document.removeEventListener('keydown', handleEscape);
        }
      };
      document.addEventListener('keydown', handleEscape);

      // Remover event listeners quando modal for fechado
      const originalRemove = modal.remove;
      modal.remove = function() {
        document.removeEventListener('keydown', handleEscape);
        originalRemove.call(this);
      };
    };

    // Função para download
    const downloadFile = () => {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
    };

    // Event listeners
    pdfViewBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openPdfModal();
    });

    downloadBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      downloadFile();
    });

    // Hover effects
    pdfViewBtn.addEventListener('mouseenter', () => {
      pdfViewBtn.style.color = '#b91c1c';
      pdfViewBtn.style.background = '#fef2f2';
    });

    pdfViewBtn.addEventListener('mouseleave', () => {
      pdfViewBtn.style.color = '#dc2626';
      pdfViewBtn.style.background = 'transparent';
    });

    downloadBtn.addEventListener('mouseenter', () => {
      downloadBtn.style.color = '#059669';
      downloadBtn.style.background = '#f0fdf4';
    });

    downloadBtn.addEventListener('mouseleave', () => {
      downloadBtn.style.color = '#64748b';
      downloadBtn.style.background = 'transparent';
    });

    // Hover effect no container principal
    node.addEventListener('mouseenter', () => {
      node.style.transform = 'translateY(-1px)';
      node.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08)';
    });

    node.addEventListener('mouseleave', () => {
      node.style.transform = 'translateY(0)';
      node.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)';
    });
  }

  static value(node) {
    return {
      id: node.getAttribute('data-pdf-id'),
      url: node.getAttribute('data-pdf-url'),
      filename: node.getAttribute('data-pdf-filename')
    };
  }
  
  static formats(node) {
    return {
      id: node.getAttribute('data-pdf-id'),
      url: node.getAttribute('data-pdf-url'),
      filename: node.getAttribute('data-pdf-filename')
    };
  }
}

PdfBlot.blotName = 'pdf';
PdfBlot.tagName = 'div';
PdfBlot.className = 'ql-pdf-embed';

Quill.register(PdfBlot);

// Função para processar PDFs existentes na página
PdfBlot.processExistingPdfs = function() {
  console.log('📄 Processando PDFs existentes na página...');
  
  const existingPdfs = document.querySelectorAll('.ql-pdf-embed');
  console.log(`📝 Total de elementos PDF encontrados: ${existingPdfs.length}`);
  
  existingPdfs.forEach((pdfElement, index) => {
    let url = pdfElement.getAttribute('data-pdf-url');
    let id = pdfElement.getAttribute('data-pdf-id');
    let filename = pdfElement.getAttribute('data-pdf-filename');
    
    if (url && !pdfElement.querySelector('.pdf-player-container')) {
      console.log(`📄 Processando PDF ${index + 1}:`, { id, url, filename });
      
      // Gerar ID se não existir
      if (!id) {
        id = 'pdf-' + Date.now() + '-' + index;
        pdfElement.setAttribute('data-pdf-id', id);
      }
      
      // Recriar o componente se necessário
      PdfBlot.setupComponent(pdfElement);
    }
  });
};

// Observer para detectar novos PDFs adicionados dinamicamente
const observer = new MutationObserver((mutations) => {
  let hasNewPdfs = false;
  
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node;
        
        // Verificar se é um PDF embed
        if (element.classList && element.classList.contains('ql-pdf-embed')) {
          hasNewPdfs = true;
        }
        
        // Verificar se contém PDFs embeds
        const pdfEmbeds = element.querySelectorAll && element.querySelectorAll('.ql-pdf-embed');
        if (pdfEmbeds && pdfEmbeds.length > 0) {
          hasNewPdfs = true;
        }
      }
    });
  });
  
  if (hasNewPdfs) {
    console.log('🔄 Novos PDFs detectados, processando...');
    setTimeout(() => {
      PdfBlot.processExistingPdfs();
    }, 100);
  }
});

// Iniciar observação
observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Processar PDFs existentes quando o script carrega
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      PdfBlot.processExistingPdfs();
    }, 500);
  });
} else {
  setTimeout(() => {
    PdfBlot.processExistingPdfs();
  }, 500);
}

export default PdfBlot;