#!/bin/sh

# Iniciar o servidor Next.js em segundo plano
cd /app && npm start &

# Iniciar o Nginx em primeiro plano
nginx -g "daemon off;" 