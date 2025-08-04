import { Request, Response } from 'express';
import { ProductoUnidadService } from '../services/producto-unidad.service';
import { IApiResponse, IPaginatedResponse, IProductoUnidad } from '../types';

export class ProductoUnidadController {
  private productoUnidadService = new ProductoUnidadService();

  getAll = async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const result = await this.productoUnidadService.findAll(page, limit);
      
      const response: IApiResponse<IPaginatedResponse<IProductoUnidad>> = {
        success: true,
        data: result
      };
      
      res.json(response);
    } catch (error: any) {
      const response: IApiResponse<null> = {
        success: false,
        error: error.message || 'Error al obtener relaciones producto-unidad'
      };
      res.status(500).json(response);
    }
  };

  getOne = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const productoUnidad = await this.productoUnidadService.findOne(id);
      
      if (!productoUnidad) {
        const response: IApiResponse<null> = {
          success: false,
          error: 'Relación producto-unidad no encontrada'
        };
        return res.status(404).json(response);
      }
      
      const response: IApiResponse<IProductoUnidad> = {
        success: true,
        data: productoUnidad
      };
      
      res.json(response);
    } catch (error: any) {
      const response: IApiResponse<null> = {
        success: false,
        error: error.message || 'Error al obtener relación producto-unidad'
      };
      res.status(500).json(response);
    }
  };

  getByProducto = async (req: Request, res: Response) => {
    try {
      const productoId = parseInt(req.params.productoId);
      const unidades = await this.productoUnidadService.findByProducto(productoId);
      
      const response: IApiResponse<IProductoUnidad[]> = {
        success: true,
        data: unidades
      };
      
      res.json(response);
    } catch (error: any) {
      const response: IApiResponse<null> = {
        success: false,
        error: error.message || 'Error al obtener unidades del producto'
      };
      res.status(500).json(response);
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const data: IProductoUnidad = req.body;
      const productoUnidad = await this.productoUnidadService.create(data);
      
      const response: IApiResponse<IProductoUnidad> = {
        success: true,
        data: productoUnidad,
        message: 'Relación producto-unidad creada exitosamente'
      };
      
      res.status(201).json(response);
    } catch (error: any) {
      const response: IApiResponse<null> = {
        success: false,
        error: error.message || 'Error al crear relación producto-unidad'
      };
      res.status(400).json(response);
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const data: Partial<IProductoUnidad> = req.body;
      const productoUnidad = await this.productoUnidadService.update(id, data);
      
      const response: IApiResponse<IProductoUnidad> = {
        success: true,
        data: productoUnidad,
        message: 'Relación producto-unidad actualizada exitosamente'
      };
      
      res.json(response);
    } catch (error: any) {
      const response: IApiResponse<null> = {
        success: false,
        error: error.message || 'Error al actualizar relación producto-unidad'
      };
      res.status(400).json(response);
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await this.productoUnidadService.delete(id);
      
      const response: IApiResponse<null> = {
        success: true,
        message: 'Relación producto-unidad eliminada exitosamente'
      };
      
      res.json(response);
    } catch (error: any) {
      const response: IApiResponse<null> = {
        success: false,
        error: error.message || 'Error al eliminar relación producto-unidad'
      };
      res.status(400).json(response);
    }
  };

  updateStock = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { cantidad, operacion } = req.body;
      
      if (!['sumar', 'restar', 'establecer'].includes(operacion)) {
        throw new Error('Operación inválida');
      }
      
      const productoUnidad = await this.productoUnidadService.updateStock(id, cantidad, operacion);
      
      const response: IApiResponse<IProductoUnidad> = {
        success: true,
        data: productoUnidad,
        message: 'Stock actualizado exitosamente'
      };
      
      res.json(response);
    } catch (error: any) {
      const response: IApiResponse<null> = {
        success: false,
        error: error.message || 'Error al actualizar stock'
      };
      res.status(400).json(response);
    }
  };

  getUnidadesCompra = async (req: Request, res: Response) => {
    try {
      const unidades = await this.productoUnidadService.getUnidadesCompra();
      
      const response: IApiResponse<IProductoUnidad[]> = {
        success: true,
        data: unidades
      };
      
      res.json(response);
    } catch (error: any) {
      const response: IApiResponse<null> = {
        success: false,
        error: error.message || 'Error al obtener unidades de compra'
      };
      res.status(500).json(response);
    }
  };

  getUnidadesVenta = async (req: Request, res: Response) => {
    try {
      const unidades = await this.productoUnidadService.getUnidadesVenta();
      
      const response: IApiResponse<IProductoUnidad[]> = {
        success: true,
        data: unidades
      };
      
      res.json(response);
    } catch (error: any) {
      const response: IApiResponse<null> = {
        success: false,
        error: error.message || 'Error al obtener unidades de venta'
      };
      res.status(500).json(response);
    }
  };
}