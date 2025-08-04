# README.md (en la raíz del proyecto)

# Sistema de Gestión - Verdulería Mayorista

Sistema integral para la gestión de pedidos, compras, stock y facturación de una verdulería mayorista.

## 🚀 Instalación Rápida con Docker

### Requisitos
- Docker
- Docker Compose

### Pasos

1. **Clonar el repositorio:**
```bash
git clone <tu-repositorio>
cd verduleria-system
```

2. **Configurar variables de entorno:**
```bash
# Backend
cd backend
cp .env.example .env
cd ..

# Frontend
cd frontend
cp .env.example .env
cd ..
```

3. **Iniciar con Docker Compose:**
```bash
docker-compose up -d
```

El sistema estará disponible en:
- Frontend: http://localhost
- Backend API: http://localhost:3001
- PgAdmin: http://localhost:5050

## 🚀 Instalación Manual

### Requisitos
- Node.js v18+
- PostgreSQL 14+

### Backend

1. **Instalar dependencias:**
```bash
cd backend
npm install
```

2. **Configurar base de datos:**
```sql
CREATE DATABASE verduleria_db;
```

3. **Configurar variables de entorno:**
```bash
cp .env.example .env
# Editar .env con tus credenciales
```

4. **Ejecutar migraciones:**
```bash
npm run migration:run
```

5. **Iniciar servidor:**
```bash
npm run dev
```

### Frontend

1. **Instalar dependencias:**
```bash
cd frontend
npm install
```

2. **Configurar variables de entorno:**
```bash
cp .env.example .env
```

3. **Iniciar aplicación:**
```bash
npm run dev
```

## 🔐 Credenciales por Defecto

- Usuario: `admin`
- Contraseña: `admin123`

⚠️ **IMPORTANTE**: Cambiar en producción

## 📁 Estructura del Proyecto

```
verduleria-system/
├── backend/              # API REST con Node.js + Express + TypeORM
│   ├── src/
│   │   ├── config/      # Configuración
│   │   ├── controllers/ # Controladores
│   │   ├── entities/    # Entidades TypeORM
│   │   ├── middlewares/ # Middlewares
│   │   ├── routes/      # Rutas
│   │   ├── services/    # Lógica de negocio
│   │   └── types/       # Tipos TypeScript
│   └── Dockerfile
├── frontend/            # Aplicación web con Next.js
│   ├── src/
│   │   ├── app/        # Páginas y layouts
│   │   ├── components/ # Componentes React
│   │   ├── contexts/   # Context API
│   │   ├── services/   # Servicios API
│   │   └── types/      # Tipos TypeScript
│   └── Dockerfile
└── docker-compose.yml
```

## ✅ Funcionalidades Implementadas (Fase 2)

### Gestión de Maestros
- **Clientes**: CRUD completo con búsqueda
- **Productos**: CRUD completo con búsqueda
- **Unidades de Medida**: CRUD completo
- **Productos-Unidades**: Relaciones con stock y márgenes
- **Conversiones**: Sistema bidireccional automático

### Características Técnicas
- Autenticación JWT
- API RESTful
- Validación de datos
- Paginación
- Búsqueda en tiempo real
- Interfaz responsive
- Gestión de stock

## 🛠️ Stack Tecnológico

### Backend
- Node.js + Express
- TypeScript
- TypeORM
- PostgreSQL
- JWT Authentication

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Axios

### DevOps
- Docker
- Docker Compose
- PostgreSQL
- PgAdmin

## 📋 Próximas Fases

### Fase 3: Importación y Pedidos
- Importación de pedidos CSV
- Gestión completa de pedidos
- Estados de pedidos

### Fase 4: Compras
- Generación automática de órdenes
- Registro de compras
- Actualización de stock

### Fase 5: Remitos y Facturación
- Generación de remitos
- Precios personalizados por cliente
- Histórico de precios

### Fase 6: Reportes
- Dashboard avanzado
- Reportes de ventas
- Análisis de rentabilidad

## 🤝 Contribuir

1. Fork el proyecto
2. Crear una rama (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📝 Licencia

Este proyecto está bajo licencia privada.

## 👥 Equipo

- Desarrollo: [Tu nombre]
- Cliente: Verdulería Mayorista

## 📞 Soporte

Para soporte, enviar email a: soporte@verduleria.com