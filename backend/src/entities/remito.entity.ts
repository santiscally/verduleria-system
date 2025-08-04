import { Entity, Column, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Pedido } from './pedido.entity';
import { HistoricoPrecios } from './historico-precios.entity';
import { IRemito } from '../types';

@Entity('remitos')
export class Remito extends BaseEntity implements IRemito {
  @Column()
  pedido_id: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha_emision: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ type: 'boolean', default: false })
  entregado: boolean;

  @Column({ type: 'timestamp', nullable: true })
  fecha_entrega?: Date;

  @OneToOne(() => Pedido, pedido => pedido.remito)
  @JoinColumn({ name: 'pedido_id' })
  pedido: Pedido;

  @OneToMany(() => HistoricoPrecios, historico => historico.remito)
  historico_precios: HistoricoPrecios[];
}