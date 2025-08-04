// frontend/src/services/pedido-import.service.ts

import api from '@/lib/api';
import { IApiResponse } from '@/types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  newClientes: string[];
  newProductos: string[];
  newUnidades: string[];
  newProductoUnidades: {
    producto: string;
    unidad: string;
    necesitaConfig: boolean;
    esUnidadCompra?: boolean;
    esUnidadVenta?: boolean;
    margenGanancia?: number;
  }[];
  missingConversions: {
    producto: string;
    unidadVenta: string;
    unidadesCompra: string[];
  }[];
  parsedData: any[];
}

export interface ImportResult {
  success: boolean;
  pedidosCreados: number;
  errors?: string[];
}

export const pedidoImportService = {
  validateCSV: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<IApiResponse<ValidationResult>>(
      '/pedidos/import/validate',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  createEntities: async (
    clientes: any[],
    productos: any[],
    unidades: any[],
    productoUnidades?: any[]
  ) => {
    const response = await api.post<IApiResponse<null>>(
      '/pedidos/import/create-entities',
      {
        clientes,
        productos,
        unidades,
        productoUnidades: productoUnidades || []
      }
    );
    return response.data;
  },

  import: async (rows: any[]) => {
    const response = await api.post<IApiResponse<ImportResult>>(
      '/pedidos/import/import',
      { rows }
    );
    return response.data;
  },
};