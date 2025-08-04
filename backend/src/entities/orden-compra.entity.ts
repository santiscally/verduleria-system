import { Entity, Column, OneToMany, OneToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OrdenCompraDetalle } from './orden-compra-detalle.entity';
import { Compra } from './compra.entity';
import { IOrdenCompra, EstadoOrdenCompra } from '../types';

@Entity('ordenes_compra')
export class OrdenCompra extends BaseEntity implements IOrdenCompra {
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha_orden: Date;

  @Column({
    type: 'enum',
    enum: EstadoOrdenCompra,
    default: EstadoOrdenCompra.BORRADOR
  })
  estado: EstadoOrdenCompra;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total_estimado: number;

  @Column({ type: 'text', nullable: true })
  observaciones?: string;

  @OneToMany(() => OrdenCompraDetalle, detalle => detalle.orden_compra)
  detalles: OrdenCompraDetalle[];

  @OneToOne(() => Compra, compra => compra.orden_compra)
  compra: Compra;
}