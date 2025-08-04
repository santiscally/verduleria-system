import { Router } from 'express';
import { ConversionController } from '../controllers/conversion.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { body, param, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

const router = Router();
const conversionController = new ConversionController();

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
const conversionValidation = [
  body('factor_conversion').isFloat({ gt: 0 }).withMessage('Factor de conversión debe ser mayor a 0'),
  // Validación condicional: debe tener IDs O nombres
  body().custom((value, { req }) => {
    const hasIds = req.body.producto_id && req.body.unidad_origen_id && req.body.unidad_destino_id;
    const hasNames = req.body.productoNombre && req.body.unidadOrigenNombre && req.body.unidadDestinoNombre;
    
    if (!hasIds && !hasNames) {
      throw new Error('Debe proporcionar IDs (producto_id, unidad_origen_id, unidad_destino_id) o nombres (productoNombre, unidadOrigenNombre, unidadDestinoNombre)');
    }
    
    if (hasIds) {
      if (!Number.isInteger(req.body.producto_id)) throw new Error('ID de producto inválido');
      if (!Number.isInteger(req.body.unidad_origen_id)) throw new Error('ID de unidad origen inválido');
      if (!Number.isInteger(req.body.unidad_destino_id)) throw new Error('ID de unidad destino inválido');
    }
    
    if (hasNames) {
      if (typeof req.body.productoNombre !== 'string' || !req.body.productoNombre.trim()) {
        throw new Error('Nombre de producto inválido');
      }
      if (typeof req.body.unidadOrigenNombre !== 'string' || !req.body.unidadOrigenNombre.trim()) {
        throw new Error('Nombre de unidad origen inválido');
      }
      if (typeof req.body.unidadDestinoNombre !== 'string' || !req.body.unidadDestinoNombre.trim()) {
        throw new Error('Nombre de unidad destino inválido');
      }
    }
    
    return true;
  })
];

const convertirValidation = [
  body('producto_id').isInt().withMessage('ID de producto inválido'),
  body('cantidad').isFloat({ gt: 0 }).withMessage('Cantidad debe ser mayor a 0'),
  body('unidad_origen_id').isInt().withMessage('ID de unidad origen inválido'),
  body('unidad_destino_id').isInt().withMessage('ID de unidad destino inválido')
];

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// Rutas
router.get('/', conversionController.getAll);
router.post('/convertir',
  convertirValidation,
  handleValidationErrors,
  conversionController.convertir
);
router.get('/:id', 
  param('id').isInt().withMessage('ID inválido'),
  handleValidationErrors,
  conversionController.getOne
);
router.get('/producto/:productoId',
  param('productoId').isInt().withMessage('ID de producto inválido'),
  handleValidationErrors,
  conversionController.getByProducto
);
router.get('/producto/:productoId/disponibles',
  param('productoId').isInt().withMessage('ID de producto inválido'),
  handleValidationErrors,
  conversionController.getConversionesDisponibles
);
router.post('/',
  conversionValidation,
  handleValidationErrors,
  conversionController.create
);
router.put('/:id',
  param('id').isInt().withMessage('ID inválido'),
  body('factor_conversion').isFloat({ gt: 0 }).withMessage('Factor de conversión debe ser mayor a 0'),
  handleValidationErrors,
  conversionController.update
);
router.delete('/:id',
  param('id').isInt().withMessage('ID inválido'),
  handleValidationErrors,
  conversionController.delete
);

export default router;