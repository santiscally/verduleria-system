
import { Not } from 'typeorm';
import { AppDataSource } from '../config/database';
import { ProductoUnidad } from '../entities/producto-unidad.entity';
import { Producto } from '../entities/producto.entity';
import { UnidadMedida } from '../entities/unidad-medida.entity';
import { IProductoUnidad } from '../types';

export class StockInsuficienteError extends Error {
  constructor(stockActual: number, cantidadSolicitada: number) {
    super(`Stock insuficiente. Stock actual: ${stockActual}, cantidad solicitada: ${cantidadSolicitada}`);
    this.name = 'StockInsuficienteError';
  }
}

export class ProductoNoEncontradoError extends Error {
  constructor(id: number) {
    super(`Producto con ID ${id} no encontrado`);
    this.name = 'ProductoNoEncontradoError';
  }
}
export class ProductoUnidadService {
  private productoUnidadRepository = AppDataSource.getRepository(ProductoUnidad);
  private productoRepository = AppDataSource.getRepository(Producto);
  private unidadRepository = AppDataSource.getRepository(UnidadMedida);

  async findAll(page: number = 1, limit: number = 10) {
    const [data, total] = await this.productoUnidadRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      relations: ['producto', 'unidad_medida'],
      order: {
        producto: { nombre: 'ASC' },
        unidad_medida: { nombre: 'ASC' }
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

  async findOne(id: number): Promise<ProductoUnidad | null> {
    return await this.productoUnidadRepository.findOne({
      where: { id },
      relations: ['producto', 'unidad_medida']
    });
  }

  async findByProducto(productoId: number): Promise<ProductoUnidad[]> {
    return await this.productoUnidadRepository.find({
      where: { producto_id: productoId },
      relations: ['unidad_medida'],
      order: { unidad_medida: { nombre: 'ASC' } }
    });
  }

  async create(data: IProductoUnidad): Promise<ProductoUnidad> {
    // Verificar que el producto existe
    const producto = await this.productoRepository.findOne({
      where: { id: data.producto_id }
    });
    if (!producto) {
      throw new Error('Producto no encontrado');
    }

    // Verificar que la unidad existe
    const unidad = await this.unidadRepository.findOne({
      where: { id: data.unidad_medida_id }
    });
    if (!unidad) {
      throw new Error('Unidad de medida no encontrada');
    }

    // Verificar que no exista ya la relación
    const existente = await this.productoUnidadRepository.findOne({
      where: {
        producto_id: data.producto_id,
        unidad_medida_id: data.unidad_medida_id
      }
    });
    if (existente) {
      throw new Error('Ya existe una relación entre este producto y unidad de medida');
    }

    const productoUnidad = this.productoUnidadRepository.create(data);
    return await this.productoUnidadRepository.save(productoUnidad);
  }

  async update(id: number, data: Partial<IProductoUnidad>): Promise<ProductoUnidad> {
    const productoUnidad = await this.productoUnidadRepository.findOne({
      where: { id },
      relations: ['producto', 'unidad_medida']
    });

    if (!productoUnidad) {
      throw new Error('Relación producto-unidad no encontrada');
    }

    // Validación: Si se está intentando marcar como unidad de compra
    if (data.es_unidad_compra === true && !productoUnidad.es_unidad_compra) {
      // Verificar si ya existe otra unidad de compra para este producto
      const unidadCompraExistente = await this.productoUnidadRepository.findOne({
        where: {
          producto_id: productoUnidad.producto_id,
          es_unidad_compra: true,
          id: Not(id) // Excluir el registro actual
        }
      });

      if (unidadCompraExistente) {
        throw new Error(`Ya existe una unidad de compra para el producto ${productoUnidad.producto?.nombre || productoUnidad.producto_id}. Solo puede haber una unidad de compra por producto.`);
      }
    }

    Object.assign(productoUnidad, data);
    return await this.productoUnidadRepository.save(productoUnidad);
  }

  async delete(id: number): Promise<void> {
    const result = await this.productoUnidadRepository.delete(id);
    if (result.affected === 0) {
      throw new Error('Relación producto-unidad no encontrada');
    }
  }

async updateStock(id: number, cantidad: number, operacion: 'sumar' | 'restar' | 'establecer'): Promise<ProductoUnidad> {
  const productoUnidad = await this.findOne(id);
  try {

    if (!productoUnidad) {
      throw new ProductoNoEncontradoError(id); 
    }

    switch (operacion) {
      case 'sumar':
        productoUnidad.stock_actual = Number(productoUnidad.stock_actual) + cantidad;
        break;
      case 'restar':
        const nuevoStock = Number(productoUnidad.stock_actual) - cantidad;
        productoUnidad.stock_actual = nuevoStock;
        break;
      case 'establecer':
        productoUnidad.stock_actual = cantidad;
        break;
    }

    return await this.productoUnidadRepository.save(productoUnidad);
  } catch (error) {
    // Si es un error de base de datos, lo manejamos aquí
    if (error instanceof Error && !['StockInsuficienteError', 'ProductoNoEncontradoError'].includes(error.name)) {
      console.error('Error de base de datos:', error);
      // Retornamos el objeto sin guardar o un objeto vacío
      return productoUnidad || {} as ProductoUnidad;
    }
    // Si es un error de negocio, lo propagamos para que el controlador lo maneje
    throw error;
  }
}

  async getUnidadesCompra(): Promise<ProductoUnidad[]> {
    return await this.productoUnidadRepository.find({
      where: { es_unidad_compra: true },
      relations: ['producto', 'unidad_medida'],
      order: {
        producto: { nombre: 'ASC' }
      }
    });
  }

  async getUnidadesVenta(): Promise<ProductoUnidad[]> {
    return await this.productoUnidadRepository.find({
      where: { es_unidad_venta: true },
      relations: ['producto', 'unidad_medida'],
      order: {
        producto: { nombre: 'ASC' }
      }
    });
  }
}