import { useState, useEffect } from "react";
import { toast } from "sonner";

interface CuriosityText {
  id: string;
  content: string;
  createdAt: Date;
}

interface UseCuriosityTextsReturn {
  texts: CuriosityText[];
  isLoading: boolean;
  error: string | null;
  fetchTexts: () => Promise<void>;
  createText: (content: string) => Promise<void>;
  updateText: (id: string, content: string) => Promise<void>;
  deleteText: (id: string) => Promise<void>;
  updateAllTexts: (texts: CuriosityText[]) => Promise<void>;
}

export const useCuriosityTexts = (): UseCuriosityTextsReturn => {
  const [texts, setTexts] = useState<CuriosityText[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função para buscar textos do servidor
  const fetchTexts = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/curiosity-texts');
      const data = await response.json();
      
      if (data.success) {
        // Converter strings de data para objetos Date
        const processedTexts = data.data.map((text: any) => ({
          ...text,
          createdAt: new Date(text.createdAt)
        }));
        setTexts(processedTexts);
        
        // Salvar no localStorage como backup
        localStorage.setItem('curiosityTexts', JSON.stringify(processedTexts));
      } else {
        throw new Error(data.error || 'Erro ao buscar textos');
      }
    } catch (err) {
      console.error('Erro ao buscar textos de curiosidade:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      
      // Fallback para localStorage se a API falhar
      const savedTexts = localStorage.getItem('curiosityTexts');
      if (savedTexts) {
        try {
          const parsedTexts = JSON.parse(savedTexts).map((text: any) => ({
            ...text,
            createdAt: new Date(text.createdAt)
          }));
          setTexts(parsedTexts);
        } catch (parseError) {
          console.error('Erro ao carregar backup do localStorage:', parseError);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Função para criar novo texto
  const createText = async (content: string) => {
    try {
      const response = await fetch('/api/curiosity-texts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ content })
      });
      
      const data = await response.json();
      
      if (data.success) {
        const newText = {
          ...data.data,
          createdAt: new Date(data.data.createdAt)
        };
        setTexts(prev => [...prev, newText]);
        toast.success('Texto adicionado com sucesso!');
      } else {
        throw new Error(data.error || 'Erro ao criar texto');
      }
    } catch (err) {
      console.error('Erro ao criar texto:', err);
      toast.error(err instanceof Error ? err.message : 'Erro ao criar texto');
      throw err;
    }
  };

  // Função para atualizar texto
  const updateText = async (id: string, content: string) => {
    try {
      const response = await fetch(`/api/curiosity-texts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ content })
      });
      
      const data = await response.json();
      
      if (data.success) {
        const updatedText = {
          ...data.data,
          createdAt: new Date(data.data.createdAt)
        };
        setTexts(prev => prev.map(text => 
          text.id === id ? updatedText : text
        ));
        toast.success('Texto atualizado com sucesso!');
      } else {
        throw new Error(data.error || 'Erro ao atualizar texto');
      }
    } catch (err) {
      console.error('Erro ao atualizar texto:', err);
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar texto');
      throw err;
    }
  };

  // Função para deletar texto
  const deleteText = async (id: string) => {
    try {
      const response = await fetch(`/api/curiosity-texts/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTexts(prev => prev.filter(text => text.id !== id));
        toast.success('Texto removido com sucesso!');
      } else {
        throw new Error(data.error || 'Erro ao deletar texto');
      }
    } catch (err) {
      console.error('Erro ao deletar texto:', err);
      toast.error(err instanceof Error ? err.message : 'Erro ao deletar texto');
      throw err;
    }
  };

  // Função para atualizar todos os textos
  const updateAllTexts = async (newTexts: CuriosityText[]) => {
    try {
      const response = await fetch('/api/curiosity-texts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ texts: newTexts })
      });
      
      const data = await response.json();
      
      if (data.success) {
        const processedTexts = data.data.map((text: any) => ({
          ...text,
          createdAt: new Date(text.createdAt)
        }));
        setTexts(processedTexts);
        
        // Atualizar localStorage
        localStorage.setItem('curiosityTexts', JSON.stringify(processedTexts));
      } else {
        throw new Error(data.error || 'Erro ao atualizar textos');
      }
    } catch (err) {
      console.error('Erro ao atualizar todos os textos:', err);
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar textos');
      throw err;
    }
  };

  // Carregar textos na inicialização
  useEffect(() => {
    fetchTexts();
  }, []);

  return {
    texts,
    isLoading,
    error,
    fetchTexts,
    createText,
    updateText,
    deleteText,
    updateAllTexts
  };
};