import api from '@/lib/api';
import { ICliente, IApiResponse, IPaginatedResponse } from '@/types';

export const clienteService = {
  getAll: async (page: number = 1, limit: number = 10) => {
    const response = await api.get<IApiResponse<IPaginatedResponse<ICliente>>>(
      `/clientes?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  getOne: async (id: number) => {
    const response = await api.get<IApiResponse<ICliente>>(`/clientes/${id}`);
    return response.data;
  },

  create: async (data: ICliente) => {
    const response = await api.post<IApiResponse<ICliente>>('/clientes', data);
    return response.data;
  },

  update: async (id: number, data: Partial<ICliente>) => {
    const response = await api.put<IApiResponse<ICliente>>(`/clientes/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete<IApiResponse<null>>(`/clientes/${id}`);
    return response.data;
  },

  search: async (query: string) => {
    const response = await api.get<IApiResponse<ICliente[]>>(
      `/clientes/search?q=${encodeURIComponent(query)}`
    );
    return response.data;
  },
};