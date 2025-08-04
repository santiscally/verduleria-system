import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OrdenCompra } from './orden-compra.entity';
import { ProductoUnidad } from './producto-unidad.entity';
import { IOrdenCompraDetalle } from '../types';

@Entity('ordenes_compra_detalles')
export class OrdenCompraDetalle extends BaseEntity implements IOrdenCompraDetalle {
  @Column()
  orden_compra_id: number;

  @Column()
  producto_unidad_id: number;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  cantidad_sugerida: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  cantidad_comprada?: number;

  @ManyToOne(() => OrdenCompra, orden => orden.detalles)
  @JoinColumn({ name: 'orden_compra_id' })
  orden_compra: OrdenCompra;

  @ManyToOne(() => ProductoUnidad, productoUnidad => productoUnidad.orden_compra_detalles)
  @JoinColumn({ name: 'producto_unidad_id' })
  producto_unidad: ProductoUnidad;
}