import { Router } from 'express';
import { PedidoController } from '../controllers/pedido.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { EstadoPedido } from '../types';

const router = Router();
const pedidoController = new PedidoController();

// Middleware de validación
const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

// Validaciones
const estadoValidation = [
  body('estado')
    .isIn(Object.values(EstadoPedido))
    .withMessage('Estado inválido')
];

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// Rutas
router.get('/', 
  query('page').optional().isInt({ min: 1 }).withMessage('Página inválida'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Límite inválido'),
  query('estado').optional().isIn(Object.values(EstadoPedido)).withMessage('Estado inválido'),
  handleValidationErrors,
  pedidoController.getAll
);

router.get('/pendientes', pedidoController.getPendientes);

router.get('/:id', 
  param('id').isInt().withMessage('ID inválido'),
  handleValidationErrors,
  pedidoController.getOne
);

router.get('/cliente/:clienteId',
  param('clienteId').isInt().withMessage('ID de cliente inválido'),
  handleValidationErrors,
  pedidoController.getByCliente
);

router.put('/:id',
  param('id').isInt().withMessage('ID inválido'),
  handleValidationErrors,
  pedidoController.update
);

router.put('/:id/estado',
  param('id').isInt().withMessage('ID inválido'),
  estadoValidation,
  handleValidationErrors,
  pedidoController.updateEstado
);

router.delete('/:id',
  param('id').isInt().withMessage('ID inválido'),
  handleValidationErrors,
  pedidoController.delete
);

export default router;