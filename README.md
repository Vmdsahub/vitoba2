# FOROX - Forum Platform

Um sistema de fórum moderno construído com React, TypeScript e Express.

## Características

- 🚀 Interface moderna e responsiva
- 📝 Editor de texto rico com Quill.js
- 👥 Sistema de usuários e autenticação
- 💬 Sistema de comentários
- 🏷️ Sistema de badges e gamificação
- 🔒 Sistema de segurança robusto
- 📧 Sistema de newsletter

## Tecnologias Utilizadas

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Radix UI
- React Hook Form
- Quill.js para editor de texto rico

### Backend
- Node.js
- Express
- TypeScript
- Multer para upload de arquivos
- Sharp para processamento de imagens

## Instalação

1. Clone o repositório:
```bash
git clone https://github.com/Vmdsahub/FOROX.git
cd FOROX
```

2. Instale as dependências:
```bash
npm install
# ou
yarn install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

4. Execute o projeto em modo de desenvolvimento:
```bash
npm run dev
# ou
yarn dev
```

## Scripts Disponíveis

- `npm run dev` - Executa o projeto em modo de desenvolvimento
- `npm run build` - Constrói o projeto para produção
- `npm run build:client` - Constrói apenas o frontend
- `npm run build:server` - Constrói apenas o backend
- `npm run start` - Executa o projeto em produção
- `npm run test` - Executa os testes
- `npm run format.fix` - Formata o código com Prettier
- `npm run typecheck` - Verifica os tipos TypeScript

## Estrutura do Projeto

```
├── client/           # Frontend React
│   ├── components/   # Componentes React
│   ├── contexts/     # Contextos React
│   ├── hooks/        # Hooks customizados
│   ├── pages/        # Páginas da aplicação
│   └── utils/        # Utilitários
├── server/           # Backend Express
│   ├── routes/       # Rotas da API
│   ├── security/     # Middleware de segurança
│   └── types/        # Tipos TypeScript
├── shared/           # Código compartilhado
├── public/           # Arquivos estáticos
└── netlify/          # Configurações Netlify
```

## Funcionalidades

### Sistema de Fórum
- Criação e visualização de tópicos
- Sistema de comentários aninhados
- Editor de texto rico com formatação
- Upload de imagens

### Sistema de Usuários
- Registro e login de usuários
- Perfis de usuário
- Sistema de badges
- Gamificação

### Segurança
- Validação de entrada
- Sanitização de dados
- Proteção contra XSS
- Rate limiting

## Deploy

O projeto está configurado para deploy no Netlify com funções serverless.

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## Autor

**Vmdsahub** - [GitHub](https://github.com/Vmdsahub)

---

⭐ Se este projeto te ajudou, considere dar uma estrela no repositório!