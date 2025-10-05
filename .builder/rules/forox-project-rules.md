# FOROX Project Rules - Regras Específicas do Projeto

## 📋 Visão Geral

Este documento define as regras específicas para desenvolvimento no projeto FOROX, uma plataforma de fórum moderna construída com React, TypeScript e Express.

## 🏗️ Arquitetura e Estrutura

### Organização de Pastas
```
├── client/           # Frontend React + TypeScript
├── server/           # Backend Express + TypeScript  
├── shared/           # Código compartilhado (tipos, interfaces)
├── public/           # Arquivos estáticos
├── netlify/          # Configurações de deploy
└── temp-uploads/     # Uploads temporários
```

### Regras de Estrutura
- **NUNCA** misture código de frontend e backend
- Use a pasta `shared/` para tipos e interfaces compartilhadas
- Mantenha arquivos de configuração na raiz do projeto
- Organize componentes em subpastas por funcionalidade

## 🎨 Frontend (React + TypeScript)

### Padrões de Componentes
```typescript
// ✅ Estrutura padrão de componente
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface ComponentProps {
  title: string;
  onAction?: () => void;
}

export default function Component({ title, onAction }: ComponentProps) {
  const { user } = useAuth();
  const [state, setState] = useState<string>("");

  return (
    <div className="container mx-auto p-4">
      {/* JSX aqui */}
    </div>
  );
}
```

### Regras de Estilo
- **SEMPRE** use Tailwind CSS para estilização
- Use componentes do Radix UI através da pasta `ui/`
- Aplique o padrão de design system com variáveis CSS customizadas
- Use `cn()` utility para combinar classes condicionalmente

### Gerenciamento de Estado
- Use Context API para estado global (AuthContext, ThemeContext)
- useState para estado local de componentes
- React Hook Form para formulários complexos
- Sonner para notificações toast

### Roteamento
- Use React Router DOM v6
- Defina rotas no App.tsx principal
- Implemente proteção de rotas com AuthContext

## 🔧 Backend (Express + TypeScript)

### Estrutura de Rotas
```typescript
// ✅ Padrão de rota
import { RequestHandler } from "express";
import { z } from "zod";

const schema = z.object({
  field: z.string().min(1),
});

export const handleRoute: RequestHandler = async (req, res) => {
  try {
    const validatedData = schema.parse(req.body);
    // Lógica da rota
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
```

### Validação de Dados
- **SEMPRE** use Zod para validação de entrada
- Valide tanto no frontend quanto no backend
- Retorne mensagens de erro claras e específicas

### Autenticação e Autorização
- Use JWT tokens para autenticação
- Implemente middleware `authenticateToken` para rotas protegidas
- Use `optionalAuthenticateToken` para rotas que funcionam com/sem auth
- Mantenha roles simples: "admin" e "user"

### Armazenamento de Dados
- Atualmente usa Map() em memória para demo
- **PRODUÇÃO**: Migrar para banco de dados real (PostgreSQL/MongoDB)
- Mantenha estruturas de dados consistentes

## 🔒 Segurança

### Upload de Arquivos
- **SEMPRE** use o sistema de upload seguro implementado
- Valide tipos MIME e extensões de arquivo
- Implemente quarentena para arquivos suspeitos
- Use Sharp para processamento seguro de imagens

### Validação e Sanitização
- Sanitize nomes de arquivos com `sanitize-filename`
- Valide entrada do usuário em todas as rotas
- Use CORS configurado adequadamente
- Implemente rate limiting quando necessário

### Logging de Segurança
```typescript
// ✅ Uso do SecurityLogger
import { securityLogger, SecurityEventType } from "../security/logger";

securityLogger.logFileUpload(
  userId,
  fileName,
  fileSize,
  clientIp,
  userAgent
);
```

## 🎯 Padrões de Código

### TypeScript
- **SEMPRE** defina interfaces para props e dados
- Use tipos compartilhados da pasta `shared/`
- Configure strict: false no tsconfig.json (padrão do projeto)
- Use path mapping: `@/` para client, `@shared/` para shared

### Nomenclatura
- Componentes: PascalCase (`UserProfile.tsx`)
- Hooks: camelCase com prefixo use (`useAuth.ts`)
- Utilitários: camelCase (`formatDate.ts`)
- Constantes: UPPER_SNAKE_CASE (`DEFAULT_AVATARS`)

### Imports
```typescript
// ✅ Ordem de imports
import React from "react";                    // React
import { useState } from "react";             // React hooks
import { Button } from "@/components/ui";     // UI components
import { useAuth } from "@/contexts";         // Contexts/hooks
import { User } from "@shared/auth";          // Shared types
import { toast } from "sonner";               // External libs
```

## 🔧 Build e Deploy

### Scripts NPM
- `yarn dev` - Desenvolvimento (Vite + Express)
- `yarn build` - Build completo (client + server)
- `yarn build:client` - Build apenas frontend
- `yarn build:server` - Build apenas backend
- `yarn start` - Produção

### Configuração de Build
- Use Vite para frontend (SWC para transpilação)
- Configure build separado para servidor
- Target Node.js 22 para servidor
- Deploy no Netlify com funções serverless

### Variáveis de Ambiente
- Use `.env` apenas para variáveis públicas
- **NUNCA** commite arquivos .env com secrets
- Prefixe variáveis do frontend com `VITE_`
- Mantenha `.env.example` atualizado

## 📦 Dependências

### Frontend Principais
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS + Radix UI
- React Router DOM
- React Hook Form
- Quill.js (editor rico)
- Sonner (toasts)

### Backend Principais
- Express + TypeScript
- Zod (validação)
- Multer (uploads)
- Sharp (processamento de imagem)
- UUID (IDs únicos)

### Regras de Dependências
- **SEMPRE** use yarn como package manager
- Mantenha dependências atualizadas
- Prefira devDependencies quando apropriado
- Use versões específicas para estabilidade

## 🧪 Testes e Qualidade

### Ferramentas
- Vitest para testes
- Prettier para formatação
- TypeScript para type checking

### Comandos
```bash
yarn test        # Executar testes
yarn format.fix  # Formatar código
yarn typecheck   # Verificar tipos
```

## 🚀 Funcionalidades Específicas

### Sistema de Fórum
- Categorias predefinidas com ícones
- Tópicos com editor rico (Quill)
- Sistema de comentários aninhados
- Likes e sistema de pontuação
- Tópicos em destaque

### Sistema de Usuários
- Registro com validação completa
- Login com captcha
- Avatares aleatórios padrão
- Sistema de badges
- Perfis de usuário

### Newsletter
- Sistema de artigos
- Navegação por semanas
- Geração automática de conteúdo

## ⚠️ Regras Críticas

1. **NUNCA** desabilite validação de segurança
2. **SEMPRE** valide entrada do usuário
3. **NUNCA** exponha dados sensíveis no frontend
4. **SEMPRE** use HTTPS em produção
5. **NUNCA** commite secrets ou tokens
6. **SEMPRE** teste uploads de arquivo
7. **NUNCA** confie apenas em validação frontend
8. **SEMPRE** implemente logs de segurança

## 📝 Convenções de Commit

```
feat: Adicionar nova funcionalidade
fix: Corrigir bug
security: Melhorias de segurança
style: Mudanças de estilo/formatação
refactor: Refatoração de código
docs: Atualização de documentação
test: Adicionar/modificar testes
```

## 🔄 Processo de Desenvolvimento

1. **Análise**: Entenda o requisito completamente
2. **Planejamento**: Defina arquitetura e abordagem
3. **Implementação**: Siga os padrões estabelecidos
4. **Validação**: Teste funcionalidade e segurança
5. **Review**: Verifique qualidade e padrões
6. **Deploy**: Use processo de build estabelecido

---

**Última atualização**: Janeiro 2025
**Versão**: 1.0.0
**Projeto**: FOROX Forum Platform