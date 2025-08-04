import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Pedido } from './pedido.entity';
import { HistoricoPrecios } from './historico-precios.entity';
import { ICliente } from '../types';

@Entity('clientes')
export class Cliente extends BaseEntity implements ICliente {
  @Column({ type: 'varchar', length: 255 })
  nombre: string;

  @Column({ type: 'varchar', length: 500 })
  direccion: string;

  @Column({ type: 'varchar', length: 50 })
  telefono: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  contacto?: string;

  @OneToMany(() => Pedido, pedido => pedido.cliente)
  pedidos: Pedido[];

  @OneToMany(() => HistoricoPrecios, historico => historico.cliente)
  historico_precios: HistoricoPrecios[];
}