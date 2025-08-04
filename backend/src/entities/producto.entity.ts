import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ProductoUnidad } from './producto-unidad.entity';
import { Conversion } from './conversion.entity';
import { IProducto } from '../types';

@Entity('productos')
export class Producto extends BaseEntity implements IProducto {
  @Column({ type: 'varchar', length: 255, unique: true })
  nombre: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  proveedor?: string;

  @OneToMany(() => ProductoUnidad, productoUnidad => productoUnidad.producto)
  producto_unidades: ProductoUnidad[];

  @OneToMany(() => Conversion, conversion => conversion.producto)
  conversiones: Conversion[];
}