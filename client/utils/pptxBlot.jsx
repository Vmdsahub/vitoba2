import { Quill } from 'react-quill';

const Embed = Quill.import('blots/embed');

class PptxBlot extends Embed {
  static create(value) {
    const node = super.create();
    const { id, url, filename } = value;
    
    // Configurar o blot como um container único
    node.setAttribute('data-pptx-id', id);
    node.setAttribute('data-pptx-url', url);
    node.setAttribute('data-pptx-filename', filename);
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
      white-space: nowrap;
    `;
    
    // Criar estrutura HTML do componente PPTX
    node.innerHTML = `
      <div class="pptx-player-container" style="
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
        <button class="pptx-view-btn" style="
          width: 16px;
          height: 16px;
          border: none;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #ea580c;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          flex-shrink: 0;
          box-sizing: border-box;
          position: relative;
          margin: 0;
          padding: 0;
          border-radius: 4px;
        " title="Visualizar PowerPoint">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
            <path d="M8,12H10.5A1.5,1.5 0 0,1 12,13.5A1.5,1.5 0 0,1 10.5,15H8V12M8,10V11H10.5A2.5,2.5 0 0,1 13,13.5A2.5,2.5 0 0,1 10.5,16H8V17H7V10H8Z"/>
          </svg>
        </button>

        <div class="pptx-filename" style="
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

        <div class="pptx-type-display" style="
          font-size: 8px;
          color: #ea580c;
          font-weight: 500;
          white-space: nowrap;
          flex-shrink: 0;
          margin: 0 4px;
          font-variant-numeric: tabular-nums;
        ">PPTX</div>

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
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
          </svg>
        </button>
      </div>
    `;
    
    // Configurar funcionalidades do componente
    PptxBlot.setupComponent(node);
    
    return node;
  }

  static setupComponent(node) {
    // Verificar se já foi configurado
    if (node.hasAttribute('data-pptx-configured')) {
      return;
    }
    node.setAttribute('data-pptx-configured', 'true');
    
    const pptxViewBtn = node.querySelector('.pptx-view-btn');
    const downloadBtn = node.querySelector('.download-btn');
    const url = node.getAttribute('data-pptx-url');
    const filename = node.getAttribute('data-pptx-filename');

    // Função para abrir modal do PPTX
    const openPptxModal = async () => {
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.75);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        backdrop-filter: blur(4px);
        animation: fadeIn 0.3s ease-out;
      `;

      const modalContent = document.createElement('div');
      modalContent.style.cssText = `
        width: 85vw;
        height: 85vh;
        max-width: 1200px;
        max-height: 800px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        animation: slideIn 0.3s ease-out;
      `;

      const modalHeader = document.createElement('div');
      modalHeader.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid #e5e7eb;
        background: #f9fafb;
        flex-shrink: 0;
      `;

      const modalTitle = document.createElement('h3');
      modalTitle.textContent = filename;
      modalTitle.style.cssText = `
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #111827;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `;

      const closeBtn = document.createElement('button');
      closeBtn.style.cssText = `
        width: 32px;
        height: 32px;
        border: none;
        background: transparent;
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #6b7280;
        transition: all 0.2s;
      `;
      closeBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;

      modalHeader.appendChild(modalTitle);
      modalHeader.appendChild(closeBtn);

      const pptxContainer = document.createElement('div');
      pptxContainer.style.cssText = `
        flex: 1;
        background: white;
        padding: 8px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      `;

      // Criar visualizador
      const viewerContainer = document.createElement('div');
      viewerContainer.style.cssText = `
        width: 100%;
        height: 100%;
        background: #f8fafc;
        border-radius: 8px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        position: relative;
      `;

      // Container para pptx-preview
      const pptxViewerDiv = document.createElement('div');
      pptxViewerDiv.id = `pptx-viewer-${Date.now()}`;
      pptxViewerDiv.style.cssText = `
        width: 100%;
        height: 100%;
        background: white;
        display: flex;
        align-items: center;
        justify-content: center;
      `;

      // Mensagem de carregamento
      const loadingMsg = document.createElement('div');
      loadingMsg.textContent = 'Carregando apresentação...';
      loadingMsg.style.cssText = `
        color: #666;
        font-size: 16px;
        text-align: center;
      `;
      pptxViewerDiv.appendChild(loadingMsg);

      viewerContainer.appendChild(pptxViewerDiv);

      // Carregar e inicializar pptx-preview
      this.loadPptxPreview(url, pptxViewerDiv, loadingMsg);
      pptxContainer.appendChild(viewerContainer);

      // Adicionar CSS
      const style = document.createElement('style');
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: scale(0.95) translateY(-10px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);

      modalContent.appendChild(modalHeader);
      modalContent.appendChild(pptxContainer);
      modal.appendChild(modalContent);
      document.body.appendChild(modal);

      // Event listeners
      const closeModal = () => {
        document.body.removeChild(modal);
        document.head.removeChild(style);
      };

      closeBtn.addEventListener('click', closeModal);
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
    };

    // Event listeners
    if (pptxViewBtn) {
      pptxViewBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openPptxModal();
      });

      pptxViewBtn.addEventListener('mouseenter', () => {
        pptxViewBtn.style.background = 'rgba(234, 88, 12, 0.1)';
        pptxViewBtn.style.transform = 'scale(1.1)';
      });

      pptxViewBtn.addEventListener('mouseleave', () => {
        pptxViewBtn.style.background = 'transparent';
        pptxViewBtn.style.transform = 'scale(1)';
      });
    }

    if (downloadBtn) {
      downloadBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
      });

      downloadBtn.addEventListener('mouseenter', () => {
        downloadBtn.style.background = 'rgba(100, 116, 139, 0.1)';
        downloadBtn.style.transform = 'scale(1.1)';
      });

      downloadBtn.addEventListener('mouseleave', () => {
        downloadBtn.style.background = 'transparent';
        downloadBtn.style.transform = 'scale(1)';
      });
    }

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

  static async loadPptxPreview(url, container, loadingMsg) {
    try {
      // Atualizar mensagem de carregamento
      loadingMsg.textContent = 'Baixando apresentação...';
      
      // Buscar o arquivo PPTX
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Erro ao carregar arquivo: ${response.status}`);
      }
      
      loadingMsg.textContent = 'Processando apresentação...';
      
      // Converter response para buffer
      const arrayBuffer = await response.arrayBuffer();
      
      // Usar pptx-preview para renderizar os slides
      try {
        const { init } = await import('pptx-preview');
        
        loadingMsg.textContent = 'Renderizando slides...';
        
        // Limpar container e configurar para o viewer
        container.innerHTML = '';
        container.style.cssText = `
          width: 100%;
          height: 100%;
          background: white;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        `;

        // Criar container para o viewer
        const viewerContainer = document.createElement('div');
        viewerContainer.style.cssText = `
          flex: 1;
          width: 100%;
          height: 100%;
          position: relative;
          background: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
        `;

        container.appendChild(viewerContainer);

        // Inicializar o pptx-preview
        const pptxPreviewer = init(viewerContainer, {
          width: viewerContainer.offsetWidth || 800,
          height: viewerContainer.offsetHeight || 600
        });

        // Carregar a apresentação
        await pptxPreviewer.preview(arrayBuffer);
        
      } catch (pptxPreviewError) {
        console.warn('pptx-preview falhou, tentando pptx-in-html-out:', pptxPreviewError);
        
        // Fallback: tentar pptx-in-html-out
        try {
          const { PPTXInHTMLOut } = await import('pptx-in-html-out');
          
          loadingMsg.textContent = 'Renderizando slides (fallback)...';
          
          // Criar instância do conversor
          const converter = new PPTXInHTMLOut(arrayBuffer);
          
          // Converter para HTML com estilos incluídos
          const html = await converter.toHTML({ includeStyles: true });
          
          // Renderizar o HTML
          PptxBlot.renderPptxHtml(container, html);
          
        } catch (pptxInHtmlError) {
          console.warn('pptx-in-html-out também falhou, usando fallback básico:', pptxInHtmlError);
          
          // Fallback final: usar uma implementação simples de visualização
          await PptxBlot.renderPptxFallback(container, arrayBuffer, loadingMsg);
        }
      }
      
    } catch (error) {
      console.error('Erro ao carregar PPTX:', error);
      PptxBlot.showError(container, error);
    }
  }

  static renderPptxHtml(container, html) {
    // Limpar container
    container.innerHTML = '';
    
    // Configurar container para o viewer
    container.style.cssText = `
      width: 100%;
      height: 100%;
      background: white;
      position: relative;
      overflow: auto;
      padding: 20px;
      box-sizing: border-box;
    `;

    // Criar wrapper para o conteúdo
    const contentWrapper = document.createElement('div');
    contentWrapper.style.cssText = `
      max-width: 100%;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    `;
    
    // Inserir HTML convertido
    contentWrapper.innerHTML = html;
    
    // Aplicar estilos adicionais
    PptxBlot.addPptxStyles();
    
    container.appendChild(contentWrapper);
  }

  static async renderPptxFallback(container, arrayBuffer, loadingMsg) {
    loadingMsg.textContent = 'Carregando visualização básica...';
    
    // Implementação de fallback simples
    container.innerHTML = '';
    container.style.cssText = `
      width: 100%;
      height: 100%;
      background: white;
      position: relative;
      overflow: auto;
      padding: 20px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    `;

    const fallbackContent = document.createElement('div');
    fallbackContent.style.cssText = `
      text-align: center;
      max-width: 600px;
      padding: 40px;
      background: #f8fafc;
      border-radius: 12px;
      border: 2px dashed #cbd5e1;
    `;

    fallbackContent.innerHTML = `
      <div style="margin-bottom: 24px;">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="1.5" style="margin: 0 auto;">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14,2 14,8 20,8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10,9 9,9 8,9"></polyline>
        </svg>
      </div>
      <h3 style="margin: 0 0 16px 0; color: #334155; font-size: 20px; font-weight: 600;">
        Apresentação PowerPoint
      </h3>
      <p style="margin: 0 0 20px 0; color: #64748b; font-size: 16px; line-height: 1.5;">
        Arquivo PPTX carregado com sucesso.<br>
        Tamanho: ${(arrayBuffer.byteLength / 1024 / 1024).toFixed(2)} MB
      </p>
      <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
        <a href="${container.dataset.pptxUrl || '#'}" 
           download 
           style="
             display: inline-flex;
             align-items: center;
             gap: 8px;
             padding: 12px 20px;
             background: #3b82f6;
             color: white;
             text-decoration: none;
             border-radius: 8px;
             font-weight: 500;
             transition: background-color 0.2s;
           "
           onmouseover="this.style.background='#2563eb'"
           onmouseout="this.style.background='#3b82f6'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7,10 12,15 17,10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Baixar Arquivo
        </a>
        <button onclick="window.open('${container.dataset.pptxUrl || '#'}', '_blank')"
                style="
                  display: inline-flex;
                  align-items: center;
                  gap: 8px;
                  padding: 12px 20px;
                  background: #10b981;
                  color: white;
                  border: none;
                  border-radius: 8px;
                  font-weight: 500;
                  cursor: pointer;
                  transition: background-color 0.2s;
                "
                onmouseover="this.style.background='#059669'"
                onmouseout="this.style.background='#10b981'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15,3 21,3 21,9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
          Abrir Externamente
        </button>
      </div>
      <p style="margin: 24px 0 0 0; color: #94a3b8; font-size: 14px;">
        Para melhor visualização, baixe o arquivo ou abra em um aplicativo compatível
      </p>
    `;

    container.appendChild(fallbackContent);
  }

  static addPptxStyles() {
    // Verificar se os estilos já foram adicionados
    if (document.getElementById('pptx-viewer-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'pptx-viewer-styles';
    style.textContent = `
      /* Estilos para melhorar a renderização */
      .pptx-slide {
        margin-bottom: 20px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        overflow: hidden;
        background: white;
      }
      
      .pptx-slide img {
        max-width: 100%;
        height: auto;
        display: block;
      }
      
      .pptx-slide table {
        width: 100%;
        border-collapse: collapse;
      }
      
      .pptx-slide td, .pptx-slide th {
        border: 1px solid #d1d5db;
        padding: 8px;
        text-align: left;
      }
      
      /* Ajustes para texto */
      .pptx-slide p, .pptx-slide div {
        line-height: 1.5;
        margin-bottom: 8px;
      }
      
      /* Ajustes para listas */
      .pptx-slide ul, .pptx-slide ol {
        margin-left: 20px;
        margin-bottom: 12px;
      }
      
      /* Responsividade */
      @media (max-width: 768px) {
        .pptx-slide {
          margin-bottom: 15px;
        }
      }
    `;
    
    document.head.appendChild(style);
  }

  static showError(container, error) {
    container.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: #ef4444;
        text-align: center;
        padding: 20px;
      ">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 16px;">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
        <div style="font-size: 16px; font-weight: 500; margin-bottom: 8px;">
          Erro ao carregar apresentação
        </div>
        <div style="font-size: 14px; color: #6b7280;">
          ${error.message || 'Não foi possível carregar o arquivo PPTX'}
        </div>
        <div style="font-size: 12px; color: #9ca3af; margin-top: 12px;">
          Verifique se o arquivo não está corrompido e tente novamente
        </div>
      </div>
    `;
  }

  static value(node) {
    return {
      id: node.getAttribute('data-pptx-id'),
      url: node.getAttribute('data-pptx-url'),
      filename: node.getAttribute('data-pptx-filename')
    };
  }
}

PptxBlot.blotName = 'pptx';
PptxBlot.tagName = 'div';
PptxBlot.className = 'pptx-blot';

Quill.register(PptxBlot);

export default PptxBlot;