// Script para adicionar SVGs nativos aos botões customizados do Quill
export function addCustomButtonIcons() {
  // Aguarda um pouco para garantir que o DOM foi renderizado
  setTimeout(() => {
    // SVG para o botão de upload
    const uploadButton = document.querySelector('.ql-toolbar .ql-upload');
    if (uploadButton && !uploadButton.querySelector('svg')) {
      uploadButton.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 12V18C5 18.5523 5.44772 19 6 19H18C18.5523 19 19 18.5523 19 18V12" class="ql-stroke" stroke="#444" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M12 15L12 3M12 3L8 7M12 3L16 7" class="ql-stroke" stroke="#444" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
    }

    // SVG para o botão de emoji
    const emojiButton = document.querySelector('.ql-toolbar .ql-emoji');
    if (emojiButton && !emojiButton.querySelector('svg')) {
      emojiButton.innerHTML = `
        <svg viewBox="0 0 18 18">
          <circle class="ql-stroke" cx="9" cy="9" r="7" stroke="#444" stroke-width="2" fill="none"/>
          <circle class="ql-fill" cx="6.5" cy="7" r="1" fill="#444"/>
          <circle class="ql-fill" cx="11.5" cy="7" r="1" fill="#444"/>
          <path class="ql-stroke" d="M6,11 Q9,13 12,11" stroke="#444" stroke-width="2" fill="none" stroke-linecap="round"/>
        </svg>
      `;
    }

    // SVG para o botão de código
    const codeButton = document.querySelector('.ql-toolbar .ql-code');
    if (codeButton) {
      // Remove qualquer SVG existente para forçar atualização
      codeButton.innerHTML = '';
      codeButton.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path class="ql-fill" fill-rule="evenodd" clip-rule="evenodd" d="M9.29289 1.29289C9.48043 1.10536 9.73478 1 10 1H18C19.6569 1 21 2.34315 21 4V9C21 9.55228 20.5523 10 20 10C19.4477 10 19 9.55228 19 9V4C19 3.44772 18.5523 3 18 3H11V8C11 8.55228 10.5523 9 10 9H5V20C5 20.5523 5.44772 21 6 21H9C9.55228 21 10 21.4477 10 22C10 22.5523 9.55228 23 9 23H6C4.34315 23 3 21.6569 3 20V8C3 7.73478 3.10536 7.48043 3.29289 7.29289L9.29289 1.29289ZM6.41421 7H9V4.41421L6.41421 7ZM18.7071 12.2929L22.7071 16.2929C23.0976 16.6834 23.0976 17.3166 22.7071 17.7071L18.7071 21.7071C18.3166 22.0976 17.6834 22.0976 17.2929 21.7071C16.9024 21.3166 16.9024 20.6834 17.2929 20.2929L20.5858 17L17.2929 13.7071C16.9024 13.3166 16.9024 12.6834 17.2929 12.2929C17.6834 11.9024 18.3166 11.9024 18.7071 12.2929ZM14.7071 13.7071C15.0976 13.3166 15.0976 12.6834 14.7071 12.2929C14.3166 11.9024 13.6834 11.9024 13.2929 12.2929L9.29289 16.2929C8.90237 16.6834 8.90237 17.3166 9.29289 17.7071L13.2929 21.7071C13.6834 22.0976 14.3166 22.0976 14.7071 21.7071C15.0976 21.3166 15.0976 20.6834 14.7071 20.2929L11.4142 17L14.7071 13.7071Z" fill="#444"/>
        </svg>
      `;
    }
  }, 100);
}

// Função para observar mudanças no DOM e reaplicar os ícones se necessário
export function observeQuillToolbar() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        const addedNodes = Array.from(mutation.addedNodes);
        const hasQuillToolbar = addedNodes.some(node => 
          node.nodeType === Node.ELEMENT_NODE && 
          (node.classList?.contains('ql-toolbar') || node.querySelector?.('.ql-toolbar'))
        );
        
        if (hasQuillToolbar) {
          addCustomButtonIcons();
        }
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  return observer;
}