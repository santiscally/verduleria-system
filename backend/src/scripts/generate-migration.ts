// Este archivo es para generar migraciones
// Ejecutar con: npm run migration:generate src/migrations/InitialSchema

import { AppDataSource } from '../config/database';

// Importar todas las entidades para que TypeORM las reconozca
import '../entities';