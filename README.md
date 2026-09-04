# Despesas

Aplicacao de controle de despesas mensais com listas de compras, leitura de QR Code do cupom fiscal (NFC-e), contas a pagar e faturas de cartao.

## Principais funcionalidades

- Cadastro, login e logout de usuarios
- Listas de compras no mesmo formato de sempre (nome, quantidade, unidade e categoria)
- Leitura do QR Code do cupom para conciliar itens, dar baixa na lista, registrar valor e forma de pagamento
- Contas a pagar do mes, com vencimento, pagamento e edicao de valor
- Fatura atual do cartao, com valor editavel que vai sendo atualizado
- Despesas avulsas e compras no credito somando na fatura do cartao escolhido
- Historico e relatorios do mes
- Compartilhamento de listas
- Notificacoes push (quando configuradas)
- Modo PWA com Service Worker

## Stack

- Next.js 16
- React 19
- TypeScript
- MongoDB + Mongoose
- Zustand
- Zod
- Tailwind CSS
- next-pwa

## Estrutura resumida

- app: rotas da aplicacao e API routes
- components: telas de listas, despesas, historico e relatorios
- lib: autenticacao, banco, modelos, parser de NFC-e e utilitarios
- worker: custom worker para PWA
- public: assets estaticos e arquivos gerados do PWA

## Pre-requisitos

- Node.js 20+
- npm
- MongoDB (local ou em nuvem)

## Instalacao

```bash
npm install
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
npm run dev
```

A aplicacao sobe em http://localhost:3000

## Como usar o cupom

Na lista de compras, toque em **Ler cupom** e aponte a camera para o QR Code do NFC-e. O app busca os itens na consulta da SEFAZ, tenta casar com a sua lista, da baixa nos itens encontrados e ja preenche valor, estabelecimento e forma de pagamento. Se a camera nao abrir, cole o link do QR.

Compras no credito podem ser lancadas na fatura atual do cartao cadastrado.

## Build de producao

```bash
npm run build
npm start
```

## Scripts disponiveis

- `npm run dev`: inicia ambiente de desenvolvimento
- `npm run build`: gera build de producao
- `npm run start`: inicia servidor da build
- `npm run lint`: executa lint

## Endpoints principais

Autenticacao:

- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me

Listas e cupom:

- GET /api/shopping-lists
- POST /api/shopping-lists
- GET /api/shopping-lists/[listId]
- PATCH /api/shopping-lists/[listId]
- POST /api/shopping-lists/[listId]/items
- PATCH /api/shopping-lists/[listId]/items/[itemId]
- POST /api/shopping-lists/[listId]/complete
- POST /api/shopping-lists/[listId]/share
- POST /api/receipts/parse
- POST /api/purchases

Despesas:

- GET/POST /api/bills
- PATCH/DELETE /api/bills/[billId]
- GET/POST /api/credit-cards
- GET/POST /api/invoices
- PATCH /api/invoices/[invoiceId]

Outros:

- GET /api/health/db
- POST /api/notifications/subscription

## PWA

O projeto usa next-pwa e gera os arquivos de service worker na pasta public no build de producao.

## Observacoes

- A conexao com banco depende de MONGODB_URI valido.
- A autenticacao usa cookie HttpOnly de sessao assinado com AUTH_SECRET.
- A leitura do cupom depende da consulta publica da SEFAZ do estado. Se o portal estiver fora ou bloquear a consulta, use o checkout manual.
- Contas mensais se repetem no mes seguinte automaticamente.
- A fatura do cartao pode ser editada a qualquer momento para acompanhar o valor do banco.
- Em desenvolvimento, o PWA fica desabilitado por configuracao.

## Licenca

Defina aqui a licenca do projeto (exemplo: MIT).
