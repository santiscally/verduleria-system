import { Request, Response } from 'express';
import { ConversionService } from '../services/conversion.service';
import { IApiResponse, IPaginatedResponse, IConversion } from '../types';

export class ConversionController {
  private conversionService = new ConversionService();

  getAll = async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const result = await this.conversionService.findAll(page, limit);
      
      const response: IApiResponse<IPaginatedResponse<IConversion>> = {
        success: true,
        data: result
      };
      
      res.json(response);
    } catch (error: any) {
      const response: IApiResponse<null> = {
        success: false,
        error: error.message || 'Error al obtener conversiones'
      };
      res.status(500).json(response);
    }
  };

  getOne = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const conversion = await this.conversionService.findOne(id);
      
      if (!conversion) {
        const response: IApiResponse<null> = {
          success: false,
          error: 'Conversión no encontrada'
        };
        return res.status(404).json(response);
      }
      
      const response: IApiResponse<IConversion> = {
        success: true,
        data: conversion
      };
      
      res.json(response);
    } catch (error: any) {
      const response: IApiResponse<null> = {
        success: false,
        error: error.message || 'Error al obtener conversión'
      };
      res.status(500).json(response);
    }
  };

  getByProducto = async (req: Request, res: Response) => {
    try {
      const productoId = parseInt(req.params.productoId);
      const conversiones = await this.conversionService.findByProducto(productoId);
      
      const response: IApiResponse<IConversion[]> = {
        success: true,
        data: conversiones
      };
      
      res.json(response);
    } catch (error: any) {
      const response: IApiResponse<null> = {
        success: false,
        error: error.message || 'Error al obtener conversiones del producto'
      };
      res.status(500).json(response);
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const data = req.body;
      
      // Verificar si se envían nombres o IDs
      if (data.productoNombre && data.unidadOrigenNombre && data.unidadDestinoNombre) {
        // Crear usando nombres
        const conversion = await this.conversionService.create({
          productoNombre: data.productoNombre,
          unidadOrigenNombre: data.unidadOrigenNombre,
          unidadDestinoNombre: data.unidadDestinoNombre,
          factor_conversion: data.factor_conversion
        });
        
        const response: IApiResponse<IConversion> = {
          success: true,
          data: conversion,
          message: 'Conversión creada exitosamente (conversión inversa creada automáticamente)'
        };
        
        res.status(201).json(response);
      } else {
        // Lógica original con IDs
        const conversionData: IConversion = data;
        const conversion = await this.conversionService.create(conversionData);
        
        const response: IApiResponse<IConversion> = {
          success: true,
          data: conversion,
          message: 'Conversión creada exitosamente (conversión inversa creada automáticamente)'
        };
        
        res.status(201).json(response);
      }
    } catch (error: any) {
      const response: IApiResponse<null> = {
        success: false,
        error: error.message || 'Error al crear conversión'
      };
      res.status(400).json(response);
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const data: Partial<IConversion> = req.body;
      const conversion = await this.conversionService.update(id, data);
      
      const response: IApiResponse<IConversion> = {
        success: true,
        data: conversion,
        message: 'Conversión actualizada exitosamente (conversión inversa actualizada automáticamente)'
      };
      
      res.json(response);
    } catch (error: any) {
      const response: IApiResponse<null> = {
        success: false,
        error: error.message || 'Error al actualizar conversión'
      };
      res.status(400).json(response);
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await this.conversionService.delete(id);
      
      const response: IApiResponse<null> = {
        success: true,
        message: 'Conversión eliminada exitosamente (conversión inversa eliminada automáticamente)'
      };
      
      res.json(response);
    } catch (error: any) {
      const response: IApiResponse<null> = {
        success: false,
        error: error.message || 'Error al eliminar conversión'
      };
      res.status(400).json(response);
    }
  };

  convertir = async (req: Request, res: Response) => {
    try {
      const { producto_id, cantidad, unidad_origen_id, unidad_destino_id } = req.body;
      
      const resultado = await this.conversionService.convertir(
        producto_id,
        cantidad,
        unidad_origen_id,
        unidad_destino_id
      );
      
      const response: IApiResponse<{ cantidad_convertida: number }> = {
        success: true,
        data: { cantidad_convertida: resultado }
      };
      
      res.json(response);
    } catch (error: any) {
      const response: IApiResponse<null> = {
        success: false,
        error: error.message || 'Error al realizar conversión'
      };
      res.status(400).json(response);
    }
  };

  getConversionesDisponibles = async (req: Request, res: Response) => {
    try {
      const productoId = parseInt(req.params.productoId);
      const resultado = await this.conversionService.getConversionesDisponibles(productoId);
      
      const response: IApiResponse<any> = {
        success: true,
        data: resultado
      };
      
      res.json(response);
    } catch (error: any) {
      const response: IApiResponse<null> = {
        success: false,
        error: error.message || 'Error al obtener conversiones disponibles'
      };
      res.status(500).json(response);
    }
  };
}