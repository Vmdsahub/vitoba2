# Regras do Trae AI para o Projeto FOROX

## 🤖 Instruções Específicas para IA

Este documento contém regras específicas para assistentes de IA trabalhando no projeto FOROX.

## 🎯 Contexto do Projeto

### Tecnologias Principais
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Express + TypeScript + Node.js
- **UI**: Radix UI + Shadcn/ui components
- **Validação**: Zod (backend) + React Hook Form (frontend)
- **Estilização**: Tailwind CSS com design system customizado
- **Build**: Vite (client) + Vite (server) com configurações separadas

### Arquitetura
- Monorepo com separação clara frontend/backend/shared
- Deploy no Netlify com funções serverless
- Sistema de upload seguro com validação avançada
- Autenticação JWT com roles admin/user

## 📋 Regras de Implementação

### 1. Estrutura de Arquivos
```
AO CRIAR NOVOS ARQUIVOS:
✅ Frontend: client/components/, client/pages/, client/hooks/
✅ Backend: server/routes/, server/security/
✅ Shared: shared/ (apenas tipos e interfaces)
✅ UI: client/components/ui/ (componentes reutilizáveis)

❌ NUNCA misture código frontend/backend
❌ NUNCA crie arquivos na raiz sem justificativa
```

### 2. Padrões de Código

#### Frontend (React)
```typescript
// ✅ SEMPRE use este padrão para componentes
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  className?: string;
}

export default function Component({ title, className }: Props) {
  const { user } = useAuth();
  
  return (
    <div className={cn("container mx-auto p-4", className)}>
      <Button variant="default" size="lg">
        {title}
      </Button>
    </div>
  );
}
```

#### Backend (Express)
```typescript
// ✅ SEMPRE use este padrão para rotas
import { RequestHandler } from "express";
import { z } from "zod";

const requestSchema = z.object({
  field: z.string().min(1, "Campo obrigatório"),
});

export const handleRoute: RequestHandler = async (req, res) => {
  try {
    const data = requestSchema.parse(req.body);
    
    // Lógica aqui
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Erro na rota:", error);
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
};
```

### 3. Estilização com Tailwind

```typescript
// ✅ Use classes Tailwind seguindo o design system
const styles = {
  container: "container mx-auto px-4 py-8",
  card: "bg-card text-card-foreground rounded-lg border shadow-sm",
  button: "bg-primary text-primary-foreground hover:bg-primary/90",
  input: "border border-input bg-background px-3 py-2 rounded-md"
};

// ✅ Use cn() para classes condicionais
const buttonClass = cn(
  "px-4 py-2 rounded-md transition-colors",
  variant === "primary" && "bg-primary text-primary-foreground",
  disabled && "opacity-50 cursor-not-allowed"
);
```

### 4. Gerenciamento de Estado

```typescript
// ✅ Para estado global, use Context API existente
const { user, login, logout } = useAuth();
const { addNotification } = useNotifications();

// ✅ Para formulários, use React Hook Form
const form = useForm<FormData>({
  resolver: zodResolver(schema),
  defaultValues: { field: "" }
});

// ✅ Para estado local simples, use useState
const [isOpen, setIsOpen] = useState(false);
```

### 5. Validação de Dados

```typescript
// ✅ SEMPRE defina schemas Zod
const userSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres")
});

// ✅ Use no backend para validação
const userData = userSchema.parse(req.body);

// ✅ Use no frontend com React Hook Form
const form = useForm({
  resolver: zodResolver(userSchema)
});
```

## 🔒 Regras de Segurança

### Upload de Arquivos
```typescript
// ✅ SEMPRE use o sistema seguro existente
import { secureUploadMiddleware } from "../routes/secure-upload";

// ✅ Para rotas de upload
app.post("/api/upload", 
  authenticateToken,
  secureUploadMiddleware.single("file"),
  handleSecureUpload
);
```

### Autenticação
```typescript
// ✅ Para rotas protegidas
app.get("/api/protected", authenticateToken, handler);

// ✅ Para rotas opcionais
app.get("/api/optional", optionalAuthenticateToken, handler);

// ✅ No frontend, sempre verifique auth
const { user, isLoading } = useAuth();
if (isLoading) return <Loading />;
if (!user) return <LoginPrompt />;
```

## 📦 Dependências e Imports

### Ordem de Imports
```typescript
// 1. React e hooks
import React, { useState, useEffect } from "react";

// 2. Bibliotecas externas
import { toast } from "sonner";
import { z } from "zod";

// 3. Componentes UI
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

// 4. Componentes locais
import Header from "@/components/Header";
import Forum from "@/components/Forum";

// 5. Hooks e contextos
import { useAuth } from "@/contexts/AuthContext";
import { useCategoryStats } from "@/hooks/useCategoryStats";

// 6. Tipos compartilhados
import { User, Topic } from "@shared/auth";
import { ForumCategory } from "@shared/forum";

// 7. Utilitários
import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/dateUtils";
```

### Gerenciamento de Dependências
```bash
# ✅ SEMPRE use yarn
yarn add package-name
yarn add -D dev-package

# ✅ Scripts principais
yarn dev          # Desenvolvimento
yarn build        # Build completo
yarn start        # Produção
yarn test         # Testes
yarn format.fix   # Formatação
```

## 🎨 UI/UX Guidelines

### Componentes UI
```typescript
// ✅ Use componentes do sistema existente
import { 
  Button, 
  Input, 
  Dialog, 
  Card,
  Badge,
  Avatar
} from "@/components/ui";

// ✅ Para notificações
import { toast } from "sonner";
toast.success("Operação realizada com sucesso!");
toast.error("Erro ao processar solicitação");
```

### Responsividade
```typescript
// ✅ Use classes responsivas do Tailwind
const responsiveClasses = {
  container: "container mx-auto px-4 sm:px-6 lg:px-8",
  grid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
  text: "text-sm sm:text-base lg:text-lg"
};
```

## 🔧 Debugging e Logs

### Frontend
```typescript
// ✅ Use console.log para desenvolvimento
console.log("[DEBUG] Estado atual:", state);
console.error("[ERROR] Falha na operação:", error);

// ✅ Para produção, use toast para feedback
toast.error("Erro ao carregar dados");
```

### Backend
```typescript
// ✅ Use SecurityLogger para eventos importantes
import { securityLogger } from "../security/logger";

securityLogger.logFileUpload(userId, fileName, fileSize, ip, userAgent);
securityLogger.logSuspiciousActivity("Tentativa de acesso negada", details);

// ✅ Console para desenvolvimento
console.log("[API] Processando requisição:", req.path);
console.error("[ERROR] Falha na validação:", error);
```

## 📋 Checklist para Novas Features

### Antes de Implementar
- [ ] Entendi completamente o requisito?
- [ ] A feature se encaixa na arquitetura existente?
- [ ] Preciso de novas dependências?
- [ ] Há implicações de segurança?

### Durante a Implementação
- [ ] Estou seguindo os padrões de código?
- [ ] Implementei validação adequada?
- [ ] Adicionei tratamento de erros?
- [ ] A UI está responsiva?
- [ ] Testei em diferentes cenários?

### Após Implementação
- [ ] O código está bem documentado?
- [ ] Não há vazamentos de dados sensíveis?
- [ ] A performance está adequada?
- [ ] Logs de segurança estão funcionando?

## 🚨 Erros Comuns a Evitar

### ❌ NÃO FAÇA
```typescript
// ❌ Não misture estilos inline com Tailwind
<div style={{color: 'red'}} className="text-blue-500">

// ❌ Não ignore validação
const data = req.body; // Sem validação

// ❌ Não exponha dados sensíveis
res.json({ user: { ...user, password: user.password } });

// ❌ Não use any sem necessidade
const data: any = response;

// ❌ Não ignore erros
try { ... } catch (e) { /* vazio */ }
```

### ✅ FAÇA
```typescript
// ✅ Use apenas Tailwind
<div className="text-red-500 hover:text-red-600">

// ✅ Sempre valide entrada
const data = schema.parse(req.body);

// ✅ Filtre dados sensíveis
res.json({ user: { id, name, email } });

// ✅ Use tipos específicos
const data: UserData = response;

// ✅ Trate erros adequadamente
try { ... } catch (error) {
  console.error("Erro:", error);
  toast.error("Operação falhou");
}
```

## 🎯 Objetivos de Qualidade

1. **Consistência**: Siga sempre os padrões estabelecidos
2. **Segurança**: Nunca comprometa a segurança por conveniência
3. **Performance**: Otimize para carregamento rápido
4. **Usabilidade**: Priorize experiência do usuário
5. **Manutenibilidade**: Escreva código limpo e documentado

---

**Para Assistentes IA**: Estas regras devem ser seguidas rigorosamente ao trabalhar no projeto FOROX. Sempre consulte este documento antes de implementar novas funcionalidades ou modificar código existente.