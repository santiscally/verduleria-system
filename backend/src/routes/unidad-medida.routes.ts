import { Router } from 'express';
import { UnidadMedidaController } from '../controllers/unidad-medida.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { body, param, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

const router = Router();
const unidadController = new UnidadMedidaController();

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

// Validaciones para crear/actualizar unidad
const unidadValidation = [
  body('nombre').notEmpty().withMessage('El nombre es requerido'),
  body('abreviacion').notEmpty().withMessage('La abreviación es requerida')
];

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// Rutas
router.get('/', unidadController.getAll);
router.get('/all', unidadController.getAllSimple);
router.get('/search', unidadController.search);
router.get('/:id', 
  param('id').isInt().withMessage('ID inválido'),
  handleValidationErrors,
  unidadController.getOne
);
router.post('/',
  unidadValidation,
  handleValidationErrors,
  unidadController.create
);
router.put('/:id',
  param('id').isInt().withMessage('ID inválido'),
  unidadValidation,
  handleValidationErrors,
  unidadController.update
);
router.delete('/:id',
  param('id').isInt().withMessage('ID inválido'),
  handleValidationErrors,
  unidadController.delete
);

export default router;