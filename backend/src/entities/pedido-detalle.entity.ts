import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Pedido } from './pedido.entity';
import { ProductoUnidad } from './producto-unidad.entity';
import { IPedidoDetalle } from '../types';

@Entity('pedidos_detalles')
export class PedidoDetalle extends BaseEntity implements IPedidoDetalle {
  @Column()
  pedido_id: number;

  @Column()
  producto_unidad_id: number;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  cantidad: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  precio_unitario?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  subtotal?: number;

  @ManyToOne(() => Pedido, pedido => pedido.detalles)
  @JoinColumn({ name: 'pedido_id' })
  pedido: Pedido;

  @ManyToOne(() => ProductoUnidad, productoUnidad => productoUnidad.pedido_detalles)
  @JoinColumn({ name: 'producto_unidad_id' })
  producto_unidad: ProductoUnidad;
}