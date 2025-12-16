#!/bin/bash

# Script para rodar o app Android abrindo o emulador automaticamente

FORCE_NEW_EMULATOR=false
if [ "$1" = "--new" ] || [ "$1" = "-n" ]; then
    FORCE_NEW_EMULATOR=true
    shift
fi

echo "🤖 Iniciando Android (Development Build)..."
echo ""

# Verifica se o projeto nativo existe e está completo
if [ ! -d "android" ] || [ ! -f "android/app/build.gradle" ]; then
    echo "📦 Projeto nativo não encontrado ou incompleto."
    echo "🔨 Gerando projeto Android nativo (isso pode levar alguns minutos)..."
    echo ""
    npx expo prebuild --platform android --clean
    if [ $? -ne 0 ]; then
        echo "❌ Erro ao gerar projeto nativo!"
        exit 1
    fi
    echo ""
    echo "✅ Projeto Android gerado com sucesso!"
    echo ""
fi

# Encontra o caminho do Android SDK
find_android_sdk() {
    if [ -n "$ANDROID_HOME" ]; then
        echo "$ANDROID_HOME"
    elif [ -n "$ANDROID_SDK_ROOT" ]; then
        echo "$ANDROID_SDK_ROOT"
    elif [ -d "$HOME/Library/Android/sdk" ]; then
        echo "$HOME/Library/Android/sdk"
    else
        echo ""
    fi
}

# Encontra o caminho do ADB
find_adb() {
    local sdk_path=$(find_android_sdk)
    
    if [ -n "$sdk_path" ] && [ -f "$sdk_path/platform-tools/adb" ]; then
        echo "$sdk_path/platform-tools/adb"
    elif command -v adb &> /dev/null; then
        which adb
    else
        echo ""
    fi
}

# Encontra o caminho do emulator
find_emulator() {
    local sdk_path=$(find_android_sdk)
    
    if [ -n "$sdk_path" ] && [ -f "$sdk_path/emulator/emulator" ]; then
        echo "$sdk_path/emulator/emulator"
    elif command -v emulator &> /dev/null; then
        which emulator
    else
        echo ""
    fi
}

ADB_CMD=$(find_adb)
EMULATOR_CMD=$(find_emulator)

# Verifica se o ADB foi encontrado
if [ -z "$ADB_CMD" ] || [ ! -f "$ADB_CMD" ]; then
    echo "❌ ADB não encontrado!"
    echo ""
    echo "💡 O Android SDK parece estar instalado, mas o ADB não foi encontrado."
    echo "   Tentando configurar automaticamente..."
    
    # Tenta adicionar ao PATH para esta sessão
    SDK_PATH=$(find_android_sdk)
    if [ -n "$SDK_PATH" ]; then
        export ANDROID_HOME="$SDK_PATH"
        export PATH="$PATH:$SDK_PATH/platform-tools:$SDK_PATH/emulator"
        ADB_CMD=$(find_adb)
        EMULATOR_CMD=$(find_emulator)
        
        if [ -n "$ADB_CMD" ] && [ -f "$ADB_CMD" ]; then
            echo "✅ ADB encontrado em: $ADB_CMD"
        else
            echo "❌ Ainda não foi possível encontrar o ADB"
            echo ""
            echo "💡 Configure manualmente adicionando ao seu ~/.zshrc:"
            echo "   export ANDROID_HOME=\$HOME/Library/Android/sdk"
            echo "   export PATH=\$PATH:\$ANDROID_HOME/platform-tools:\$ANDROID_HOME/emulator"
            echo ""
            echo "   Depois execute: source ~/.zshrc"
            exit 1
        fi
    else
        echo "❌ Android SDK não encontrado!"
        echo "💡 Instale o Android Studio e configure o SDK"
        exit 1
    fi
fi

# Exporta as variáveis para uso no script
export ANDROID_HOME=$(find_android_sdk)
export PATH="$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator"

# Função para verificar se há emuladores rodando E prontos
check_emulator_ready() {
    # Verifica se há emuladores na lista
    if ! "$ADB_CMD" devices 2>/dev/null | grep -q "emulator"; then
        return 1
    fi
    
    # Verifica se pelo menos um emulador está pronto (boot_completed)
    local devices=$("$ADB_CMD" devices 2>/dev/null | grep "emulator" | awk '{print $1}')
    
    for device in $devices; do
        if "$ADB_CMD" -s "$device" shell getprop sys.boot_completed 2>/dev/null | grep -q "1"; then
            return 0
        fi
    done
    
    return 1
}

# Função para listar emuladores disponíveis
list_emulators() {
    "$EMULATOR_CMD" -list-avds 2>/dev/null
}

# Função para iniciar um emulador
start_emulator() {
    local avd_name=$1
    
    if [ -z "$avd_name" ]; then
        # Pega o primeiro emulador disponível
        avd_name=$(list_emulators | head -n 1)
    fi
    
    if [ -z "$avd_name" ]; then
        echo "❌ Nenhum emulador encontrado!"
        echo ""
        echo "💡 Para criar um emulador:"
        echo "   1. Abra o Android Studio"
        echo "   2. Vá em Tools > Device Manager"
        echo "   3. Clique em Create Device"
        echo "   4. Escolha um dispositivo e finalize a criação"
        exit 1
    fi
    
    echo "🚀 Iniciando emulador: $avd_name"
    "$EMULATOR_CMD" -avd "$avd_name" > /dev/null 2>&1 &
    local emulator_pid=$!
    
    # Aguarda o emulador ficar pronto
    echo "⏳ Aguardando emulador ficar pronto (isso pode levar alguns minutos na primeira vez)..."
    local max_attempts=90
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if "$ADB_CMD" -e shell getprop sys.boot_completed 2>/dev/null | grep -q "1"; then
            echo ""
            echo "✅ Emulador pronto!"
            sleep 2  # Aguarda mais um pouco para garantir
            return 0
        fi
        sleep 2
        attempt=$((attempt + 1))
        if [ $((attempt % 5)) -eq 0 ]; then
            echo -n "."
        fi
    done
    
    echo ""
    echo "⚠️  Emulador demorou muito para iniciar, mas continuando..."
    echo "💡 Se o emulador não abrir, verifique se está instalado corretamente"
}

# Verifica se há emuladores prontos
if [ "$FORCE_NEW_EMULATOR" = true ]; then
    echo "🆕 Forçando abertura de novo emulador..."
    start_emulator "$1"
elif check_emulator_ready; then
    echo "✅ Emulador já está rodando e pronto"
else
    # Verifica se há emuladores na lista mas não prontos
    if "$ADB_CMD" devices 2>/dev/null | grep -q "emulator"; then
        echo "⏳ Emulador detectado mas ainda não está pronto. Aguardando (máx 10s)..."
        local max_wait=10
        local waited=0
        
        while [ $waited -lt $max_wait ]; do
            if check_emulator_ready; then
                echo "✅ Emulador ficou pronto!"
                break
            fi
            sleep 1
            waited=$((waited + 1))
            echo -n "."
        done
        echo ""
        
        if ! check_emulator_ready; then
            echo "⚠️  Emulador não ficou pronto a tempo. Abrindo um novo..."
            start_emulator "$1"
        fi
    else
        echo "📱 Nenhum emulador rodando. Iniciando..."
        start_emulator "$1"
    fi
fi

# Aguarda um pouco para garantir que o ADB está conectado
sleep 1

# Verifica se há um dispositivo conectado e pronto
echo ""
echo "📱 Verificando dispositivos conectados..."
DEVICES=$("$ADB_CMD" devices 2>/dev/null | grep -E "device|emulator" | wc -l | tr -d ' ')
if [ "$DEVICES" -eq "0" ]; then
    echo "❌ Nenhum dispositivo conectado!"
    echo "💡 Certifique-se de que o emulador está rodando"
    exit 1
fi

echo "✅ $DEVICES dispositivo(s) conectado(s)"
"$ADB_CMD" devices

# Roda o app (Development Build)
echo ""
echo "🚀 Compilando e instalando o app nativo..."
echo "📱 O app será instalado como um app independente (não Expo Go)"
echo "⏳ Primeira vez pode levar vários minutos (Gradle baixando dependências)..."
echo "💡 Se parecer travado, aguarde - o Gradle está trabalhando"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Roda o expo run:android que compila o código nativo
npx expo run:android

# Verifica se houve erro
if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Erro ao compilar/instalar o app"
    echo ""
    echo "💡 Dicas para resolver:"
    echo "   1. Verifique se o emulador está rodando: adb devices"
    echo "   2. Tente limpar o build: cd android && ./gradlew clean && cd .."
    echo "   3. Regenerar projeto: pnpm run prebuild:clean"
    exit 1
fi
