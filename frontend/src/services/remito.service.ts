// frontend/src/services/remito.service.ts

import api from '@/lib/api';

export interface UnidadDisponible {
  id: number;
  productoUnidadId: number;
  nombre: string;
  abreviacion: string;
  precioSugerido: number;
  factorConversion: number | null;
}

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
  precioPorKg: number | null;
  margenGanancia: number;
  cantidad: number;
  unidadesDisponibles: UnidadDisponible[];
  warningConversion: string | null;
}

export interface RecalcularPrecioResponse {
  productoUnidadId: number;
  precioSugerido: number;
  precioPorKg: number | null;
  costoBase: number;
  factorConversion: number | null;
  warning: string | null;
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
  pedido?: any;
  historico_precios?: any[];
  createdAt: string;
  updatedAt: string;
}

export class RemitoService {
  static async obtenerPreciosSugeridos(pedidoId: number): Promise<PrecioSugerido[]> {
    const response = await api.get(`/remitos/pedido/${pedidoId}/precios-sugeridos`);
    return response.data;
  }

  // NUEVO: Recalcular precio al cambiar unidad
  static async recalcularPrecioPorUnidad(productoId: number, unidadId: number, cantidad?: number): Promise<RecalcularPrecioResponse> {
    const params = cantidad ? `?cantidad=${cantidad}` : '';
    const response = await api.get(`/remitos/recalcular-precio/${productoId}/${unidadId}${params}`);
    return response.data.data;
  }

  static async crearRemito(pedidoId: number, detalles: DetalleRemitoInput[]): Promise<Remito> {
    const response = await api.post('/remitos', { pedidoId, detalles });
    return response.data;
  }

  static async obtenerRemitos(filtros?: { clienteId?: number; estado?: string; fechaDesde?: string; fechaHasta?: string }): Promise<Remito[]> {
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
    const response = await api.get(`/remitos/${id}/pdf`, { responseType: 'blob' });
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