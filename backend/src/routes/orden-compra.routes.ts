import { Router } from 'express';
import { OrdenCompraController } from '../controllers/orden-compra.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { body, param, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

const router = Router();
const ordenCompraController = new OrdenCompraController();

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
const createValidation = [
  body('detalles').isArray().withMessage('Detalles debe ser un array'),
  body('detalles.*.producto_unidad_id').isInt().withMessage('ID de producto-unidad inválido'),
  body('detalles.*.cantidad_sugerida').isFloat({ gt: 0 }).withMessage('Cantidad debe ser mayor a 0')
];

const updateDetalleValidation = [
  param('id').isInt().withMessage('ID de orden inválido'),
  param('detalleId').isInt().withMessage('ID de detalle inválido'),
  body('cantidad_sugerida').isFloat({ min: 0 }).withMessage('Cantidad debe ser mayor o igual a 0')
];

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// Rutas
router.get('/', ordenCompraController.getAll);
router.get('/sugerencia', ordenCompraController.generarSugerencia);
router.get('/:id', 
  param('id').isInt().withMessage('ID inválido'),
  handleValidationErrors,
  ordenCompraController.getOne
);
router.post('/',
  createValidation,
  handleValidationErrors,
  ordenCompraController.create
);
router.put('/:id',
  param('id').isInt().withMessage('ID inválido'),
  handleValidationErrors,
  ordenCompraController.update
);
router.put('/:id/detalles/:detalleId',
  updateDetalleValidation,
  handleValidationErrors,
  ordenCompraController.updateDetalle
);
router.delete('/:id/detalles/:detalleId',
  param('id').isInt().withMessage('ID inválido'),
  param('detalleId').isInt().withMessage('ID de detalle inválido'),
  handleValidationErrors,
  ordenCompraController.deleteDetalle
);
router.post('/:id/confirmar',
  param('id').isInt().withMessage('ID inválido'),
  handleValidationErrors,
  ordenCompraController.confirmar
);
router.post('/:id/cancelar',
  param('id').isInt().withMessage('ID inválido'),
  handleValidationErrors,
  ordenCompraController.cancelar
);

export default router;