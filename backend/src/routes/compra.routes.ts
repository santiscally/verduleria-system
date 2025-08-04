import { Router } from 'express';
import { CompraController } from '../controllers/compra.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { body, param, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

const router = Router();
const compraController = new CompraController();

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
const detalleValidation = [
  body('producto_unidad_id').isInt().withMessage('ID de producto-unidad inválido'),
  body('cantidad').isFloat({ min: 0.001 }).withMessage('Cantidad debe ser mayor a 0'),
  body('precio_unitario').isFloat({ min: 0.01 }).withMessage('Precio debe ser mayor a 0')
];

const compraFromOrdenValidation = [
  body('orden_compra_id').isInt().withMessage('ID de orden inválido'),
  body('detalles').isArray({ min: 1 }).withMessage('Debe incluir al menos un detalle'),
  body('detalles.*').custom((value) => {
    if (!value.producto_unidad_id || !value.cantidad || !value.precio_unitario) {
      throw new Error('Cada detalle debe tener producto_unidad_id, cantidad y precio_unitario');
    }
    return true;
  })
];

const compraManualValidation = [
  body('detalles').isArray({ min: 1 }).withMessage('Debe incluir al menos un detalle'),
  body('detalles.*').custom((value) => {
    if (!value.producto_unidad_id || !value.cantidad || !value.precio_unitario) {
      throw new Error('Cada detalle debe tener producto_unidad_id, cantidad y precio_unitario');
    }
    return true;
  })
];

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// Rutas
router.get('/', compraController.getAll);
router.get('/:id', 
  param('id').isInt().withMessage('ID inválido'),
  handleValidationErrors,
  compraController.getOne
);
router.post('/from-orden',
  compraFromOrdenValidation,
  handleValidationErrors,
  compraController.createFromOrden
);
router.post('/manual',
  compraManualValidation,
  handleValidationErrors,
  compraController.createManual
);
router.put('/:id',
  param('id').isInt().withMessage('ID inválido'),
  handleValidationErrors,
  compraController.update
);
router.put('/:id/detalles/:detalleId',
  param('id').isInt().withMessage('ID inválido'),
  param('detalleId').isInt().withMessage('ID de detalle inválido'),
  handleValidationErrors,
  compraController.updateDetalle
);
router.delete('/:id/detalles/:detalleId',
  param('id').isInt().withMessage('ID inválido'),
  param('detalleId').isInt().withMessage('ID de detalle inválido'),
  handleValidationErrors,
  compraController.deleteDetalle
);
router.post('/:id/confirmar',
  param('id').isInt().withMessage('ID inválido'),
  handleValidationErrors,
  compraController.confirmar
);
router.post('/:id/cancelar',
  param('id').isInt().withMessage('ID inválido'),
  handleValidationErrors,
  compraController.cancelar
);
router.get('/historico-precios/:productoUnidadId',
  param('productoUnidadId').isInt().withMessage('ID inválido'),
  handleValidationErrors,
  compraController.getHistoricoPrecios
);

export default router;