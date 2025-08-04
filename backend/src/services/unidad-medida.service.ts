import { AppDataSource } from '../config/database';
import { UnidadMedida } from '../entities/unidad-medida.entity';
import { ProductoUnidad } from '../entities/producto-unidad.entity';
import { IUnidadMedida } from '../types';

export class UnidadMedidaService {
  private unidadRepository = AppDataSource.getRepository(UnidadMedida);
  private productoUnidadRepository = AppDataSource.getRepository(ProductoUnidad);

  async findAll(page: number = 1, limit: number = 10) {
    const [data, total] = await this.unidadRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: {
        nombre: 'ASC'
      }
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async findOne(id: number): Promise<UnidadMedida | null> {
    return await this.unidadRepository.findOne({
      where: { id }
    });
  }

  async create(unidadData: IUnidadMedida): Promise<UnidadMedida> {
    const unidad = this.unidadRepository.create(unidadData);
    return await this.unidadRepository.save(unidad);
  }

  async update(id: number, unidadData: Partial<IUnidadMedida>): Promise<UnidadMedida> {
    const unidad = await this.findOne(id);
    if (!unidad) {
      throw new Error('Unidad de medida no encontrada');
    }
    
    Object.assign(unidad, unidadData);
    return await this.unidadRepository.save(unidad);
  }

  async delete(id: number): Promise<void> {
    // Verificar si tiene relaciones
    const productoUnidades = await this.productoUnidadRepository.count({
      where: { unidad_medida_id: id }
    });

    if (productoUnidades > 0) {
      throw new Error('No se puede eliminar la unidad porque está asociada a productos');
    }

    const result = await this.unidadRepository.delete(id);
    if (result.affected === 0) {
      throw new Error('Unidad de medida no encontrada');
    }
  }

  async search(query: string) {
    return await this.unidadRepository
      .createQueryBuilder('unidad')
      .where('unidad.nombre ILIKE :query', { query: `%${query}%` })
      .orWhere('unidad.abreviacion ILIKE :query', { query: `%${query}%` })
      .orderBy('unidad.nombre', 'ASC')
      .getMany();
  }

  async getAll() {
    return await this.unidadRepository.find({
      order: { nombre: 'ASC' }
    });
  }
}