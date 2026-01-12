// backend/src/routes/compra.routes.ts

import { Router } from 'express';
import { CompraController } from '../controllers/compra.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { body, param, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

const router = Router();
const compraController = new CompraController();

const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

const kgRealesValidation = [
  body('cantidad_kg_real').isFloat({ min: 0.001 }).withMessage('Los kg reales deben ser mayor a 0')
];

router.use(authMiddleware);

router.get('/', compraController.getAll);
router.get('/:id', param('id').isInt(), handleValidationErrors, compraController.getOne);
router.post('/from-orden', compraController.createFromOrden);
router.post('/manual', compraController.createManual);
router.put('/:id', compraController.update);
router.put('/:id/detalles/:detalleId', compraController.updateDetalle);

// NUEVO: Actualizar kg reales
router.put('/:id/detalles/:detalleId/kg-reales', kgRealesValidation, handleValidationErrors, compraController.updateKgReales);

// NUEVO: Obtener warnings
router.get('/:id/warnings-kg', compraController.getWarningsKgReales);

router.delete('/:id/detalles/:detalleId', compraController.deleteDetalle);
router.post('/:id/confirmar', compraController.confirmar);
router.post('/:id/cancelar', compraController.cancelar);
router.get('/historico-precios/:productoUnidadId', compraController.getHistoricoPrecios);

// NUEVO: Precio por kg
router.get('/precio-kg/:productoId', compraController.getUltimoPrecioPorKg);

export default router;