// backend/src/routes/orden-compra.routes.ts
import { Router } from 'express';
import { OrdenCompraController } from '../controllers/orden-compra.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const ordenCompraController = new OrdenCompraController();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Obtener sugerencia de compra
router.get('/sugerencia', (req, res) => ordenCompraController.generarSugerencia(req, res));

// Obtener todas las órdenes de compra
router.get('/', (req, res) => ordenCompraController.getAll(req, res));

// Obtener una orden de compra por ID
router.get('/:id', (req, res) => ordenCompraController.getOne(req, res));

// Generar PDF de orden de compra
router.get('/:id/pdf', (req, res) => ordenCompraController.generarPDF(req, res));

// Crear nueva orden de compra
router.post('/', (req, res) => ordenCompraController.create(req, res));

// Actualizar detalle de orden de compra
router.put('/:id/detalles/:detalleId', (req, res) => ordenCompraController.updateDetalle(req, res));

// Eliminar detalle de orden de compra
router.delete('/:id/detalles/:detalleId', (req, res) => ordenCompraController.deleteDetalle(req, res));

// Confirmar orden de compra
router.post('/:id/confirmar', (req, res) => ordenCompraController.confirmar(req, res));

// Cancelar orden de compra
router.post('/:id/cancelar', (req, res) => ordenCompraController.cancelar(req, res));

export default router;