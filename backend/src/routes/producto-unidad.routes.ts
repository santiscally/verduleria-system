import { Router } from 'express';
import { ProductoUnidadController } from '../controllers/producto-unidad.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { body, param, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

const router = Router();
const productoUnidadController = new ProductoUnidadController();

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
const productoUnidadValidation = [
  body('producto_id').isInt().withMessage('ID de producto inválido'),
  body('unidad_medida_id').isInt().withMessage('ID de unidad de medida inválido'),
  body('margen_ganancia').isFloat({ min: 0 }).withMessage('Margen de ganancia debe ser mayor o igual a 0'),
  body('stock_actual').isFloat({ min: 0 }).withMessage('Stock debe ser mayor o igual a 0'),
  body('es_unidad_compra').isBoolean().withMessage('es_unidad_compra debe ser booleano'),
  body('es_unidad_venta').isBoolean().withMessage('es_unidad_venta debe ser booleano')
];

const updateValidation = [
  body('margen_ganancia').optional().isFloat({ min: 0 }).withMessage('Margen de ganancia debe ser mayor o igual a 0'),
  body('stock_actual').optional().isFloat({ min: 0 }).withMessage('Stock debe ser mayor o igual a 0'),
  body('es_unidad_compra').optional().isBoolean().withMessage('es_unidad_compra debe ser booleano'),
  body('es_unidad_venta').optional().isBoolean().withMessage('es_unidad_venta debe ser booleano')
];

const stockValidation = [
  body('operacion').isIn(['sumar', 'restar', 'establecer']).withMessage('Operación inválida')
];

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// Rutas
router.get('/', productoUnidadController.getAll);
router.get('/compra', productoUnidadController.getUnidadesCompra);
router.get('/venta', productoUnidadController.getUnidadesVenta);
router.get('/:id', 
  param('id').isInt().withMessage('ID inválido'),
  handleValidationErrors,
  productoUnidadController.getOne
);
router.get('/producto/:productoId',
  param('productoId').isInt().withMessage('ID de producto inválido'),
  handleValidationErrors,
  productoUnidadController.getByProducto
);
router.post('/',
  productoUnidadValidation,
  handleValidationErrors,
  productoUnidadController.create
);
router.put('/:id',
  param('id').isInt().withMessage('ID inválido'),
  updateValidation,
  handleValidationErrors,
  productoUnidadController.update
);
router.put('/:id/stock',
  param('id').isInt().withMessage('ID inválido'),
  stockValidation,
  handleValidationErrors,
  productoUnidadController.updateStock
);
router.delete('/:id',
  param('id').isInt().withMessage('ID inválido'),
  handleValidationErrors,
  productoUnidadController.delete
);

export default router;