import { Quill } from 'react-quill';
import JSZip from 'jszip';

const Embed = Quill.import('blots/embed');

class ZipBlot extends Embed {
  static create(value) {
    const node = super.create();
    const { id, url, filename } = value;
    
    // Configurar o blot como um container único
    node.setAttribute('data-zip-id', id);
    node.setAttribute('data-zip-url', url);
    node.setAttribute('data-zip-filename', filename);
    node.setAttribute('contenteditable', 'false');
    
    // Estilos do container principal - design moderno e minimalista (igual aos outros blots)
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
    
    // Criar estrutura HTML do componente ZIP (igual aos outros blots)
    node.innerHTML = `
      <div class="zip-player-container" style="
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
        <!-- ZIP View Button -->
        <button class="zip-view-btn" style="
          width: 16px;
          height: 16px;
          border: none;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #7c3aed;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          flex-shrink: 0;
          box-sizing: border-box;
          position: relative;
          margin: 0;
          padding: 0;
          border-radius: 4px;
        " title="Visualizar ZIP">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="position: relative;">
            <path d="M14,17H7V15H14M17,13H7V11H17M17,9H7V7H17M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3Z"/>
          </svg>
        </button>

        <!-- ZIP filename -->
        <div class="zip-filename" style="
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

        <!-- ZIP Type Display -->
        <div class="zip-type-display" style="
          font-size: 8px;
          color: #7c3aed;
          font-weight: 500;
          white-space: nowrap;
          flex-shrink: 0;
        ">ZIP</div>
      </div>
    `;

    // Configurar componente
    ZipBlot.setupComponent(node);
    
    return node;
  }

  static setupComponent(container) {
    const url = container.getAttribute('data-zip-url');
    const filename = container.getAttribute('data-zip-filename');
    
    if (!url || !filename) {
      console.error('❌ ZIP: URL ou filename não encontrados');
      return;
    }

    // Função para abrir modal do ZIP
    const openZipModal = async () => {
      try {
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

        const headerActions = document.createElement('div');
        headerActions.style.cssText = `
          display: flex;
          gap: 8px;
          align-items: center;
        `;

        const downloadBtn = document.createElement('button');
        downloadBtn.innerHTML = '↓';
        downloadBtn.style.cssText = `
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

        const contentArea = document.createElement('div');
        contentArea.style.cssText = `
          padding: 24px 32px;
          overflow-y: auto;
          flex: 1;
          max-height: 85vh;
          min-height: 70vh;
        `;

        // Mostrar loading enquanto processa
        const loadingDiv = document.createElement('div');
        loadingDiv.style.cssText = `
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 200px;
          gap: 16px;
        `;

        const spinner = document.createElement('div');
        spinner.style.cssText = `
          width: 32px;
          height: 32px;
          border: 3px solid #f3f4f6;
          border-top: 3px solid #7c3aed;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        `;

        const loadingText = document.createElement('p');
        loadingText.textContent = 'Analisando arquivo ZIP...';
        loadingText.style.cssText = `
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        `;

        loadingDiv.appendChild(spinner);
        loadingDiv.appendChild(loadingText);
        contentArea.appendChild(loadingDiv);

        // Adicionar CSS para animação do spinner
        const style = document.createElement('style');
        style.textContent = `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .zip-file-item {
            display: flex;
            align-items: center;
            padding: 8px 12px;
            border-radius: 6px;
            transition: background-color 0.2s;
            gap: 8px;
          }
          .zip-file-item:hover {
            background-color: #f8fafc;
          }
          .zip-file-icon {
            width: 16px;
            height: 16px;
            flex-shrink: 0;
          }
          .zip-folder-icon {
            color: #f59e0b;
          }
          .zip-file-icon-default {
            color: #6b7280;
          }
        `;
        document.head.appendChild(style);

        // Montar estrutura do modal
        headerActions.appendChild(downloadBtn);
        headerActions.appendChild(closeBtn);
        header.appendChild(title);
        header.appendChild(headerActions);
        modalContent.appendChild(header);
        modalContent.appendChild(contentArea);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Event listeners para fechar modal
        const closeModal = () => {
          document.body.removeChild(modal);
          document.head.removeChild(style);
        };

        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
          if (e.target === modal) closeModal();
        });

        downloadBtn.addEventListener('click', () => {
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          link.click();
        });

        // Buscar e processar o arquivo ZIP
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Erro ao carregar arquivo: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        
        // Usar JSZip para analisar o conteúdo
        const zip = new JSZip();
        const zipContent = await zip.loadAsync(arrayBuffer);
        
        // Substituir loading pelo conteúdo extraído
        contentArea.innerHTML = '';
        
        // Criar lista de arquivos
        const fileList = document.createElement('div');
        fileList.style.cssText = `
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

        // Header da lista
        const listHeader = document.createElement('div');
        listHeader.style.cssText = `
          padding: 16px 0;
          border-bottom: 1px solid #e5e7eb;
          margin-bottom: 16px;
        `;

        const headerTitle = document.createElement('h4');
        headerTitle.textContent = 'Conteúdo do arquivo ZIP';
        headerTitle.style.cssText = `
          margin: 0 0 8px 0;
          font-size: 16px;
          font-weight: 600;
          color: #111827;
        `;

        const fileCount = Object.keys(zipContent.files).length;
        const headerSubtitle = document.createElement('p');
        headerSubtitle.textContent = `${fileCount} ${fileCount === 1 ? 'item' : 'itens'} encontrados`;
        headerSubtitle.style.cssText = `
          margin: 0;
          font-size: 14px;
          color: #6b7280;
        `;

        listHeader.appendChild(headerTitle);
        listHeader.appendChild(headerSubtitle);
        fileList.appendChild(listHeader);

        // Lista de arquivos
        const filesContainer = document.createElement('div');
        filesContainer.style.cssText = `
          max-height: 400px;
          overflow-y: auto;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: white;
        `;

        // Organizar arquivos por pastas
        const sortedFiles = Object.keys(zipContent.files).sort();
        
        sortedFiles.forEach((filePath, index) => {
          const file = zipContent.files[filePath];
          const isDirectory = file.dir;
          
          const fileItem = document.createElement('div');
          fileItem.className = 'zip-file-item';
          fileItem.style.cssText += index % 2 === 0 ? 'background-color: #fafafa;' : '';

          // Ícone do arquivo/pasta
          const icon = document.createElement('div');
          icon.className = `zip-file-icon ${isDirectory ? 'zip-folder-icon' : 'zip-file-icon-default'}`;
          
          if (isDirectory) {
            icon.innerHTML = `
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8C22,6.89 21.1,6 20,6H12L10,4Z"/>
              </svg>
            `;
          } else {
            icon.innerHTML = `
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
              </svg>
            `;
          }

          // Nome do arquivo
          const fileName = document.createElement('div');
          fileName.textContent = filePath;
          fileName.style.cssText = `
            flex: 1;
            font-size: 13px;
            color: #374151;
            word-break: break-all;
          `;

          // Tamanho do arquivo (se não for pasta)
          const fileSize = document.createElement('div');
          if (!isDirectory && file.uncompressedSize) {
            const size = file.uncompressedSize;
            const sizeText = size < 1024 ? `${size} B` :
                           size < 1024 * 1024 ? `${(size / 1024).toFixed(1)} KB` :
                           `${(size / (1024 * 1024)).toFixed(1)} MB`;
            fileSize.textContent = sizeText;
          }
          fileSize.style.cssText = `
            font-size: 12px;
            color: #9ca3af;
            min-width: 60px;
            text-align: right;
          `;

          fileItem.appendChild(icon);
          fileItem.appendChild(fileName);
          fileItem.appendChild(fileSize);
          filesContainer.appendChild(fileItem);
        });

        fileList.appendChild(filesContainer);

        // Aviso de segurança
        const securityWarning = document.createElement('div');
        securityWarning.style.cssText = `
          margin-top: 20px;
          padding: 12px 16px;
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 8px;
          font-size: 13px;
          color: #92400e;
        `;
        securityWarning.innerHTML = `
          <strong>⚠️ Aviso de Segurança:</strong> Este arquivo ZIP foi analisado apenas superficialmente. 
          Sempre verifique o conteúdo antes de extrair ou executar arquivos de fontes não confiáveis.
        `;

        fileList.appendChild(securityWarning);
        contentArea.appendChild(fileList);

      } catch (error) {
        console.error('❌ Erro ao processar ZIP:', error);
        
        // Mostrar erro no modal se já estiver aberto
        const existingModal = document.querySelector('[style*="z-index: 10000"]');
        if (existingModal) {
          const contentArea = existingModal.querySelector('div[style*="padding: 24px 32px"]');
          if (contentArea) {
            contentArea.innerHTML = `
              <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 200px;
                gap: 16px;
                text-align: center;
              ">
                <div style="
                  width: 48px;
                  height: 48px;
                  background: #fee2e2;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: #dc2626;
                  font-size: 24px;
                ">⚠️</div>
                <div>
                  <h4 style="margin: 0 0 8px 0; color: #dc2626; font-size: 16px;">Erro ao processar arquivo ZIP</h4>
                  <p style="margin: 0; color: #6b7280; font-size: 14px;">
                    Não foi possível analisar o conteúdo do arquivo. Você ainda pode fazer o download.
                  </p>
                </div>
              </div>
            `;
          }
        }
      }
    };

    // Event listener para o botão de visualização
    const viewBtn = container.querySelector('.zip-view-btn');
    if (viewBtn) {
      viewBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openZipModal();
      });
    }

    // Event listener para clique no container
    container.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openZipModal();
    });

    // Hover effects
    container.addEventListener('mouseenter', () => {
      container.style.transform = 'translateY(-1px)';
      container.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08)';
    });

    container.addEventListener('mouseleave', () => {
      container.style.transform = 'translateY(0)';
      container.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)';
    });
  }

  static value(node) {
    return {
      id: node.getAttribute('data-zip-id'),
      url: node.getAttribute('data-zip-url'),
      filename: node.getAttribute('data-zip-filename')
    };
  }
  
  static formats(node) {
    return {
      id: node.getAttribute('data-zip-id'),
      url: node.getAttribute('data-zip-url'),
      filename: node.getAttribute('data-zip-filename')
    };
  }
}

ZipBlot.blotName = 'zip';
ZipBlot.tagName = 'div';
ZipBlot.className = 'ql-zip-embed';

Quill.register(ZipBlot);

// Função para processar ZIPs existentes na página
ZipBlot.processExistingZips = function() {
  console.log('📦 Processando ZIPs existentes na página...');
  
  const existingZips = document.querySelectorAll('.ql-zip-embed');
  console.log(`📝 Total de elementos ZIP encontrados: ${existingZips.length}`);
  
  existingZips.forEach((zipElement, index) => {
    let url = zipElement.getAttribute('data-zip-url');
    let id = zipElement.getAttribute('data-zip-id');
    let filename = zipElement.getAttribute('data-zip-filename');
    
    if (url && !zipElement.querySelector('.zip-player-container')) {
      console.log(`📦 Processando ZIP ${index + 1}:`, { id, url, filename });
      
      // Gerar ID se não existir
      if (!id) {
        id = 'zip-' + Date.now() + '-' + index;
        zipElement.setAttribute('data-zip-id', id);
      }
      
      // Recriar o componente se necessário
      ZipBlot.setupComponent(zipElement);
    }
  });
};

// Observer para detectar novos ZIPs adicionados dinamicamente
const observer = new MutationObserver((mutations) => {
  let hasNewZips = false;
  
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node;
        
        // Verificar se é um ZIP embed
        if (element.classList && element.classList.contains('ql-zip-embed')) {
          hasNewZips = true;
        }
        
        // Verificar se contém ZIP embeds
        const zipEmbeds = element.querySelectorAll && element.querySelectorAll('.ql-zip-embed');
        if (zipEmbeds && zipEmbeds.length > 0) {
          hasNewZips = true;
        }
      }
    });
  });
  
  if (hasNewZips) {
    console.log('🔄 Novos ZIPs detectados, processando...');
    setTimeout(() => {
      ZipBlot.processExistingZips();
    }, 100);
  }
});

// Iniciar observação
observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Processar ZIPs existentes quando o script carrega
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      ZipBlot.processExistingZips();
    }, 500);
  });
} else {
  setTimeout(() => {
    ZipBlot.processExistingZips();
  }, 500);
}

export default ZipBlot;