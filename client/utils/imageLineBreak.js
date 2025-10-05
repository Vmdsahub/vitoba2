// Script para adicionar quebras de linha após imagens no ReactQuill

// Função para adicionar quebra de linha após uma imagem
function addLineBreakAfterImage(img) {
  // Verificar se já existe uma quebra
  if (img.nextElementSibling && img.nextElementSibling.classList.contains('image-line-break')) {
    return;
  }
  
  // Criar elemento de quebra
  const lineBreak = document.createElement('br');
  lineBreak.className = 'image-line-break';
  lineBreak.style.display = 'block';
  lineBreak.style.width = '100%';
  lineBreak.style.height = '1px';
  lineBreak.style.clear = 'both';
  
  // Inserir após a imagem
  img.parentNode.insertBefore(lineBreak, img.nextSibling);
}

// Função para remover quebras quando imagens estão consecutivas
function manageConsecutiveImages() {
  const editor = document.querySelector('.topic-shell .ql-editor');
  if (!editor) return;
  
  const images = editor.querySelectorAll('img');
  
  images.forEach((img, index) => {
    const nextElement = img.nextElementSibling;
    const nextImg = nextElement && nextElement.tagName === 'IMG' ? nextElement : 
                   nextElement && nextElement.nextElementSibling && nextElement.nextElementSibling.tagName === 'IMG' ? nextElement.nextElementSibling : null;
    
    const lineBreak = img.parentNode.querySelector('.image-line-break');
    
    if (nextImg && lineBreak) {
      // Se há uma próxima imagem, ocultar a quebra
      lineBreak.style.display = 'none';
    } else if (lineBreak) {
      // Se não há próxima imagem, mostrar a quebra
      lineBreak.style.display = 'block';
    }
  });
}

// Função para processar todas as imagens no editor
function processAllImages() {
  const editor = document.querySelector('.topic-shell .ql-editor');
  if (!editor) return;
  
  const images = editor.querySelectorAll('img');
  images.forEach(addLineBreakAfterImage);
  manageConsecutiveImages();
}

// Observer para detectar mudanças no DOM
function setupImageObserver() {
  const editor = document.querySelector('.topic-shell .ql-editor');
  if (!editor) {
    // Tentar novamente em 100ms
    setTimeout(setupImageObserver, 100);
    return;
  }
  
  const observer = new MutationObserver((mutations) => {
    let hasImageChanges = false;
    
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        // Verificar se foram adicionadas imagens
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === 'IMG') {
              hasImageChanges = true;
              addLineBreakAfterImage(node);
            } else if (node.querySelector && node.querySelector('img')) {
              hasImageChanges = true;
              node.querySelectorAll('img').forEach(addLineBreakAfterImage);
            }
          }
        });
      }
    });
    
    if (hasImageChanges) {
      // Pequeno delay para garantir que o DOM foi atualizado
      setTimeout(manageConsecutiveImages, 10);
    }
  });
  
  observer.observe(editor, {
    childList: true,
    subtree: true
  });
  
  // Processar imagens existentes
  processAllImages();
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupImageObserver);
} else {
  setupImageObserver();
}

// Exportar funções para uso externo
export { setupImageObserver, processAllImages, addLineBreakAfterImage };
