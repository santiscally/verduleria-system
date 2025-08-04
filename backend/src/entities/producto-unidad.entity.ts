import { Entity, Column, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Producto } from './producto.entity';
import { UnidadMedida } from './unidad-medida.entity';
import { PedidoDetalle } from './pedido-detalle.entity';
import { OrdenCompraDetalle } from './orden-compra-detalle.entity';
import { CompraDetalle } from './compra-detalle.entity';
import { HistoricoPrecios } from './historico-precios.entity';
import { IProductoUnidad } from '../types';

@Entity('productos_unidades')
@Index(['producto_id', 'unidad_medida_id'], { unique: true })
export class ProductoUnidad extends BaseEntity implements IProductoUnidad {
  @Column()
  producto_id: number;

  @Column()
  unidad_medida_id: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  margen_ganancia: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  stock_actual: number;

  @Column({ type: 'boolean', default: false })
  es_unidad_compra: boolean;

  @Column({ type: 'boolean', default: true })
  es_unidad_venta: boolean;

  @ManyToOne(() => Producto, producto => producto.producto_unidades)
  @JoinColumn({ name: 'producto_id' })
  producto: Producto;

  @ManyToOne(() => UnidadMedida, unidadMedida => unidadMedida.producto_unidades)
  @JoinColumn({ name: 'unidad_medida_id' })
  unidad_medida: UnidadMedida;

  @OneToMany(() => PedidoDetalle, detalle => detalle.producto_unidad)
  pedido_detalles: PedidoDetalle[];

  @OneToMany(() => OrdenCompraDetalle, detalle => detalle.producto_unidad)
  orden_compra_detalles: OrdenCompraDetalle[];

  @OneToMany(() => CompraDetalle, detalle => detalle.producto_unidad)
  compra_detalles: CompraDetalle[];

  @OneToMany(() => HistoricoPrecios, historico => historico.producto_unidad)
  historico_precios: HistoricoPrecios[];
}