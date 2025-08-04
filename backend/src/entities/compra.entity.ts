import { Entity, Column, ManyToOne, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OrdenCompra } from './orden-compra.entity';
import { ICompra, EstadoCompra } from '../types';
import { CompraDetalle } from './compra-detalle.entity';

@Entity('compras')
export class Compra extends BaseEntity implements ICompra {
  
  @Column({ nullable: true })
  orden_compra_id?: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha_compra: Date;

  @Column({
    type: 'enum',
    enum: EstadoCompra,
    default: EstadoCompra.PENDIENTE
  })
  estado: EstadoCompra;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total_real: number;

  @Column({ type: 'boolean', default: false })
  confirmada: boolean;

  @OneToOne(() => OrdenCompra, orden => orden.compra)
  @JoinColumn({ name: 'orden_compra_id' })
  orden_compra?: OrdenCompra;

  @OneToMany(() => CompraDetalle, detalle => detalle.compra)
  detalles: CompraDetalle[];
}