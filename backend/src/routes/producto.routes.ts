import { Router } from 'express';
import { ProductoController } from '../controllers/producto.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { body, param, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

const router = Router();
const productoController = new ProductoController();

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

// Validaciones para crear/actualizar producto
const productoValidation = [
  body('nombre').notEmpty().withMessage('El nombre es requerido'),
  body('proveedor').optional()
];

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// Rutas
router.get('/', productoController.getAll);
router.get('/search', productoController.search);
router.get('/con-stock', productoController.getProductosConStock);
router.get('/:id', 
  param('id').isInt().withMessage('ID inválido'),
  handleValidationErrors,
  productoController.getOne
);
router.post('/',
  productoValidation,
  handleValidationErrors,
  productoController.create
);
router.put('/:id',
  param('id').isInt().withMessage('ID inválido'),
  productoValidation,
  handleValidationErrors,
  productoController.update
);
router.delete('/:id',
  param('id').isInt().withMessage('ID inválido'),
  handleValidationErrors,
  productoController.delete
);

export default router;