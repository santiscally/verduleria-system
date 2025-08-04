#!/bin/bash
echo "🚀 Iniciando entorno PRODUCCIÓN..."

# Detener contenedores existentes
docker-compose -f docker-compose.prod.yml down

# Construir y levantar
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

echo "✅ Aplicación en producción disponible en:"
echo "   http://149.50.147.54"
echo ""
echo "Ver logs con: docker-compose -f docker-compose.prod.yml logs -f"