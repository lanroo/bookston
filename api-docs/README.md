# 📚 Documentação da API - My Book App

Documentação completa e organizada de todos os endpoints da API do My Book App.

## 🚀 Como Acessar

### Opção 1: Servidor Local (Recomendado)

1. Instale as dependências (se ainda não instalou):
```bash
pnpm install
```

2. Inicie o servidor de documentação:
```bash
pnpm docs
```

3. Acesse no navegador:
```
http://localhost:3001/api-docs
```

### Opção 2: Visualizar JSON Diretamente

O arquivo `swagger.json` pode ser visualizado em:
- [Swagger Editor](https://editor.swagger.io/) - Cole o conteúdo do arquivo
- [Swagger UI Online](https://petstore.swagger.io/) - Importe o arquivo JSON

## 📋 Endpoints Documentados

### 📖 Books (Livros)
- `GET /books` - Listar livros do usuário
- `GET /books/{bookId}` - Obter livro por ID
- `POST /books` - Criar novo livro
- `PATCH /books/{bookId}` - Atualizar livro
- `DELETE /books/{bookId}` - Deletar livro
- `GET /books/stats` - Estatísticas de livros
- `PUT /books/order` - Atualizar ordem dos livros
- `GET /books/search` - Buscar livros em APIs externas

### 📝 Notes (Notas)
- `GET /notes` - Listar notas
- `GET /notes/{noteId}` - Obter nota por ID
- `POST /notes` - Criar nova nota
- `PATCH /notes/{noteId}` - Atualizar nota
- `DELETE /notes/{noteId}` - Deletar nota
- `GET /folders` - Listar pastas
- `POST /folders` - Criar pasta
- `DELETE /folders/{folderId}` - Deletar pasta

### 📰 Posts (Posts Sociais)
- `GET /posts` - Listar posts do feed
- `GET /posts/{postId}` - Obter post por ID
- `GET /posts/user/{userId}` - Listar posts de um usuário
- `POST /posts` - Criar post
- `DELETE /posts/{postId}` - Deletar post
- `POST /posts/{postId}/like` - Curtir/descurtir post

### 💬 Comments (Comentários)
- `GET /posts/{postId}/comments` - Listar comentários
- `POST /posts/{postId}/comments` - Criar comentário
- `POST /comments/{commentId}/like` - Curtir/descurtir comentário
- `DELETE /comments/{commentId}` - Deletar comentário

### 🔔 Notifications (Notificações)
- `GET /notifications` - Listar notificações
- `GET /notifications/stats` - Estatísticas de notificações
- `POST /notifications/mark-read` - Marcar todas como lidas
- `POST /notifications/{notificationId}/read` - Marcar como lida

### 👥 Follows (Seguir Usuários)
- `POST /follows/{userId}` - Seguir usuário
- `DELETE /follows/{userId}` - Deixar de seguir
- `GET /follows/{userId}/stats` - Estatísticas de seguidores
- `GET /follows/{userId}/followers` - Listar seguidores
- `GET /follows/{userId}/following` - Listar usuários seguidos

### 👤 Profile (Perfil)
- `PATCH /profile` - Atualizar perfil
- `POST /profile/username/check` - Verificar disponibilidade de username

### 🎮 Points (Pontos e Gamificação)
- `GET /points` - Obter pontos do usuário
- `GET /points/{userId}` - Obter pontos de um usuário

### 🔍 Search (Busca)
- `GET /search` - Busca unificada (usuários, livros, autores, editoras)

### 📦 Storage (Armazenamento)
- `POST /storage/avatar` - Upload de avatar
- `DELETE /storage/avatar` - Deletar avatar

## 🔐 Autenticação

Todos os endpoints requerem autenticação via JWT Bearer Token.

**Como obter o token:**
```javascript
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;
```

**Como usar:**
- No Swagger UI: Clique em "Authorize" e cole o token
- Em requisições: Adicione o header: `Authorization: Bearer {token}`

## 📝 Notas Importantes

1. **Base URL**: A API usa o Supabase REST API
   - URL base: `https://{seu-projeto}.supabase.co/rest/v1`

2. **Row Level Security (RLS)**: Todos os dados são isolados por usuário
   - Você só pode acessar seus próprios dados
   - Exceção: Posts e comentários são públicos (mas só você pode editar/deletar os seus)

3. **Paginação**: Endpoints de listagem suportam `limit` e `offset`

4. **Filtros**: Alguns endpoints suportam filtros via query parameters

## 🛠️ Desenvolvimento

Para atualizar a documentação:

1. Edite o arquivo `swagger.json`
2. Reinicie o servidor: `pnpm docs`
3. A documentação será atualizada automaticamente

## 📄 Formato

A documentação segue o padrão **OpenAPI 3.0.3** (Swagger).
