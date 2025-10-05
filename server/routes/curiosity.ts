import { RequestHandler } from "express";
import { z } from "zod";

interface CuriosityText {
  id: string;
  content: string;
  createdAt: Date;
}

// Armazenamento em memória (em produção, usar banco de dados)
let curiosityTexts: CuriosityText[] = [
  {
    id: '1',
    content: '🤖 **Você sabia?** A primeira IA conversacional foi criada em 1966 e se chamava ELIZA!',
    createdAt: new Date()
  },
  {
    id: '2', 
    content: '🧠 **Curiosidade:** O cérebro humano processa informações a cerca de 20 watts - menos que uma lâmpada!',
    createdAt: new Date()
  },
  {
    id: '3',
    content: '⚡ **Fato interessante:** GPT-3 tem 175 bilhões de parâmetros, mas ainda não consegue *realmente* entender como você!',
    createdAt: new Date()
  }
];

// Schema de validação
const curiosityTextSchema = z.object({
  content: z.string().min(1, "Conteúdo é obrigatório").max(200, "Conteúdo deve ter no máximo 200 caracteres")
});

const updateTextsSchema = z.object({
  texts: z.array(z.object({
    id: z.string(),
    content: z.string().min(1).max(200),
    createdAt: z.string().or(z.date())
  }))
});

// GET /api/curiosity-texts - Buscar todos os textos
export const getCuriosityTexts: RequestHandler = async (req, res) => {
  try {
    res.json({
      success: true,
      data: curiosityTexts
    });
  } catch (error) {
    console.error("Erro ao buscar textos de curiosidade:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor"
    });
  }
};

// POST /api/curiosity-texts - Adicionar novo texto (apenas admin)
export const createCuriosityText: RequestHandler = async (req, res) => {
  try {
    const { content } = curiosityTextSchema.parse(req.body);
    
    const newText: CuriosityText = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      content: content.trim(),
      createdAt: new Date()
    };
    
    curiosityTexts.push(newText);
    
    res.json({
      success: true,
      data: newText
    });
  } catch (error) {
    console.error("Erro ao criar texto de curiosidade:", error);
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: error.errors[0].message
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Erro interno do servidor"
      });
    }
  }
};

// PUT /api/curiosity-texts/:id - Atualizar texto (apenas admin)
export const updateCuriosityText: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = curiosityTextSchema.parse(req.body);
    
    const textIndex = curiosityTexts.findIndex(text => text.id === id);
    
    if (textIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Texto não encontrado"
      });
    }
    
    curiosityTexts[textIndex] = {
      ...curiosityTexts[textIndex],
      content: content.trim()
    };
    
    res.json({
      success: true,
      data: curiosityTexts[textIndex]
    });
  } catch (error) {
    console.error("Erro ao atualizar texto de curiosidade:", error);
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: error.errors[0].message
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Erro interno do servidor"
      });
    }
  }
};

// DELETE /api/curiosity-texts/:id - Deletar texto (apenas admin)
export const deleteCuriosityText: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (curiosityTexts.length <= 1) {
      return res.status(400).json({
        success: false,
        error: "Deve haver pelo menos um texto de curiosidade"
      });
    }
    
    const textIndex = curiosityTexts.findIndex(text => text.id === id);
    
    if (textIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Texto não encontrado"
      });
    }
    
    const deletedText = curiosityTexts.splice(textIndex, 1)[0];
    
    res.json({
      success: true,
      data: deletedText
    });
  } catch (error) {
    console.error("Erro ao deletar texto de curiosidade:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor"
    });
  }
};

// PUT /api/curiosity-texts - Atualizar todos os textos (apenas admin)
export const updateAllCuriosityTexts: RequestHandler = async (req, res) => {
  try {
    const { texts } = updateTextsSchema.parse(req.body);
    
    if (texts.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Deve haver pelo menos um texto de curiosidade"
      });
    }
    
    // Converter strings de data para objetos Date
    const processedTexts: CuriosityText[] = texts.map(text => ({
      ...text,
      createdAt: typeof text.createdAt === 'string' ? new Date(text.createdAt) : text.createdAt
    }));
    
    curiosityTexts = processedTexts;
    
    res.json({
      success: true,
      data: curiosityTexts
    });
  } catch (error) {
    console.error("Erro ao atualizar todos os textos de curiosidade:", error);
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: error.errors[0].message
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Erro interno do servidor"
      });
    }
  }
};

// Função para obter textos (para uso interno)
export const getCuriosityTextsData = () => curiosityTexts;

// Função para definir textos (para uso interno)
export const setCuriosityTextsData = (texts: CuriosityText[]) => {
  curiosityTexts = texts;
};
