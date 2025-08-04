import { Router } from 'express';
import { ClienteController } from '../controllers/cliente.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { body, param, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

const router = Router();
const clienteController = new ClienteController();

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

// Validaciones para crear/actualizar cliente
const clienteValidation = [
  body('nombre').notEmpty().withMessage('El nombre es requerido'),
  body('direccion').notEmpty().withMessage('La dirección es requerida'),
  body('telefono').notEmpty().withMessage('El teléfono es requerido'),
  body('email').optional().isEmail().withMessage('Email inválido')
];

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// Rutas
router.get('/', clienteController.getAll);
router.get('/search', clienteController.search);
router.get('/:id', 
  param('id').isInt().withMessage('ID inválido'),
  handleValidationErrors,
  clienteController.getOne
);
router.post('/',
  clienteValidation,
  handleValidationErrors,
  clienteController.create
);
router.put('/:id',
  param('id').isInt().withMessage('ID inválido'),
  clienteValidation,
  handleValidationErrors,
  clienteController.update
);
router.delete('/:id',
  param('id').isInt().withMessage('ID inválido'),
  handleValidationErrors,
  clienteController.delete
);

export default router;