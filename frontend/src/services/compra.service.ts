import api from '@/lib/api';
import { IApiResponse, IPaginatedResponse, IPaginatedApiResponse, ICompra } from '@/types';

export interface CompraDetalleInput {
  producto_unidad_id: number;
  cantidad: number;
  precio_unitario: number;
}

export interface CreateCompraFromOrdenInput {
  orden_compra_id: number;
  detalles: CompraDetalleInput[];
}

export interface CreateCompraManualInput {
  detalles: CompraDetalleInput[];
}

export const compraService = {
  getAll: async (page: number = 1, limit: number = 10) => {
    const response = await api.get<IPaginatedApiResponse<ICompra>>(
      `/compras?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  getOne: async (id: number) => {
    const response = await api.get<IApiResponse<ICompra>>(`/compras/${id}`);
    return response.data;
  },

  createFromOrden: async (data: CreateCompraFromOrdenInput) => {
    const response = await api.post<IApiResponse<ICompra>>('/compras/from-orden', data);
    return response.data;
  },

  createManual: async (data: CreateCompraManualInput) => {
    const response = await api.post<IApiResponse<ICompra>>('/compras/manual', data);
    return response.data;
  },

  update: async (id: number, data: Partial<ICompra>) => {
    const response = await api.put<IApiResponse<ICompra>>(`/compras/${id}`, data);
    return response.data;
  },

  updateDetalle: async (id: number, detalleId: number, data: Partial<CompraDetalleInput>) => {
    const response = await api.put<IApiResponse<any>>(
      `/compras/${id}/detalles/${detalleId}`,
      data
    );
    return response.data;
  },

  deleteDetalle: async (id: number, detalleId: number) => {
    const response = await api.delete<IApiResponse<null>>(
      `/compras/${id}/detalles/${detalleId}`
    );
    return response.data;
  },

  confirmar: async (id: number) => {
    const response = await api.post<IApiResponse<ICompra>>(`/compras/${id}/confirmar`);
    return response.data;
  },

  cancelar: async (id: number) => {
    const response = await api.post<IApiResponse<ICompra>>(`/compras/${id}/cancelar`);
    return response.data;
  },

  getHistoricoPrecios: async (productoUnidadId: number, limit: number = 10) => {
    const response = await api.get<IApiResponse<any[]>>(
      `/compras/historico-precios/${productoUnidadId}?limit=${limit}`
    );
    return response.data;
  },
};