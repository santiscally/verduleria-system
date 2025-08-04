// backend/src/routes/pedido-import.routes.ts

import { Router } from 'express';
import { PedidoImportController, uploadMiddleware } from '../controllers/pedido-import.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const importController = new PedidoImportController();

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// Rutas
router.post('/validate', uploadMiddleware, importController.validateCSV);
router.post('/create-entities', importController.createEntities);
router.post('/import', importController.import);

export default router;