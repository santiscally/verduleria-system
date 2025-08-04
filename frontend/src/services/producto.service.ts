import api from '@/lib/api';
import { IProducto, IApiResponse, IPaginatedResponse } from '@/types';

export const productoService = {
  getAll: async (page: number = 1, limit: number = 10) => {
    const response = await api.get<IApiResponse<IPaginatedResponse<IProducto>>>(
      `/productos?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  getOne: async (id: number) => {
    const response = await api.get<IApiResponse<IProducto>>(`/productos/${id}`);
    return response.data;
  },

  create: async (data: IProducto) => {
    const response = await api.post<IApiResponse<IProducto>>('/productos', data);
    return response.data;
  },

  update: async (id: number, data: Partial<IProducto>) => {
    const response = await api.put<IApiResponse<IProducto>>(`/productos/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete<IApiResponse<null>>(`/productos/${id}`);
    return response.data;
  },

  search: async (query: string) => {
    const response = await api.get<IApiResponse<IProducto[]>>(
      `/productos/search?q=${encodeURIComponent(query)}`
    );
    return response.data;
  },

  getProductosConStock: async () => {
    const response = await api.get<IApiResponse<IProducto[]>>('/productos/con-stock');
    return response.data;
  },
};