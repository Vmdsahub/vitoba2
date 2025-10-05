import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Topic } from "@shared/forum";
import TopicCreate from "@/components/TopicCreate";

// Função para upload de imagem para o servidor
async function uploadImage(file: File): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'topic-image');

    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Erro no upload da imagem');
    }

    const result = await response.json();
    return result.url; // Retorna a URL permanente do servidor
  } catch (error) {
    console.error('Erro ao fazer upload da imagem:', error);
    return null;
  }
}

interface ForumCategory {
  id: string;
  name: string;
  description: string;
}

interface CreateTopicModalProps {
  currentCategory: ForumCategory;
  onTopicCreated?: (newTopic: Topic) => void;
  onStatsRefresh?: () => void;
}

export default function CreateTopicModal({
  currentCategory,
  onTopicCreated,
  onStatsRefresh,
}: CreateTopicModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [topicImage, setTopicImage] = useState<File | null>(null);
  const [errors, setErrors] = useState({
    title: false,
    content: false,
    image: false
  });

  const handleSave = async (data: { delta: any; image: File | null }) => {
    if (!user) {
      toast.error("Faça login para criar tópicos");
      return;
    }

    // Validar se há conteúdo real no delta (texto, imagens ou vídeos)
    const hasContent = data.delta && 
      data.delta.ops && 
      data.delta.ops.length > 0 && 
      data.delta.ops.some((op: any) => {
        // Verificar se há texto
        if (op.insert && typeof op.insert === 'string' && op.insert.trim().length > 0) {
          return true;
        }
        // Verificar se há imagens
        if (op.insert && typeof op.insert === 'object' && op.insert.image) {
          return true;
        }
        // Verificar se há vídeos
        if (op.insert && typeof op.insert === 'object' && op.insert.video) {
          return true;
        }
        return false;
      });

    // Verificar erros
    const newErrors = {
      title: !title.trim(),
      content: !hasContent,
      image: !topicImage // Imagem agora é obrigatória
    };

    setErrors(newErrors);

    if (newErrors.title || newErrors.content || newErrors.image) {
      if (newErrors.image) {
        toast.error("Adicione uma imagem para o tópico");
      } else {
        toast.error("Preencha o título e adicione conteúdo (texto, imagem ou vídeo)");
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const topicData = {
        title: title.trim(),
        content: JSON.stringify(data.delta), // Salvar Delta como JSON
        category: currentCategory.id,
        image: topicImage ? await uploadImage(topicImage) : null,
      };

      const response = await fetch("/api/topics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify(topicData),
      });

      if (response.ok) {
        const newTopic = await response.json();
        toast.success("Tópico criado com sucesso!");
        setTitle("");
        setTopicImage(null);
        setIsOpen(false);
        onTopicCreated?.(newTopic);
        onStatsRefresh?.();
        // Redirecionar para a página do tópico criado
        navigate(`/topic/${newTopic.id}`);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Erro ao criar tópico");
      }
    } catch (error) {
      console.error("Error creating topic:", error);
      toast.error("Erro ao criar tópico");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-black text-white hover:bg-gray-800">
          Criar Tópico
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto px-3 py-6">
        <DialogHeader className="pb-4">
          <DialogTitle>Criar Novo Tópico em {currentCategory.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Título com imagem circular ao lado - alinhado com as bordas do editor */}
          <div className="max-w-[790px] mx-auto flex items-center gap-6">
            <button
              type="button"
              onClick={() => document.getElementById('topic-image-upload')?.click()}
              className={`w-16 h-16 rounded-full border-2 border-dashed ${errors.image ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100'} flex items-center justify-center transition-colors flex-shrink-0`}
            >
              {topicImage ? (
                <img 
                  src={URL.createObjectURL(topicImage)} 
                  alt="Preview" 
                  className="w-full h-full rounded-full object-cover" 
                />
              ) : (
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              )}
            </button>
            <Input
              id="title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title && e.target.value.trim()) {
                  setErrors(prev => ({ ...prev, title: false }));
                }
              }}
              placeholder="Digite o título do tópico"
              maxLength={70}
              className={`flex-1 text-lg h-12 font-bold ${errors.title ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
            />
            <input
              id="topic-image-upload"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setTopicImage(file);
                if (errors.image && file) {
                  setErrors(prev => ({ ...prev, image: false }));
                }
              }}
              className="hidden"
            />
          </div>

          <TopicCreate 
            onSave={handleSave} 
            onCancel={() => setIsOpen(false)}
            image={topicImage}
            onImageChange={(image) => {
              setTopicImage(image);
            }}
            hasError={errors.content}
            onContentChange={() => {
              if (errors.content) {
                setErrors(prev => ({ ...prev, content: false }));
              }
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}