import api from '@/lib/api';
import { IUnidadMedida, IApiResponse, IPaginatedResponse } from '@/types';

export const unidadMedidaService = {
  getAll: async (page: number = 1, limit: number = 10) => {
    const response = await api.get<IApiResponse<IPaginatedResponse<IUnidadMedida>>>(
      `/unidades-medida?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  getAllSimple: async () => {
    const response = await api.get<IApiResponse<IUnidadMedida[]>>('/unidades-medida/all');
    return response.data;
  },

  getOne: async (id: number) => {
    const response = await api.get<IApiResponse<IUnidadMedida>>(`/unidades-medida/${id}`);
    return response.data;
  },

  create: async (data: IUnidadMedida) => {
    const response = await api.post<IApiResponse<IUnidadMedida>>('/unidades-medida', data);
    return response.data;
  },

  update: async (id: number, data: Partial<IUnidadMedida>) => {
    const response = await api.put<IApiResponse<IUnidadMedida>>(`/unidades-medida/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete<IApiResponse<null>>(`/unidades-medida/${id}`);
    return response.data;
  },

  search: async (query: string) => {
    const response = await api.get<IApiResponse<IUnidadMedida[]>>(
      `/unidades-medida/search?q=${encodeURIComponent(query)}`
    );
    return response.data;
  },
};