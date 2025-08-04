# Backend - Sistema Verdulería

## 📋 Requisitos Previos

- Node.js v18 o superior
- PostgreSQL 14 o superior
- npm o yarn

## 🚀 Instalación

1. **Instalar dependencias desde la raíz del proyecto:**
```bash
# Desde la carpeta raíz (verduleria-system)
npm install
```

2. **Configurar variables de entorno:**
```bash
# En la carpeta backend
cp .env.example .env
# Editar .env con tus credenciales de PostgreSQL
```

3. **Crear la base de datos:**
```sql
CREATE DATABASE verduleria_db;
```

4. **Generar y ejecutar migraciones:**
```bash
# Desde la carpeta raíz
npm run build:shared  # Compilar tipos compartidos primero

# Desde la carpeta backend
npm run migration:generate src/migrations/InitialSchema
npm run migration:run
```

## 🏃‍♂️ Ejecución

### Desarrollo:
```bash
# Desde la carpeta raíz
npm run dev:backend

# O desde la carpeta backend
npm run dev
```

### Producción:
```bash
# Desde la carpeta backend
npm run build
npm start
```

## 🔑 Autenticación

El sistema crea automáticamente un usuario administrador con las siguientes credenciales por defecto:
- Usuario: `admin`
- Contraseña: `admin123`

⚠️ **IMPORTANTE**: Cambiar estas credenciales en producción editando las variables de entorno `ADMIN_USERNAME` y `ADMIN_PASSWORD`.

## 📁 Estructura de Carpetas

```
backend/
├── src/
│   ├── config/         # Configuración (DB, etc)
│   ├── controllers/    # Controladores
│   ├── entities/       # Entidades TypeORM
│   ├── middlewares/    # Middlewares
│   ├── routes/         # Rutas
│   ├── services/       # Lógica de negocio
│   ├── utils/          # Utilidades
│   ├── app.ts          # Configuración Express
│   └── index.ts        # Punto de entrada
├── migrations/         # Migraciones de DB
└── dist/              # Código compilado
```

## 🛠️ Comandos Útiles

- `npm run dev`: Ejecutar en modo desarrollo
- `npm run build`: Compilar TypeScript
- `npm run migration:generate <nombre>`: Generar nueva migración
- `npm run migration:run`: Ejecutar migraciones pendientes
- `npm run migration:revert`: Revertir última migración

## 🔗 API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener usuario actual (requiere token)
- `POST /api/auth/change-password` - Cambiar contraseña (requiere token)

### Health Check
- `GET /health` - Verificar estado del servidor