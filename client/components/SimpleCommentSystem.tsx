import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { toast } from "sonner";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import CommentRenderer from "@/components/CommentRenderer";
import UserHoverCard from "@/components/UserHoverCard";
import ReportModal from "@/components/ReportModal";
import SecureUploadWidget, { UploadedFileInfo } from "./SecureUploadWidget";
import CommentRichEditor from "./CommentRichEditor";

interface Comment {
  id: string;
  content: string;
  author: string;
  authorId: string;
  authorAvatar: string;
  topicId: string;
  createdAt: string;
  likes: number;
  isLiked: boolean;
  quotedComment?: {
    id: string;
    content: string;
    author: string;
    authorId: string;
  };
}

interface SimpleCommentSystemProps {
  topicId: string;
  topicAuthorId: string;
}

// Componente individual do comentário
function CommentItem({
  comment,
  topicAuthorId,
  onLike,
  onDelete,
  onQuote,
  onReport,
  onEdit,
}: {
  comment: Comment;
  topicAuthorId: string;
  onLike: (commentId: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  onQuote: (comment: Comment) => void;
  onReport: (comment: Comment) => void;
  onEdit: (commentId: string, content: string) => Promise<void>;
}) {
  const { user, isAdmin } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const isTopicOwner = user?.id === topicAuthorId;
  const isCommentOwner = user?.id === comment.authorId;
  const canDelete = isAdmin || isTopicOwner || isCommentOwner;

  const handleEdit = () => {
    // Limpar conteúdo antes de editar para evitar HTML bugado
    const cleanContent = comment.content
      .replace(/data-edit-mode="[^"]*"/g, "")
      .replace(/data-has-delete="[^"]*"/g, "");
    setEditContent(cleanContent);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    try {
      await onEdit(comment.id, editContent);
      setIsEditing(false);
      toast.success("Comentário editado!");
    } catch (error) {
      toast.error("Erro ao editar");
    }
  };

  const handleCancelEdit = () => {
    setEditContent(comment.content);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm("Confirma a exclusão?")) return;
    try {
      await onDelete(comment.id);
      toast.success("Comentário excluído!");
    } catch (error) {
      toast.error("Erro ao excluir");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString("pt-BR") +
      " às " +
      date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm mb-4 min-h-[120px]">
      {/* Quote exibido se existir */}
      {comment.quotedComment && (
        <div className="mb-3 p-3 bg-gray-50 border-l-4 border-gray-300 rounded">
          <div className="text-xs text-gray-500 mb-1">
            Citando @{comment.quotedComment.author}:
          </div>
          <div className="text-sm text-gray-700 italic line-clamp-3">
            <MarkdownRenderer content={comment.quotedComment.content} />
          </div>
        </div>
      )}

      <div className="flex items-start gap-3">
        <UserHoverCard
          userId={comment.authorId}
          userName={comment.author}
          userAvatar={comment.authorAvatar}
          isTopicAuthor={comment.authorId === topicAuthorId}
          size="sm"
        >
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-sm font-semibold hover:bg-gray-800 transition-colors cursor-pointer overflow-hidden">
              {comment.authorAvatar.startsWith("http") ||
              comment.authorAvatar.startsWith("/") ? (
                <img
                  src={comment.authorAvatar}
                  alt={comment.author}
                  className="w-full h-full object-cover"
                />
              ) : (
                comment.authorAvatar
              )}
            </div>
            <span className="text-sm font-medium text-gray-900 hover:text-black cursor-pointer transition-colors text-center">
              {comment.author}
            </span>
          </div>
        </UserHoverCard>

        <div className="flex-1 min-w-0 relative">
          {/* Data no canto superior direito */}
          <div className="absolute top-0 right-0 text-xs text-gray-500">
            {formatDate(comment.createdAt)}
          </div>

          {/* Conteúdo do coment��rio */}
          {isEditing ? (
            <div className="mb-8 space-y-3">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Editar comentário..."
                className="min-h-[100px]"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SecureUploadWidget
                    onSuccess={(fileInfo: UploadedFileInfo) => {
                      console.log('Arquivo carregado na edição:', fileInfo);
                      // Inserir link do arquivo no comentário em edição
                      setEditContent(prev => {
                        // Verificar se há texto na linha atual
                        const lines = prev.split('\n');
                        const lastLine = lines[lines.length - 1];
                        const hasTextInLastLine = lastLine && lastLine.trim().length > 0;
                        
                        if (fileInfo.isImage) {
                          const imageMarkdown = `![${fileInfo.originalName}](${fileInfo.url})`;
                          // Se há texto na linha atual, adicionar quebra antes da imagem
                          return hasTextInLastLine ? prev + '\n' + imageMarkdown + '\n' : prev + imageMarkdown + '\n';
                        } else {
                          const linkMarkdown = `[📎 ${fileInfo.originalName}](${fileInfo.url})`;
                          // Se há texto na linha atual, adicionar quebra antes do link
                          return hasTextInLastLine ? prev + '\n' + linkMarkdown + '\n' : prev + linkMarkdown + '\n';
                        }
                      });
                    }}
                    onError={(error) => console.error('Erro no upload:', error)}
                    buttonText="📎"
                    className="mr-2"
                  />
                  <span className="text-xs text-gray-500">Upload de mídia</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleSaveEdit}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Salvar
                  </Button>
                  <Button onClick={handleCancelEdit} size="sm" variant="outline">
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-700 mb-8 text-sm">
              <CommentRenderer delta={comment.content ? JSON.parse(comment.content) : null} />
            </div>
          )}

          {/* Ações no canto inferior direito */}
          <div className="absolute bottom-0 right-4 flex items-center gap-2">
            {/* 1. Botão Delete/Lixo */}
            {canDelete && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-black transition-colors"
                title={`Excluir comentário ${isAdmin ? "(Admin)" : isTopicOwner ? "(Dono do post)" : "(Seu comentário)"}`}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                </svg>
              </button>
            )}

            {user && (
              <>
                {/* 2. Botão Editar - apenas para o autor do comentário */}
                {isCommentOwner && !isEditing && (
                  <button
                    onClick={handleEdit}
                    className="text-xs text-gray-500 hover:text-black transition-colors"
                    title="Editar comentário"
                  >
                    Editar
                  </button>
                )}

                {/* 3. Botão Citar */}
                <button
                  onClick={() => onQuote(comment)}
                  className="text-xs text-gray-500 hover:text-black transition-colors"
                  title="Citar comentário"
                >
                  Citar
                </button>

                {user.id !== comment.authorId && (
                  <button
                    onClick={() => onReport(comment)}
                    className="text-xs text-gray-500 hover:text-red-600 transition-colors"
                    title="Denunciar comentário"
                  >
                    !
                  </button>
                )}
              </>
            )}

            {/* 4. Botão Like */}
            <button
              onClick={() => {
                onLike(comment.id);
                // Add like animation
                if (!comment.isLiked) {
                  const button = document.getElementById(`heart-${comment.id}`);
                  if (button) {
                    button.classList.add("liked");
                    setTimeout(() => button.classList.remove("liked"), 600);
                  }
                }
              }}
              id={`heart-${comment.id}`}
              className={`heart-button flex items-center gap-1 text-xs transition-all text-gray-600 hover:text-gray-800`}
              title="Curtir comentário"
            >
              <span
                className={`text-sm transition-all ${
                  comment.isLiked ? "heart-red" : "heart-gray"
                }`}
              >
                ❤️
              </span>
              {comment.likes}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SimpleCommentSystem({
  topicId,
  topicAuthorId,
}: SimpleCommentSystemProps) {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quotedComment, setQuotedComment] = useState<Comment | null>(null);
  const [commentsToShow, setCommentsToShow] = useState(8);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingComment, setReportingComment] = useState<Comment | null>(
    null,
  );

  // Carregar comentários
  const loadComments = async () => {
    try {
      const headers: Record<string, string> = {};
      if (user) {
        headers.Authorization = `Bearer ${localStorage.getItem("auth_token")}`;
      }

      const response = await fetch(`/api/comments/${topicId}`, { headers });
      if (response.ok) {
        const data = await response.json();
        // Filtra apenas coment��rios raiz (sem parentId) e ordena por data
        const rootComments = data.comments
          .filter((comment: any) => !comment.parentId)
          .sort(
            (a: any, b: any) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          );
        setComments(rootComments);
      }
    } catch (error) {
      console.error("Error loading comments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadComments();

    // Verificar se usuário tem emblemas conquistados mas não notificados
    if (user) {
      checkUserBadges();
    }
  }, [topicId, user]);

  // Verificar emblemas do usuário
  const checkUserBadges = async () => {
    try {
      const response = await fetch(`/api/user/stats`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        console.log("[BADGES] Dados do usuário:", userData);

        // Se usuário tem emblemas mas nunca foi notificado, pode notificar agora
        if (userData.badges && userData.badges.length > 0) {
          console.log(
            `[BADGES] Usuário tem ${userData.badges.length} emblemas`,
          );
        }
      }
    } catch (error) {
      console.error("Erro ao verificar emblemas do usuário:", error);
    }
  };

  // Curtir comentário
  const handleLike = async (commentId: string) => {
    if (!user) {
      toast.error("Faça login para curtir");
      return;
    }

    try {
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("[LIKE DEBUG] Response:", data);

        // Atualizar o estado imediatamente
        setComments((prevComments) =>
          prevComments.map((comment) =>
            comment.id === commentId
              ? { ...comment, likes: data.likes, isLiked: data.isLiked }
              : comment,
          ),
        );

        // Trigger user stats refresh for hover cards and theme context
        window.dispatchEvent(new CustomEvent("userLikeUpdate"));
        window.dispatchEvent(new CustomEvent("refreshUserLikes"));

        // Verificar se o usuário ganhou um novo emblema
        if (data.newBadge) {
          console.log("[BADGE DEBUG] New badge:", data.newBadge.name);
          addNotification(
            `Parabéns! Você conquistou o emblema "${data.newBadge.name}": ${data.newBadge.description}`,
            "badge",
            data.newBadge.icon,
          );
        }
      }
    } catch (error) {
      toast.error("Erro ao curtir");
    }
  };

  // Editar comentário
  const handleEditComment = async (commentId: string, content: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({ content }),
      });

      if (response.ok) {
        const data = await response.json();
        // Atualizar o comentário no estado
        setComments((prevComments) =>
          prevComments.map((comment) =>
            comment.id === commentId
              ? { ...comment, content: data.comment.content }
              : comment,
          ),
        );
      } else {
        const data = await response.json();
        toast.error(data.message || "Erro ao editar comentário");
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Error editing comment:", error);
      throw error;
    }
  };

  // Deletar comentário
  const handleDelete = async (commentId: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });

      if (response.ok) {
        await loadComments();
        // Trigger global category stats refresh
        window.dispatchEvent(new CustomEvent("refreshCategoryStats"));
      } else {
        const data = await response.json();
        toast.error(data.message || "Erro ao excluir");
      }
    } catch (error) {
      toast.error("Erro ao excluir");
    }
  };

  // Criar comentário
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Faça login para comentar");
      return;
    }

    // Verificar se há conteúdo real no delta
    if (!newComment || !newComment.ops || newComment.ops.length === 0) {
      toast.error("Digite um comentário");
      return;
    }
    
    // Verificar se há texto real (não apenas espaços em branco)
    const hasRealContent = newComment.ops.some((op: any) => 
      typeof op.insert === 'string' && op.insert.trim().length > 0
    );
    
    if (!hasRealContent) {
      toast.error("Digite um comentário");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/comments/${topicId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({
          content: JSON.stringify(newComment),
          quotedCommentId: quotedComment?.id || null,
        }),
      });

      if (response.ok) {
        setNewComment(null);
        setQuotedComment(null);
        await loadComments();

        // Trigger global category stats refresh
        window.dispatchEvent(new CustomEvent("refreshCategoryStats"));

        toast.success("Comentário adicionado!");
      } else {
        const data = await response.json();
        toast.error(data.message || "Erro ao adicionar comentário");
      }
    } catch (error) {
      toast.error("Erro ao adicionar comentário");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Citar comentário
  const handleQuote = (comment: Comment) => {
    setQuotedComment(comment);
    // Adicionar foco no campo de comentário
    const textarea = document.querySelector(
      'textarea[placeholder*="comentário"]',
    ) as HTMLTextAreaElement;
    if (textarea) {
      textarea.focus();
    }
  };

  // Denunciar comentário
  const handleReport = (comment: Comment) => {
    setReportingComment(comment);
    setShowReportModal(true);
  };

  const handleCloseReportModal = () => {
    setShowReportModal(false);
    setReportingComment(null);
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-2"></div>
        <p className="text-gray-500 text-sm">Carregando comentários...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">
        Comentários ({comments.length})
      </h3>

      {/* Formulário de novo comentário */}
      {user && (
        <form onSubmit={handleSubmitComment} className="mb-6">
          {/* Quote preview */}
          {quotedComment && (
            <div className="mb-3 p-3 bg-white border border-gray-200 rounded">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">
                  Citando @{quotedComment.author}:
                </span>
                <button
                  type="button"
                  onClick={() => setQuotedComment(null)}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Remover citação
                </button>
              </div>
              <div className="text-sm text-gray-700 italic line-clamp-2">
                <CommentRenderer delta={quotedComment.content ? JSON.parse(quotedComment.content) : null} />
              </div>
            </div>
          )}

          <CommentRichEditor
            value={newComment}
            onChange={setNewComment}
            placeholder="Escreva seu comentário..."
          />
          
          <Button
            type="submit"
            disabled={
              isSubmitting || !newComment || !newComment.ops || newComment.ops.length === 0 || !newComment.ops.some((op: any) => typeof op.insert === 'string' && op.insert.trim().length > 0)
            }
            className="mt-3 bg-black text-white hover:bg-black/90"
          >
            {isSubmitting ? "Enviando..." : "Comentar"}
          </Button>
        </form>
      )}

      {/* Lista de comentários */}
      {comments.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Nenhum comentário ainda.</p>
          {!user && (
            <p className="text-sm text-gray-400 mt-2">
              Faça login para ser o primeiro a comentar!
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Mostrar comentários de acordo com paginação */}
          {comments.slice(0, commentsToShow).map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              topicAuthorId={topicAuthorId}
              onLike={handleLike}
              onDelete={handleDelete}
              onQuote={handleQuote}
              onReport={handleReport}
              onEdit={handleEditComment}
            />
          ))}

          {/* Botão Ver mais */}
          {comments.length > commentsToShow && (
            <div className="text-center py-4">
              <button
                onClick={() => setCommentsToShow((prev) => prev + 8)}
                className="flex items-center gap-2 mx-auto text-gray-600 hover:text-black transition-colors text-sm"
              >
                Ver mais
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M7.41 8.84L12 13.42l4.59-4.58L18 10.25l-6 6-6-6z" />
                </svg>
              </button>
            </div>
          )}

          {/* Botão Ver menos */}
          {commentsToShow > 8 && (
            <div className="text-center py-4">
              <button
                onClick={() => {
                  setCommentsToShow(8);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="flex items-center gap-2 mx-auto text-gray-600 hover:text-black transition-colors text-sm"
              >
                Retrair e voltar ao topo
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal de Denúncia */}
      {reportingComment && (
        <ReportModal
          isOpen={showReportModal}
          onClose={handleCloseReportModal}
          contentType="comment"
          contentId={reportingComment.id}
          contentAuthor={reportingComment.author}
        />
      )}
    </div>
  );
}
