import api from '@/lib/api';
import { IApiResponse, IPaginatedResponse, IPedido, EstadoPedido } from '@/types';

export const pedidoService = {
  getAll: async (page: number = 1, limit: number = 10, estado?: EstadoPedido) => {
    let url = `/pedidos?page=${page}&limit=${limit}`;
    if (estado) {
      url += `&estado=${estado}`;
    }
    const response = await api.get<IApiResponse<IPaginatedResponse<IPedido>>>(url);
    return response.data;
  },

  getOne: async (id: number) => {
    const response = await api.get<IApiResponse<IPedido>>(`/pedidos/${id}`);
    return response.data;
  },

  update: async (id: number, data: Partial<IPedido>) => {
    const response = await api.put<IApiResponse<IPedido>>(`/pedidos/${id}`, data);
    return response.data;
  },

  updateEstado: async (id: number, estado: EstadoPedido) => {
    const response = await api.put<IApiResponse<IPedido>>(`/pedidos/${id}/estado`, { estado });
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete<IApiResponse<null>>(`/pedidos/${id}`);
    return response.data;
  },

  getByCliente: async (clienteId: number) => {
    const response = await api.get<IApiResponse<IPedido[]>>(`/pedidos/cliente/${clienteId}`);
    return response.data;
  },

  getPendientes: async () => {
    const response = await api.get<IApiResponse<IPedido[]>>('/pedidos/pendientes');
    return response.data;
  },
};