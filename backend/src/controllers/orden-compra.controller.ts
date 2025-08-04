import { Request, Response } from 'express';
import { OrdenCompraService } from '../services/orden-compra.service';
import { IApiResponse, IPaginatedResponse, IOrdenCompra } from '../types';
import { AppDataSource } from '../config/database';
import { Compra } from '../entities';

export class OrdenCompraController {
  private ordenCompraService = new OrdenCompraService();

  getAll = async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const result = await this.ordenCompraService.findAll(page, limit);
      
      const response: IApiResponse<IPaginatedResponse<IOrdenCompra>> = {
        success: true,
        data: result
      };
      
      res.json(response);
    } catch (error: any) {
      const response: IApiResponse<null> = {
        success: false,
        error: error.message || 'Error al obtener órdenes de compra'
      };
      res.status(500).json(response);
    }
  };

  getOne = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const orden = await this.ordenCompraService.findOne(id);
      
      if (!orden) {
        const response: IApiResponse<null> = {
          success: false,
          error: 'Orden de compra no encontrada'
        };
        return res.status(404).json(response);
      }
      
      const response: IApiResponse<IOrdenCompra> = {
        success: true,
        data: orden
      };
      
      res.json(response);
    } catch (error: any) {
      const response: IApiResponse<null> = {
        success: false,
        error: error.message || 'Error al obtener orden de compra'
      };
      res.status(500).json(response);
    }
  };

  generarSugerencia = async (req: Request, res: Response) => {
    try {
      const sugerencia = await this.ordenCompraService.generarSugerencia();
      
      const response: IApiResponse<any> = {
        success: true,
        data: sugerencia
      };
      
      res.json(response);
    } catch (error: any) {
      const response: IApiResponse<null> = {
        success: false,
        error: error.message || 'Error al generar sugerencia'
      };
      res.status(500).json(response);
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const { detalles } = req.body;
      
      if (!detalles || !Array.isArray(detalles) || detalles.length === 0) {
        const response: IApiResponse<null> = {
          success: false,
          error: 'Debe proporcionar al menos un detalle'
        };
        return res.status(400).json(response);
      }
      
      const orden = await this.ordenCompraService.create(detalles);
      
      const response: IApiResponse<IOrdenCompra> = {
        success: true,
        data: orden!,
        message: 'Orden de compra creada exitosamente'
      };
      
      res.status(201).json(response);
    } catch (error: any) {
      const response: IApiResponse<null> = {
        success: false,
        error: error.message || 'Error al crear orden de compra'
      };
      res.status(400).json(response);
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const data = req.body;
      
      const orden = await this.ordenCompraService.update(id, data);
      
      const response: IApiResponse<IOrdenCompra> = {
        success: true,
        data: orden,
        message: 'Orden de compra actualizada exitosamente'
      };
      
      res.json(response);
    } catch (error: any) {
      const response: IApiResponse<null> = {
        success: false,
        error: error.message || 'Error al actualizar orden de compra'
      };
      res.status(400).json(response);
    }
  };

  updateDetalle = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const detalleId = parseInt(req.params.detalleId);
      const { cantidad_sugerida } = req.body;
      
      if (cantidad_sugerida === undefined || cantidad_sugerida < 0) {
        const response: IApiResponse<null> = {
          success: false,
          error: 'Cantidad inválida'
        };
        return res.status(400).json(response);
      }
      
      await this.ordenCompraService.updateDetalle(id, detalleId, cantidad_sugerida);
      
      const response: IApiResponse<null> = {
        success: true,
        message: 'Detalle actualizado exitosamente'
      };
      
      res.json(response);
    } catch (error: any) {
      const response: IApiResponse<null> = {
        success: false,
        error: error.message || 'Error al actualizar detalle'
      };
      res.status(400).json(response);
    }
  };

  deleteDetalle = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const detalleId = parseInt(req.params.detalleId);
      
      await this.ordenCompraService.deleteDetalle(id, detalleId);
      
      const response: IApiResponse<null> = {
        success: true,
        message: 'Detalle eliminado exitosamente'
      };
      
      res.json(response);
    } catch (error: any) {
      const response: IApiResponse<null> = {
        success: false,
        error: error.message || 'Error al eliminar detalle'
      };
      res.status(400).json(response);
    }
  };

   confirmar = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const orden = await this.ordenCompraService.confirmar(id);
      
      // Buscar la compra creada
      const compraRepository = AppDataSource.getRepository(Compra);
      const compra = await compraRepository.findOne({
        where: { orden_compra_id: id }
      });
      
      const response: IApiResponse<any> = {
        success: true,
        data: { orden, compra },
        message: 'Orden confirmada y compra creada exitosamente'
      };
      
      res.json(response);
    } catch (error: any) {
      const response: IApiResponse<null> = {
        success: false,
        error: error.message || 'Error al confirmar orden'
      };
      res.status(400).json(response);
    }
  };

  cancelar = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      const orden = await this.ordenCompraService.cancelar(id);
      
      const response: IApiResponse<IOrdenCompra> = {
        success: true,
        data: orden,
        message: 'Orden de compra cancelada exitosamente'
      };
      
      res.json(response);
    } catch (error: any) {
      const response: IApiResponse<null> = {
        success: false,
        error: error.message || 'Error al cancelar orden de compra'
      };
      res.status(400).json(response);
    }
  };
}