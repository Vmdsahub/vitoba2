import { Quill } from 'react-quill';

const Embed = Quill.import('blots/embed');

class TxtBlot extends Embed {
  static create(value) {
    const node = super.create();
    const { id, url, filename } = value;
    
    // Configurar o blot como um container único
    node.setAttribute('data-txt-id', id);
    node.setAttribute('data-txt-url', url);
    node.setAttribute('data-txt-filename', filename);
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
    
    // Criar estrutura HTML do componente TXT com design similar ao áudio
    node.innerHTML = `
      <div class="txt-player-container" style="
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
        <!-- TXT filename - posicionado dentro do container -->
        <div class="txt-filename" style="
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

        <!-- Document Icon -->
        <button class="txt-view-btn" style="
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
          color: #64748b;
        " title="Visualizar conteúdo">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style="position: relative;">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
          </svg>
        </button>

        <!-- File Size Display -->
        <div class="txt-size-display" style="
          font-size: 8px;
          color: #6b7280;
          font-weight: 400;
          white-space: nowrap;
          flex-shrink: 0;
          margin: 0 4px;
          font-variant-numeric: tabular-nums;
        ">TXT</div>

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
    TxtBlot.setupComponent(node);
    
    return node;
  }

  static setupComponent(node) {
    // Verificar se já foi configurado para evitar duplicação
    if (node.hasAttribute('data-txt-configured')) {
      return;
    }
    node.setAttribute('data-txt-configured', 'true');
    
    const txtViewBtn = node.querySelector('.txt-view-btn');
    const downloadBtn = node.querySelector('.download-btn');
    const url = node.getAttribute('data-txt-url');
    const filename = node.getAttribute('data-txt-filename');

    // Função para abrir modal com conteúdo do TXT
    const openTxtModal = async () => {
      try {
        const response = await fetch(url);
        const content = await response.text();
        
        // Criar modal
        const modal = document.createElement('div');
        modal.className = 'txt-modal-overlay';
        modal.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          backdrop-filter: blur(4px);
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
          background: white;
          border-radius: 12px;
          max-width: 80vw;
          max-height: 80vh;
          width: 600px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        `;

        const header = document.createElement('div');
        header.style.cssText = `
          padding: 20px 24px 16px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        `;

        const title = document.createElement('h3');
        title.textContent = filename;
        title.style.cssText = `
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #111827;
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

        const contentArea = document.createElement('div');
        contentArea.style.cssText = `
          padding: 24px;
          overflow-y: auto;
          flex: 1;
        `;

        const textContent = document.createElement('pre');
        textContent.textContent = content;
        textContent.style.cssText = `
          margin: 0;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          line-height: 1.5;
          color: #374151;
          white-space: pre-wrap;
          word-wrap: break-word;
        `;

        // Montar modal
        header.appendChild(title);
        header.appendChild(closeBtn);
        contentArea.appendChild(textContent);
        modalContent.appendChild(header);
        modalContent.appendChild(contentArea);
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
        const handleEsc = (e) => {
          if (e.key === 'Escape') {
            document.body.removeChild(modal);
            document.removeEventListener('keydown', handleEsc);
          }
        };
        document.addEventListener('keydown', handleEsc);

      } catch (error) {
        console.error('Erro ao carregar arquivo TXT:', error);
        alert('Erro ao carregar o arquivo TXT');
      }
    };

    // Função para download
    const downloadFile = () => {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
    };

    // Event listeners
    txtViewBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openTxtModal();
    });

    downloadBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      downloadFile();
    });

    // Hover effects
    txtViewBtn.addEventListener('mouseenter', () => {
      txtViewBtn.style.color = '#374151';
      txtViewBtn.style.background = '#f3f4f6';
    });

    txtViewBtn.addEventListener('mouseleave', () => {
      txtViewBtn.style.color = '#64748b';
      txtViewBtn.style.background = 'none';
    });

    downloadBtn.addEventListener('mouseenter', () => {
      downloadBtn.style.color = '#374151';
      downloadBtn.style.background = '#f3f4f6';
    });

    downloadBtn.addEventListener('mouseleave', () => {
      downloadBtn.style.color = '#64748b';
      downloadBtn.style.background = 'none';
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
      id: node.getAttribute('data-txt-id'),
      url: node.getAttribute('data-txt-url'),
      filename: node.getAttribute('data-txt-filename')
    };
  }
  
  static formats(node) {
    return {
      id: node.getAttribute('data-txt-id'),
      url: node.getAttribute('data-txt-url'),
      filename: node.getAttribute('data-txt-filename')
    };
  }
}

TxtBlot.blotName = 'txt';
TxtBlot.tagName = 'div';
TxtBlot.className = 'ql-txt-embed';

Quill.register(TxtBlot);

// Função para processar TXTs existentes na página
TxtBlot.processExistingTxts = function() {
  console.log('📄 Processando TXTs existentes na página...');
  
  const existingTxts = document.querySelectorAll('.ql-txt-embed');
  console.log(`📝 Total de elementos TXT encontrados: ${existingTxts.length}`);
  
  existingTxts.forEach((txtElement, index) => {
    let url = txtElement.getAttribute('data-txt-url');
    let id = txtElement.getAttribute('data-txt-id');
    let filename = txtElement.getAttribute('data-txt-filename');
    
    if (url && !txtElement.querySelector('.txt-player-container')) {
      console.log(`📄 Processando TXT ${index + 1}:`, { id, url, filename });
      
      // Gerar ID se não existir
      if (!id) {
        id = 'txt-' + Date.now() + '-' + index;
        txtElement.setAttribute('data-txt-id', id);
      }
      
      // Recriar o componente se necessário
      TxtBlot.setupComponent(txtElement);
    }
  });
};

// Observer para detectar novos TXTs adicionados dinamicamente
const observer = new MutationObserver((mutations) => {
  let hasNewTxts = false;
  
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node;
        if (element.classList && element.classList.contains('ql-txt-embed') || 
            element.querySelector && element.querySelector('.ql-txt-embed')) {
          hasNewTxts = true;
        }
      }
    });
  });
  
  if (hasNewTxts) {
    console.log('🔄 Novos TXTs detectados, processando...');
    setTimeout(TxtBlot.processExistingTxts, 100);
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Processar TXTs existentes quando o script carrega
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(TxtBlot.processExistingTxts, 500);
});

// Também processar após um pequeno delay para garantir que o Quill foi inicializado
setTimeout(TxtBlot.processExistingTxts, 1000);

export default TxtBlot;