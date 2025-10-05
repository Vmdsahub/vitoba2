import { RequestHandler } from "express";
import { Topic } from "@shared/forum";
import { getTopicCommentStats } from "./simple-comments";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs/promises";

// Importar o storage de tópicos reais do forum.ts
let topicsStorage: Map<string, Topic> | null = null;

// Função para obter referência ao storage de tópicos
const getTopicsStorage = () => {
  if (!topicsStorage) {
    // Esta é uma referência temporária - em produção seria uma conexão com banco
    const forumModule = require("./forum");
    topicsStorage = forumModule.getTopicsStorage?.() || new Map();
  }
  return topicsStorage;
};

// Simulação de dados em memória para tópicos em destaque
let featuredTopics: Map<
  string,
  {
    topicId: string;
    position: number;
    featuredImageUrl?: string;
    addedAt: string;
  }
> = new Map();

// Mock data inicial para demonstração
featuredTopics.set("demo_featured_1", {
  topicId: "demo_featured_1",
  position: 1,
  featuredImageUrl:
    "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=400&fit=crop",
  addedAt: new Date().toISOString(),
});

featuredTopics.set("demo_featured_2", {
  topicId: "demo_featured_2",
  position: 2,
  featuredImageUrl:
    "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=400&fit=crop",
  addedAt: new Date().toISOString(),
});

// Mock topics para demonstração
const mockTopics: Topic[] = [
  {
    id: "demo_featured_1",
    title: "Como usar GPT-4 para automatizar workflows",
    description: "Guia completo sobre automação com IA",
    content: "Conteúdo detalhado sobre automação...",
    author: "João da Silva",
    authorId: "demo_user_123",
    authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=joao",
    replies: 45,
    views: 1230,
    likes: 89,
    isLiked: false,
    lastPost: {
      author: "Maria Santos",
      date: "2024-01-15",
      time: "14:30",
    },
    category: "llms",
    createdAt: "2024-01-10T10:00:00Z",
    updatedAt: "2024-01-15T14:30:00Z",
    comments: [],
    isFeatured: true,
    featuredPosition: 1,
    featuredImageUrl:
      "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=400&fit=crop",
  },
  {
    id: "demo_featured_2",
    title: "Análise das melhores ferramentas de IA para desenvolvimento",
    description: "Comparativo entre diferentes ferramentas de IA",
    content: "Análise detalhada das ferramentas...",
    author: "Pedro Costa",
    authorId: "demo_user_456",
    authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=pedro",
    replies: 32,
    views: 890,
    likes: 67,
    isLiked: false,
    lastPost: {
      author: "Ana Paula",
      date: "2024-01-14",
      time: "16:45",
    },
    category: "vibe-coding",
    createdAt: "2024-01-08T08:00:00Z",
    updatedAt: "2024-01-14T16:45:00Z",
    comments: [],
    isFeatured: true,
    featuredPosition: 2,
    featuredImageUrl:
      "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=400&fit=crop",
  },
];

// GET /api/featured-topics - Buscar tópicos em destaque
export const getFeaturedTopics: RequestHandler = async (req, res) => {
  try {
    // Ordenar por posição
    const featuredList = Array.from(featuredTopics.values()).sort(
      (a, b) => a.position - b.position,
    );

    // Buscar dados completos dos tópicos do storage real
    const realTopicsStorage = getTopicsStorage();
    const topics = featuredList
      .map((featured) => {
        // Primeiro tentar buscar nos tópicos reais
        const realTopic = realTopicsStorage.get(featured.topicId);
        if (realTopic) {
          // Obter contagem real de comentários e likes
          const commentStats = getTopicCommentStats(featured.topicId);
          const totalLikes = (realTopic.likes || 0) + commentStats.totalLikes;
          console.log(
            `[FEATURED] Real topic ${featured.topicId} has ${commentStats.commentsCount} comments and ${totalLikes} total likes (topic: ${realTopic.likes}, comments: ${commentStats.totalLikes})`,
          );
          return {
            ...realTopic,
            replies: commentStats.commentsCount,
            likes: totalLikes,
            isFeatured: true,
            featuredPosition: featured.position,
            featuredImageUrl:
              featured.featuredImageUrl || realTopic.featuredImageUrl,
          };
        }

        // Fallback para mock data se não encontrar tópico real
        const mockTopic = mockTopics.find((t) => t.id === featured.topicId);
        if (mockTopic) {
          // Para tópicos mock, também tentar obter contagem real de comentários e likes
          const commentStats = getTopicCommentStats(featured.topicId);
          const totalLikes = (mockTopic.likes || 0) + commentStats.totalLikes;
          console.log(
            `[FEATURED] Mock topic ${featured.topicId} has ${commentStats.commentsCount} comments and ${totalLikes} total likes (topic: ${mockTopic.likes}, comments: ${commentStats.totalLikes}) (fallback: ${mockTopic.replies})`,
          );
          return {
            ...mockTopic,
            replies:
              commentStats.commentsCount > 0
                ? commentStats.commentsCount
                : mockTopic.replies,
            likes: totalLikes,
            isFeatured: true,
            featuredPosition: featured.position,
            featuredImageUrl:
              featured.featuredImageUrl || mockTopic.featuredImageUrl,
          };
        }

        return null;
      })
      .filter(Boolean);

    console.log("[FEATURED] Topics found:", topics.length);
    console.log("[FEATURED] Featured list:", featuredList);

    res.json({
      success: true,
      topics,
    });
  } catch (error) {
    console.error("Error fetching featured topics:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar tópicos em destaque",
    });
  }
};

// POST /api/featured-topics/:topicId - Adicionar tópico aos destaques
export const addFeaturedTopic: RequestHandler = async (req, res) => {
  try {
    const { topicId } = req.params;
    const { position, featuredImageUrl } = req.body;

    // Validar posição (1-4)
    if (!position || position < 1 || position > 4) {
      return res.status(400).json({
        success: false,
        message: "Posição deve ser entre 1 e 4",
      });
    }

    // Verificar se já existe tópico nesta posição
    const existingAtPosition = Array.from(featuredTopics.values()).find(
      (f) => f.position === position,
    );

    if (existingAtPosition) {
      // Remover o tópico existente da posição
      featuredTopics.delete(existingAtPosition.topicId);
    }

    // Adicionar novo tópico em destaque
    featuredTopics.set(topicId, {
      topicId,
      position,
      featuredImageUrl,
      addedAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: "Tópico adicionado aos destaques",
    });
  } catch (error) {
    console.error("Error adding featured topic:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao adicionar tópico aos destaques",
    });
  }
};

// DELETE /api/featured-topics/:topicId - Remover tópico dos destaques
export const removeFeaturedTopic: RequestHandler = async (req, res) => {
  try {
    const { topicId } = req.params;

    if (featuredTopics.has(topicId)) {
      featuredTopics.delete(topicId);
      res.json({
        success: true,
        message: "Tópico removido dos destaques",
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Tópico não encontrado nos destaques",
      });
    }
  } catch (error) {
    console.error("Error removing featured topic:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao remover tópico dos destaques",
    });
  }
};

// GET /api/featured-topics/positions - Buscar posições disponíveis
export const getAvailablePositions: RequestHandler = async (req, res) => {
  try {
    const usedPositions = Array.from(featuredTopics.values()).map(
      (f) => f.position,
    );

    const availablePositions = [1, 2, 3, 4].filter(
      (pos) => !usedPositions.includes(pos),
    );

    console.log("[FEATURED] Featured topics map size:", featuredTopics.size);
    console.log("[FEATURED] Used positions:", usedPositions);
    console.log("[FEATURED] Available positions:", availablePositions);
    console.log(
      "[FEATURED] All featured topics:",
      Array.from(featuredTopics.entries()),
    );

    res.json({
      success: true,
      availablePositions,
      usedPositions: usedPositions.sort(),
      debug: {
        totalFeatured: featuredTopics.size,
        featuredTopics: Array.from(featuredTopics.values()),
      },
    });
  } catch (error) {
    console.error("Error getting available positions:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar posições disponíveis",
    });
  }
};

// Configuração do multer para upload de imagens
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "public", "uploads", "featured");
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `featured-${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Apenas arquivos de imagem são permitidos!"));
    }
  },
});

// PUT /api/featured-topics/:topicId/image - Alterar imagem de tópico em destaque
export const updateFeaturedImage = (req: any, res: any) => {
  upload.single("image")(req, res, async (err) => {
    if (err) {
      console.error("Error uploading image:", err);
      return res.status(400).json({
        success: false,
        message: err.message || "Erro ao fazer upload da imagem",
      });
    }

    try {
      const { topicId } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: "Nenhuma imagem foi enviada",
        });
      }

      // Verificar se o tópico está nos destaques
      const featuredTopic = featuredTopics.get(topicId);
      if (!featuredTopic) {
        // Remover arquivo se tópico não estiver em destaque
        await fs.unlink(file.path).catch(console.error);
        return res.status(404).json({
          success: false,
          message: "Tópico não encontrado nos destaques",
        });
      }

      // Construir URL da nova imagem
      const imageUrl = `/uploads/featured/${file.filename}`;

      // Remover imagem anterior se existir
      if (
        featuredTopic.featuredImageUrl &&
        featuredTopic.featuredImageUrl.startsWith("/uploads/")
      ) {
        const oldImagePath = path.join(
          process.cwd(),
          "public",
          featuredTopic.featuredImageUrl,
        );
        await fs.unlink(oldImagePath).catch(console.error);
      }

      // Atualizar URL da imagem no tópico em destaque
      featuredTopics.set(topicId, {
        ...featuredTopic,
        featuredImageUrl: imageUrl,
      });

      // Também atualizar no storage de tópicos reais se existir
      const realTopicsStorage = getTopicsStorage();
      const realTopic = realTopicsStorage.get(topicId);
      if (realTopic) {
        realTopicsStorage.set(topicId, {
          ...realTopic,
          featuredImageUrl: imageUrl,
        });
      }

      res.json({
        success: true,
        message: "Imagem atualizada com sucesso",
        imageUrl,
      });
    } catch (error) {
      console.error("Error updating featured image:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  });
};
