#!/bin/bash

# Instalar todas as dependências, incluindo as de desenvolvimento
npm install --production=false

# Verificar se o tailwindcss está instalado
if ! npm list tailwindcss > /dev/null 2>&1; then
  echo "Tailwindcss não está instalado. Instalando..."
  npm install tailwindcss postcss
fi

# Executar o build
DISABLE_ESLINT_DURING_BUILD=true next build 