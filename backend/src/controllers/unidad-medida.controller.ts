import { Request, Response } from 'express';
import { UnidadMedidaService } from '../services/unidad-medida.service';
import { IApiResponse, IPaginatedResponse, IUnidadMedida } from '../types';

export class UnidadMedidaController {
  private unidadService = new UnidadMedidaService();

  getAll = async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const result = await this.unidadService.findAll(page, limit);
      
      const response: IApiResponse<IPaginatedResponse<IUnidadMedida>> = {
        success: true,
        data: result
      };
      
      res.json(response);
    } catch (error: any) {
      const response: IApiResponse<null> = {
        success: false,
        error: error.message || 'Error al obtener unidades de medida'
      };
      res.status(500).json(response);
    }
  };

  getOne = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const unidad = await this.unidadService.findOne(id);
      
      if (!unidad) {
        const response: IApiResponse<null> = {
          success: false,
          error: 'Unidad de medida no encontrada'
        };
        return res.status(404).json(response);
      }
      
      const response: IApiResponse<IUnidadMedida> = {
        success: true,
        data: unidad
      };
      
      res.json(response);
    } catch (error: any) {
      const response: IApiResponse<null> = {
        success: false,
        error: error.message || 'Error al obtener unidad de medida'
      };
      res.status(500).json(response);
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const unidadData: IUnidadMedida = req.body;
      const unidad = await this.unidadService.create(unidadData);
      
      const response: IApiResponse<IUnidadMedida> = {
        success: true,
        data: unidad,
        message: 'Unidad de medida creada exitosamente'
      };
      
      res.status(201).json(response);
    } catch (error: any) {
      const response: IApiResponse<null> = {
        success: false,
        error: error.message || 'Error al crear unidad de medida'
      };
      res.status(400).json(response);
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const unidadData: Partial<IUnidadMedida> = req.body;
      const unidad = await this.unidadService.update(id, unidadData);
      
      const response: IApiResponse<IUnidadMedida> = {
        success: true,
        data: unidad,
        message: 'Unidad de medida actualizada exitosamente'
      };
      
      res.json(response);
    } catch (error: any) {
      const response: IApiResponse<null> = {
        success: false,
        error: error.message || 'Error al actualizar unidad de medida'
      };
      res.status(400).json(response);
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await this.unidadService.delete(id);
      
      const response: IApiResponse<null> = {
        success: true,
        message: 'Unidad de medida eliminada exitosamente'
      };
      
      res.json(response);
    } catch (error: any) {
      const response: IApiResponse<null> = {
        success: false,
        error: error.message || 'Error al eliminar unidad de medida'
      };
      res.status(400).json(response);
    }
  };

  search = async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string || '';
      const unidades = await this.unidadService.search(query);
      
      const response: IApiResponse<IUnidadMedida[]> = {
        success: true,
        data: unidades
      };
      
      res.json(response);
    } catch (error: any) {
      const response: IApiResponse<null> = {
        success: false,
        error: error.message || 'Error al buscar unidades de medida'
      };
      res.status(500).json(response);
    }
  };

  getAllSimple = async (req: Request, res: Response) => {
    try {
      const unidades = await this.unidadService.getAll();
      
      const response: IApiResponse<IUnidadMedida[]> = {
        success: true,
        data: unidades
      };
      
      res.json(response);
    } catch (error: any) {
      const response: IApiResponse<null> = {
        success: false,
        error: error.message || 'Error al obtener todas las unidades'
      };
      res.status(500).json(response);
    }
  };
}