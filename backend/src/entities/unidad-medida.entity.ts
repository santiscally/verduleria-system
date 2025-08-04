import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ProductoUnidad } from './producto-unidad.entity';
import { Conversion } from './conversion.entity';
import { IUnidadMedida } from '../types';

@Entity('unidades_medida')
export class UnidadMedida extends BaseEntity implements IUnidadMedida {
  @Column({ type: 'varchar', length: 100, unique: true })
  nombre: string;

  @Column({ type: 'varchar', length: 20 })
  abreviacion: string;

  @OneToMany(() => ProductoUnidad, productoUnidad => productoUnidad.unidad_medida)
  producto_unidades: ProductoUnidad[];

  @OneToMany(() => Conversion, conversion => conversion.unidad_origen)
  conversiones_origen: Conversion[];

  @OneToMany(() => Conversion, conversion => conversion.unidad_destino)
  conversiones_destino: Conversion[];
}