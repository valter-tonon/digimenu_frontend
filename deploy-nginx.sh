#!/bin/bash

# Script de implantação para o frontend usando Docker com Nginx
echo "Iniciando processo de implantação do frontend com Docker e Nginx..."

# Verificar se o Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "Docker não encontrado. Por favor, instale o Docker antes de continuar."
    exit 1
fi

# Tornar o script de inicialização executável
chmod +x docker-entrypoint.sh

# Construir a imagem Docker
echo "Construindo a imagem Docker com Nginx..."
docker build -t restaurante-delivery-frontend-nginx:latest -f Dockerfile.nginx .

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
    if docker ps -a | grep -q "restaurante-delivery-frontend-nginx"; then
        echo "Removendo contêiner existente..."
        docker rm -f restaurante-delivery-frontend-nginx
    fi
    
    # Iniciar o novo contêiner
    docker run -d -p 80:80 --name restaurante-delivery-frontend-nginx restaurante-delivery-frontend-nginx:latest
    
    echo "Contêiner iniciado com sucesso!"
    echo "O frontend está disponível em: http://localhost"
fi

echo "Processo de implantação com Docker e Nginx concluído com sucesso!"
echo "Para iniciar o contêiner, execute: docker run -d -p 80:80 --name restaurante-delivery-frontend-nginx restaurante-delivery-frontend-nginx:latest"
echo "Ou use: ./deploy-nginx.sh --start"

exit 0 