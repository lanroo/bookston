#!/bin/bash

echo "🔍 Verificando setup do projeto..."
echo ""

# Verificar Node.js
echo "📦 Node.js:"
if command -v node &> /dev/null; then
    echo "   ✅ $(node --version)"
else
    echo "   ❌ Node.js não encontrado"
    exit 1
fi

# Verificar pnpm
echo "📦 pnpm:"
if command -v pnpm &> /dev/null; then
    echo "   ✅ $(pnpm --version)"
else
    echo "   ❌ pnpm não encontrado"
    exit 1
fi

# Verificar node_modules
echo "📦 Dependências:"
if [ -d "node_modules" ]; then
    echo "   ✅ node_modules existe"
    if [ -d "node_modules/expo" ]; then
        echo "   ✅ Expo instalado"
    else
        echo "   ⚠️  Expo não encontrado - execute: pnpm install"
    fi
else
    echo "   ❌ node_modules não existe - execute: pnpm install"
    exit 1
fi

# Verificar .env
echo "📦 Variáveis de ambiente:"
if [ -f ".env" ]; then
    if grep -q "EXPO_PUBLIC_SUPABASE_URL" .env; then
        echo "   ✅ .env configurado"
    else
        echo "   ⚠️  .env não tem EXPO_PUBLIC_SUPABASE_URL"
    fi
else
    echo "   ⚠️  .env não encontrado"
fi

# Verificar Expo CLI
echo "📦 Expo CLI:"
if command -v expo &> /dev/null || [ -f "node_modules/.bin/expo" ]; then
    echo "   ✅ Expo disponível"
else
    echo "   ⚠️  Expo CLI não encontrado"
fi

# Verificar pastas nativas (se existirem)
echo "📦 Projeto nativo:"
if [ -d "android" ] || [ -d "ios" ]; then
    echo "   ✅ Pastas nativas encontradas"
    if [ -d "android" ]; then
        echo "      - android/ existe"
    fi
    if [ -d "ios" ]; then
        echo "      - ios/ existe"
    fi
else
    echo "   ℹ️  Pastas nativas não encontradas (normal para Expo Go)"
    echo "      Para criar: pnpm prebuild"
fi

echo ""
echo "✅ Verificação concluída!"
echo ""
echo "💡 Para rodar o projeto:"
echo "   - Expo Go: pnpm start:go"
echo "   - Android nativo: pnpm android"
echo "   - iOS nativo: pnpm ios"
