import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ProductoUnidad } from './producto-unidad.entity';
import { Compra } from './compra.entity';
import { IHistoricoPreciosCompra } from '../types';

@Entity('historico_precios_compra')
@Index(['producto_unidad_id', 'fecha'])
export class HistoricoPreciosCompra extends BaseEntity implements IHistoricoPreciosCompra {
  @Column()
  producto_unidad_id: number;

  @Column()
  compra_id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precio: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha: Date;

  @ManyToOne(() => ProductoUnidad)
  @JoinColumn({ name: 'producto_unidad_id' })
  producto_unidad: ProductoUnidad;

  @ManyToOne(() => Compra)
  @JoinColumn({ name: 'compra_id' })
  compra: Compra;
}