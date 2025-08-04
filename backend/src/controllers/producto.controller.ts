import { Request, Response } from 'express';
import { ProductoService } from '../services/producto.service';
import { IApiResponse, IPaginatedResponse, IProducto } from '../types';

export class ProductoController {
  private productoService = new ProductoService();

  getAll = async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const result = await this.productoService.findAll(page, limit);
      
      const response: IApiResponse<IPaginatedResponse<IProducto>> = {
        success: true,
        data: result
      };
      
      res.json(response);
    } catch (error: any) {
      const response: IApiResponse<null> = {
        success: false,
        error: error.message || 'Error al obtener productos'
      };
      res.status(500).json(response);
    }
  };

  getOne = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const producto = await this.productoService.findOne(id);
      
      if (!producto) {
        const response: IApiResponse<null> = {
          success: false,
          error: 'Producto no encontrado'
        };
        return res.status(404).json(response);
      }
      
      const response: IApiResponse<IProducto> = {
        success: true,
        data: producto
      };
      
      res.json(response);
    } catch (error: any) {
      const response: IApiResponse<null> = {
        success: false,
        error: error.message || 'Error al obtener producto'
      };
      res.status(500).json(response);
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const productoData: IProducto = req.body;
      const producto = await this.productoService.create(productoData);
      
      const response: IApiResponse<IProducto> = {
        success: true,
        data: producto,
        message: 'Producto creado exitosamente'
      };
      
      res.status(201).json(response);
    } catch (error: any) {
      const response: IApiResponse<null> = {
        success: false,
        error: error.message || 'Error al crear producto'
      };
      res.status(400).json(response);
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const productoData: Partial<IProducto> = req.body;
      const producto = await this.productoService.update(id, productoData);
      
      const response: IApiResponse<IProducto> = {
        success: true,
        data: producto,
        message: 'Producto actualizado exitosamente'
      };
      
      res.json(response);
    } catch (error: any) {
      const response: IApiResponse<null> = {
        success: false,
        error: error.message || 'Error al actualizar producto'
      };
      res.status(400).json(response);
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await this.productoService.delete(id);
      
      const response: IApiResponse<null> = {
        success: true,
        message: 'Producto eliminado exitosamente'
      };
      
      res.json(response);
    } catch (error: any) {
      const response: IApiResponse<null> = {
        success: false,
        error: error.message || 'Error al eliminar producto'
      };
      res.status(400).json(response);
    }
  };

  search = async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string || '';
      const productos = await this.productoService.search(query);
      
      const response: IApiResponse<IProducto[]> = {
        success: true,
        data: productos
      };
      
      res.json(response);
    } catch (error: any) {
      const response: IApiResponse<null> = {
        success: false,
        error: error.message || 'Error al buscar productos'
      };
      res.status(500).json(response);
    }
  };

  getProductosConStock = async (req: Request, res: Response) => {
    try {
      const productos = await this.productoService.getProductosConStock();
      
      const response: IApiResponse<IProducto[]> = {
        success: true,
        data: productos
      };
      
      res.json(response);
    } catch (error: any) {
      const response: IApiResponse<null> = {
        success: false,
        error: error.message || 'Error al obtener productos con stock'
      };
      res.status(500).json(response);
    }
  };
}