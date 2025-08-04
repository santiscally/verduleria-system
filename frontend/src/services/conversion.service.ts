import api from '@/lib/api';
import { IConversion, IApiResponse, IPaginatedResponse, IUnidadMedida } from '@/types';

export const conversionService = {
  getAll: async (page: number = 1, limit: number = 10) => {
    const response = await api.get<IApiResponse<IPaginatedResponse<IConversion>>>(
      `/conversiones?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  getOne: async (id: number) => {
    const response = await api.get<IApiResponse<IConversion>>(`/conversiones/${id}`);
    return response.data;
  },

  getByProducto: async (productoId: number) => {
    const response = await api.get<IApiResponse<IConversion[]>>(
      `/conversiones/producto/${productoId}`
    );
    return response.data;
  },

  create: async (data: IConversion | any) => {
    const response = await api.post<IApiResponse<IConversion>>('/conversiones', data);
    return response.data;
  },

  update: async (id: number, data: Partial<IConversion>) => {
    const response = await api.put<IApiResponse<IConversion>>(`/conversiones/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete<IApiResponse<null>>(`/conversiones/${id}`);
    return response.data;
  },

  convertir: async (productoId: number, cantidad: number, unidadOrigenId: number, unidadDestinoId: number) => {
    const response = await api.post<IApiResponse<{ cantidad_convertida: number }>>(
      '/conversiones/convertir',
      {
        producto_id: productoId,
        cantidad,
        unidad_origen_id: unidadOrigenId,
        unidad_destino_id: unidadDestinoId,
      }
    );
    return response.data;
  },

  getConversionesDisponibles: async (productoId: number) => {
    const response = await api.get<IApiResponse<{
      unidades: IUnidadMedida[];
      conversiones: IConversion[];
    }>>(`/conversiones/producto/${productoId}/disponibles`);
    return response.data;
  },
};