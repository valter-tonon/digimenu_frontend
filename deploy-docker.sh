#!/bin/bash

# Script de implantação para o frontend usando Docker
echo "Iniciando processo de implantação do frontend com Docker..."

# Verificar se o Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "Docker não encontrado. Por favor, instale o Docker antes de continuar."
    exit 1
fi

# Construir a imagem Docker
echo "Construindo a imagem Docker..."
docker build -t restaurante-delivery-frontend:latest -f Dockerfile --target production .

# Verificar se a construção foi bem-sucedida
if [ $? -ne 0 ]; then
    echo "Erro durante a construção da imagem Docker. Verifique os erros acima."
    exit 1
fi

echo "Imagem Docker construída com sucesso!"

# Iniciar o contêiner (opcional)
if [ "$1" == "--start" ]; then
    echo "Iniciando o contêiner..."
    
    # Verificar se já existe um contêiner com o mesmo nome
    if docker ps -a | grep -q "restaurante-delivery-frontend"; then
        echo "Removendo contêiner existente..."
        docker rm -f restaurante-delivery-frontend
    fi
    
    # Iniciar o novo contêiner
    docker run -d -p 3000:3000 --name restaurante-delivery-frontend restaurante-delivery-frontend:latest
    
    echo "Contêiner iniciado com sucesso!"
    echo "O frontend está disponível em: http://localhost:3000"
fi

echo "Processo de implantação com Docker concluído com sucesso!"
echo "Para iniciar o contêiner, execute: docker run -d -p 3000:3000 --name restaurante-delivery-frontend restaurante-delivery-frontend:latest"
echo "Ou use: ./deploy-docker.sh --start"

exit 0 