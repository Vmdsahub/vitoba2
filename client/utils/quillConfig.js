import ReactQuill from 'react-quill';
import './videoBlot.js'; // Importar para registrar o blot
import './model3DBlot.js'; // Importar para registrar o blot de modelo 3D
import './audioBlot.js'; // Importar para registrar o blot de áudio
import './txtBlot.js'; // Importar para registrar o blot de TXT
import './pdfBlot.js'; // Importar para registrar o blot de PDF
import './xlsxBlot.js'; // Importar para registrar o blot de XLSX
import './pptxBlot.jsx'; // Importar para registrar o blot de PPTX
import './docxBlot.js'; // Importar para registrar o blot de DOCX
import './zipBlot.js'; // Importar para registrar o blot de ZIP
import './codeBlot.js'; // Importar para registrar o blot de código

// O VideoBlot se registra automaticamente
const Quill = ReactQuill.Quill;

// Handler customizado para o botão de upload
function insertUpload() {
  // Este handler será chamado quando o botão customizado for clicado
  // A lógica real será implementada no componente TopicCreate
  const event = new CustomEvent('quill-upload-click', {
    detail: { quill: this.quill }
  });
  document.dispatchEvent(event);
}

// Handler customizado para o botão de emoji
function insertEmoji() {
  // Este handler será chamado quando o botão de emoji for clicado
  const event = new CustomEvent('quill-emoji-click', {
    detail: { quill: this.quill }
  });
  document.dispatchEvent(event);
}

// Handler customizado para o botão de código
function insertCode() {
  const range = this.quill.getSelection(true);
  this.quill.insertEmbed(range.index, 'codeblock', {
    code: '',
    language: 'javascript'
  });
  this.quill.setSelection(range.index + 1);
}

export const modules = {
  toolbar: {
    container: [
      [{ size: [false, 'large'] }, 'bold', 'italic', { color: [] }, { background: [] }, { align: [] }],
      ['link', 'upload', 'emoji', 'code']
    ],
    handlers: {
      upload: insertUpload,
      emoji: insertEmoji,
      code: insertCode
    }
  },
};

export const formats = [
  'size', 'bold', 'italic',
  'color', 'background', 'align',
  'link', 'image',
  'video',
  'model3d',
  'audio',
  'txt',
  'pdf',
  'xlsx',
  'pptx',
  'docx',
  'zip',
  'codeblock'
];