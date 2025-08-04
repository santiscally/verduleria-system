import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Producto } from './producto.entity';
import { UnidadMedida } from './unidad-medida.entity';
import { IConversion } from '../types';

@Entity('conversiones')
@Index(['producto_id', 'unidad_origen_id', 'unidad_destino_id'], { unique: true })
export class Conversion extends BaseEntity implements IConversion {
  @Column()
  producto_id: number;

  @Column()
  unidad_origen_id: number;

  @Column()
  unidad_destino_id: number;

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  factor_conversion: number;

  @ManyToOne(() => Producto, producto => producto.conversiones)
  @JoinColumn({ name: 'producto_id' })
  producto: Producto;

  @ManyToOne(() => UnidadMedida, unidad => unidad.conversiones_origen)
  @JoinColumn({ name: 'unidad_origen_id' })
  unidad_origen: UnidadMedida;

  @ManyToOne(() => UnidadMedida, unidad => unidad.conversiones_destino)
  @JoinColumn({ name: 'unidad_destino_id' })
  unidad_destino: UnidadMedida;
}