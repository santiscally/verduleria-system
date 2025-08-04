// backend/src/routes/remito.routes.ts
import { Router } from 'express';
import { RemitoController } from '../controllers/remito.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const remitoController = new RemitoController();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Obtener precios sugeridos para un pedido
router.get('/pedido/:pedidoId/precios-sugeridos', (req, res) => 
  remitoController.obtenerPreciosSugeridos(req, res)
);

// Crear remito
router.post('/', (req, res) => 
  remitoController.crearRemito(req, res)
);

// Obtener todos los remitos con filtros opcionales
router.get('/', (req, res) => 
  remitoController.obtenerRemitos(req, res)
);

// Obtener remito por ID
router.get('/:id', (req, res) => 
  remitoController.obtenerRemitoPorId(req, res)
);

// Confirmar entrega de remito
router.patch('/:id/confirmar-entrega', (req, res) => 
  remitoController.confirmarEntrega(req, res)
);

// Anular remito
router.delete('/:id/anular', (req, res) => 
  remitoController.anularRemito(req, res)
);

// Generar PDF de remito
router.get('/:id/pdf', (req, res) => 
  remitoController.generarPDF(req, res)
);

export default router;