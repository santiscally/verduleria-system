// backend/src/routes/remito.routes.ts

import { Router } from 'express';
import { RemitoController } from '../controllers/remito.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const remitoController = new RemitoController();

router.use(authMiddleware);

router.get('/pedido/:pedidoId/precios-sugeridos', (req, res) => remitoController.obtenerPreciosSugeridos(req, res));

// NUEVO: Recalcular precio cuando cambia la unidad
router.get('/recalcular-precio/:productoId/:unidadId', (req, res) => remitoController.recalcularPrecioPorUnidad(req, res));

router.post('/', (req, res) => remitoController.crearRemito(req, res));
router.get('/', (req, res) => remitoController.obtenerRemitos(req, res));
router.get('/:id', (req, res) => remitoController.obtenerRemitoPorId(req, res));
router.patch('/:id/confirmar-entrega', (req, res) => remitoController.confirmarEntrega(req, res));
router.delete('/:id/anular', (req, res) => remitoController.anularRemito(req, res));
router.get('/:id/pdf', (req, res) => remitoController.generarPDF(req, res));

export default router;