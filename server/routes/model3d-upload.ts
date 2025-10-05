import { RequestHandler } from "express";
import path from "path";
import fs from "fs";
import {
  secureUploadMiddleware,
  handleSecureUpload,
} from "./secure-upload";

// Middleware específico para modelos 3D
export const model3DUploadMiddleware = secureUploadMiddleware;

// Handler para upload de modelos 3D
export const handleModel3DUpload: RequestHandler = async (req, res) => {
  const userId = (req as any).user?.id || "anonymous";
  const clientIp = req.ip || req.connection.remoteAddress || "unknown";

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "Nenhum arquivo de modelo 3D fornecido",
      });
    }

    // Verificar se é um arquivo 3D válido
    const ext = path.extname(req.file.originalname).toLowerCase();
    if (!['.glb', '.gltf'].includes(ext)) {
      return res.status(400).json({
        success: false,
        error: "Apenas arquivos GLB e GLTF são suportados",
      });
    }

    // Usar o handler de upload seguro existente
    // Mas primeiro vamos interceptar a resposta para adicionar metadados específicos de 3D
    const originalSend = res.json;
    let responseData: any = null;

    res.json = function(data: any) {
      responseData = data;
      return this;
    };

    // Chamar o handler de upload seguro
    await new Promise<void>((resolve, reject) => {
      const mockRes = {
        ...res,
        json: (data: any) => {
          responseData = data;
          resolve();
        },
        status: (code: number) => ({
          json: (data: any) => {
            responseData = { ...data, statusCode: code };
            resolve();
          }
        })
      };

      handleSecureUpload(req, mockRes as any, (err: any) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Restaurar o método original
    res.json = originalSend;

    if (responseData?.success) {
      // Adicionar metadados específicos para modelos 3D
      const model3DData = {
        ...responseData,
        type: 'model3d',
        format: ext.substring(1), // Remove o ponto da extensão
        isModel3D: true,
        metadata: {
          ...responseData.metadata,
          modelType: ext === '.glb' ? 'binary' : 'json',
          canRotate: true,
          hasTextures: ext === '.glb', // GLB geralmente inclui texturas
        }
      };

      console.log(`[MODEL3D UPLOAD] Modelo 3D carregado com sucesso: ${req.file.originalname}`);
      
      return res.json(model3DData);
    } else {
      // Retornar erro do upload seguro
      const statusCode = responseData?.statusCode || 400;
      return res.status(statusCode).json(responseData);
    }

  } catch (error) {
    console.error('[MODEL3D UPLOAD] Erro:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor ao processar modelo 3D',
    });
  }
};

// Handler para obter informações de um modelo 3D
export const handleModel3DInfo: RequestHandler = async (req, res) => {
  try {
    const { filename } = req.params;
    
    if (!filename) {
      return res.status(400).json({
        success: false,
        error: 'Nome do arquivo não fornecido'
      });
    }

    // Verificar se é um arquivo de modelo 3D
    const ext = path.extname(filename).toLowerCase();
    if (!['.glb', '.gltf'].includes(ext)) {
      return res.status(400).json({
        success: false,
        error: 'Arquivo não é um modelo 3D válido'
      });
    }

    // Buscar metadados do arquivo
    const safeDir = path.join(process.cwd(), "public", "secure-uploads");
    const metadataPath = path.join(safeDir, `${filename}.metadata.json`);
    
    if (!fs.existsSync(metadataPath)) {
      return res.status(404).json({
        success: false,
        error: 'Metadados do modelo 3D não encontrados'
      });
    }

    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    
    res.json({
      success: true,
      modelInfo: {
        filename,
        originalName: metadata.originalName,
        size: metadata.size,
        format: ext.substring(1),
        uploadTime: metadata.uploadTime,
        hash: metadata.hash,
        isModel3D: true,
        canRotate: true,
        modelType: ext === '.glb' ? 'binary' : 'json'
      }
    });

  } catch (error) {
    console.error('[MODEL3D INFO] Erro:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter informações do modelo 3D'
    });
  }
};

// Handler para listar modelos 3D do usuário
export const handleUserModel3DList: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Autenticação necessária'
      });
    }

    const safeDir = path.join(process.cwd(), "public", "secure-uploads");
    
    if (!fs.existsSync(safeDir)) {
      return res.json({
        success: true,
        models: []
      });
    }

    const files = fs.readdirSync(safeDir);
    const model3DFiles = [];

    for (const file of files) {
      if (file.endsWith('.metadata.json')) continue;
      
      const ext = path.extname(file).toLowerCase();
      if (!['.glb', '.gltf'].includes(ext)) continue;

      const metadataPath = path.join(safeDir, `${file}.metadata.json`);
      
      if (fs.existsSync(metadataPath)) {
        try {
          const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
          
          if (metadata.uploadedBy === userId) {
            model3DFiles.push({
              filename: file,
              originalName: metadata.originalName,
              size: metadata.size,
              format: ext.substring(1),
              uploadTime: metadata.uploadTime,
              url: `/api/secure-files/${file}`
            });
          }
        } catch (error) {
          console.error(`Erro ao ler metadados de ${file}:`, error);
        }
      }
    }

    res.json({
      success: true,
      models: model3DFiles.sort((a, b) => 
        new Date(b.uploadTime).getTime() - new Date(a.uploadTime).getTime()
      )
    });

  } catch (error) {
    console.error('[USER MODEL3D LIST] Erro:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar modelos 3D do usuário'
    });
  }
};