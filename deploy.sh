#!/bin/bash

# Script de despliegue para verdulería
# Uso: ./deploy.sh [local|prod] [server_name]

ENV=${1:-local}
SERVER_NAME=${2:-localhost}

echo "Desplegando en modo: $ENV"
echo "Server name: $SERVER_NAME"

# Actualizar server_name en nginx.conf si se proporciona
if [ "$SERVER_NAME" != "localhost" ]; then
    sed -i "s/server_name localhost;/server_name $SERVER_NAME localhost;/" frontend/nginx.conf
    echo "Configurado server_name: $SERVER_NAME"
fi

# Ejecutar docker-compose correspondiente
if [ "$ENV" = "prod" ]; then
    echo "Iniciando en modo producción..."
    docker-compose -f docker-compose.prod.yml down
    docker-compose -f docker-compose.prod.yml build --no-cache
    docker-compose -f docker-compose.prod.yml up -d
else
    echo "Iniciando en modo desarrollo..."
    ENV=$ENV docker-compose down
    ENV=$ENV docker-compose build
    ENV=$ENV docker-compose up -d
fi

echo "Despliegue completado!"
echo "La aplicación estará disponible en:"
if [ "$ENV" = "prod" ]; then
    echo "  http://$SERVER_NAME:3000"
else
    echo "  http://localhost:3000 (nginx proxy)"
fi