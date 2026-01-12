// frontend/src/types/index.ts

// Enums
export enum EstadoPedido {
  PENDIENTE = 'pendiente',
  EN_COMPRA = 'en_compra',
  EN_PROCESO = 'en_proceso', 
  PARCIAL = 'parcial',
  COMPLETADO = 'completado'
}

export enum EstadoOrdenCompra {
  BORRADOR = 'borrador',
  CONFIRMADA = 'confirmada',
  EN_PROCESO = 'en_proceso',
  COMPLETADA = 'completada',
  CANCELADA = 'cancelada'
}

export enum EstadoCompra {
  PENDIENTE = 'pendiente',
  CONFIRMADA = 'confirmada',
  CANCELADA = 'cancelada'
}

// Interfaces base
export interface ICliente {
  id?: number;
  nombre: string;
  direccion: string;
  telefono: string;
  email?: string;
  contacto?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface IProducto {
  id?: number;
  nombre: string;
  proveedor?: string;
  producto_unidades?: IProductoUnidad[];
  conversiones?: IConversion[];
  created_at?: Date;
  updated_at?: Date;
}

export interface IUnidadMedida {
  id?: number;
  nombre: string;
  abreviacion: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface IProductoUnidad {
  id?: number;
  producto_id: number;
  unidad_medida_id: number;
  margen_ganancia: number;
  stock_actual: number;
  es_unidad_compra: boolean;
  es_unidad_venta: boolean;
  producto?: IProducto;
  unidad_medida?: IUnidadMedida;
  created_at?: Date;
  updated_at?: Date;
}

export interface IConversion {
  id?: number;
  producto_id: number;
  unidad_origen_id: number;
  unidad_destino_id: number;
  factor_conversion: number;
  producto?: IProducto;
  unidad_origen?: IUnidadMedida;
  unidad_destino?: IUnidadMedida;
  created_at?: Date;
  updated_at?: Date;
}

export interface IPedido {
  id?: number;
  cliente_id: number;
  fecha_pedido: Date;
  estado: EstadoPedido;
  incluido_en_compra: boolean;
  fecha_importacion: Date;
  total: number;
  cliente?: ICliente;
  detalles?: IPedidoDetalle[];
  remito?: IRemito;
  created_at?: Date;
  updated_at?: Date;
}

export interface IPedidoDetalle {
  id?: number;
  pedido_id: number;
  producto_unidad_id: number;
  cantidad: number;
  precio_unitario?: number;
  subtotal?: number;
  producto_unidad?: IProductoUnidad;
  created_at?: Date;
  updated_at?: Date;
}

export interface IOrdenCompra {
  id?: number;
  fecha_orden: Date;
  estado: EstadoOrdenCompra;
  total_estimado: number;
  observaciones?: string;
  detalles?: IOrdenCompraDetalle[];
  created_at?: Date;
  updated_at?: Date;
}

export interface IOrdenCompraDetalle {
  id?: number;
  orden_compra_id: number;
  producto_unidad_id: number;
  cantidad_sugerida: number;
  cantidad_comprada?: number;
  producto_unidad?: IProductoUnidad;
  created_at?: Date;
  updated_at?: Date;
}

export interface ICompra {
  id?: number;
  orden_compra_id?: number;
  fecha_compra: Date;
  estado: EstadoCompra;
  total_real: number;
  confirmada: boolean;
  orden_compra?: IOrdenCompra;
  detalles?: ICompraDetalle[];
  created_at?: Date;
  updated_at?: Date;
}

export interface ICompraDetalle {
  id?: number;
  compra_id: number;
  producto_unidad_id: number;
  cantidad: number;
  precio_unitario: number;
  cantidad_kg_real?: number | null;
  precio_por_kg?: number | null;
  producto_unidad?: IProductoUnidad;
  created_at?: Date;
  updated_at?: Date;
}

export interface IRemito {
  id?: number;
  pedido_id: number;
  fecha_emision: Date;
  total: number;
  entregado: boolean;
  fecha_entrega?: Date;
  pedido?: IPedido;
  created_at?: Date;
  updated_at?: Date;
}

export interface IHistoricoPrecios {
  id?: number;
  cliente_id: number;
  producto_unidad_id: number;
  precio: number;
  fecha: Date;
  remito_id?: number;
  cliente?: ICliente;
  producto_unidad?: IProductoUnidad;
  remito?: IRemito;
  created_at?: Date;
  updated_at?: Date;
}

export interface IHistoricoPreciosCompra {
  id?: number;
  producto_unidad_id: number;
  compra_id: number;
  precio: number;
  precio_por_kg?: number | null;
  fecha: Date;
  producto_unidad?: IProductoUnidad;
  created_at?: Date;
  updated_at?: Date;
}

// DTOs
export interface IPedidoImportRow {
  cliente: string;
  producto: string;
  unidad_medida: string;
  cantidad: number;
}

export interface ILoginRequest {
  username: string;
  password: string;
}

export interface ILoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
  };
}

export interface IApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface IPaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IPaginatedApiResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  error?: string;
  message?: string;
}