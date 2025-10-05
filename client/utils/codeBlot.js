import ReactQuill from 'react-quill';

const Quill = ReactQuill.Quill;
const BlockEmbed = Quill.import('blots/block/embed');

class CodeBlot extends BlockEmbed {
  static create(value) {
    const node = super.create();
    
    // Função para verificar se o Quill pai está em modo readOnly
    const checkQuillReadOnlyMode = () => {
      // Procurar pelo container do Quill
      let parent = node.parentElement;
      while (parent) {
        if (parent.classList.contains('ql-editor')) {
          const quillContainer = parent.closest('.ql-container');
          if (quillContainer && quillContainer.classList.contains('ql-disabled')) {
            return true;
          }
          break;
        }
        parent = parent.parentElement;
      }
      return false;
    };
    
    // Função para detectar modo readonly de forma mais robusta
    const detectReadOnlyMode = () => {
      console.log('🔍 CodeBlot: Detectando modo readonly...', {
        valueReadOnly: value?.readOnly,
        hasQuillDisabled: !!document.querySelector('.ql-container.ql-disabled'),
        hasTopicView: !!document.querySelector('.topic-view'),
        hasCommentView: !!document.querySelector('.comment-view')
      });
      
      // 1. Verificar se foi explicitamente passado como readonly
      if (value.readOnly === true) {
        console.log('✅ CodeBlot: Modo readonly detectado via value.readOnly');
        return true;
      }
      
      // 2. Verificar se o Quill pai está em modo readonly
      if (checkQuillReadOnlyMode()) {
        console.log('✅ CodeBlot: Modo readonly detectado via checkQuillReadOnlyMode');
        return true;
      }
      
      // 3. Verificar se estamos em um contexto de visualização (topic-view ou comment-view)
      let parent = node.parentElement;
      while (parent) {
        if (parent.classList.contains('topic-view') || 
            parent.classList.contains('comment-view') ||
            parent.closest('.topic-view') ||
            parent.closest('.comment-view')) {
          console.log('✅ CodeBlot: Modo readonly detectado via topic-view/comment-view');
          return true;
        }
        parent = parent.parentElement;
      }
      
      console.log('❌ CodeBlot: Modo readonly NÃO detectado');
      return false;
    };
    
    // Verificar se é modo de edição ou visualização
    // Detectar se o Quill está em modo readOnly (tópico publicado)
    const isReadOnly = detectReadOnlyMode();
    console.log('🎯 CodeBlot: Resultado final da detecção readonly:', isReadOnly);
    
    // Verificar periodicamente se o Quill mudou para modo readOnly
    const checkReadOnlyStatus = () => {
      const quillIsReadOnly = checkQuillReadOnlyMode();
      if (quillIsReadOnly && !codeElement.readOnly) {
        // Converter para modo readOnly
        makeReadOnly();
      }
    };
    
    let codeElement;
    let languageElement;
    
    // Função para converter o codeblock para modo readOnly
    const makeReadOnly = () => {
      if (codeElement && !codeElement.readOnly) {
        codeElement.readOnly = true;
        codeElement.disabled = true;
        codeElement.style.cursor = 'default';
        
        // Remover eventos de edição
        codeElement.removeEventListener('input', saveChanges);
        if (languageElement && languageElement.tagName === 'SELECT') {
          languageElement.disabled = true;
          languageElement.style.cursor = 'default';
          languageElement.removeEventListener('change', saveChanges);
        }
        
        // Atualizar altura para conteúdo readonly
        setTimeout(() => {
          codeElement.style.height = 'auto';
          codeElement.style.height = Math.min(codeElement.scrollHeight, 350) + 'px';
        }, 0);
      }
    };
    
    // Container principal
    node.setAttribute('contenteditable', false);
    
    // Permitir que o container receba eventos de teclado quando necessário
    node.addEventListener('mousedown', (e) => {
      // Permitir que cliques no textarea sejam processados normalmente
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        e.stopPropagation();
      }
    });
    node.style.cssText = `
      width: 95%;
      height: ${isReadOnly ? 'auto' : '100px'};
      min-height: 100px;
      margin: 10px auto;
      background: #ffffff;
      border-radius: 4px;
      border: 1px solid #e1e5e9;
      position: relative;
      overflow: hidden;
      font-family: 'Courier New', monospace;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      max-height: ${isReadOnly ? '400px' : '200px'};
    `;
    
    // Header com seletor de linguagem
    const header = document.createElement('div');
    header.style.cssText = `
      background: transparent;
      padding: 8px 12px;
      border: none;
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 32px;
    `;
    
    // Container para botões do lado direito
    const rightButtons = document.createElement('div');
    rightButtons.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    
    // Criar elemento de linguagem (sempre como select, mas CSS vai desabilitar em readonly)
    languageElement = document.createElement('select');
    languageElement.className = 'code-language-selector';
    languageElement.style.cssText = `
      background: transparent;
      border: none;
      border-radius: 6px;
      padding: 4px 8px;
      font-size: 11px;
      font-weight: 500;
      font-style: italic;
      color: #64748b;
      margin-right: 8px;
      outline: none;
      transition: all 0.2s ease;
      min-width: 80px;
      appearance: none;
      -webkit-appearance: none;
      -moz-appearance: none;
    `;

    // Adicionar opções de linguagem (apenas essenciais para vibecoding)
    const languages = [
      'javascript', 'typescript', 'python', 'html', 'css', 'json', 'markdown'
    ];
    
    languages.forEach(lang => {
      const option = document.createElement('option');
      option.value = lang;
      option.textContent = lang.charAt(0).toUpperCase() + lang.slice(1);
      if (lang === (value.language || 'javascript')) option.selected = true;
      languageElement.appendChild(option);
    });

    // Event listener para mudança de linguagem (será desabilitado pelo CSS em readonly)
    languageElement.addEventListener('change', (e) => {
      const newLanguage = e.target.value;
      codeElement.className = `language-${newLanguage}`;
      node.setAttribute('data-code', JSON.stringify({
        code: codeElement.value,
        language: newLanguage,
        readOnly: false
      }));
      
      // Re-aplicar highlight
      if (window.Prism) {
        window.Prism.highlightElement(codeElement);
      }
    });
    
    // Botão de copiar
    const copyBtn = document.createElement('button');
    copyBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
    `;
    copyBtn.title = 'Copiar código';
    copyBtn.style.cssText = `
      background: transparent;
      border: none;
      border-radius: 6px;
      padding: 6px 8px;
      font-size: 11px;
      cursor: pointer;
      color: #64748b;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 32px;
      height: 28px;
    `;
    
    copyBtn.addEventListener('mouseenter', () => {
      copyBtn.style.color = '#475569';
    });
    
    copyBtn.addEventListener('mouseleave', () => {
      copyBtn.style.color = '#64748b';
    });
    
    copyBtn.addEventListener('click', async () => {
      try {
        const textToCopy = codeElement.value || codeElement.textContent || '';
        await navigator.clipboard.writeText(textToCopy);
        copyBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20,6 9,17 4,12"></polyline>
          </svg>
        `;
        copyBtn.style.color = '#10b981';
        setTimeout(() => {
          copyBtn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          `;
          copyBtn.style.color = '#64748b';
        }, 1000);
      } catch (err) {
        console.error('Erro ao copiar:', err);
        // Fallback para navegadores mais antigos
        const textArea = document.createElement('textarea');
        textArea.value = codeElement.value || codeElement.textContent || '';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        copyBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20,6 9,17 4,12"></polyline>
          </svg>
        `;
        copyBtn.style.color = '#10b981';
        setTimeout(() => {
          copyBtn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2 2v1"></path>
            </svg>
          `;
          copyBtn.style.color = '#64748b';
        }, 1000);
      }
    });
    
    rightButtons.appendChild(copyBtn);
    
    header.appendChild(languageElement);
    header.appendChild(rightButtons);
    
    // Remover o botão do header - será adicionado no final do bloco
    
    // Área de código
    if (isReadOnly) {
      codeElement = document.createElement('textarea');
      codeElement.readOnly = true;
      codeElement.disabled = true;
      codeElement.style.cssText = `
        width: 100%;
        height: auto;
        min-height: 80px;
        background: transparent;
        color: #212529;
        border: none;
        outline: none;
        padding: 0 12px;
        font-family: 'Courier New', monospace;
        font-size: 14px;
        line-height: 1.4;
        margin: 0;
        resize: none;
        overflow-y: auto;
        scrollbar-width: none;
        -ms-overflow-style: none;
      `;
      
      // Ocultar scrollbar nativa
      codeElement.style.setProperty('-webkit-scrollbar', 'none');
      
      // Criar barra de scroll customizada
       const customScrollbar = document.createElement('div');
        customScrollbar.style.cssText = `
          position: absolute;
          right: 6px;
          top: 0;
          width: 4px;
          height: 100%;
          background: transparent;
          border-radius: 2px;
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
          z-index: 10;
        `;
      
      const scrollThumb = document.createElement('div');
      scrollThumb.style.cssText = `
        width: 100%;
        background: #cbd5e0;
        border-radius: 2px;
        position: absolute;
        top: 0;
        transition: background 0.2s ease;
      `;
      
      customScrollbar.appendChild(scrollThumb);
      
      // Função para atualizar a posição e tamanho do thumb
      const updateScrollThumb = () => {
        const scrollTop = codeElement.scrollTop;
        const scrollHeight = codeElement.scrollHeight;
        const clientHeight = codeElement.clientHeight;
        
        if (scrollHeight <= clientHeight) {
          customScrollbar.style.opacity = '0';
          return;
        }
        
        const thumbHeight = Math.max((clientHeight / scrollHeight) * clientHeight, 20);
        const thumbTop = (scrollTop / (scrollHeight - clientHeight)) * (clientHeight - thumbHeight);
        
        scrollThumb.style.height = thumbHeight + 'px';
        scrollThumb.style.top = thumbTop + 'px';
      };
      
      // Mostrar/ocultar scrollbar durante o scroll
      let scrollTimeout;
      codeElement.addEventListener('scroll', () => {
        customScrollbar.style.opacity = '0.7';
        updateScrollThumb();
        
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          customScrollbar.style.opacity = '0';
        }, 1000);
      });
      
      // Hover na scrollbar
      customScrollbar.addEventListener('mouseenter', () => {
        scrollThumb.style.background = '#a0aec0';
      });
      
      customScrollbar.addEventListener('mouseleave', () => {
        scrollThumb.style.background = '#cbd5e0';
      });
      
      // Adicionar scrollbar ao container
      node.style.position = 'relative';
      node.appendChild(customScrollbar);
      
      // Atualizar thumb inicial
      setTimeout(updateScrollThumb, 100);
      codeElement.value = value.code || '';
      // Auto-ajustar altura para conteúdo readonly
      setTimeout(() => {
        codeElement.style.height = 'auto';
        codeElement.style.height = Math.min(codeElement.scrollHeight, 350) + 'px';
      }, 0);
    } else {
      codeElement = document.createElement('textarea');
      // Altura inicial será ajustada pela função updateFooterVisibility
      codeElement.style.cssText = `
        width: 100%;
        height: calc(100% - 32px);
        background: transparent;
        color: #212529;
        border: none;
        outline: none;
        padding: 0 12px;
        font-family: 'Courier New', monospace;
        font-size: 14px;
        resize: none;
        line-height: 1.4;
        overflow-y: auto;
        scrollbar-width: none;
        -ms-overflow-style: none;
      `;
      
      // Ocultar scrollbar nativa
      codeElement.style.setProperty('-webkit-scrollbar', 'none');
      
      // Criar barra de scroll customizada para modo editável
       const customScrollbar = document.createElement('div');
        customScrollbar.style.cssText = `
          position: absolute;
          right: 6px;
          top: 0;
          width: 4px;
          height: 100%;
          background: transparent;
          border-radius: 2px;
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
          z-index: 10;
        `;
      
      const scrollThumb = document.createElement('div');
      scrollThumb.style.cssText = `
        width: 100%;
        background: #cbd5e0;
        border-radius: 2px;
        position: absolute;
        top: 0;
        transition: background 0.2s ease;
      `;
      
      customScrollbar.appendChild(scrollThumb);
      
      // Função para atualizar a posição e tamanho do thumb
      const updateScrollThumb = () => {
        const scrollTop = codeElement.scrollTop;
        const scrollHeight = codeElement.scrollHeight;
        const clientHeight = codeElement.clientHeight;
        
        if (scrollHeight <= clientHeight) {
          customScrollbar.style.opacity = '0';
          return;
        }
        
        const thumbHeight = Math.max((clientHeight / scrollHeight) * clientHeight, 20);
        const thumbTop = (scrollTop / (scrollHeight - clientHeight)) * (clientHeight - thumbHeight);
        
        scrollThumb.style.height = thumbHeight + 'px';
        scrollThumb.style.top = thumbTop + 'px';
      };
      
      // Mostrar/ocultar scrollbar durante o scroll
      let scrollTimeout;
      codeElement.addEventListener('scroll', () => {
        customScrollbar.style.opacity = '0.7';
        updateScrollThumb();
        
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          customScrollbar.style.opacity = '0';
        }, 1000);
      });
      
      // Hover na scrollbar
      customScrollbar.addEventListener('mouseenter', () => {
        scrollThumb.style.background = '#a0aec0';
      });
      
      customScrollbar.addEventListener('mouseleave', () => {
        scrollThumb.style.background = '#cbd5e0';
      });
      
      // Adicionar scrollbar ao container
      node.style.position = 'relative';
      node.appendChild(customScrollbar);
      
      // Atualizar thumb quando o conteúdo muda
      const updateOnChange = () => {
        setTimeout(updateScrollThumb, 10);
      };
      
      codeElement.addEventListener('input', updateOnChange);
      codeElement.addEventListener('keyup', updateOnChange);
      
      // Atualizar thumb inicial
      setTimeout(updateScrollThumb, 100);
      codeElement.placeholder = 'Digite seu código aqui...';
      codeElement.value = value.code || '';
      
      // Garantir que o textarea seja focalizável e receba eventos de teclado
      codeElement.setAttribute('tabindex', '0');
      
      // Interceptar cliques para garantir foco adequado
      codeElement.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        setTimeout(() => codeElement.focus(), 0);
      });
      
      // Garantir que o textarea mantenha o foco quando clicado
      codeElement.addEventListener('focus', (e) => {
        e.stopPropagation();
      });
    }
    
    // Criar footer com botão expandir
    const footer = document.createElement('div');
    footer.style.cssText = `
      background: transparent;
      padding: 8px 12px;
      border: none;
      display: none;
      justify-content: center;
      align-items: center;
      height: 36px;
      position: relative;
    `;
    
    const expandBtn = document.createElement('div');
    expandBtn.innerHTML = 'Expandir';
    expandBtn.style.cssText = `
      color: #6c757d;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
      transition: all 0.2s ease;
      user-select: none;
      text-decoration: none;
      background: none;
      border: none;
      padding: 2px 4px;
      transform: translateY(-8px);
    `;
    
    expandBtn.addEventListener('mouseenter', () => {
      expandBtn.style.color = '#495057';
    });
    
    expandBtn.addEventListener('mouseleave', () => {
      expandBtn.style.color = '#6c757d';
    });
    
    footer.appendChild(expandBtn);
    
    // Estado de expansão
    let isExpanded = false;
    
    // Função para verificar se deve mostrar o botão expandir
    const shouldShowExpandButton = (content) => {
      if (!content || content.trim().length === 0) return false;
      
      // Contar quebras de linha explícitas
      const explicitLines = content.split('\n').length;
      
      // Se há 3+ linhas explícitas, mostrar botão
      if (explicitLines >= 3) return true;
      
      // Para conteúdo sem quebras explícitas, verificar se é longo o suficiente
      // para potencialmente quebrar em 3+ linhas visuais (aproximadamente 150+ chars)
      if (explicitLines < 3 && content.length > 150) {
        // Verificar altura visual do elemento
        const lineHeight = 20;
        const elementHeight = codeElement.scrollHeight || codeElement.offsetHeight;
        const visualLines = Math.ceil(elementHeight / lineHeight);
        return visualLines >= 3;
      }
      
      return false;
    };
    
    // Função para atualizar visibilidade do footer
    const updateFooterVisibility = () => {
      // Tentar múltiplas formas de obter o conteúdo
      let content = '';
      if (isReadOnly) {
        content = codeElement.textContent || codeElement.innerText || value.code || '';
      } else {
        content = codeElement.value || '';
      }
      
      const shouldShow = shouldShowExpandButton(content);
      
      if (shouldShow) {
        footer.style.display = 'flex';
        // Não alterar altura aqui - deixar para updateHeight() gerenciar
      } else {
        footer.style.display = 'none';
        if (isExpanded) {
          isExpanded = false;
          updateHeight();
        }
      }
      
      // Sempre chamar updateHeight para aplicar a altura correta
      updateHeight();
    };
    
    // Função para atualizar altura do container dinamicamente
    const updateHeight = () => {
      const headerHeight = 32;
      const footerHeight = footer.style.display === 'none' ? 0 : 36;
      
      if (isExpanded) {
        // Modo expandido: container se ajusta dinamicamente até 330px (300px + 10%)
        const maxCodeHeight = 330 - headerHeight - footerHeight;
        
        // Configurar container para crescer dinamicamente
        node.style.height = 'auto';
        node.style.maxHeight = '330px';
        node.style.minHeight = 'auto';
        node.style.overflow = 'visible';
        
        // Configurar elemento de código para crescer dinamicamente
        codeElement.style.height = 'auto';
        codeElement.style.maxHeight = maxCodeHeight + 'px';
        codeElement.style.overflow = 'auto';
        codeElement.style.minHeight = 'auto';
        
        // Forçar recálculo para altura dinâmica
        requestAnimationFrame(() => {
          const contentHeight = codeElement.scrollHeight;
          const finalHeight = Math.min(contentHeight, maxCodeHeight);
          
          if (contentHeight <= maxCodeHeight) {
            // Conteúdo cabe sem scroll - ajustar altura exata
            codeElement.style.height = contentHeight + 'px';
            codeElement.style.overflow = 'hidden';
            node.style.height = (contentHeight + headerHeight + footerHeight) + 'px';
          } else {
            // Conteúdo excede limite - usar scroll
            codeElement.style.height = maxCodeHeight + 'px';
            codeElement.style.overflow = 'auto';
            node.style.height = '330px';
          }
        });
        
        expandBtn.innerHTML = 'Contrair';
      } else {
        // Modo contraído: altura limitada
        const collapsedHeight = isReadOnly ? '80px' : '100px';
        
        node.style.height = collapsedHeight;
        node.style.maxHeight = collapsedHeight;
        node.style.minHeight = collapsedHeight;
        node.style.overflow = 'hidden';
        
        if (footer.style.display === 'none') {
          // Sem footer: código ocupa toda a altura disponível
          codeElement.style.height = `calc(${collapsedHeight} - ${headerHeight}px)`;
          codeElement.style.maxHeight = `calc(${collapsedHeight} - ${headerHeight}px)`;
        } else {
          // Com footer: código ocupa altura menos header e footer
          codeElement.style.height = `calc(${collapsedHeight} - ${headerHeight + footerHeight}px)`;
          codeElement.style.maxHeight = `calc(${collapsedHeight} - ${headerHeight + footerHeight}px)`;
        }
        codeElement.style.overflow = 'hidden';
        codeElement.style.minHeight = 'auto';
        
        expandBtn.innerHTML = 'Expandir';
      }
    };
    
    // Evento de clique no botão expandir
    expandBtn.addEventListener('click', () => {
      isExpanded = !isExpanded;
      updateHeight();
    });
    
    if (!isReadOnly) {
      // Eventos específicos para modo de edição
      codeElement.addEventListener('input', () => {
        updateFooterVisibility();
        // Atualizar altura em tempo real sempre que o conteúdo mudar
        updateHeight();
      });
      
      // Garantir que Ctrl+V funcione corretamente
      codeElement.addEventListener('keydown', (e) => {
        // Permitir Ctrl+V (paste) e outros atalhos importantes
        if (e.ctrlKey && (e.key === 'v' || e.key === 'V' || e.key === 'c' || e.key === 'C' || e.key === 'x' || e.key === 'X' || e.key === 'a' || e.key === 'A' || e.key === 'z' || e.key === 'Z')) {
          e.stopPropagation();
          // Não prevenir o comportamento padrão para permitir que o paste funcione
        }
      });
      
      // Atualizar altura quando o usuário cola conteúdo
      codeElement.addEventListener('paste', (e) => {
        e.stopPropagation(); // Impedir que o Quill interfira
        setTimeout(() => {
          updateFooterVisibility();
          updateHeight();
        }, 10);
      });
      
      // Atualizar altura quando há mudanças no tamanho do conteúdo
      codeElement.addEventListener('keyup', () => {
        updateHeight();
      });
      
      // Salvar mudanças
      const saveChanges = () => {
        const newValue = {
          code: codeElement.value,
          language: languageElement.value,
          readOnly: false
        };
        node.setAttribute('data-code', JSON.stringify(newValue));
      };

      codeElement.addEventListener('input', saveChanges);
      languageElement.addEventListener('change', saveChanges);
      
      // Monitorar mudanças no estado readOnly do Quill
      const readOnlyMonitor = setInterval(checkReadOnlyStatus, 1000);
      
      // Cleanup do monitor quando o elemento for removido
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.removedNodes.forEach((removedNode) => {
              if (removedNode === node || (removedNode.contains && removedNode.contains(node))) {
                clearInterval(readOnlyMonitor);
                observer.disconnect();
              }
            });
          }
        });
      });
      
      // Observar remoções no documento
      observer.observe(document.body, { childList: true, subtree: true });
    } else {
      // Para modo readonly, verificar periodicamente se o conteúdo mudou
      const observer = new MutationObserver(() => {
        updateFooterVisibility();
        updateHeight(); // Atualizar altura também no modo somente leitura
      });
      observer.observe(codeElement, { childList: true, subtree: true, characterData: true });
    }
    
    // Montar o DOM
    node.appendChild(header);
    node.appendChild(codeElement);
    node.appendChild(footer);
    
    // Verificações múltiplas da visibilidade do footer para garantir detecção
    setTimeout(() => updateFooterVisibility(), 100);
    setTimeout(() => updateFooterVisibility(), 300);
    setTimeout(() => updateFooterVisibility(), 800);
    setTimeout(() => updateFooterVisibility(), 1500);
    
    // Salvar valor inicial
    node.setAttribute('data-code', JSON.stringify(value));
    
    return node;
  }
  
  static value(node) {
    const dataCode = node.getAttribute('data-code');
    if (dataCode) {
      try {
        return JSON.parse(dataCode);
      } catch (e) {
        return { code: '', language: 'javascript', readOnly: false };
      }
    }
    return { code: '', language: 'javascript', readOnly: false };
  }
}

CodeBlot.blotName = 'codeblock';
CodeBlot.tagName = 'div';
CodeBlot.className = 'ql-codeblock';

Quill.register(CodeBlot);

export default CodeBlot;