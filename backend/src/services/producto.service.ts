import { AppDataSource } from '../config/database';
import { Producto } from '../entities/producto.entity';
import { ProductoUnidad } from '../entities/producto-unidad.entity';
import { IProducto } from '../types';

export class ProductoService {
  private productoRepository = AppDataSource.getRepository(Producto);
  private productoUnidadRepository = AppDataSource.getRepository(ProductoUnidad);

  async findAll(page: number = 1, limit: number = 10) {
    const [data, total] = await this.productoRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: {
        nombre: 'ASC'
      },
      relations: ['producto_unidades', 'producto_unidades.unidad_medida']
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async findOne(id: number): Promise<Producto | null> {
    return await this.productoRepository.findOne({
      where: { id },
      relations: ['producto_unidades', 'producto_unidades.unidad_medida', 'conversiones']
    });
  }

  async create(productoData: IProducto): Promise<Producto> {
    const producto = this.productoRepository.create(productoData);
    return await this.productoRepository.save(producto);
  }

  async update(id: number, productoData: Partial<IProducto>): Promise<Producto> {
    const producto = await this.findOne(id);
    if (!producto) {
      throw new Error('Producto no encontrado');
    }
    
    Object.assign(producto, productoData);
    return await this.productoRepository.save(producto);
  }

  async delete(id: number): Promise<void> {
    // Verificar si tiene relaciones
    const productoUnidades = await this.productoUnidadRepository.count({
      where: { producto_id: id }
    });

    if (productoUnidades > 0) {
      throw new Error('No se puede eliminar el producto porque tiene unidades asociadas');
    }

    const result = await this.productoRepository.delete(id);
    if (result.affected === 0) {
      throw new Error('Producto no encontrado');
    }
  }

  async search(query: string) {
    return await this.productoRepository
      .createQueryBuilder('producto')
      .leftJoinAndSelect('producto.producto_unidades', 'producto_unidades')
      .leftJoinAndSelect('producto_unidades.unidad_medida', 'unidad_medida')
      .where('producto.nombre ILIKE :query', { query: `%${query}%` })
      .orWhere('producto.proveedor ILIKE :query', { query: `%${query}%` })
      .orderBy('producto.nombre', 'ASC')
      .getMany();
  }

  async getProductosConStock() {
    return await this.productoRepository
      .createQueryBuilder('producto')
      .leftJoinAndSelect('producto.producto_unidades', 'pu')
      .leftJoinAndSelect('pu.unidad_medida', 'um')
      .where('pu.stock_actual > 0')
      .orderBy('producto.nombre', 'ASC')
      .getMany();
  }
}