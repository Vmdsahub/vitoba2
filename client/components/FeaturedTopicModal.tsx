import { useState, useEffect } from "react";
import { Topic } from "@shared/forum";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FeaturedTopicModalProps {
  topic: Topic;
  isOpen: boolean;
  onClose: () => void;
  onFeaturedUpdate: () => void;
}

interface PositionInfo {
  availablePositions: number[];
  usedPositions: number[];
}

export default function FeaturedTopicModal({
  topic,
  isOpen,
  onClose,
  onFeaturedUpdate,
}: FeaturedTopicModalProps) {
  const [selectedPosition, setSelectedPosition] = useState<number>(1);
  const [featuredImageUrl, setFeaturedImageUrl] = useState("");
  const [positions, setPositions] = useState<PositionInfo>({
    availablePositions: [],
    usedPositions: [],
  });
  const [isLoading, setIsLoading] = useState(false);

  // Carregar posições disponíveis quando o modal abre
  useEffect(() => {
    if (isOpen) {
      fetchAvailablePositions();
      setFeaturedImageUrl(topic.featuredImageUrl || "");
      if (topic.isFeatured && topic.featuredPosition) {
        setSelectedPosition(topic.featuredPosition);
      }
    }
  }, [isOpen, topic]);

  const fetchAvailablePositions = async () => {
    try {
      const response = await fetch("/api/featured-topics/positions");
      if (response.ok) {
        const data = await response.json();
        setPositions(data);

        // Se o tópico já está em destaque, usar sua posição atual
        if (topic.isFeatured && topic.featuredPosition) {
          setSelectedPosition(topic.featuredPosition);
        } else if (data.availablePositions.length > 0) {
          setSelectedPosition(data.availablePositions[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching available positions:", error);
      toast.error("Erro ao carregar posições disponíveis");
    }
  };

  const handleAddToFeatured = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/featured-topics/${topic.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({
          position: selectedPosition,
          featuredImageUrl: featuredImageUrl.trim() || undefined,
        }),
      });

      if (response.ok) {
        toast.success(
          `Tópico adicionado aos destaques na posição ${selectedPosition}!`,
        );
        onFeaturedUpdate();
        onClose();
      } else {
        const error = await response.json();
        toast.error(error.message || "Erro ao adicionar tópico aos destaques");
      }
    } catch (error) {
      console.error("Error adding to featured:", error);
      toast.error("Erro ao adicionar tópico aos destaques");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFromFeatured = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/featured-topics/${topic.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });

      if (response.ok) {
        toast.success("Tópico removido dos destaques!");
        onFeaturedUpdate();
        onClose();
      } else {
        const error = await response.json();
        toast.error(error.message || "Erro ao remover tópico dos destaques");
      }
    } catch (error) {
      console.error("Error removing from featured:", error);
      toast.error("Erro ao remover tópico dos destaques");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🍀 Gerenciar Destaque
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações do tópico */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-sm text-gray-900 mb-1">Tópico:</h4>
            <p className="text-sm text-gray-700 line-clamp-2">{topic.title}</p>
            <p className="text-xs text-gray-500 mt-1">
              por {topic.author} • {topic.likes} likes • {topic.replies}{" "}
              comentários
            </p>
          </div>

          {topic.isFeatured ? (
            /* Tópico já está em destaque */
            <div className="space-y-3">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  ✅ Este tópico está em destaque na{" "}
                  <strong>posição {topic.featuredPosition}</strong>
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleRemoveFromFeatured}
                  disabled={isLoading}
                  variant="destructive"
                  className="flex-1"
                >
                  {isLoading ? "Removendo..." : "Remover dos Destaques"}
                </Button>
              </div>
            </div>
          ) : (
            /* Adicionar aos destaques */
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="position">Posição no Carrossel (1-4)</Label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((pos) => {
                    const isUsed = positions.usedPositions.includes(pos);
                    const isAvailable =
                      positions.availablePositions.includes(pos);
                    const isCurrentTopicPosition =
                      topic.isFeatured && topic.featuredPosition === pos;

                    return (
                      <button
                        key={pos}
                        onClick={() => setSelectedPosition(pos)}
                        disabled={isUsed && !isCurrentTopicPosition}
                        className={`p-3 text-sm font-medium rounded-lg border-2 transition-all ${
                          selectedPosition === pos
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : isUsed && !isCurrentTopicPosition
                              ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "border-gray-300 hover:border-gray-400 text-gray-700"
                        }`}
                      >
                        {pos}
                        {isUsed && !isCurrentTopicPosition && (
                          <div className="text-xs mt-1">Ocupada</div>
                        )}
                        {isCurrentTopicPosition && (
                          <div className="text-xs mt-1 text-green-600">
                            Atual
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                {positions.usedPositions.includes(selectedPosition) && (
                  <p className="text-xs text-orange-600">
                    ⚠️ Esta posição substituirá o tópico existente
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="featured-image">
                  URL da Imagem de Destaque (opcional)
                </Label>
                <Input
                  id="featured-image"
                  type="url"
                  value={featuredImageUrl}
                  onChange={(e) => setFeaturedImageUrl(e.target.value)}
                  placeholder="https://exemplo.com/imagem.jpg"
                  className="text-sm"
                />
                <p className="text-xs text-gray-500">
                  Imagem que será exibida no carrossel (recomendado: 800x400px)
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1"
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleAddToFeatured}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? "Adicionando..." : "Adicionar aos Destaques"}
                </Button>
              </div>

              {positions.usedPositions.length === 4 &&
                !positions.availablePositions.length && (
                  <p className="text-xs text-orange-600 text-center">
                    Todas as posições estão ocupadas. Selecione uma posição para
                    substituir.
                  </p>
                )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
