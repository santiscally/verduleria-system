#!/bin/bash
echo "🚀 Iniciando entorno LOCAL..."

# Iniciar solo PostgreSQL con Docker
docker-compose -f docker-compose.local.yml up -d

# Esperar a que PostgreSQL esté listo
echo "⏳ Esperando a PostgreSQL..."
sleep 5

# Iniciar backend
echo "🔧 Iniciando Backend..."
cd backend
npm install
npm run dev &
cd ..

# Iniciar frontend
echo "🎨 Iniciando Frontend..."
cd frontend
npm install
npm run dev &
cd ..

echo "✅ Aplicación disponible en:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:3001/api"
echo ""
echo "Para detener, presiona Ctrl+C"

# Mantener script corriendo
wait