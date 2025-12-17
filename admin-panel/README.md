# 🎛️ Painel Administrativo - My Book App

Painel web completo para gestão do app, usuários, premium e pagamentos.

## 🚀 Como Iniciar

```bash
cd admin-panel
pnpm install
cp .env.example .env
```

**Configure o `.env` com as MESMAS credenciais do app mobile:**
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
```

```bash
pnpm dev
```

Acesse: http://localhost:3000

> 💡 **Importante:** Use o MESMO projeto Supabase do app mobile! Assim você gerencia os mesmos usuários e dados.

## 📋 Funcionalidades

- ✅ Dashboard com métricas do app
- ✅ Gestão completa de usuários
- ✅ Sistema de usuários premium
- ✅ Preparação para pagamentos
- ✅ Visualização de estatísticas
- ✅ Detalhes de cada usuário

## 🔐 Autenticação

Apenas usuários com role `admin` podem acessar.

Para criar o primeiro admin, execute no Supabase SQL Editor:
```sql
-- Adicione seu email como admin
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'seu-email@exemplo.com';
```

## 💳 Sistema Premium

Para ativar premium para um usuário:
```sql
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object(
  'is_premium', true,
  'premium_since', NOW(),
  'premium_until', NOW() + INTERVAL '1 year'
)
WHERE email = 'usuario@exemplo.com';
```

## 🛠️ Tecnologias

- Vite + React
- TypeScript
- Supabase (Auth + Database)
- Tailwind CSS
- React Router
- Lucide Icons

## 📊 Estrutura

```
admin-panel/
├── src/
│   ├── pages/          # Páginas do admin
│   ├── components/     # Componentes reutilizáveis
│   ├── lib/            # Configurações (Supabase)
│   └── App.tsx         # App principal
├── package.json
└── vite.config.ts
```
