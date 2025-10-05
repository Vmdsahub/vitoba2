import React, { useState, useRef, useEffect } from 'react';
import ReactQuill from 'react-quill';
import { modules, formats } from '../utils/quillConfig';
import { addCustomButtonIcons, observeQuillToolbar } from '../utils/quillButtonIcons';
import SecureUploadWidget, { UploadedFileInfo, is3DModelFile, isTxtFile, isPdfFile, isXlsxFile, isPptxFile, isDocxFile, isZipFile } from './SecureUploadWidget';

import ImageModal from './ImageModal';
import VideoPlayer from './VideoPlayer';
import '../styles/topic.css';

interface TopicCreateProps {
  onSave: (data: { delta: any; image: File | null }) => void;
  onCancel?: () => void;
  image?: File | null;
  onImageChange?: (image: File | null) => void;
  hasError?: boolean;
  onContentChange?: () => void;
}

export default function TopicCreate({ onSave, onCancel, image: externalImage, onImageChange, hasError, onContentChange }: TopicCreateProps) {
  const [delta, setDelta] = useState('');
  const [image, setImage] = useState<File | null>(externalImage || null);
  const [characterCount, setCharacterCount] = useState(0);
  const [modalVideo, setModalVideo] = useState<{ src: string; alt: string } | null>(null);
  const [videoModal, setVideoModal] = useState<{
    src: string;
    filename: string;
  } | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const quillRef = useRef<ReactQuill>(null);
  const uploadWidgetRef = useRef<HTMLButtonElement>(null);

  // Escutar evento customizado da toolbar e configurar observer de imagens
  useEffect(() => {
    const handleUploadClick = (event: CustomEvent) => {
      // Acionar o SecureUploadWidget quando o botão da toolbar for clicado
      if (uploadWidgetRef.current) {
        uploadWidgetRef.current.click();
      }
    };

    const handleEmojiClick = (event: CustomEvent) => {
      // Alternar o emoji picker quando o botão da toolbar for clicado
      setShowEmojiPicker(!showEmojiPicker);
    };

    document.addEventListener('quill-upload-click', handleUploadClick as EventListener);
    document.addEventListener('quill-emoji-click', handleEmojiClick as EventListener);
    
    // Definir função global para abrir modal de vídeo
    (window as any).openVideoModal = (src: string, filename: string) => {
      setVideoModal({ src, filename });
    };

    // Adicionar ícones SVG aos botões customizados
    addCustomButtonIcons();
    const observer = observeQuillToolbar();
    
    return () => {
      document.removeEventListener('quill-upload-click', handleUploadClick as EventListener);
      document.removeEventListener('quill-emoji-click', handleEmojiClick as EventListener);
      delete (window as any).openVideoModal;
      observer.disconnect();
    };
  }, [showEmojiPicker]);

  // Fechar emoji picker quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showEmojiPicker && !(event.target as Element).closest('.emoji-picker')) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  // Lista de emojis comuns
  const commonEmojis = [
    // Rostos felizes
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
    '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
    '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
    '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏',
    
    // Rostos tristes/neutros
    '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
    '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠',
    '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨',
    '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥',
    '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧',
    '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
    '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑',
    
    // Personagens e objetos
    '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻',
    '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸',
    '❤️', '💙', '💚', '💛', '🧡', '💜', '🖤', '🤍',
    '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙',
    '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪',
    '🔥', '💯', '💫', '⭐', '🌟', '✨', '⚡', '💥'
  ];

  // Função para inserir emoji no editor
  const insertEmoji = (emoji: string) => {
    if (!quillRef.current) return;
    
    const quill = quillRef.current.getEditor();
    const selection = quill.getSelection();
    const index = selection ? selection.index : quill.getLength();
    
    quill.insertText(index, emoji);
    quill.setSelection(index + emoji.length);
    
    setShowEmojiPicker(false);
  };

  // Sistema para impedir texto em parágrafos com mídia
  useEffect(() => {
    if (!quillRef.current) return;

    const quill = quillRef.current.getEditor();
    
    const preventTextInMediaParagraphs = () => {
      const editor = quill.container.querySelector('.ql-editor');
      if (!editor) return;

      // Interceptar eventos de teclado
      const handleKeyDown = (e: KeyboardEvent) => {
        const selection = quill.getSelection();
        if (!selection) return;

        const [blot] = quill.getLeaf(selection.index);
        if (!blot || !blot.domNode) return;

        // Verificar se domNode tem o método closest
        if (typeof blot.domNode.closest !== 'function') return;
        
        const paragraph = blot.domNode.closest('p');
        if (!paragraph) return;

        const hasMedia = paragraph.querySelector('img, .ql-video-embed, .ql-model-embed, .video-thumbnail-container, .ql-model3d-embed');
        
        if (hasMedia && e.key.length === 1) {
          // Impedir digitação de caracteres
          e.preventDefault();
          
          // Criar ou encontrar parágrafo vazio após a mídia
          let nextP = paragraph.nextElementSibling as HTMLElement;
          
          if (!nextP || nextP.tagName !== 'P') {
            // Inserir novo parágrafo via Quill para manter consistência
            const paragraphIndex = quill.getIndex(blot);
            const paragraphLength = quill.getLength(paragraph);
            quill.insertText(paragraphIndex + paragraphLength, '\n');
            nextP = paragraph.nextElementSibling as HTMLElement;
          }
          
          // Mover cursor e inserir o caractere no novo parágrafo
          if (nextP) {
            const nextIndex = quill.getIndex(quill.getLeaf(quill.getLength() - 1)[0]);
            quill.setSelection(nextIndex);
            quill.insertText(nextIndex, e.key);
          }
        }
      };

      // Interceptar tentativas de colar
      const handlePaste = (e: ClipboardEvent) => {
        const selection = quill.getSelection();
        if (!selection) return;

        const [blot] = quill.getLeaf(selection.index);
        if (!blot || !blot.domNode) return;

        const paragraph = blot.domNode.closest('p');
        if (!paragraph) return;

        const hasMedia = paragraph.querySelector('img, .ql-video-embed, .video-thumbnail-container');
        
        if (hasMedia) {
          e.preventDefault();
          
          const clipboardData = e.clipboardData?.getData('text/plain') || '';
          if (clipboardData) {
            // Criar novo parágrafo e colar lá
            let nextP = paragraph.nextElementSibling as HTMLElement;
            
            if (!nextP || nextP.tagName !== 'P') {
              const paragraphIndex = quill.getIndex(blot);
              const paragraphLength = quill.getLength(paragraph);
              quill.insertText(paragraphIndex + paragraphLength, '\n');
              nextP = paragraph.nextElementSibling as HTMLElement;
            }
            
            if (nextP) {
              const nextIndex = quill.getIndex(quill.getLeaf(quill.getLength() - 1)[0]);
              quill.setSelection(nextIndex);
              quill.insertText(nextIndex, clipboardData);
            }
          }
        }
      };

      editor.addEventListener('keydown', handleKeyDown);
      editor.addEventListener('paste', handlePaste);
      
      return () => {
        editor.removeEventListener('keydown', handleKeyDown);
        editor.removeEventListener('paste', handlePaste);
      };
    };

    const cleanup = preventTextInMediaParagraphs();
    
    return cleanup;
  }, []);

  const handleQuillChange = (content: string, delta: any, source: any, editor: any) => {
    const newDelta = editor.getContents();
    const text = editor.getText();
    const count = text.length - 1; // -1 para remover o \n final do Quill
    
    // Limitar a 5000 caracteres
    if (count <= 5000) {
      setDelta(newDelta);
      setCharacterCount(count);
      onContentChange?.();
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImage(file);
    onImageChange?.(file);
  };

  return (
    <div className={`topic-shell ${hasError ? 'error' : ''}`}>
      <input 
        ref={fileInputRef}
        type="file" 
        accept="image/*" 
        onChange={handleImageChange}
        className="hidden"
      />
      
      <div className="relative">
        <ReactQuill 
          ref={quillRef}
          theme="snow" 
          value={delta} 
          onChange={handleQuillChange}
          modules={modules} 
          formats={formats} 
        />
        
        {/* Emoji Picker posicionado em relação à toolbar */}
        {showEmojiPicker && (
          <div className="emoji-picker absolute top-10 left-1/2 transform -translate-x-1/2 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50 w-80 max-h-60 overflow-y-auto">
            <div className="grid grid-cols-8 gap-1">
              {commonEmojis.map((emoji, index) => (
                <button
                  key={index}
                  type="button"
                  className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded transition-colors text-lg"
                  onClick={() => insertEmoji(emoji)}
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="flex justify-between items-center pt-2 pb-4">
        <div className="flex items-center gap-2 relative">
          {/* SecureUploadWidget invisível, acionado pela toolbar */}
          <div className="hidden relative">
            <SecureUploadWidget
              ref={uploadWidgetRef}
              onSuccess={(fileInfo: UploadedFileInfo) => {
                console.log('Arquivo carregado:', fileInfo);
                // Inserir link do arquivo no editor
                if (quillRef.current) {
                  const quill = quillRef.current.getEditor();
                  const range = quill.getSelection();
                  const index = range ? range.index : quill.getLength();
                  
                  // Detectar tipo de arquivo e inserir adequadamente
                  const isVideo = fileInfo.mimeType?.startsWith('video/') || 
                                 /\.(mp4|webm|avi|mov|wmv|flv|mkv)$/i.test(fileInfo.originalName);
                  
                  const isModel3D = fileInfo.mimeType?.includes('gltf') || 
                                   fileInfo.mimeType?.includes('model/') ||
                                   is3DModelFile(fileInfo.originalName);
                  
                  const isAudio = fileInfo.mimeType?.startsWith('audio/') || 
                                 /\.(mp3|wav|ogg|aac|flac|m4a|wma)$/i.test(fileInfo.originalName);
                  
                  const isTxt = fileInfo.mimeType?.startsWith('text/') || 
                               isTxtFile(fileInfo.originalName);
                  
                  const isPdf = fileInfo.mimeType === 'application/pdf' || 
                               isPdfFile(fileInfo.originalName);
                  
                  const isXlsx = fileInfo.mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                                isXlsxFile(fileInfo.originalName);
                  
                  const isPptx = fileInfo.mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || 
                                isPptxFile(fileInfo.originalName);
                  
                  const isDocx = fileInfo.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                                isDocxFile(fileInfo.originalName);
                  
                  const isZip = fileInfo.mimeType === 'application/zip' || 
                               isZipFile(fileInfo.originalName);
                  
                  // Verificar contexto da linha atual
                  const currentLine = quill.getLine(index);
                  const lineText = currentLine && currentLine[0] ? currentLine[0].domNode.textContent : '';
                  const hasTextInLine = lineText && lineText.trim().length > 0;
                  
                  // Verificar se há mídia na linha atual (excluindo áudios para lógica de áudio)
                  const hasMediaInCurrentLine = currentLine && currentLine[0] && 
                    (currentLine[0].domNode.closest('p').querySelector('img') ||
                     currentLine[0].domNode.querySelector('.ql-video-embed') ||
                     currentLine[0].domNode.closest('p').querySelector('.ql-model3d-embed'));
                  
                  // Para áudios e TXT, verificar se há mídia não-inline na linha atual
                  const hasNonInlineMediaInCurrentLine = currentLine && currentLine[0] && 
                    (currentLine[0].domNode.closest('p').querySelector('img') ||
                     currentLine[0].domNode.querySelector('.ql-video-embed') ||
                     currentLine[0].domNode.closest('p').querySelector('.ql-model3d-embed'));
                  
                  let insertIndex = index;
                  let shouldAddLineBreakBefore = false;
                  let shouldAddLineBreakAfter = false;
                  
                  // Lógica especial para áudio, TXT, PDF, XLSX, PPTX, DOCX e ZIP: só quebra linha se há mídia não-inline na linha atual
                  if (isAudio || isTxt || isPdf || isXlsx || isPptx || isDocx || isZip) {
                    // Para áudio, TXT e PDF: só quebra linha se há mídia (imagem, vídeo, 3D) na linha atual, não outros áudios/txts/pdfs
                    if (hasNonInlineMediaInCurrentLine) {
                      quill.insertText(index, '\n');
                      insertIndex = index + 1;
                      shouldAddLineBreakBefore = true;
                    }
                    // Se há apenas texto ou outros áudios/txts, não quebra linha - fica inline
                  } else {
                    // Para outros tipos de mídia: quebra linha se há texto na linha atual
                    if (hasTextInLine && !hasMediaInCurrentLine) {
                      quill.insertText(index, '\n');
                      insertIndex = index + 1;
                      shouldAddLineBreakBefore = true;
                    }
                  }
                  
                  // Para áudio, TXT, PDF, XLSX, PPTX, DOCX e ZIP, determinar quebra após baseado no próximo elemento
                  if (isAudio || isTxt || isPdf || isXlsx || isPptx || isDocx || isZip) {
                    const nextChar = quill.getText(insertIndex + 1, 1);
                    const hasTextAfter = nextChar && nextChar.trim() && nextChar !== '\n';
                    // Áudio, TXT e PDF só quebram linha após se há mídia não-inline depois
                    const nextBlot = quill.getLeaf(insertIndex + 1)[0];
                    const nextParagraph = nextBlot?.domNode?.closest('p');
                    const hasNonInlineMediaAfter = nextParagraph && 
                      (nextParagraph.querySelector('img') ||
                       nextParagraph.querySelector('.ql-video-embed') ||
                       nextParagraph.querySelector('.ql-model3d-embed'));
                    shouldAddLineBreakAfter = hasNonInlineMediaAfter;
                  } else {
                    // Para outros tipos: quebra linha se há texto depois
                    const nextChar = quill.getText(insertIndex + 1, 1);
                    shouldAddLineBreakAfter = nextChar && nextChar.trim() && nextChar !== '\n';
                  }
                  
                  if (fileInfo.isImage) {
                    quill.insertEmbed(insertIndex, 'image', fileInfo.url);
                    
                    let cursorPosition = insertIndex + 1;
                    
                    // Adicionar quebra de linha apenas se necessário
                    if (shouldAddLineBreakAfter) {
                      const nextChar = quill.getText(insertIndex + 1, 1);
                      if (nextChar !== '\n') {
                        quill.insertText(insertIndex + 1, '\n');
                        cursorPosition = insertIndex + 2;
                      }
                    }
                    
                    // Posicionar cursor após o embed (e quebra se houver)
                    quill.setSelection(cursorPosition, 0);
                  } else if (isVideo) {
                    // Para vídeos, inserir usando o blot customizado
                    const videoId = `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    quill.insertEmbed(insertIndex, 'video', {
                      id: videoId,
                      url: fileInfo.url,
                      filename: fileInfo.originalName
                    });
                    
                    let cursorPosition = insertIndex + 1;
                    
                    // Adicionar quebra de linha apenas se necessário
                    if (shouldAddLineBreakAfter) {
                      const nextChar = quill.getText(insertIndex + 1, 1);
                      if (nextChar !== '\n') {
                        quill.insertText(insertIndex + 1, '\n');
                        cursorPosition = insertIndex + 2;
                      }
                    }
                    
                    // Posicionar cursor após o embed (e quebra se houver)
                    quill.setSelection(cursorPosition, 0);
                  } else if (isModel3D) {
                    // Para modelos 3D, inserir usando o blot customizado
                    const modelId = `model3d-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    quill.insertEmbed(insertIndex, 'model3d', {
                      id: modelId,
                      url: fileInfo.url,
                      name: fileInfo.originalName,
                      size: fileInfo.size
                    });
                    
                    let cursorPosition = insertIndex + 1;
                    
                    // Adicionar quebra de linha apenas se necessário
                    if (shouldAddLineBreakAfter) {
                      const nextChar = quill.getText(insertIndex + 1, 1);
                      if (nextChar !== '\n') {
                        quill.insertText(insertIndex + 1, '\n');
                        cursorPosition = insertIndex + 2;
                      }
                    }
                    
                    // Posicionar cursor após o embed (e quebra se houver)
                    quill.setSelection(cursorPosition, 0);
                  } else if (isAudio) {
                    // Para áudios, inserir usando o blot customizado
                    const audioId = `audio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    quill.insertEmbed(insertIndex, 'audio', {
                      id: audioId,
                      url: fileInfo.url,
                      filename: fileInfo.originalName
                    });
                    
                    let cursorPosition = insertIndex + 1;
                    
                    // Adicionar quebra de linha apenas se necessário (após mídia)
                    if (shouldAddLineBreakAfter) {
                      const nextChar = quill.getText(insertIndex + 1, 1);
                      if (nextChar !== '\n') {
                        quill.insertText(insertIndex + 1, '\n');
                        cursorPosition = insertIndex + 2;
                      }
                    }
                    
                    // Posicionar cursor após o embed (e quebra se houver)
                    quill.setSelection(cursorPosition, 0);
                  } else if (isTxt) {
                    // Para arquivos TXT, inserir usando o blot customizado
                    const txtId = `txt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    quill.insertEmbed(insertIndex, 'txt', {
                      id: txtId,
                      url: fileInfo.url,
                      filename: fileInfo.originalName
                    });
                    
                    let cursorPosition = insertIndex + 1;
                    
                    // Adicionar quebra de linha apenas se necessário (após mídia)
                    if (shouldAddLineBreakAfter) {
                      const nextChar = quill.getText(insertIndex + 1, 1);
                      if (nextChar !== '\n') {
                        quill.insertText(insertIndex + 1, '\n');
                        cursorPosition = insertIndex + 2;
                      }
                    }
                    
                    // Posicionar cursor após o embed (e quebra se houver)
                    quill.setSelection(cursorPosition, 0);
                  } else if (isPdf) {
                    // Para arquivos PDF, inserir usando o blot customizado
                    const pdfId = `pdf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    quill.insertEmbed(insertIndex, 'pdf', {
                      id: pdfId,
                      url: fileInfo.url,
                      filename: fileInfo.originalName
                    });
                    
                    let cursorPosition = insertIndex + 1;
                    
                    // Adicionar quebra de linha apenas se necessário (após mídia)
                    if (shouldAddLineBreakAfter) {
                      const nextChar = quill.getText(insertIndex + 1, 1);
                      if (nextChar !== '\n') {
                        quill.insertText(insertIndex + 1, '\n');
                        cursorPosition = insertIndex + 2;
                      }
                    }
                    
                    // Posicionar cursor após o embed (e quebra se houver)
                    quill.setSelection(cursorPosition, 0);
                  } else if (isXlsx) {
                    // Para arquivos XLSX, inserir usando o blot customizado
                    const xlsxId = `xlsx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    quill.insertEmbed(insertIndex, 'xlsx', {
                      id: xlsxId,
                      url: fileInfo.url,
                      filename: fileInfo.originalName
                    });
                    
                    let cursorPosition = insertIndex + 1;
                    
                    // Adicionar quebra de linha apenas se necessário (após mídia)
                    if (shouldAddLineBreakAfter) {
                      const nextChar = quill.getText(insertIndex + 1, 1);
                      if (nextChar !== '\n') {
                        quill.insertText(insertIndex + 1, '\n');
                        cursorPosition = insertIndex + 2;
                      }
                    }
                    
                    // Posicionar cursor após o embed (e quebra se houver)
                    quill.setSelection(cursorPosition, 0);
                  } else if (isPptx) {
                    // Para arquivos PPTX, inserir usando o blot customizado
                    const pptxId = `pptx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    quill.insertEmbed(insertIndex, 'pptx', {
                      id: pptxId,
                      url: fileInfo.url,
                      filename: fileInfo.originalName
                    });
                    
                    let cursorPosition = insertIndex + 1;
                    
                    // Adicionar quebra de linha apenas se necessário (após mídia)
                    if (shouldAddLineBreakAfter) {
                      const nextChar = quill.getText(insertIndex + 1, 1);
                      if (nextChar !== '\n') {
                        quill.insertText(insertIndex + 1, '\n');
                        cursorPosition = insertIndex + 2;
                      }
                    }
                    
                    // Posicionar cursor após o embed (e quebra se houver)
                    quill.setSelection(cursorPosition, 0);
                  } else if (isDocx) {
                    // Para arquivos DOCX, inserir usando o blot customizado
                    const docxId = `docx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    quill.insertEmbed(insertIndex, 'docx', {
                      id: docxId,
                      url: fileInfo.url,
                      filename: fileInfo.originalName
                    });
                    
                    let cursorPosition = insertIndex + 1;
                    
                    // Adicionar quebra de linha apenas se necessário (após mídia)
                    if (shouldAddLineBreakAfter) {
                      const nextChar = quill.getText(insertIndex + 1, 1);
                      if (nextChar !== '\n') {
                        quill.insertText(insertIndex + 1, '\n');
                        cursorPosition = insertIndex + 2;
                      }
                    }
                    
                    // Posicionar cursor após o embed (e quebra se houver)
                    quill.setSelection(cursorPosition, 0);
                  } else if (isZip) {
                    // Para arquivos ZIP, inserir usando o blot customizado
                    const zipId = `zip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    quill.insertEmbed(insertIndex, 'zip', {
                      id: zipId,
                      url: fileInfo.url,
                      filename: fileInfo.originalName
                    });
                    
                    let cursorPosition = insertIndex + 1;
                    
                    // Adicionar quebra de linha apenas se necessário (após mídia)
                    if (shouldAddLineBreakAfter) {
                      const nextChar = quill.getText(insertIndex + 1, 1);
                      if (nextChar !== '\n') {
                        quill.insertText(insertIndex + 1, '\n');
                        cursorPosition = insertIndex + 2;
                      }
                    }
                    
                    // Posicionar cursor após o embed (e quebra se houver)
                    quill.setSelection(cursorPosition, 0);
                  } else {
                    quill.insertText(insertIndex, `📎 `);
                    quill.insertText(insertIndex + 2, fileInfo.originalName, 'link', fileInfo.url);
                    quill.insertText(insertIndex + 2 + fileInfo.originalName.length, `\n`);
                  }
                  
                  // Atualizar o delta corretamente
                  const newDelta = quill.getContents();
                  setDelta(newDelta);
                  onContentChange?.();
                }
              }}
              onError={(error) => console.error('Erro no upload:', error)}
              buttonText="📎 Upload"
              className="mr-2"
            />
          </div>
        </div>
        <div className={`text-sm ${characterCount > 5000 ? 'text-red-500' : 'text-gray-500'}`}>
          {characterCount}/5000
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <button 
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button 
          onClick={() => onSave({ delta, image })}
          className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
        >
          Publicar
        </button>
      </div>
      
      {/* Modal de vídeo */}
      <ImageModal
        isOpen={!!modalVideo}
        onClose={() => setModalVideo(null)}
        src={modalVideo?.src || ""}
        alt={modalVideo?.alt || ""}
        isVideo={true}
      />
      
      <VideoPlayer
        isOpen={!!videoModal}
        onClose={() => setVideoModal(null)}
        src={videoModal?.src || ""}
        filename={videoModal?.filename || ""}
      />
    </div>
  );
}