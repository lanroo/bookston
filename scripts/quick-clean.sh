#!/bin/bash

# Limpeza rápida - só cache, sem apagar pastas

echo "🧹 Limpeza rápida do projeto..."
echo ""

# Remove cache do Expo
echo "🗑️  Limpando cache do Expo..."
rm -rf .expo
echo "✅ Cache do Expo limpo"

# Remove cache do Metro
echo "🗑️  Limpando cache do Metro..."
rm -rf .metro-health-check*
echo "✅ Cache do Metro limpo"

echo ""
echo "✅ Limpeza concluída!"
echo ""
echo " Agora tente rodar:"
echo "   pnpm start"
