#!/bin/bash
# start-homo.sh - Script para levantar ambiente de HOMOLOGACIÓN en VPS

echo "🚀 Iniciando ambiente HOMO de Verdulería..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración del servidor
VPS_HOST="vps-4920631-x.dattaweb.com"
VPS_IP="149.50.142.57"
HOMO_PORT="3000"

echo -e "${BLUE}📍 Servidor: ${VPS_HOST} (${VPS_IP})${NC}"
echo -e "${BLUE}📍 Puerto: ${HOMO_PORT}${NC}"

# Verificar que Docker esté instalado
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker no está instalado${NC}"
    exit 1
fi

# Verificar que Docker Compose esté instalado
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose no está instalado${NC}"
    exit 1
fi

# Determinar comando de docker-compose
if docker compose version &> /dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# Detener y remover contenedores existentes de HOMO
echo -e "${YELLOW}🔄 Deteniendo contenedores HOMO existentes...${NC}"
$DOCKER_COMPOSE -f docker-compose.homo.yml down

# Construir imágenes
echo -e "${YELLOW}🔨 Construyendo imágenes para HOMO...${NC}"
$DOCKER_COMPOSE -f docker-compose.homo.yml build --no-cache

# Levantar servicios
echo -e "${YELLOW}🚀 Levantando servicios en HOMO...${NC}"
$DOCKER_COMPOSE -f docker-compose.homo.yml up -d

# Esperar a que los servicios estén listos
echo -e "${YELLOW}⏳ Esperando a que los servicios estén listos...${NC}"
sleep 15

# Verificar el estado de los contenedores
echo -e "${GREEN}✅ Estado de los contenedores:${NC}"
$DOCKER_COMPOSE -f docker-compose.homo.yml ps

# Mostrar logs del backend para verificar que todo esté bien
echo -e "${YELLOW}📋 Últimos logs del backend:${NC}"
$DOCKER_COMPOSE -f docker-compose.homo.yml logs --tail=30 backend

echo ""
echo -e "${GREEN}✨ =========================================${NC}"
echo -e "${GREEN}✨ Ambiente HOMO iniciado correctamente!${NC}"
echo -e "${GREEN}✨ =========================================${NC}"
echo ""
echo -e "${GREEN}📍 URLs:${NC}"
echo -e "   Aplicación:    ${GREEN}http://${VPS_HOST}:${HOMO_PORT}${NC}"
echo -e "   Aplicación IP: ${GREEN}http://${VPS_IP}:${HOMO_PORT}${NC}"
echo ""
echo -e "${YELLOW}📝 Comandos útiles:${NC}"
echo "   Ver logs:        $DOCKER_COMPOSE -f docker-compose.homo.yml logs -f"
echo "   Detener todo:    $DOCKER_COMPOSE -f docker-compose.homo.yml down"
echo "   Reiniciar:       $DOCKER_COMPOSE -f docker-compose.homo.yml restart"
echo "   Ver estado:      $DOCKER_COMPOSE -f docker-compose.homo.yml ps"
echo "   Logs backend:    $DOCKER_COMPOSE -f docker-compose.homo.yml logs -f backend"
echo "   Logs frontend:   $DOCKER_COMPOSE -f docker-compose.homo.yml logs -f frontend"
echo ""

# Preguntar si quiere ver logs en tiempo real
read -p "¿Mostrar logs en tiempo real? (s/n): " show_logs
if [[ "$show_logs" =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}📋 Mostrando logs en tiempo real (Ctrl+C para salir)...${NC}"
    $DOCKER_COMPOSE -f docker-compose.homo.yml logs -f
fi