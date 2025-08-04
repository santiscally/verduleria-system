import { Entity, Column, ManyToOne, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Cliente } from './cliente.entity';
import { PedidoDetalle } from './pedido-detalle.entity';
import { Remito } from './remito.entity';
import { IPedido, EstadoPedido } from '../types';

@Entity('pedidos')
export class Pedido extends BaseEntity implements IPedido {
  @Column()
  cliente_id: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha_pedido: Date;

  @Column({
    type: 'enum',
    enum: EstadoPedido,
    default: EstadoPedido.PENDIENTE
  })
  estado: EstadoPedido;

  @Column({ type: 'boolean', default: false })
  incluido_en_compra: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha_importacion: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  @ManyToOne(() => Cliente, cliente => cliente.pedidos)
  @JoinColumn({ name: 'cliente_id' })
  cliente: Cliente;

  @OneToMany(() => PedidoDetalle, detalle => detalle.pedido)
  detalles: PedidoDetalle[];

  @OneToOne(() => Remito, remito => remito.pedido)
  remito: Remito;
}