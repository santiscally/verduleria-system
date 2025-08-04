// backend/src/controllers/pedido-import.controller.ts

import { Request, Response } from 'express';
import { PedidoImportService } from '../services/pedido-import.service';
import { IApiResponse } from '../types';
import multer from 'multer';

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB máximo
});

export class PedidoImportController {
  private importService = new PedidoImportService();

  validateCSV = async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        const response: IApiResponse<null> = {
          success: false,
          error: 'No se proporcionó archivo'
        };
        return res.status(400).json(response);
      }

      const fileContent = req.file.buffer.toString('utf-8');
      const validation = await this.importService.validateCSV(fileContent);

      const response: IApiResponse<any> = {
        success: true,
        data: validation
      };

      res.json(response);
    } catch (error: any) {
      const response: IApiResponse<null> = {
        success: false,
        error: error.message || 'Error al validar CSV'
      };
      res.status(500).json(response);
    }
  };

  createEntities = async (req: Request, res: Response) => {
    try {
      const data = req.body;

      await this.importService.createEntities(data);

      const response: IApiResponse<null> = {
        success: true,
        message: 'Entidades creadas exitosamente'
      };

      res.json(response);
    } catch (error: any) {
      const response: IApiResponse<null> = {
        success: false,
        error: error.message || 'Error al crear entidades'
      };
      res.status(500).json(response);
    }
  };

  import = async (req: Request, res: Response) => {
    try {
      const { rows } = req.body;

      if (!rows || !Array.isArray(rows)) {
        const response: IApiResponse<null> = {
          success: false,
          error: 'Datos de importación inválidos'
        };
        return res.status(400).json(response);
      }

      const result = await this.importService.import(rows);

      const response: IApiResponse<any> = {
        success: result.success,
        data: result,
        message: result.success ? `${result.pedidosCreados} pedidos creados exitosamente` : undefined
      };

      res.json(response);
    } catch (error: any) {
      const response: IApiResponse<null> = {
        success: false,
        error: error.message || 'Error al importar pedidos'
      };
      res.status(500).json(response);
    }
  };
}

export const uploadMiddleware = upload.single('file');