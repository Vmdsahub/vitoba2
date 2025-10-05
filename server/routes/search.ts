import { RequestHandler } from "express";
import { getTopicsStorage } from "./forum";

export interface SearchResult {
  id: string;
  title: string;
  category: string;
  author: string;
  categoryType: "tools" | "opensource";
}

// Helper function to determine category type
function getCategoryType(categoryId: string): "tools" | "opensource" {
  return categoryId.startsWith("opensource-") ? "opensource" : "tools";
}

// Helper function to get category display name
function getCategoryDisplayName(categoryId: string): string {
  const categoryNames: Record<string, string> = {
    // Tools categories
    llms: "LLMs",
    imagem: "Imagem",
    video: "Vídeo",
    "musica-audio": "Música/Áudio",
    "vibe-coding": "Vibe Coding",
    "duvidas-erros": "Dúvidas/Erros",
    "projetos-comunidade": "Projetos da comunidade",
    outros: "Outros",
    pedidos: "Pedidos",
    // Open Source categories
    "opensource-llms": "LLMs",
    "opensource-imagem": "Imagem",
    "opensource-video": "Vídeo",
    "opensource-musica-audio": "Música/Áudio",
    "opensource-vibe-coding": "Vibe Coding",
    "opensource-duvidas-erros": "Dúvidas/Erros",
    "opensource-projetos-comunidade": "Projetos da comunidade",
    "opensource-outros": "Outros",
    "opensource-pedidos": "Pedidos",
  };

  return categoryNames[categoryId] || categoryId;
}

export const searchHandler: RequestHandler = async (req, res) => {
  try {
    const { q: query, type, categories } = req.query;

    if (!query || typeof query !== "string" || query.trim().length < 1) {
      return res.status(400).json({
        success: false,
        message: "Query is required and must be at least 1 character long",
      });
    }

    const searchQuery = query.trim().toLowerCase();
    const searchType = type as string;
    const searchCategories = Array.isArray(categories)
      ? (categories as string[])
      : categories
        ? [categories as string]
        : [];

    if (searchType === "users") {
      // For now, return empty results for user search
      // This would be implemented to search through user profiles
      return res.json({
        success: true,
        results: [],
        total: 0,
      });
    }

    // Get real topics from forum storage
    const topicsStorage = getTopicsStorage();
    const allTopics = Array.from(topicsStorage.values());

    // Filter topics based on search criteria
    const filteredTopics = allTopics.filter((topic) => {
      // Check if title or content contains search query
      const titleMatch = topic.title.toLowerCase().includes(searchQuery);
      const contentMatch = topic.content.toLowerCase().includes(searchQuery);
      const descriptionMatch = topic.description
        .toLowerCase()
        .includes(searchQuery);

      const textMatch = titleMatch || contentMatch || descriptionMatch;

      // Check if topic's category is in selected categories (if any specified)
      const categoryMatch =
        searchCategories.length === 0 ||
        searchCategories.includes(topic.category);

      return textMatch && categoryMatch;
    });

    // Map to search result format
    const searchResults: SearchResult[] = filteredTopics.map((topic) => ({
      id: topic.id,
      title: topic.title,
      category: getCategoryDisplayName(topic.category),
      author: topic.author,
      categoryType: getCategoryType(topic.category),
    }));

    res.json({
      success: true,
      results: searchResults,
      total: searchResults.length,
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during search",
    });
  }
};
