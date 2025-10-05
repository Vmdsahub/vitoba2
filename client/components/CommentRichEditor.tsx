import React, { useState, useRef, useEffect } from 'react';
import ReactQuill from 'react-quill';
import { modules, formats } from '../utils/quillConfig';
import { addCustomButtonIcons, observeQuillToolbar } from '../utils/quillButtonIcons';
import SecureUploadWidget, { UploadedFileInfo, is3DModelFile, isTxtFile, isPdfFile, isXlsxFile, isPptxFile, isDocxFile, isZipFile } from './SecureUploadWidget';
import ImageModal from './ImageModal';
import VideoPlayer from './VideoPlayer';
import CommentRenderer from './CommentRenderer';
import { calculateDeltaSize, hasRealContent, validateDelta, countEmbeds, type Delta } from '../utils/deltaUtils';
import '../styles/topic.css';

interface CommentRichEditorProps {
  value: any;
  onChange: (delta: any) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  placeholder?: string;
  disabled?: boolean;
  quotedComment?: {
    id: string;
    content: string;
    author: string;
  } | null;
  onRemoveQuote?: () => void;
}

export default function CommentRichEditor({ 
  value, 
  onChange, 
  onSubmit, 
  onCancel, 
  placeholder = "Escreva seu comentário...",
  disabled = false,
  quotedComment,
  onRemoveQuote
}: CommentRichEditorProps) {
  const [modalVideo, setModalVideo] = useState<{ src: string; alt: string } | null>(null);
  const [videoModal, setVideoModal] = useState<{
    src: string;
    filename: string;
  } | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [deltaSize, setDeltaSize] = useState(0);
  const [embedCount, setEmbedCount] = useState({ images: 0, videos: 0, audios: 0, files: 0, total: 0 });
  const quillRef = useRef<ReactQuill>(null);
  const uploadWidgetRef = useRef<HTMLButtonElement>(null);

  // Lista de emojis comuns
  const commonEmojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
    '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
    '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
    '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏',
    '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
    '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠',
    '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨',
    '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥',
    '❤️', '💙', '💚', '💛', '🧡', '💜', '🖤', '🤍',
    '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙',
    '💪', '🙏', '👏', '🎉', '🎊', '🔥', '⭐', '✨'
  ];

  // Inserir emoji no editor
  const insertEmoji = (emoji: string) => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      const range = quill.getSelection();
      const index = range ? range.index : quill.getLength();
      
      quill.insertText(index, emoji);
      quill.setSelection(index + emoji.length);
      
      const newDelta = quill.getContents();
      onChange(newDelta);
      
      setShowEmojiPicker(false);
    }
  };

  // Escutar evento customizado da toolbar
  useEffect(() => {
    const handleUploadClick = (event: CustomEvent) => {
      if (uploadWidgetRef.current) {
        uploadWidgetRef.current.click();
      }
    };

    const handleEmojiClick = (event: CustomEvent) => {
      setShowEmojiPicker(!showEmojiPicker);
    };

    document.addEventListener('quill-upload-click', handleUploadClick as EventListener);
    document.addEventListener('quill-emoji-click', handleEmojiClick as EventListener);
    
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

      editor.addEventListener('keydown', handleKeyDown);
      
      return () => {
        editor.removeEventListener('keydown', handleKeyDown);
      };
    };

    const cleanup = preventTextInMediaParagraphs();
    
    return cleanup;
  }, []);

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

  // Atualizar estatísticas quando o valor muda externamente
  useEffect(() => {
    const size = calculateDeltaSize(value);
    const embeds = countEmbeds(value);
    setDeltaSize(size);
    setEmbedCount(embeds);
  }, [value]);

  const handleQuillChange = (content: string, delta: any, source: any, editor: any) => {
    const newDelta = editor.getContents();
    
    // Calcular tamanho e estatísticas do delta
    const size = calculateDeltaSize(newDelta);
    const embeds = countEmbeds(newDelta);
    
    // Limitar a 2000 caracteres para comentários (menor que tópicos)
    if (size <= 2000) {
      setDeltaSize(size);
      setEmbedCount(embeds);
      onChange(newDelta);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.shiftKey)) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="comment-rich-editor mx-auto max-w-2xl">
      {quotedComment && (
        <div className="mb-3 p-3 bg-white border border-gray-200 rounded">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">
              Citando @{quotedComment.author}:
            </span>
            <button
              type="button"
              onClick={onRemoveQuote}
              className="text-xs text-red-600 hover:text-red-800"
            >
              Remover citação
            </button>
          </div>
          <div className="text-sm text-gray-700 italic line-clamp-2">
            <CommentRenderer delta={quotedComment.content ? JSON.parse(quotedComment.content) : null} />
          </div>
        </div>
      )}

      <div className="relative">
        <ReactQuill 
          ref={quillRef}
          theme="snow" 
          value={value} 
          onChange={handleQuillChange}
          modules={modules} 
          formats={formats}
          placeholder={placeholder}
          readOnly={disabled}
          onKeyDown={handleKeyDown}
          style={{ minHeight: '120px' }}
        />
          
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
        
      <div className="hidden relative">
        <SecureUploadWidget
          ref={uploadWidgetRef}
          onSuccess={(fileInfo: UploadedFileInfo) => {
            console.log('Arquivo carregado no comentário:', fileInfo);
            
            if (quillRef.current) {
              const quill = quillRef.current.getEditor();
              const range = quill.getSelection();
              const index = range ? range.index : quill.getLength();
              
              const videoRegex = /\.(mp4|webm|avi|mov|wmv|flv|mkv)$/i;
              const isVideo = fileInfo.mimeType?.startsWith('video/') || videoRegex.test(fileInfo.originalName);
              
              const isModel3D = fileInfo.mimeType?.includes('gltf') || 
                               fileInfo.mimeType?.includes('model/') ||
                               is3DModelFile(fileInfo.originalName);
                  
              const audioRegex = /\.(mp3|wav|ogg|aac|flac|m4a|wma)$/i;
              const isAudio = fileInfo.mimeType?.startsWith('audio/') || audioRegex.test(fileInfo.originalName);
                  
              const isTxt = fileInfo.mimeType?.startsWith('text/') || isTxtFile(fileInfo.originalName);
              const isPdf = fileInfo.mimeType === 'application/pdf' || isPdfFile(fileInfo.originalName);
              const isXlsx = fileInfo.mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || isXlsxFile(fileInfo.originalName);
              const isPptx = fileInfo.mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || isPptxFile(fileInfo.originalName);
              const isDocx = fileInfo.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || isDocxFile(fileInfo.originalName);
              const isZip = fileInfo.mimeType === 'application/zip' || isZipFile(fileInfo.originalName);
              
              // Verificar se precisa adicionar quebra de linha após o embed
              const shouldAddLineBreakAfter = index < quill.getLength() - 1;

              if (fileInfo.isImage) {
                quill.insertEmbed(index, 'image', fileInfo.url);
                
                let cursorPosition = index + 1;
                
                // Adicionar quebra de linha apenas se necessário
                if (shouldAddLineBreakAfter) {
                  const nextChar = quill.getText(index + 1, 1);
                  if (nextChar !== '\n') {
                    quill.insertText(index + 1, '\n');
                    cursorPosition = index + 2;
                  }
                }
                
                // Posicionar cursor após o embed (e quebra se houver)
                quill.setSelection(cursorPosition, 0);
              } else if (isVideo) {
                const videoId = `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                quill.insertEmbed(index, 'video', {
                  id: videoId,
                  url: fileInfo.url,
                  filename: fileInfo.originalName
                });
                
                let cursorPosition = index + 1;
                
                // Adicionar quebra de linha apenas se necessário
                if (shouldAddLineBreakAfter) {
                  const nextChar = quill.getText(index + 1, 1);
                  if (nextChar !== '\n') {
                    quill.insertText(index + 1, '\n');
                    cursorPosition = index + 2;
                  }
                }
                
                // Posicionar cursor após o embed (e quebra se houver)
                quill.setSelection(cursorPosition, 0);
              } else if (isModel3D) {
                const modelId = `model3d-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                quill.insertEmbed(index, 'model3d', {
                  id: modelId,
                  url: fileInfo.url,
                  name: fileInfo.originalName,
                  size: fileInfo.size
                });
                
                let cursorPosition = index + 1;
                
                // Adicionar quebra de linha apenas se necessário
                if (shouldAddLineBreakAfter) {
                  const nextChar = quill.getText(index + 1, 1);
                  if (nextChar !== '\n') {
                    quill.insertText(index + 1, '\n');
                    cursorPosition = index + 2;
                  }
                }
                
                // Posicionar cursor após o embed (e quebra se houver)
                quill.setSelection(cursorPosition, 0);
              } else if (isAudio) {
                const audioId = `audio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                quill.insertEmbed(index, 'audio', {
                  id: audioId,
                  url: fileInfo.url,
                  filename: fileInfo.originalName
                });
                
                let cursorPosition = index + 1;
                
                // Adicionar quebra de linha apenas se necessário
                if (shouldAddLineBreakAfter) {
                  const nextChar = quill.getText(index + 1, 1);
                  if (nextChar !== '\n') {
                    quill.insertText(index + 1, '\n');
                    cursorPosition = index + 2;
                  }
                }
                
                // Posicionar cursor após o embed (e quebra se houver)
                quill.setSelection(cursorPosition, 0);
              } else if (isTxt) {
                const txtId = `txt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                quill.insertEmbed(index, 'txt', {
                  id: txtId,
                  url: fileInfo.url,
                  filename: fileInfo.originalName
                });
                
                let cursorPosition = index + 1;
                
                // Adicionar quebra de linha apenas se necessário
                if (shouldAddLineBreakAfter) {
                  const nextChar = quill.getText(index + 1, 1);
                  if (nextChar !== '\n') {
                    quill.insertText(index + 1, '\n');
                    cursorPosition = index + 2;
                  }
                }
                
                // Posicionar cursor após o embed (e quebra se houver)
                quill.setSelection(cursorPosition, 0);
              } else if (isPdf) {
                const pdfId = `pdf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                quill.insertEmbed(index, 'pdf', {
                  id: pdfId,
                  url: fileInfo.url,
                  filename: fileInfo.originalName
                });
                
                let cursorPosition = index + 1;
                
                // Adicionar quebra de linha apenas se necessário
                if (shouldAddLineBreakAfter) {
                  const nextChar = quill.getText(index + 1, 1);
                  if (nextChar !== '\n') {
                    quill.insertText(index + 1, '\n');
                    cursorPosition = index + 2;
                  }
                }
                
                // Posicionar cursor após o embed (e quebra se houver)
                quill.setSelection(cursorPosition, 0);
              } else if (isXlsx) {
                const xlsxId = `xlsx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                quill.insertEmbed(index, 'xlsx', {
                  id: xlsxId,
                  url: fileInfo.url,
                  filename: fileInfo.originalName
                });
                
                let cursorPosition = index + 1;
                
                // Adicionar quebra de linha apenas se necessário
                if (shouldAddLineBreakAfter) {
                  const nextChar = quill.getText(index + 1, 1);
                  if (nextChar !== '\n') {
                    quill.insertText(index + 1, '\n');
                    cursorPosition = index + 2;
                  }
                }
                
                // Posicionar cursor após o embed (e quebra se houver)
                quill.setSelection(cursorPosition, 0);
              } else if (isPptx) {
                const pptxId = `pptx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                quill.insertEmbed(index, 'pptx', {
                  id: pptxId,
                  url: fileInfo.url,
                  filename: fileInfo.originalName
                });
                
                let cursorPosition = index + 1;
                
                // Adicionar quebra de linha apenas se necessário
                if (shouldAddLineBreakAfter) {
                  const nextChar = quill.getText(index + 1, 1);
                  if (nextChar !== '\n') {
                    quill.insertText(index + 1, '\n');
                    cursorPosition = index + 2;
                  }
                }
                
                // Posicionar cursor após o embed (e quebra se houver)
                quill.setSelection(cursorPosition, 0);
              } else if (isDocx) {
                const docxId = `docx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                quill.insertEmbed(index, 'docx', {
                  id: docxId,
                  url: fileInfo.url,
                  filename: fileInfo.originalName
                });
                
                let cursorPosition = index + 1;
                
                // Adicionar quebra de linha apenas se necessário
                if (shouldAddLineBreakAfter) {
                  const nextChar = quill.getText(index + 1, 1);
                  if (nextChar !== '\n') {
                    quill.insertText(index + 1, '\n');
                    cursorPosition = index + 2;
                  }
                }
                
                // Posicionar cursor após o embed (e quebra se houver)
                quill.setSelection(cursorPosition, 0);
              } else if (isZip) {
                const zipId = `zip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                quill.insertEmbed(index, 'zip', {
                  id: zipId,
                  url: fileInfo.url,
                  filename: fileInfo.originalName
                });
                
                let cursorPosition = index + 1;
                
                // Adicionar quebra de linha apenas se necessário
                if (shouldAddLineBreakAfter) {
                  const nextChar = quill.getText(index + 1, 1);
                  if (nextChar !== '\n') {
                    quill.insertText(index + 1, '\n');
                    cursorPosition = index + 2;
                  }
                }
                
                // Posicionar cursor após o embed (e quebra se houver)
                quill.setSelection(cursorPosition, 0);
              } else {
                quill.insertText(index, `📎 `);
                quill.insertText(index + 2, fileInfo.originalName, 'link', fileInfo.url);
                quill.insertText(index + 2 + fileInfo.originalName.length, `\n`);
              }
              
              const newDelta = quill.getContents();
              onChange(newDelta);
            }
          }}
          onError={(error) => console.error('Erro no upload:', error)}
          buttonText="📎 Upload"
          className="mr-2"
        />
      </div>
      
      {/* Contador de Delta e Estatísticas */}
      <div className="flex justify-between items-center mt-2 text-sm">
        <div className="flex gap-4 text-gray-500">
          {embedCount.total > 0 && (
            <span>
              📎 {embedCount.total} arquivo{embedCount.total !== 1 ? 's' : ''}
              {embedCount.images > 0 && ` (${embedCount.images} img)`}
              {embedCount.videos > 0 && ` (${embedCount.videos} vid)`}
              {embedCount.audios > 0 && ` (${embedCount.audios} aud)`}
            </span>
          )}
        </div>
        <div className={`${deltaSize > 2000 ? 'text-red-500' : deltaSize > 1600 ? 'text-yellow-500' : 'text-gray-500'}`}>
          {deltaSize}/2000
        </div>
      </div>

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