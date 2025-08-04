import { Request, Response } from 'express';
import { ClienteService } from '../services/cliente.service';
import { IApiResponse, IPaginatedResponse, ICliente } from '../types';

export class ClienteController {
  private clienteService = new ClienteService();

  getAll = async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const result = await this.clienteService.findAll(page, limit);
      
      const response: IApiResponse<IPaginatedResponse<ICliente>> = {
        success: true,
        data: result
      };
      
      res.json(response);
    } catch (error: any) {
      const response: IApiResponse<null> = {
        success: false,
        error: error.message || 'Error al obtener clientes'
      };
      res.status(500).json(response);
    }
  };

  getOne = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const cliente = await this.clienteService.findOne(id);
      
      if (!cliente) {
        const response: IApiResponse<null> = {
          success: false,
          error: 'Cliente no encontrado'
        };
        return res.status(404).json(response);
      }
      
      const response: IApiResponse<ICliente> = {
        success: true,
        data: cliente
      };
      
      res.json(response);
    } catch (error: any) {
      const response: IApiResponse<null> = {
        success: false,
        error: error.message || 'Error al obtener cliente'
      };
      res.status(500).json(response);
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const clienteData: ICliente = req.body;
      const cliente = await this.clienteService.create(clienteData);
      
      const response: IApiResponse<ICliente> = {
        success: true,
        data: cliente,
        message: 'Cliente creado exitosamente'
      };
      
      res.status(201).json(response);
    } catch (error: any) {
      const response: IApiResponse<null> = {
        success: false,
        error: error.message || 'Error al crear cliente'
      };
      res.status(400).json(response);
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const clienteData: Partial<ICliente> = req.body;
      const cliente = await this.clienteService.update(id, clienteData);
      
      const response: IApiResponse<ICliente> = {
        success: true,
        data: cliente,
        message: 'Cliente actualizado exitosamente'
      };
      
      res.json(response);
    } catch (error: any) {
      const response: IApiResponse<null> = {
        success: false,
        error: error.message || 'Error al actualizar cliente'
      };
      res.status(400).json(response);
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await this.clienteService.delete(id);
      
      const response: IApiResponse<null> = {
        success: true,
        message: 'Cliente eliminado exitosamente'
      };
      
      res.json(response);
    } catch (error: any) {
      const response: IApiResponse<null> = {
        success: false,
        error: error.message || 'Error al eliminar cliente'
      };
      res.status(400).json(response);
    }
  };

  search = async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string || '';
      const clientes = await this.clienteService.search(query);
      
      const response: IApiResponse<ICliente[]> = {
        success: true,
        data: clientes
      };
      
      res.json(response);
    } catch (error: any) {
      const response: IApiResponse<null> = {
        success: false,
        error: error.message || 'Error al buscar clientes'
      };
      res.status(500).json(response);
    }
  };
}