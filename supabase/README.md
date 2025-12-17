# 📦 Supabase Edge Functions

Esta pasta contém as **Edge Functions** do Supabase.

## 📁 Estrutura

```
supabase/
  functions/
    send-push-notification/
      index.ts
```

## 🔍 Por que essa estrutura?

O Supabase usa o **nome da pasta** como nome da função. Quando você faz deploy:

- **Pasta**: `supabase/functions/send-push-notification/`
- **Endpoint**: `https://seu-projeto.supabase.co/functions/v1/send-push-notification`

Cada função precisa:
- Estar em uma pasta com o nome da função
- Ter um arquivo `index.ts` (ou `index.js`) dentro dela
- Usar Deno (não Node.js)

## 🚀 Como fazer deploy

```bash
# Instalar Supabase CLI (se não tiver)
npm install -g supabase

# Fazer login
supabase login

# Fazer deploy da função
supabase functions deploy send-push-notification
```

## 📝 Função atual

### `send-push-notification`

**O que faz:**
- Recebe notificações do app
- Busca tokens de push do usuário no banco
- Envia notificações push via Expo Push API

**Como é chamada:**
```typescript
// No código do app (services/notifications.service.ts)
const response = await fetch(
  `${supabaseUrl}/functions/v1/send-push-notification`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      notification: { ... },
      actorProfile: { ... }
    }),
  }
);
```

## ⚙️ Variáveis de Ambiente Necessárias

A função precisa das seguintes variáveis no Supabase:
- `SUPABASE_URL` - URL do projeto (automático)
- `SUPABASE_SERVICE_ROLE_KEY` - Chave de serviço (automático)

Essas são configuradas automaticamente pelo Supabase quando você faz deploy.

## 📚 Documentação

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Deno Runtime](https://deno.land/)
