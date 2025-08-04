// frontend/src/services/remito.service.ts
import api from '@/lib/api';

// Tipos temporales hasta que se actualicen en @/types
export interface PrecioSugerido {
  pedidoDetalleId: number;
  productoId: number;
  unidadMedidaId: number;
  productoUnidadId: number;
  productoNombre: string;
  unidadNombre: string;
  precioCalculado: number;
  ultimoPrecioCobrado: number | null;
  costoBase: number;
  margenGanancia: number;
  cantidad: number;
}

export interface DetalleRemitoInput {
  pedidoDetalleId: number;
  productoUnidadId: number;
  cantidad: number;
  precio: number;
}

export interface Remito {
  id: number;
  pedido_id: number;
  fecha_emision: string;
  total: number;
  entregado: boolean;
  fecha_entrega?: string;
  pedido?: any; // Pedido type
  historico_precios?: any[]; // HistoricoPrecios[]
  createdAt: string;
  updatedAt: string;
}

export class RemitoService {
  static async obtenerPreciosSugeridos(pedidoId: number): Promise<PrecioSugerido[]> {
    const response = await api.get(`/remitos/pedido/${pedidoId}/precios-sugeridos`);
    return response.data;
  }

  static async crearRemito(pedidoId: number, detalles: DetalleRemitoInput[]): Promise<Remito> {
    const response = await api.post('/remitos', { pedidoId, detalles });
    return response.data;
  }

  static async obtenerRemitos(filtros?: {
    clienteId?: number;
    estado?: string;
    fechaDesde?: string;
    fechaHasta?: string;
  }): Promise<Remito[]> {
    const response = await api.get('/remitos', { params: filtros });
    return response.data;
  }

  static async obtenerRemitoPorId(id: number): Promise<Remito> {
    const response = await api.get(`/remitos/${id}`);
    return response.data;
  }

  static async confirmarEntrega(id: number): Promise<Remito> {
    const response = await api.patch(`/remitos/${id}/confirmar-entrega`);
    return response.data;
  }

  static async anularRemito(id: number): Promise<Remito> {
    const response = await api.delete(`/remitos/${id}/anular`);
    return response.data;
  }

  static async descargarPDF(id: number): Promise<void> {
    const response = await api.get(`/remitos/${id}/pdf`, {
      responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `remito-${id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
}