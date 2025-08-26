import api from '@/lib/api';
import { IProductoUnidad, IApiResponse, IPaginatedResponse } from '@/types';

export const productoUnidadService = {
  getAll: async (page: number = 1, limit: number = 10) => {
    const response = await api.get<IApiResponse<IPaginatedResponse<IProductoUnidad>>>(
      `/productos-unidades?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  getOne: async (id: number) => {
    const response = await api.get<IApiResponse<IProductoUnidad>>(`/productos-unidades/${id}`);
    return response.data;
  },

  getByProducto: async (productoId: number) => {
    const response = await api.get<IApiResponse<IProductoUnidad[]>>(
      `/productos-unidades/producto/${productoId}`
    );
    return response.data;
  },

  create: async (data: IProductoUnidad) => {
    const response = await api.post<IApiResponse<IProductoUnidad>>('/productos-unidades', data);
    return response.data;
  },

  update: async (id: number, data: Partial<IProductoUnidad>) => {
    try {
      const response = await api.put<IApiResponse<IProductoUnidad>>(
        `/productos-unidades/${id}`, 
        data
      );
      return response.data;
    } catch (error: any) {
      // Si el servidor devuelve un error con mensaje, propagarlo
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      // Si no, lanzar un error genérico
      throw new Error('Error al actualizar la relación producto-unidad');
    }
  },

  delete: async (id: number) => {
    const response = await api.delete<IApiResponse<null>>(`/productos-unidades/${id}`);
    return response.data;
  },

  updateStock: async (id: number, cantidad: number, operacion: 'sumar' | 'restar' | 'establecer') => {
    const response = await api.put<IApiResponse<IProductoUnidad>>(
      `/productos-unidades/${id}/stock`,
      { cantidad, operacion }
    );
    return response.data;
  },

  getUnidadesCompra: async () => {
    const response = await api.get<IApiResponse<IProductoUnidad[]>>('/productos-unidades/compra');
    return response.data;
  },

  getUnidadesVenta: async () => {
    const response = await api.get<IApiResponse<IProductoUnidad[]>>('/productos-unidades/venta');
    return response.data;
  },
};