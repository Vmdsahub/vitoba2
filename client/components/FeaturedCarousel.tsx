import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Topic } from "@shared/forum";
import { ChevronLeft, ChevronRight, Trash2, Image } from "lucide-react";
import { toast } from "sonner";

interface FeaturedTopic extends Topic {
  featuredImageUrl?: string;
  carouselPosition: number; // 1, 2, 3, ou 4
}

interface FeaturedCarouselProps {
  isAdmin?: boolean;
  onFeaturedUpdate?: () => void;
}

export default function FeaturedCarousel({
  isAdmin,
  onFeaturedUpdate,
}: FeaturedCarouselProps) {
  const [featuredTopics, setFeaturedTopics] = useState<FeaturedTopic[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const fetchFeaturedTopics = async () => {
    try {
      const response = await fetch("/api/featured-topics", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFeaturedTopics(data.topics || []);
      }
    } catch (error) {
      console.error("Error fetching featured topics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const nextSlide = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredTopics.length);
      setTimeout(() => setIsTransitioning(false), 50);
    }, 250);
  }, [isTransitioning, featuredTopics.length]);

  const prevSlide = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentSlide(
        (prev) => (prev - 1 + featuredTopics.length) % featuredTopics.length,
      );
      setTimeout(() => setIsTransitioning(false), 50);
    }, 250);
  }, [isTransitioning, featuredTopics.length]);

  const goToSlide = useCallback(
    (index: number) => {
      if (isTransitioning || index === currentSlide) return;
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSlide(index);
        setTimeout(() => setIsTransitioning(false), 50);
      }, 250);
    },
    [isTransitioning, currentSlide],
  );

  const removeFeaturedTopic = async (topicId: string) => {
    try {
      const response = await fetch(`/api/featured-topics/${topicId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });

      if (response.ok) {
        toast.success("Tópico removido dos destaques!");
        // Atualizar a lista de tópicos em destaque
        await fetchFeaturedTopics();
        // Ajustar slide atual se necessário
        setTimeout(() => {
          if (featuredTopics.length <= 1) {
            setCurrentSlide(0);
          } else if (currentSlide >= featuredTopics.length - 1) {
            setCurrentSlide(Math.max(0, featuredTopics.length - 2));
          }
        }, 100);
        // Notificar componente pai para atualizar dados
        onFeaturedUpdate?.();
      } else {
        const error = await response.json();
        toast.error(error.message || "Erro ao remover tópico dos destaques");
      }
    } catch (error) {
      console.error("Error removing featured topic:", error);
      toast.error("Erro ao remover tópico dos destaques");
    }
  };

  const changeFeaturedImage = async (topicId: string) => {
    // Criar input de arquivo temporário
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // Validar tamanho do arquivo (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Arquivo muito grande. Máximo 5MB.");
        return;
      }

      // Validar tipo de arquivo
      if (!file.type.startsWith("image/")) {
        toast.error("Por favor, selecione apenas arquivos de imagem.");
        return;
      }

      const formData = new FormData();
      formData.append("image", file);

      try {
        const response = await fetch(`/api/featured-topics/${topicId}/image`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
          body: formData,
        });

        if (response.ok) {
          toast.success("Imagem atualizada com sucesso!");
          await fetchFeaturedTopics();
          onFeaturedUpdate?.();
        } else {
          const error = await response.json();
          toast.error(error.message || "Erro ao atualizar imagem");
        }
      } catch (error) {
        console.error("Error updating featured image:", error);
        toast.error("Erro ao atualizar imagem");
      }
    };

    input.click();
  };

  // Carregar tópicos em destaque
  useEffect(() => {
    fetchFeaturedTopics();
  }, []);

  // Auto-rotation a cada 10 segundos
  useEffect(() => {
    if (featuredTopics.length <= 1) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 10000);

    return () => clearInterval(interval);
  }, [featuredTopics.length, nextSlide]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-8">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-black">
            Tópicos em Destaque
          </h2>
        </div>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando tópicos em destaque...</p>
        </div>
      </div>
    );
  }

  if (featuredTopics.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-8">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-black">
            Tópicos em Destaque
          </h2>
        </div>
        <div className="p-8 text-center text-gray-500">
          <p>Nenhum tópico em destaque no momento.</p>
          {isAdmin && (
            <p className="text-sm mt-2">
              Use o símbolo 🍀 em tópicos para adicioná-los aos destaques.
            </p>
          )}
        </div>
      </div>
    );
  }

  const currentTopic = featuredTopics[currentSlide];

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8 shadow-sm">
      <div className="relative">
        {/* Main Carousel Container */}
        <div className="relative h-80 overflow-hidden rounded-xl">
          {/* Background Image */}
          <div
            className={`absolute inset-0 bg-cover bg-center transition-all duration-500 ${
              isTransitioning ? "opacity-70 scale-105" : "opacity-100 scale-100"
            }`}
            style={{
              backgroundImage: currentTopic.featuredImageUrl
                ? `url(${currentTopic.featuredImageUrl})`
                : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            }}
          >
            {/* Overlay */}
            <div className="absolute inset-0 featured-topic-overlay"></div>
          </div>

          {/* Title in top-left corner */}
          <div
            className={`absolute top-6 left-6 z-10 transition-all duration-300 ${
              isTransitioning
                ? "opacity-0 transform translate-y-2"
                : "opacity-100 transform translate-y-0"
            }`}
          >
            <h2 className="text-xl font-semibold text-white mb-4 drop-shadow-lg">
              Tópicos em Destaque
            </h2>
          </div>

          {/* Admin buttons in top-right corner */}
          {isAdmin && (
            <div
              className={`absolute top-6 right-6 z-10 transition-all duration-300 flex gap-2 ${
                isTransitioning
                  ? "opacity-0 transform translate-y-2"
                  : "opacity-100 transform translate-y-0"
              }`}
            >
              <button
                onClick={() => changeFeaturedImage(currentTopic.id)}
                className="p-2 bg-blue-500 bg-opacity-80 hover:bg-opacity-100 rounded-lg transition-all text-white drop-shadow-lg hover:scale-110"
                aria-label="Alterar imagem"
                title="Alterar imagem"
              >
                <Image size={20} />
              </button>
              <button
                onClick={() => removeFeaturedTopic(currentTopic.id)}
                className="p-2 bg-red-500 bg-opacity-80 hover:bg-opacity-100 rounded-lg transition-all text-white drop-shadow-lg hover:scale-110"
                aria-label="Remover dos destaques"
                title="Remover dos destaques"
              >
                <Trash2 size={20} />
              </button>
            </div>
          )}

          {/* Content */}
          <div
            className={`relative h-full flex items-end p-6 transition-all duration-300 ${
              isTransitioning
                ? "opacity-0 transform translate-y-4"
                : "opacity-100 transform translate-y-0"
            }`}
          >
            <div className="text-white max-w-2xl">
              <Link
                to={`/topic/${currentTopic.id}`}
                className="block hover:opacity-80 transition-opacity"
              >
                <h3 className="text-2xl font-bold mb-2 line-clamp-2 drop-shadow-lg">
                  {currentTopic.title}
                </h3>
                <div className="flex items-center gap-4 text-sm text-gray-200">
                  <span>
                    por <strong>{currentTopic.author}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    💬{" "}
                    {currentTopic.replies || currentTopic.comments?.length || 0}{" "}
                    comentários
                  </span>
                  <span className="flex items-center gap-1">
                    ❤️ {currentTopic.likes} likes
                  </span>
                </div>
              </Link>
            </div>
          </div>

          {/* Navigation Arrows */}
          {featuredTopics.length > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 hover:scale-110 transition-all text-white drop-shadow-lg"
                aria-label="Tópico anterior"
              >
                <ChevronLeft size={28} />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 hover:scale-110 transition-all text-white drop-shadow-lg"
                aria-label="Próximo tópico"
              >
                <ChevronRight size={28} />
              </button>
            </>
          )}

          {/* Pagination Dots */}
          {featuredTopics.length > 1 && (
            <div className="absolute bottom-4 right-6 flex gap-2">
              {featuredTopics.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`transition-all duration-300 rounded-full bg-white bg-opacity-70 hover:bg-opacity-90 ${
                    index === currentSlide
                      ? "w-3 h-3 bg-opacity-100"
                      : "w-2 h-2"
                  }`}
                  aria-label={`Ir para tópico ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
