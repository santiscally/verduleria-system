import 'reflect-metadata';
import { AppDataSource } from './config/database';
import app from './app';
import { AuthService } from './services/auth.service';

const PORT = parseInt(process.env.PORT || '3001');

async function startServer() {
  try {
    // Inicializar conexión a la base de datos
    await AppDataSource.initialize();
    console.log('✅ Base de datos conectada');

    // Ejecutar migraciones pendientes
    await AppDataSource.runMigrations();
    console.log('✅ Migraciones ejecutadas');

    // Crear usuario admin por defecto si no existe
    const authService = new AuthService();
    await authService.createDefaultUser();

    // Iniciar servidor
    app.listen(PORT, '0.0.0.0', () => {
      const host = process.env.NODE_ENV === 'development' ? 'localhost' : '0.0.0.0';
      console.log(`🚀 Servidor corriendo en http://${host}:${PORT}`);
      console.log(`📝 Documentación: http://${host}:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

startServer();