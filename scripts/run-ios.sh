#!/bin/bash

# Script para rodar o app iOS abrindo o simulador automaticamente

echo "🍎 Iniciando iOS (Development Build)..."
echo ""

# Verifica se está no macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ iOS só pode ser desenvolvido no macOS!"
    exit 1
fi

# Verifica se o projeto nativo existe e está completo
if [ ! -d "ios" ] || [ ! -f "ios/Podfile" ]; then
    echo "📦 Projeto nativo iOS não encontrado ou incompleto."
    echo "🔨 Gerando projeto iOS nativo (isso pode levar alguns minutos)..."
    echo ""
    npx expo prebuild --platform ios --clean
    if [ $? -ne 0 ]; then
        echo "❌ Erro ao gerar projeto nativo iOS!"
        exit 1
    fi
    echo ""
    echo "✅ Projeto iOS gerado com sucesso!"
    echo ""
    echo "📦 Instalando CocoaPods..."
    cd ios && pod install && cd ..
    if [ $? -ne 0 ]; then
        echo "⚠️  Aviso: Erro ao instalar CocoaPods. Tente manualmente: cd ios && pod install"
    fi
    echo ""
fi

# Verifica se o Podfile foi executado (pasta Pods existe)
if [ ! -d "ios/Pods" ]; then
    echo "📦 Instalando dependências do CocoaPods..."
    cd ios && pod install && cd ..
    if [ $? -ne 0 ]; then
        echo "❌ Erro ao instalar CocoaPods!"
        echo "💡 Tente manualmente: cd ios && pod install"
        exit 1
    fi
    echo ""
fi

# Verifica se o Xcode está instalado
if ! command -v xcodebuild &> /dev/null; then
    echo "❌ Xcode não encontrado!"
    echo "💡 Instale o Xcode da App Store e execute: xcode-select --install"
    exit 1
fi

# Função para verificar se há simulador rodando
check_simulator_running() {
    xcrun simctl list devices | grep -E "Booted" | grep -q "iPhone\|iPad"
}

# Função para abrir simulador
open_simulator() {
    echo "📱 Abrindo simulador..."
    
    # Abre o app Simulator
    open -a Simulator 2>/dev/null
    
    # Aguarda um pouco para o Simulator abrir
    sleep 3
    
    # Pega o primeiro iPhone disponível (preferência por iPhone 15 ou mais recente)
    local device=$(xcrun simctl list devices available | grep -E "iPhone" | grep -E "15|16|17" | head -1 | sed -E 's/.*\(([^)]+)\).*/\1/' | xargs)
    
    if [ -z "$device" ]; then
        # Se não encontrar iPhone 15+, pega qualquer iPhone
        device=$(xcrun simctl list devices available | grep -E "iPhone" | head -1 | sed -E 's/.*\(([^)]+)\).*/\1/' | xargs)
    fi
    
    if [ -z "$device" ]; then
        # Se não encontrar iPhone, tenta iPad
        device=$(xcrun simctl list devices available | grep -E "iPad" | head -1 | sed -E 's/.*\(([^)]+)\).*/\1/' | xargs)
    fi
    
    if [ -z "$device" ]; then
        echo "⚠️  Não foi possível detectar dispositivo automaticamente"
        echo "💡 O Simulator foi aberto. Escolha um dispositivo manualmente."
        return 0
    fi
    
    echo "🚀 Iniciando simulador: $device"
    
    # Boota o dispositivo se não estiver bootado
    xcrun simctl boot "$device" 2>/dev/null || {
        echo "⚠️  Dispositivo já está rodando ou não foi possível iniciar"
    }
    
    # Aguarda o simulador ficar pronto
    echo "⏳ Aguardando simulador ficar pronto..."
    sleep 3
    
    echo "✅ Simulador pronto!"
}

# Verifica se há simulador rodando
if check_simulator_running; then
    echo "✅ Simulador já está rodando"
else
    echo "📱 Nenhum simulador rodando. Abrindo..."
    open_simulator
fi

echo ""

# Lista simuladores disponíveis (informação)
echo "📱 Simuladores disponíveis:"
xcrun simctl list devices available | grep -E "iPhone|iPad" | head -3
echo ""

# Procura e abre o workspace do Xcode
WORKSPACE=$(find ios -name "*.xcworkspace" -type d 2>/dev/null | head -1)

if [ -n "$WORKSPACE" ]; then
    echo "🔧 Abrindo projeto no Xcode..."
    open "$WORKSPACE"
    echo "✅ Xcode aberto!"
    echo ""
else
    echo "⚠️  Workspace do Xcode não encontrado ainda."
    echo "💡 Será gerado quando o expo run:ios executar."
    echo ""
fi

# Roda o app (Development Build)
echo ""
echo "🚀 Compilando e instalando o app nativo..."
echo "📱 O app será instalado como um app independente (não Expo Go)"
echo "⏳ Primeira vez pode levar vários minutos (Xcode compilando)..."
echo "💡 Se parecer travado, aguarde - o Xcode está compilando"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Roda o expo run:ios que compila o código nativo e abre no simulador
npx expo run:ios

# Se o workspace não existia antes, tenta abrir depois do build
if [ -z "$WORKSPACE" ]; then
    sleep 2
    WORKSPACE=$(find ios -name "*.xcworkspace" -type d 2>/dev/null | head -1)
    if [ -n "$WORKSPACE" ]; then
        echo ""
        echo "🔧 Abrindo projeto no Xcode..."
        open "$WORKSPACE"
    fi
fi

# Verifica se houve erro
if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Erro ao compilar/instalar o app"
    echo ""
    echo "💡 Dicas para resolver:"
    echo "   1. Verifique se o simulador está instalado: xcrun simctl list devices"
    echo "   2. Tente limpar o build: cd ios && xcodebuild clean && cd .."
    echo "   3. Reinstale CocoaPods: cd ios && pod install && cd .."
    echo "   4. Regenerar projeto: pnpm run prebuild:ios:clean"
    exit 1
fi
