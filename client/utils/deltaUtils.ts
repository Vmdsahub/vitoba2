// Utilitários para trabalhar com Delta do Quill

export interface DeltaOp {
  insert?: string | object;
  delete?: number;
  retain?: number;
  attributes?: any;
}

export interface Delta {
  ops: DeltaOp[];
}

/**
 * Calcula o tamanho real do delta baseado no conteúdo
 * Considera texto, imagens, vídeos e outros embeds
 */
export function calculateDeltaSize(delta: Delta | null): number {
  if (!delta || !delta.ops || delta.ops.length === 0) {
    return 0;
  }

  let size = 0;

  for (const op of delta.ops) {
    if (op.insert) {
      if (typeof op.insert === 'string') {
        // Texto: conta caracteres (excluindo quebras de linha finais do Quill)
        const text = op.insert.replace(/\n$/, '');
        size += text.length;
      } else if (typeof op.insert === 'object') {
        // Embeds (imagem, vídeo, etc.): cada embed conta como 50 caracteres
        if (op.insert.image || op.insert.video || op.insert.audio || op.insert.file) {
          size += 50;
        }
      }
    }
  }

  return size;
}

/**
 * Extrai texto puro do delta (sem embeds)
 */
export function extractTextFromDelta(delta: Delta | null): string {
  if (!delta || !delta.ops || delta.ops.length === 0) {
    return '';
  }

  let text = '';

  for (const op of delta.ops) {
    if (op.insert && typeof op.insert === 'string') {
      text += op.insert;
    }
  }

  return text.trim();
}

/**
 * Verifica se o delta tem conteúdo real (texto, imagens, vídeos)
 */
export function hasRealContent(delta: Delta | null): boolean {
  if (!delta || !delta.ops || delta.ops.length === 0) {
    return false;
  }

  return delta.ops.some((op: DeltaOp) => {
    if (op.insert) {
      if (typeof op.insert === 'string') {
        // Verificar se há texto real (não apenas espaços em branco)
        return op.insert.trim().length > 0;
      } else if (typeof op.insert === 'object') {
        // Verificar se há embeds (imagens, vídeos, etc.)
        return op.insert.image || op.insert.video || op.insert.audio || op.insert.file;
      }
    }
    return false;
  });
}

/**
 * Valida se o delta está dentro dos limites permitidos
 */
export function validateDelta(delta: Delta | null, maxSize: number = 5000): {
  isValid: boolean;
  size: number;
  hasContent: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const size = calculateDeltaSize(delta);
  const hasContent = hasRealContent(delta);

  if (!hasContent) {
    errors.push('Adicione conteúdo (texto, imagem ou vídeo)');
  }

  if (size > maxSize) {
    errors.push(`Conteúdo muito longo (${size}/${maxSize} caracteres)`);
  }

  return {
    isValid: errors.length === 0,
    size,
    hasContent,
    errors
  };
}

/**
 * Conta embeds no delta
 */
export function countEmbeds(delta: Delta | null): {
  images: number;
  videos: number;
  audios: number;
  files: number;
  total: number;
} {
  if (!delta || !delta.ops || delta.ops.length === 0) {
    return { images: 0, videos: 0, audios: 0, files: 0, total: 0 };
  }

  let images = 0;
  let videos = 0;
  let audios = 0;
  let files = 0;

  for (const op of delta.ops) {
    if (op.insert && typeof op.insert === 'object') {
      if (op.insert.image) images++;
      if (op.insert.video) videos++;
      if (op.insert.audio) audios++;
      if (op.insert.file) files++;
    }
  }

  return {
    images,
    videos,
    audios,
    files,
    total: images + videos + audios + files
  };
}