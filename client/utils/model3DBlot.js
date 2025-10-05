import ReactQuill from 'react-quill';
import { createRoot } from 'react-dom/client';
import React from 'react';
import Model3DViewer from '../components/Model3DViewer';
import Model3DModal from '../components/Model3DModal';

const Quill = ReactQuill.Quill;
const Embed = Quill.import('blots/embed');

class Model3DBlot extends Embed {
  static blotName = 'model3d';
  static tagName = 'div';
  static className = 'ql-model3d-embed';

  static create(value) {
    const node = super.create();
    node.setAttribute('contenteditable', false);
    node.setAttribute('data-model-url', value.url);
    node.setAttribute('data-model-name', value.name || '');
    node.setAttribute('data-model-size', value.size || '');
    
    // Estilos do container principal seguindo o padrão do VideoBlot
    node.style.cssText = `
      position: relative;
      width: 150px;
      height: 150px;
      display: inline-block;
      vertical-align: top;
      margin: 4px;
      border-radius: 8px;
      overflow: hidden;
      cursor: pointer;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      line-height: 0;
    `;

    // Criar container para o React component
    const viewerContainer = document.createElement('div');
    viewerContainer.className = 'model3d-viewer-container';
    viewerContainer.style.cssText = `
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      position: absolute;
      top: 0;
      left: 0;
    `;
    node.appendChild(viewerContainer);

    // Adicionar tooltip com informações do modelo
    if (value.name) {
      node.title = `${value.name}${value.size ? ` (${value.size})` : ''}`;
    }

    // Estado do modal
    let isModalOpen = false;
    let modalRoot = null;

    // Função para abrir modal
    const openModal = () => {
      if (isModalOpen) return;
      
      isModalOpen = true;
      const modalContainer = document.createElement('div');
      document.body.appendChild(modalContainer);
      modalRoot = createRoot(modalContainer);
      
      const closeModal = () => {
        if (modalRoot && modalContainer) {
          modalRoot.unmount();
          document.body.removeChild(modalContainer);
          modalRoot = null;
          isModalOpen = false;
        }
      };
      
      modalRoot.render(
        React.createElement(Model3DModal, {
          isOpen: true,
          onClose: closeModal,
          modelUrl: value.url,
          modelName: value.name
        })
      );
    };

    // Adicionar event listener para abrir modal
    node.addEventListener('click', openModal);

    // Renderizar o viewer 3D
    const root = createRoot(viewerContainer);
    root.render(
      React.createElement(Model3DViewer, {
        modelUrl: value.url,
        width: 150,
        height: 150,
        autoRotate: true,
        enableControls: false,
        onError: (error) => {
          console.error('Erro ao carregar modelo 3D:', error);
          // Mostrar estado de erro
          viewerContainer.innerHTML = `
            <div style="
              width: 150px;
              height: 150px;
              display: flex;
              align-items: center;
              justify-content: center;
              background: #f3f4f6;
              border: 1px dashed #d1d5db;
              border-radius: 6px;
              color: #6b7280;
              text-align: center;
              font-size: 11px;
            ">
              <div>
                <div style="font-weight: 500; margin-bottom: 2px;">Erro</div>
                <div style="font-size: 10px;">Modelo 3D</div>
              </div>
            </div>
          `;
        }
      })
    );

    // Efeitos hover
    node.addEventListener('mouseenter', () => {
      node.style.borderColor = '#3b82f6';
      // Removida a sombra branca: node.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.15)';
    });

    node.addEventListener('mouseleave', () => {
      node.style.borderColor = '#e5e7eb';
      node.style.boxShadow = 'none';
    });

    return node;
  }

  static value(node) {
    return {
      url: node.getAttribute('data-model-url'),
      name: node.getAttribute('data-model-name'),
      size: node.getAttribute('data-model-size')
    };
  }

  static formats(node) {
    return {
      url: node.getAttribute('data-model-url'),
      name: node.getAttribute('data-model-name'),
      size: node.getAttribute('data-model-size')
    };
  }
}

// Registrar o blot
Quill.register(Model3DBlot);

export default Model3DBlot;

// Função helper para inserir modelo 3D no editor
export function insertModel3D(quill, modelData) {
  const range = quill.getSelection(true);
  quill.insertEmbed(range.index, 'model3d', {
    url: modelData.url,
    name: modelData.name,
    size: modelData.size
  });
  quill.setSelection(range.index + 1);
}

// CSS adicional para o blot
const style = document.createElement('style');
style.textContent = `
  .ql-model3d {
    user-select: none;
  }
  
  .ql-model3d .model3d-viewer-container {
    display: flex;
    justify-content: center;
  }
  
  .ql-model3d:hover {
    transform: translateY(-2px);
  }
  
  .ql-editor .ql-model3d {
    margin: 16px auto;
    max-width: 100%;
  }
`;
document.head.appendChild(style);