import { Quill } from 'react-quill';
import mammoth from 'mammoth';

const Embed = Quill.import('blots/embed');

class DocxBlot extends Embed {
  static create(value) {
    const node = super.create();
    const { id, url, filename } = value;
    
    // Configurar o blot como um container único
    node.setAttribute('data-docx-id', id);
    node.setAttribute('data-docx-url', url);
    node.setAttribute('data-docx-filename', filename);
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
    
    // Criar estrutura HTML do componente DOCX com design similar ao áudio
    node.innerHTML = `
      <div class="docx-player-container" style="
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
        <!-- DOCX View Button -->
        <button class="docx-view-btn" style="
          width: 16px;
          height: 16px;
          border: none;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #2563eb;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          flex-shrink: 0;
          box-sizing: border-box;
          position: relative;
          margin: 0;
          padding: 0;
          border-radius: 4px;
        " title="Visualizar Word">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="position: relative;">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
            <path d="M7,13L8.5,17.5L10.5,13L12,17.5L13.5,13H15L12.5,20H11.5L10,16L8.5,20H7.5L5,13H7Z" fill="currentColor"/>
          </svg>
        </button>

        <!-- DOCX filename -->
        <div class="docx-filename" style="
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

        <!-- DOCX Type Display -->
        <div class="docx-type-display" style="
          font-size: 8px;
          color: #2563eb;
          font-weight: 500;
          white-space: nowrap;
          flex-shrink: 0;
          margin: 0 4px;
          font-variant-numeric: tabular-nums;
        ">DOCX</div>

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
    DocxBlot.setupComponent(node);
    
    return node;
  }

  static setupComponent(node) {
    // Verificar se já foi configurado para evitar duplicação
    if (node.hasAttribute('data-docx-configured')) {
      return;
    }
    node.setAttribute('data-docx-configured', 'true');
    
    const docxViewBtn = node.querySelector('.docx-view-btn');
    const downloadBtn = node.querySelector('.download-btn');
    const url = node.getAttribute('data-docx-url');
    const filename = node.getAttribute('data-docx-filename');

    // Função para abrir modal do DOCX
    const openDocxModal = async () => {
      try {
        // Criar overlay do modal
        const modal = document.createElement('div');
        modal.className = 'docx-modal-overlay';
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
          width: 700px;
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
          padding: 24px;
          overflow-y: auto;
          flex: 1;
          max-height: 60vh;
        `;

        // Mostrar loading enquanto processa
        const loadingDiv = document.createElement('div');
        loadingDiv.style.cssText = `
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 200px;
          color: #6b7280;
        `;
        loadingDiv.innerHTML = `
          <div style="
            width: 40px;
            height: 40px;
            border: 3px solid #e5e7eb;
            border-top: 3px solid #2563eb;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 16px;
          "></div>
          <p style="margin: 0; font-size: 14px;">Extraindo conteúdo do documento...</p>
        `;

        contentArea.appendChild(loadingDiv);

        // Montar modal
        headerActions.appendChild(downloadBtn);
        headerActions.appendChild(closeBtn);
        header.appendChild(title);
        header.appendChild(headerActions);
        modalContent.appendChild(header);
        modalContent.appendChild(contentArea);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Adicionar CSS para animação de loading
        const style = document.createElement('style');
        style.textContent = `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `;
        document.head.appendChild(style);

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

        // Buscar e processar o arquivo DOCX
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Erro ao carregar arquivo: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        
        // Usar mammoth para extrair o conteúdo
        const result = await mammoth.convertToHtml({ arrayBuffer });
        
        // Substituir loading pelo conteúdo extraído
        contentArea.innerHTML = '';
        
        if (result.value) {
          const docContent = document.createElement('div');
          docContent.innerHTML = result.value;
          docContent.style.cssText = `
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            line-height: 1.6;
            color: #374151;
            word-wrap: break-word;
          `;
          
          // Aplicar estilos aos elementos do documento
          const paragraphs = docContent.querySelectorAll('p');
          paragraphs.forEach(p => {
            p.style.marginBottom = '12px';
          });
          
          const headings = docContent.querySelectorAll('h1, h2, h3, h4, h5, h6');
          headings.forEach(h => {
            h.style.fontWeight = '600';
            h.style.marginTop = '20px';
            h.style.marginBottom = '12px';
            h.style.color = '#111827';
          });
          
          const lists = docContent.querySelectorAll('ul, ol');
          lists.forEach(list => {
            list.style.marginBottom = '12px';
            list.style.paddingLeft = '20px';
          });
          
          const strong = docContent.querySelectorAll('strong, b');
          strong.forEach(s => {
            s.style.fontWeight = '600';
          });
          
          contentArea.appendChild(docContent);
          
          // Mostrar avisos se houver
          if (result.messages && result.messages.length > 0) {
            const warningsDiv = document.createElement('div');
            warningsDiv.style.cssText = `
              margin-top: 16px;
              padding: 12px;
              background: #fef3c7;
              border: 1px solid #f59e0b;
              border-radius: 6px;
              font-size: 12px;
              color: #92400e;
            `;
            warningsDiv.innerHTML = `
              <strong>Avisos:</strong><br>
              ${result.messages.map(msg => `• ${msg.message}`).join('<br>')}
            `;
            contentArea.appendChild(warningsDiv);
          }
        } else {
          // Fallback se não conseguir extrair conteúdo
          const errorDiv = document.createElement('div');
          errorDiv.style.cssText = `
            text-align: center;
            padding: 40px;
            color: #6b7280;
          `;
          errorDiv.innerHTML = `
            <p>Não foi possível extrair o conteúdo deste documento.</p>
            <p>Faça o download para visualizar no seu aplicativo preferido.</p>
          `;
          contentArea.appendChild(errorDiv);
        }

      } catch (error) {
        console.error('Erro ao processar DOCX:', error);
        
        // Mostrar erro no modal se já estiver aberto
        const modal = document.querySelector('.docx-modal-overlay');
        if (modal) {
          const contentArea = modal.querySelector('div:last-child');
          if (contentArea) {
            contentArea.innerHTML = `
              <div style="
                text-align: center;
                padding: 40px;
                color: #dc2626;
              ">
                <p><strong>Erro ao carregar documento</strong></p>
                <p>Não foi possível processar este arquivo DOCX.</p>
                <p>Faça o download para visualizar no seu aplicativo preferido.</p>
              </div>
            `;
          }
        }
      }
    };

    // Event listeners
    if (docxViewBtn) {
      docxViewBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openDocxModal();
      });

      // Hover effects
      docxViewBtn.addEventListener('mouseenter', () => {
        docxViewBtn.style.background = 'rgba(37, 99, 235, 0.1)';
        docxViewBtn.style.transform = 'scale(1.1)';
      });

      docxViewBtn.addEventListener('mouseleave', () => {
        docxViewBtn.style.background = 'transparent';
        docxViewBtn.style.transform = 'scale(1)';
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

      // Hover effects
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

  static value(node) {
    return {
      id: node.getAttribute('data-docx-id'),
      url: node.getAttribute('data-docx-url'),
      filename: node.getAttribute('data-docx-filename')
    };
  }
}

DocxBlot.blotName = 'docx';
DocxBlot.tagName = 'div';
DocxBlot.className = 'docx-blot';

// Registrar o blot
Quill.register(DocxBlot);

export default DocxBlot;