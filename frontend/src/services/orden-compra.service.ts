// frontend/src/services/orden-compra.service.ts
import api from '@/lib/api';
import { IApiResponse, IPaginatedResponse, IOrdenCompra } from '@/types';

export interface SugerenciaCompra {
  producto_unidad_id: number;
  cantidad_necesaria: number;
  cantidad_stock: number;
  cantidad_sugerida: number;
  producto_unidad?: any;
}

export interface SugerenciaResponse {
  sugerencias: SugerenciaCompra[];
  pedidos: any[];
}

export const ordenCompraService = {
  getAll: async (page: number = 1, limit: number = 10) => {
    const response = await api.get<IApiResponse<IPaginatedResponse<IOrdenCompra>>>(
      `/ordenes-compra?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  getOne: async (id: number) => {
    const response = await api.get<IApiResponse<IOrdenCompra>>(`/ordenes-compra/${id}`);
    return response.data;
  },

  generarSugerencia: async () => {
    const response = await api.get<IApiResponse<SugerenciaResponse>>('/ordenes-compra/sugerencia');
    return response.data;
  },

  create: async (detalles: { producto_unidad_id: number; cantidad_sugerida: number }[]) => {
    const response = await api.post<IApiResponse<IOrdenCompra>>('/ordenes-compra', { detalles });
    return response.data;
  },

  update: async (id: number, data: Partial<IOrdenCompra>) => {
    const response = await api.put<IApiResponse<IOrdenCompra>>(`/ordenes-compra/${id}`, data);
    return response.data;
  },

  updateDetalle: async (id: number, detalleId: number, cantidad_sugerida: number) => {
    const response = await api.put<IApiResponse<null>>(
      `/ordenes-compra/${id}/detalles/${detalleId}`,
      { cantidad_sugerida }
    );
    return response.data;
  },

  deleteDetalle: async (id: number, detalleId: number) => {
    const response = await api.delete<IApiResponse<null>>(
      `/ordenes-compra/${id}/detalles/${detalleId}`
    );
    return response.data;
  },

  confirmar: async (id: number) => {
    const response = await api.post<IApiResponse<IOrdenCompra>>(`/ordenes-compra/${id}/confirmar`);
    return response.data;
  },

  cancelar: async (id: number) => {
    const response = await api.post<IApiResponse<IOrdenCompra>>(`/ordenes-compra/${id}/cancelar`);
    return response.data;
  },

  descargarPDF: async (id: number): Promise<void> => {
    const response = await api.get(`/ordenes-compra/${id}/pdf`, {
      responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `orden-compra-${id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
};