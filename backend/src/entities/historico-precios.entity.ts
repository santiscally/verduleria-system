import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Cliente } from './cliente.entity';
import { ProductoUnidad } from './producto-unidad.entity';
import { Remito } from './remito.entity';
import { IHistoricoPrecios } from '../types';

@Entity('historico_precios')
@Index(['cliente_id', 'producto_unidad_id'])
export class HistoricoPrecios extends BaseEntity implements IHistoricoPrecios {
  @Column()
  cliente_id: number;

  @Column()
  producto_unidad_id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precio: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha: Date;

  @Column({ nullable: true })
  remito_id?: number;

  @ManyToOne(() => Cliente, cliente => cliente.historico_precios)
  @JoinColumn({ name: 'cliente_id' })
  cliente: Cliente;

  @ManyToOne(() => ProductoUnidad, productoUnidad => productoUnidad.historico_precios)
  @JoinColumn({ name: 'producto_unidad_id' })
  producto_unidad: ProductoUnidad;

  @ManyToOne(() => Remito, remito => remito.historico_precios)
  @JoinColumn({ name: 'remito_id' })
  remito?: Remito;
}