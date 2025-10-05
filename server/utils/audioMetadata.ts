import { parseFile } from 'music-metadata';
import { IAudioMetadata, parseFile } from 'music-metadata';
import path from 'path';
import fs from 'fs';

export interface AudioMetadata {
  duration?: number;
  bitrate?: number;
  sampleRate?: number;
  channels?: number;
  format?: string;
  title?: string;
  artist?: string;
  album?: string;
}

/**
 * Extrai metadados de um arquivo de áudio
 * @param filePath Caminho para o arquivo de áudio
 * @returns Metadados do áudio ou null se houver erro
 */
export async function extractAudioMetadata(filePath: string): Promise<AudioMetadata | null> {
  try {
    // Verifica se o arquivo existe
    if (!fs.existsSync(filePath)) {
      console.error(`Arquivo não encontrado: ${filePath}`);
      return null;
    }

    // Extrai metadados usando music-metadata com opções otimizadas
    // duration: true força o cálculo preciso da duração
    // skipCovers: true evita problemas com capas embutidas grandes
    const metadata: IAudioMetadata = await parseFile(filePath, {
      duration: true,
      skipCovers: true
    });
    
    const audioMetadata: AudioMetadata = {
      duration: metadata.format.duration,
      bitrate: metadata.format.bitrate,
      sampleRate: metadata.format.sampleRate,
      channels: metadata.format.numberOfChannels,
      format: metadata.format.container,
      title: metadata.common.title,
      artist: metadata.common.artist,
      album: metadata.common.album,
    };

    console.log(`Metadados extraídos para ${path.basename(filePath)}:`, {
      duration: audioMetadata.duration,
      bitrate: audioMetadata.bitrate,
      format: audioMetadata.format,
      hasEmbeddedCover: metadata.common.picture && metadata.common.picture.length > 0
    });

    return audioMetadata;
  } catch (error) {
    console.error(`Erro ao extrair metadados de ${filePath}:`, error);
    return null;
  }
}

/**
 * Formata a duração em segundos para formato legível (mm:ss)
 * @param duration Duração em segundos
 * @returns String formatada ou 'N/A' se inválida
 */
export function formatDuration(duration?: number): string {
  if (!duration || !isFinite(duration) || duration <= 0) {
    return 'N/A';
  }

  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Valida se um arquivo é de áudio baseado na extensão
 * @param filename Nome do arquivo
 * @returns true se for um arquivo de áudio
 */
export function isAudioFile(filename: string): boolean {
  const audioExtensions = ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a', '.wma'];
  const ext = path.extname(filename).toLowerCase();
  return audioExtensions.includes(ext);
}