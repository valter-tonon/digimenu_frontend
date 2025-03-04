#!/bin/bash

# Script de implantação para o frontend
echo "Iniciando processo de implantação do frontend..."

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "Node.js não encontrado. Por favor, instale o Node.js antes de continuar."
    exit 1
fi

# Verificar se o npm está instalado
if ! command -v npm &> /dev/null; then
    echo "npm não encontrado. Por favor, instale o npm antes de continuar."
    exit 1
fi

# Instalar dependências
echo "Instalando dependências..."
npm install

# Compilar o aplicativo
echo "Compilando o aplicativo..."
npm run build

# Verificar se a compilação foi bem-sucedida
if [ $? -ne 0 ]; then
    echo "Erro durante a compilação. Verifique os erros acima."
    exit 1
fi

echo "Compilação concluída com sucesso!"

# Iniciar o servidor (opcional)
if [ "$1" == "--start" ]; then
    echo "Iniciando o servidor de produção..."
    npm run start
fi

echo "Processo de implantação concluído com sucesso!"
echo "Para iniciar o servidor, execute: npm run start"
echo "Ou use: ./deploy.sh --start"

exit 0 