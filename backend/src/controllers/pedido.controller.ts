import { Request, Response } from 'express';
import { PedidoService } from '../services/pedido.service';
import { IApiResponse, IPaginatedResponse, IPedido, EstadoPedido } from '../types';

export class PedidoController {
  private pedidoService = new PedidoService();

  getAll = async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const estado = req.query.estado as EstadoPedido | undefined;
      
      const result = await this.pedidoService.findAll(page, limit, estado);
      
      const response: IApiResponse<IPaginatedResponse<IPedido>> = {
        success: true,
        data: result
      };
      
      res.json(response);
    } catch (error: any) {
      const response: IApiResponse<null> = {
        success: false,
        error: error.message || 'Error al obtener pedidos'
      };
      res.status(500).json(response);
    }
  };

  getOne = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const pedido = await this.pedidoService.findOne(id);
      
      if (!pedido) {
        const response: IApiResponse<null> = {
          success: false,
          error: 'Pedido no encontrado'
        };
        return res.status(404).json(response);
      }
      
      const response: IApiResponse<IPedido> = {
        success: true,
        data: pedido
      };
      
      res.json(response);
    } catch (error: any) {
      const response: IApiResponse<null> = {
        success: false,
        error: error.message || 'Error al obtener pedido'
      };
      res.status(500).json(response);
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const data = req.body;
      
      const pedido = await this.pedidoService.update(id, data);
      
      const response: IApiResponse<IPedido> = {
        success: true,
        data: pedido,
        message: 'Pedido actualizado exitosamente'
      };
      
      res.json(response);
    } catch (error: any) {
      const response: IApiResponse<null> = {
        success: false,
        error: error.message || 'Error al actualizar pedido'
      };
      res.status(400).json(response);
    }
  };

  updateEstado = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { estado } = req.body;
      
      if (!Object.values(EstadoPedido).includes(estado)) {
        const response: IApiResponse<null> = {
          success: false,
          error: 'Estado inválido'
        };
        return res.status(400).json(response);
      }
      
      const pedido = await this.pedidoService.updateEstado(id, estado);
      
      const response: IApiResponse<IPedido> = {
        success: true,
        data: pedido,
        message: 'Estado actualizado exitosamente'
      };
      
      res.json(response);
    } catch (error: any) {
      const response: IApiResponse<null> = {
        success: false,
        error: error.message || 'Error al actualizar estado'
      };
      res.status(400).json(response);
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      await this.pedidoService.delete(id);
      
      const response: IApiResponse<null> = {
        success: true,
        message: 'Pedido eliminado exitosamente'
      };
      
      res.json(response);
    } catch (error: any) {
      const response: IApiResponse<null> = {
        success: false,
        error: error.message || 'Error al eliminar pedido'
      };
      res.status(400).json(response);
    }
  };

  getByCliente = async (req: Request, res: Response) => {
    try {
      const clienteId = parseInt(req.params.clienteId);
      const pedidos = await this.pedidoService.findByCliente(clienteId);
      
      const response: IApiResponse<IPedido[]> = {
        success: true,
        data: pedidos
      };
      
      res.json(response);
    } catch (error: any) {
      const response: IApiResponse<null> = {
        success: false,
        error: error.message || 'Error al obtener pedidos del cliente'
      };
      res.status(500).json(response);
    }
  };

  getPendientes = async (req: Request, res: Response) => {
    try {
      const pedidos = await this.pedidoService.findPendientes();
      
      const response: IApiResponse<IPedido[]> = {
        success: true,
        data: pedidos
      };
      
      res.json(response);
    } catch (error: any) {
      const response: IApiResponse<null> = {
        success: false,
        error: error.message || 'Error al obtener pedidos pendientes'
      };
      res.status(500).json(response);
    }
  };
}