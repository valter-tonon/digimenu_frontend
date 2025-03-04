#!/bin/bash

# Cores para saída
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Função para verificar se um comando existe
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Verificar se o Netlify CLI está instalado
if ! command_exists netlify; then
  echo -e "${YELLOW}Netlify CLI não encontrado. Instalando...${NC}"
  npm install -g netlify-cli
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}Falha ao instalar Netlify CLI. Por favor, instale manualmente com 'npm install -g netlify-cli'${NC}"
    exit 1
  fi
  
  echo -e "${GREEN}Netlify CLI instalado com sucesso!${NC}"
fi

# Verificar se o usuário está logado no Netlify
netlify status 2>&1 | grep -q "Logged in"
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}Você não está logado no Netlify. Iniciando login...${NC}"
  netlify login
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}Falha ao fazer login no Netlify. Por favor, tente novamente.${NC}"
    exit 1
  fi
fi

# Verificar se o site já está configurado
netlify status 2>&1 | grep -q "No site configured"
SITE_CONFIGURED=$?

# Se não houver site configurado e o argumento --init for fornecido
if [ $SITE_CONFIGURED -ne 0 ] && [ "$1" == "--init" ]; then
  echo -e "${YELLOW}Inicializando novo site no Netlify...${NC}"
  netlify init
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}Falha ao inicializar o site no Netlify. Por favor, tente novamente.${NC}"
    exit 1
  fi
fi

# Construir o projeto
echo -e "${YELLOW}Construindo o projeto...${NC}"
npm run build

if [ $? -ne 0 ]; then
  echo -e "${RED}Falha ao construir o projeto. Verifique os erros acima.${NC}"
  exit 1
fi

# Determinar o tipo de deploy
if [ "$1" == "--prod" ] || [ "$2" == "--prod" ]; then
  echo -e "${YELLOW}Iniciando deploy para produção...${NC}"
  netlify deploy --prod
else
  echo -e "${YELLOW}Iniciando deploy para preview...${NC}"
  netlify deploy
fi

if [ $? -ne 0 ]; then
  echo -e "${RED}Falha ao fazer deploy. Verifique os erros acima.${NC}"
  exit 1
fi

echo -e "${GREEN}Deploy concluído com sucesso!${NC}"
echo -e "${YELLOW}Nota: Se você encontrar problemas, consulte o arquivo TROUBLESHOOTING.md para soluções comuns.${NC}" 