import { Quill } from 'react-quill';

const Embed = Quill.import('blots/embed');

class XlsxBlot extends Embed {
  static create(value) {
    const node = super.create();
    const { id, url, filename } = value;
    
    // Configurar o blot como um container único
    node.setAttribute('data-xlsx-id', id);
    node.setAttribute('data-xlsx-url', url);
    node.setAttribute('data-xlsx-filename', filename);
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
    
    // Criar estrutura HTML do componente XLSX com design similar ao áudio
    node.innerHTML = `
      <div class="xlsx-player-container" style="
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
        <!-- XLSX View Button -->
        <button class="xlsx-view-btn" style="
          width: 16px;
          height: 16px;
          border: none;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #16a34a;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          flex-shrink: 0;
          box-sizing: border-box;
          position: relative;
          margin: 0;
          padding: 0;
          border-radius: 4px;
        " title="Visualizar Excel">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="position: relative;">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
            <path d="M9,13L11,16L13,13H15L12,17L15,21H13L11,18L9,21H7L10,17L7,13H9Z" fill="currentColor"/>
          </svg>
        </button>

        <!-- XLSX filename -->
        <div class="xlsx-filename" style="
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

        <!-- XLSX Type Display -->
        <div class="xlsx-type-display" style="
          font-size: 8px;
          color: #16a34a;
          font-weight: 500;
          white-space: nowrap;
          flex-shrink: 0;
          margin: 0 4px;
          font-variant-numeric: tabular-nums;
        ">XLSX</div>

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
    XlsxBlot.setupComponent(node);
    
    return node;
  }

  static setupComponent(node) {
    // Verificar se já foi configurado para evitar duplicação
    if (node.hasAttribute('data-xlsx-configured')) {
      return;
    }
    node.setAttribute('data-xlsx-configured', 'true');
    
    const xlsxViewBtn = node.querySelector('.xlsx-view-btn');
    const downloadBtn = node.querySelector('.download-btn');
    const url = node.getAttribute('data-xlsx-url');
    const filename = node.getAttribute('data-xlsx-filename');

    // Função para abrir modal do XLSX
    const openXlsxModal = async () => {
      // Criar overlay do modal
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

      // Criar container do modal
      const modalContent = document.createElement('div');
      modalContent.className = 'xlsx-modal';
      modalContent.style.cssText = `
        width: 95vw;
        height: 85vh;
        max-width: 1400px;
        max-height: 900px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        animation: slideIn 0.3s ease-out;
        position: relative;
      `;

      // Criar header do modal
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

      const modalActions = document.createElement('div');
      modalActions.style.cssText = `
        display: flex;
        gap: 8px;
        align-items: center;
      `;

      // Botão de download no modal
      const modalDownloadBtn = document.createElement('button');
      modalDownloadBtn.style.cssText = `
        padding: 8px 12px;
        background: white;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        color: #374151;
        font-size: 14px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: all 0.2s;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `;
      modalDownloadBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
        </svg>
        Download
      `;

      // Botão de fechar
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

      modalActions.appendChild(modalDownloadBtn);
      modalActions.appendChild(closeBtn);
      modalHeader.appendChild(modalTitle);
      modalHeader.appendChild(modalActions);

      // Container do conteúdo
      const xlsxContainer = document.createElement('div');
      xlsxContainer.style.cssText = `
        flex: 1;
        display: flex;
        flex-direction: column;
        background: white;
        position: relative;
        overflow: hidden;
        padding: 0;
      `;

      // Loading indicator
      const loadingDiv = document.createElement('div');
      loadingDiv.innerHTML = `
        <div style="text-align: center; color: #6b7280;">
          <div style="margin-bottom: 12px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style="animation: spin 1s linear infinite;">
              <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z"/>
            </svg>
          </div>
          <p style="margin: 0; font-size: 14px;">Carregando planilha...</p>
        </div>
        <style>
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        </style>
      `;
      xlsxContainer.appendChild(loadingDiv);

      // Adicionar CSS customizado para scrollbar
      const style = document.createElement('style');
      style.textContent = `
        .xlsx-modal iframe::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .xlsx-modal iframe::-webkit-scrollbar-track {
          background: transparent;
        }
        .xlsx-modal iframe::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .xlsx-modal iframe::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
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

      // Carregar e renderizar o XLSX usando SheetJS
       try {
         // Importar XLSX dinamicamente
         const XLSX = await import('xlsx');
         
         // Buscar o arquivo XLSX
         const response = await fetch(url);
         const arrayBuffer = await response.arrayBuffer();
         
         // Ler o workbook
         const workbook = XLSX.read(arrayBuffer, { type: 'array' });
         
         // Criar container para o conteúdo
         const contentDiv = document.createElement('div');
         contentDiv.style.cssText = `
           width: 100%;
           height: 100%;
           display: flex;
           flex-direction: column;
           background: white;
           font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
           overflow: hidden;
         `;
         
         // Adicionar estilos para as planilhas
         const style = document.createElement('style');
         style.textContent = `
           .xlsx-content {
             padding: 16px;
             flex: 1;
             overflow: auto;
             max-height: calc(100vh - 200px);
           }
           .xlsx-sheet-tabs {
             display: flex;
             gap: 4px;
             padding: 8px 16px;
             background: #f8fafc;
             border-bottom: 1px solid #e2e8f0;
             overflow-x: auto;
             flex-shrink: 0;
             min-height: 48px;
           }
           .xlsx-sheet-tab {
             padding: 8px 16px;
             background: white;
             border: 1px solid #d1d5db;
             border-radius: 6px 6px 0 0;
             cursor: pointer;
             font-size: 12px;
             font-weight: 500;
             color: #374151;
             transition: all 0.2s;
             white-space: nowrap;
           }
           .xlsx-sheet-tab.active {
             background: #2563eb;
             color: white;
             border-color: #2563eb;
           }
           .xlsx-sheet-tab:hover:not(.active) {
             background: #f3f4f6;
           }
           .xlsx-table {
             width: 100%;
             border-collapse: collapse;
             font-size: 13px;
             margin-top: 8px;
             table-layout: auto;
           }
           .xlsx-table th,
           .xlsx-table td {
             border: 1px solid #d1d5db;
             padding: 8px 12px;
             text-align: left;
             min-width: 120px;
             max-width: 300px;
             overflow: hidden;
             text-overflow: ellipsis;
             white-space: nowrap;
             vertical-align: top;
           }
           .xlsx-table th {
             background: #f9fafb;
             font-weight: 600;
             color: #374151;
             position: sticky;
             top: 0;
             z-index: 1;
           }
           .xlsx-table tr:nth-child(even) {
             background: #f9fafb;
           }
           .xlsx-table tr:hover {
             background: #f3f4f6;
           }
           .xlsx-content::-webkit-scrollbar {
             width: 6px;
             height: 6px;
           }
           .xlsx-content::-webkit-scrollbar-track {
             background: transparent;
           }
           .xlsx-content::-webkit-scrollbar-thumb {
             background: rgba(0, 0, 0, 0.2);
             border-radius: 3px;
             transition: background 0.2s ease;
           }
           .xlsx-content::-webkit-scrollbar-thumb:hover {
             background: rgba(0, 0, 0, 0.4);
           }
         `;
         document.head.appendChild(style);
         
         // Criar abas das planilhas
         const tabsContainer = document.createElement('div');
         tabsContainer.className = 'xlsx-sheet-tabs';
         
         const contentContainer = document.createElement('div');
         contentContainer.className = 'xlsx-content';
         
         let activeSheetIndex = 0;
         
         // Função para renderizar uma planilha
         const renderSheet = (sheetName, sheetIndex) => {
           const worksheet = workbook.Sheets[sheetName];
           const htmlTable = XLSX.utils.sheet_to_html(worksheet, {
             table: true,
             header: 1,
             editable: false
           });
           
           // Aplicar classes CSS à tabela
           const tempDiv = document.createElement('div');
           tempDiv.innerHTML = htmlTable;
           const table = tempDiv.querySelector('table');
           if (table) {
             table.className = 'xlsx-table';
           }
           
           return tempDiv.innerHTML;
         };
         
         // Criar abas para cada planilha
         workbook.SheetNames.forEach((sheetName, index) => {
           const tab = document.createElement('div');
           tab.className = `xlsx-sheet-tab ${index === activeSheetIndex ? 'active' : ''}`;
           tab.textContent = sheetName;
           tab.addEventListener('click', () => {
             // Remover classe active de todas as abas
             tabsContainer.querySelectorAll('.xlsx-sheet-tab').forEach(t => t.classList.remove('active'));
             // Adicionar classe active à aba clicada
             tab.classList.add('active');
             // Renderizar a planilha selecionada
             contentContainer.innerHTML = renderSheet(sheetName, index);
             activeSheetIndex = index;
           });
           tabsContainer.appendChild(tab);
         });
         
         // Renderizar a primeira planilha por padrão
         if (workbook.SheetNames.length > 0) {
           contentContainer.innerHTML = renderSheet(workbook.SheetNames[0], 0);
         }
         
         contentDiv.appendChild(tabsContainer);
         contentDiv.appendChild(contentContainer);
         
         // Substituir o loading pelo conteúdo
         xlsxContainer.innerHTML = '';
         xlsxContainer.appendChild(contentDiv);
         
       } catch (error) {
         console.error('Erro ao carregar XLSX:', error);
         
         // Mostrar fallback em caso de erro
         const errorDiv = document.createElement('div');
         errorDiv.style.cssText = `
           display: flex;
           flex-direction: column;
           align-items: center;
           justify-content: center;
           height: 100%;
           text-align: center;
           padding: 40px;
           color: #374151;
           font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
         `;
         
         errorDiv.innerHTML = `
           <div style="
             width: 80px;
             height: 80px;
             background: #dcfce7;
             border-radius: 50%;
             display: flex;
             align-items: center;
             justify-content: center;
             margin-bottom: 24px;
           ">
             <svg width="40" height="40" viewBox="0 0 24 24" fill="#16a34a">
               <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
               <path d="M7,10H12V12H7V10M7,14H16V16H7V14M7,18H16V20H7V18M7,6H12V8H7V6Z" fill="#16a34a"/>
             </svg>
           </div>
           <h3 style="
             margin: 0 0 12px 0;
             font-size: 20px;
             font-weight: 600;
             color: #111827;
           ">Planilha Excel</h3>
           <p style="
             margin: 0 0 24px 0;
             font-size: 14px;
             color: #6b7280;
             line-height: 1.5;
             max-width: 400px;
           ">
             Não foi possível carregar o conteúdo da planilha.<br>
             Faça o download para visualizar o arquivo completo.
           </p>
           <button onclick="(() => { const link = document.createElement('a'); link.href = '${url}'; link.download = '${filename}'; link.click(); })()" 
                   style="background: #16a34a; color: white; border: none; border-radius: 8px; padding: 12px 24px; font-size: 14px; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s ease; box-shadow: 0 2px 4px rgba(22, 163, 74, 0.2);">
             <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 8px;">
               <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
             </svg>
             Baixar Planilha
           </button>
         `;
         
         xlsxContainer.innerHTML = '';
         xlsxContainer.appendChild(errorDiv);
       }
      modalContent.appendChild(modalHeader);
      modalContent.appendChild(xlsxContainer);
      modal.appendChild(modalContent);
      document.body.appendChild(modal);

      // Event listeners
      const closeModal = () => {
        modal.style.animation = 'fadeOut 0.2s ease-in';
        modalContent.style.animation = 'slideOut 0.2s ease-in';
        setTimeout(() => {
          document.body.removeChild(modal);
          document.head.removeChild(style);
        }, 200);
      };

      closeBtn.addEventListener('click', closeModal);
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });

      // Download functionality
      const downloadFile = () => {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
      };

      modalDownloadBtn.addEventListener('click', downloadFile);

      // Adicionar animações de saída
      const exitStyle = document.createElement('style');
      exitStyle.textContent = `
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes slideOut {
          from { transform: scale(1) translateY(0); opacity: 1; }
          to { transform: scale(0.95) translateY(-10px); opacity: 0; }
        }
      `;
      document.head.appendChild(exitStyle);
    };

    // Event listeners
    if (xlsxViewBtn) {
      xlsxViewBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openXlsxModal();
      });

      // Hover effects
      xlsxViewBtn.addEventListener('mouseenter', () => {
        xlsxViewBtn.style.background = 'rgba(22, 163, 74, 0.1)';
        xlsxViewBtn.style.transform = 'scale(1.1)';
      });

      xlsxViewBtn.addEventListener('mouseleave', () => {
        xlsxViewBtn.style.background = 'transparent';
        xlsxViewBtn.style.transform = 'scale(1)';
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
      id: node.getAttribute('data-xlsx-id'),
      url: node.getAttribute('data-xlsx-url'),
      filename: node.getAttribute('data-xlsx-filename')
    };
  }
}

XlsxBlot.blotName = 'xlsx';
XlsxBlot.tagName = 'div';
XlsxBlot.className = 'xlsx-blot';

// Registrar o blot
Quill.register(XlsxBlot);

export default XlsxBlot;