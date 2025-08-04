import { Request, Response } from 'express';
import { CompraService } from '../services/compra.service';

export class CompraController {
  private compraService = new CompraService();

  getAll = async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await this.compraService.findAll(page, limit);
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al obtener compras'
      });
    }
  };

  getOne = async (req: Request, res: Response) => {
    try {
      const compra = await this.compraService.findOne(parseInt(req.params.id));
      
      if (!compra) {
        return res.status(404).json({
          success: false,
          error: 'Compra no encontrada'
        });
      }

      res.json({
        success: true,
        data: compra
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al obtener compra'
      });
    }
  };

  createFromOrden = async (req: Request, res: Response) => {
    try {
      const { orden_compra_id, detalles } = req.body;
      const compra = await this.compraService.createFromOrden(orden_compra_id, detalles);
      
      res.status(201).json({
        success: true,
        data: compra
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al crear compra'
      });
    }
  };

  createManual = async (req: Request, res: Response) => {
    try {
      const { detalles } = req.body;
      const compra = await this.compraService.createManual(detalles);
      
      res.status(201).json({
        success: true,
        data: compra
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al crear compra'
      });
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const compra = await this.compraService.update(
        parseInt(req.params.id),
        req.body
      );

      res.json({
        success: true,
        data: compra
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al actualizar compra'
      });
    }
  };

  updateDetalle = async (req: Request, res: Response) => {
    try {
      const detalle = await this.compraService.updateDetalle(
        parseInt(req.params.id),
        parseInt(req.params.detalleId),
        req.body
      );

      res.json({
        success: true,
        data: detalle
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al actualizar detalle'
      });
    }
  };

  deleteDetalle = async (req: Request, res: Response) => {
    try {
      await this.compraService.deleteDetalle(
        parseInt(req.params.id),
        parseInt(req.params.detalleId)
      );

      res.json({
        success: true,
        message: 'Detalle eliminado correctamente'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al eliminar detalle'
      });
    }
  };

  confirmar = async (req: Request, res: Response) => {
    try {
      const compra = await this.compraService.confirmar(parseInt(req.params.id));
      
      res.json({
        success: true,
        data: compra,
        message: 'Compra confirmada y stock actualizado'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al confirmar compra'
      });
    }
  };

  cancelar = async (req: Request, res: Response) => {
    try {
      const compra = await this.compraService.cancelar(parseInt(req.params.id));
      
      res.json({
        success: true,
        data: compra,
        message: 'Compra cancelada'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al cancelar compra'
      });
    }
  };

  getHistoricoPrecios = async (req: Request, res: Response) => {
    try {
      const productoUnidadId = parseInt(req.params.productoUnidadId);
      const limit = parseInt(req.query.limit as string) || 10;

      const historico = await this.compraService.getHistoricoPreciosCompra(productoUnidadId, limit);
      
      res.json({
        success: true,
        data: historico
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al obtener histórico'
      });
    }
  };
}