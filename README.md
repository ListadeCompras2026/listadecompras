# Lista de Compras

Aplicacao web para gerenciamento de listas de compras com autenticacao, historico, relatorios, compartilhamento de listas e suporte a PWA (instalavel no celular/desktop).

## Principais funcionalidades

- Cadastro, login e logout de usuarios
- Criacao e edicao de listas de compras
- Marcacao de itens concluidos
- Compartilhamento de listas
- Historico e relatorios
- Notificacoes push (quando configuradas)
- Modo PWA com Service Worker

## Stack

- Next.js 16
- React 19
- TypeScript
- MongoDB + Mongoose
- Zustand (estado global)
- Zod (validacao)
- Tailwind CSS
- next-pwa

## Estrutura resumida

- app: rotas da aplicacao e API routes
- components: componentes de UI e telas
- lib: autenticacao, banco, modelos e utilitarios
- worker: custom worker para PWA
- public: assets estaticos e arquivos gerados do PWA

## Pre-requisitos

- Node.js 20+
- pnpm
- MongoDB (local ou em nuvem)

## Instalacao

```bash
pnpm install
```

## Variaveis de ambiente

Crie um arquivo `.env.local` na raiz com:

```env
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net
MONGODB_DB=lista_compras
AUTH_SECRET=uma_chave_bem_forte
```

Opcional para notificacoes push:

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=sua_chave_publica
VAPID_PRIVATE_KEY=sua_chave_privada
VAPID_SUBJECT=mailto:seu-email@dominio.com
```

## Rodando em desenvolvimento

```bash
pnpm dev
```

A aplicacao sobe em http://localhost:3000

## Build de producao

```bash
pnpm build
pnpm start
```

## Scripts disponiveis

- `pnpm dev`: inicia ambiente de desenvolvimento
- `pnpm build`: gera build de producao
- `pnpm start`: inicia servidor da build
- `pnpm lint`: executa lint

## Endpoints principais

Autenticacao:

- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me

Listas:

- GET /api/shopping-lists
- POST /api/shopping-lists
- GET /api/shopping-lists/[listId]
- PATCH /api/shopping-lists/[listId]
- POST /api/shopping-lists/[listId]/items
- PATCH /api/shopping-lists/[listId]/items/[itemId]
- POST /api/shopping-lists/[listId]/complete
- POST /api/shopping-lists/[listId]/share

Outros:

- POST /api/purchases
- GET /api/health/db
- POST /api/notifications/subscription

## PWA

O projeto usa next-pwa e gera os arquivos de service worker na pasta public no build de producao.

## Observacoes

- A conexao com banco depende de MONGODB_URI valido.
- A autenticacao usa cookie HttpOnly de sessao assinado com AUTH_SECRET.
- Em desenvolvimento, o PWA fica desabilitado por configuracao.

## Licenca

Defina aqui a licenca do projeto (exemplo: MIT).
