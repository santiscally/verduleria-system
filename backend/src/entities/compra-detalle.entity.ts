// backend/src/entities/compra-detalle.entity.ts

import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Compra } from './compra.entity';
import { ProductoUnidad } from './producto-unidad.entity';
import { ICompraDetalle } from '../types';

@Entity('compras_detalles')
export class CompraDetalle extends BaseEntity implements ICompraDetalle {
  @Column()
  compra_id: number;

  @Column()
  producto_unidad_id: number;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  cantidad: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precio_unitario: number;

  // NUEVOS CAMPOS para manejo de kg reales
  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  cantidad_kg_real: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  precio_por_kg: number | null;

  @ManyToOne(() => Compra, compra => compra.detalles)
  @JoinColumn({ name: 'compra_id' })
  compra: Compra;

  @ManyToOne(() => ProductoUnidad, productoUnidad => productoUnidad.compra_detalles)
  @JoinColumn({ name: 'producto_unidad_id' })
  producto_unidad: ProductoUnidad;
}