#!/bin/bash
# start.local.sh

echo "🚀 Iniciando ambiente LOCAL de Verdulería..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar que Docker esté instalado
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker no está instalado${NC}"
    exit 1
fi

# Verificar que Docker Compose esté instalado
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose no está instalado${NC}"
    exit 1
fi

# Detener y remover contenedores existentes (solo los locales)
echo -e "${YELLOW}🔄 Deteniendo contenedores locales existentes...${NC}"
docker-compose -f docker-compose.local.yml down

# Construir imágenes
echo -e "${YELLOW}🔨 Construyendo imágenes para LOCAL...${NC}"
docker-compose -f docker-compose.local.yml build --no-cache

# Levantar servicios
echo -e "${YELLOW}🚀 Levantando servicios en LOCAL...${NC}"
docker-compose -f docker-compose.local.yml up -d

# Esperar a que los servicios estén listos
echo -e "${YELLOW}⏳ Esperando a que los servicios estén listos...${NC}"
sleep 10

# Verificar el estado de los contenedores
echo -e "${GREEN}✅ Estado de los contenedores:${NC}"
docker-compose -f docker-compose.local.yml ps

# Mostrar logs del backend para verificar que todo esté bien
echo -e "${YELLOW}📋 Últimos logs del backend:${NC}"
docker-compose -f docker-compose.local.yml logs --tail=20 backend

echo -e "${GREEN}✨ Ambiente LOCAL iniciado correctamente!${NC}"
echo -e "${GREEN}📍 URLs:${NC}"
echo -e "   Frontend: ${GREEN}http://localhost:3000${NC}"
echo -e "   Backend:  ${GREEN}http://localhost:3001${NC}"
echo -e "   Base de datos: ${GREEN}localhost:5432${NC}"
echo ""
echo -e "${YELLOW}📝 Comandos útiles:${NC}"
echo "   Ver logs:        docker-compose -f docker-compose.local.yml logs -f"
echo "   Detener todo:    docker-compose -f docker-compose.local.yml down"
echo "   Reiniciar:       docker-compose -f docker-compose.local.yml restart"
echo "   Ver estado:      docker-compose -f docker-compose.local.yml ps"

# Mantener el script corriendo y mostrar logs
echo -e "${YELLOW}📋 Mostrando logs en tiempo real (Ctrl+C para salir)...${NC}"
docker-compose -f docker-compose.local.yml logs -f