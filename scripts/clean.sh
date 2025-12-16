#!/bin/bash

# Script para limpar o projeto e preparar para desenvolvimento

echo "🧹 Limpando projeto..."

# Remove pastas nativas (opcional - só se quiser começar do zero)
read -p "Deseja remover pastas android/ e ios/? (s/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo "🗑️  Removendo pastas nativas..."
    rm -rf android ios
    echo "✅ Pastas nativas removidas"
fi

# Remove node_modules
echo "🗑️  Removendo node_modules..."
rm -rf node_modules
echo "✅ node_modules removido"

# Remove cache do Expo
echo "🗑️  Limpando cache do Expo..."
rm -rf .expo
npx expo start --clear 2>/dev/null || true
echo "✅ Cache do Expo limpo"

# Remove cache do Metro
echo "🗑️  Limpando cache do Metro..."
rm -rf .metro-health-check*
echo "✅ Cache do Metro limpo"

# Remove lock files (opcional)
read -p "Deseja remover package-lock.json? (s/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    rm -f package-lock.json
    echo "✅ package-lock.json removido"
fi

echo ""
echo "✅ Limpeza concluída!"
echo ""
echo "   Agora instale as dependências:"
echo "   pnpm install"
echo ""
echo "   Depois inicie o projeto:"
echo "   pnpm start        # Expo Go (rápido)"
echo "   pnpm ios          # Development Build iOS"
echo "   pnpm android      # Development Build Android"
