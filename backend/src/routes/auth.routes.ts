import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

const router = Router();
const authController = new AuthController();

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

// Rutas públicas
router.post('/login',
  [
    body('username').notEmpty().withMessage('El usuario es requerido'),
    body('password').notEmpty().withMessage('La contraseña es requerida')
  ],
  handleValidationErrors,
  authController.login
);

// Rutas protegidas
router.get('/me', authMiddleware, authController.me);

router.post('/change-password',
  authMiddleware,
  [
    body('oldPassword').notEmpty().withMessage('La contraseña actual es requerida'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('La nueva contraseña debe tener al menos 6 caracteres')
  ],
  handleValidationErrors,
  authController.changePassword
);

export default router;