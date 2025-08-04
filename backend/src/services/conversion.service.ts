import { AppDataSource } from '../config/database';
import { Conversion } from '../entities/conversion.entity';
import { Producto } from '../entities/producto.entity';
import { UnidadMedida } from '../entities/unidad-medida.entity';
import { ProductoUnidad } from '../entities/producto-unidad.entity';
import { IConversion } from '../types';
import { In } from 'typeorm';

export class ConversionService {
  private conversionRepository = AppDataSource.getRepository(Conversion);
  private productoRepository = AppDataSource.getRepository(Producto);
  private unidadRepository = AppDataSource.getRepository(UnidadMedida);
  private productoUnidadRepository = AppDataSource.getRepository(ProductoUnidad);

  async findAll(page: number = 1, limit: number = 10) {
    const [data, total] = await this.conversionRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      relations: ['producto', 'unidad_origen', 'unidad_destino'],
      order: {
        producto: { nombre: 'ASC' }
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

  async findOne(id: number): Promise<Conversion | null> {
    return await this.conversionRepository.findOne({
      where: { id },
      relations: ['producto', 'unidad_origen', 'unidad_destino']
    });
  }

  async findByProducto(productoId: number): Promise<Conversion[]> {
    return await this.conversionRepository.find({
      where: { producto_id: productoId },
      relations: ['unidad_origen', 'unidad_destino'],
      order: { id: 'ASC' }
    });
  }

  async create(data: IConversion | any): Promise<Conversion> {
    let producto, unidadOrigen, unidadDestino;

    // Si se reciben nombres en lugar de IDs, buscarlos
    if (data.productoNombre) {
      producto = await this.productoRepository.findOne({
        where: { nombre: data.productoNombre }
      });
      if (!producto) {
        throw new Error('Producto no encontrado');
      }

      unidadOrigen = await this.unidadRepository.findOne({
        where: { nombre: data.unidadOrigenNombre }
      });
      if (!unidadOrigen) {
        throw new Error('Unidad de origen no encontrada');
      }

      unidadDestino = await this.unidadRepository.findOne({
        where: { nombre: data.unidadDestinoNombre }
      });
      if (!unidadDestino) {
        throw new Error('Unidad de destino no encontrada');
      }

      // Actualizar data con los IDs encontrados
      data.producto_id = producto.id;
      data.unidad_origen_id = unidadOrigen.id;
      data.unidad_destino_id = unidadDestino.id;
    } else {
      // Lógica original con IDs
      producto = await this.productoRepository.findOne({
        where: { id: data.producto_id }
      });
      if (!producto) {
        throw new Error('Producto no encontrado');
      }

      unidadOrigen = await this.unidadRepository.findOne({
        where: { id: data.unidad_origen_id }
      });
      if (!unidadOrigen) {
        throw new Error('Unidad de origen no encontrada');
      }

      unidadDestino = await this.unidadRepository.findOne({
        where: { id: data.unidad_destino_id }
      });
      if (!unidadDestino) {
        throw new Error('Unidad de destino no encontrada');
      }
    }

    // Verificar que no exista ya la conversión
    const existente = await this.conversionRepository.findOne({
      where: {
        producto_id: data.producto_id,
        unidad_origen_id: data.unidad_origen_id,
        unidad_destino_id: data.unidad_destino_id
      }
    });
    if (existente) {
      throw new Error('Ya existe una conversión para este producto entre estas unidades');
    }

    // Crear relaciones ProductoUnidad si no existen
    await this.ensureProductoUnidadExists(data.producto_id, data.unidad_origen_id);
    await this.ensureProductoUnidadExists(data.producto_id, data.unidad_destino_id);

    // Crear la conversión directa
    const conversion = this.conversionRepository.create(data);
    const conversionGuardada = await this.conversionRepository.save(conversion);
    // Asegurar que retorna la conversión guardada como objeto individual
    const result = Array.isArray(conversionGuardada) ? conversionGuardada[0] : conversionGuardada;

    // Crear automáticamente la conversión inversa (bidireccional)
    const conversionInversa = this.conversionRepository.create({
      producto_id: data.producto_id,
      unidad_origen_id: data.unidad_destino_id,
      unidad_destino_id: data.unidad_origen_id,
      factor_conversion: 1 / data.factor_conversion
    });
    await this.conversionRepository.save(conversionInversa);

    return result;
  }

  async update(id: number, data: Partial<IConversion>): Promise<Conversion> {
    const conversion = await this.findOne(id);
    if (!conversion) {
      throw new Error('Conversión no encontrada');
    }

    // No permitir cambiar producto_id, unidad_origen_id o unidad_destino_id
    delete data.producto_id;
    delete data.unidad_origen_id;
    delete data.unidad_destino_id;

    // Si se actualiza el factor, actualizar también la conversión inversa
    if (data.factor_conversion) {
      const conversionInversa = await this.conversionRepository.findOne({
        where: {
          producto_id: conversion.producto_id,
          unidad_origen_id: conversion.unidad_destino_id,
          unidad_destino_id: conversion.unidad_origen_id
        }
      });

      if (conversionInversa) {
        conversionInversa.factor_conversion = 1 / data.factor_conversion;
        await this.conversionRepository.save(conversionInversa);
      }
    }

    Object.assign(conversion, data);
    return await this.conversionRepository.save(conversion);
  }

  async delete(id: number): Promise<void> {
    const conversion = await this.findOne(id);
    if (!conversion) {
      throw new Error('Conversión no encontrada');
    }

    // Eliminar también la conversión inversa
    await this.conversionRepository.delete({
      producto_id: conversion.producto_id,
      unidad_origen_id: conversion.unidad_destino_id,
      unidad_destino_id: conversion.unidad_origen_id
    });

    await this.conversionRepository.delete(id);
  }

  async convertir(
    productoId: number,
    cantidad: number,
    unidadOrigenId: number,
    unidadDestinoId: number
  ): Promise<number> {
    // Si las unidades son iguales, no hay conversión
    if (unidadOrigenId === unidadDestinoId) {
      return cantidad;
    }

    // Buscar conversión directa
    const conversion = await this.conversionRepository.findOne({
      where: {
        producto_id: productoId,
        unidad_origen_id: unidadOrigenId,
        unidad_destino_id: unidadDestinoId
      }
    });

    if (!conversion) {
      throw new Error('No existe conversión configurada entre estas unidades para este producto');
    }

    return cantidad * Number(conversion.factor_conversion);
  }

  async getConversionesDisponibles(productoId: number): Promise<{
    unidades: UnidadMedida[],
    conversiones: Conversion[]
  }> {
    const conversiones = await this.findByProducto(productoId);
    
    // Obtener todas las unidades únicas involucradas
    const unidadIds = new Set<number>();
    conversiones.forEach(c => {
      unidadIds.add(c.unidad_origen_id);
      unidadIds.add(c.unidad_destino_id);
    });

    const unidades = await this.unidadRepository.findBy({
      id: In(Array.from(unidadIds))
    });

    return { unidades, conversiones };
  }

  private async ensureProductoUnidadExists(productoId: number, unidadId: number): Promise<void> {
    // Verificar si ya existe la relación
    const existente = await this.productoUnidadRepository.findOne({
      where: {
        producto_id: productoId,
        unidad_medida_id: unidadId
      }
    });

    if (!existente) {
      // Verificar si el producto ya tiene alguna unidad de compra
      const unidadesExistentes = await this.productoUnidadRepository.find({
        where: { producto_id: productoId }
      });

      const tieneUnidadCompra = unidadesExistentes.some(pu => pu.es_unidad_compra);
      
      // Crear la relación ProductoUnidad
      const productoUnidad = this.productoUnidadRepository.create({
        producto_id: productoId,
        unidad_medida_id: unidadId,
        margen_ganancia: 50, // Margen por defecto
        stock_actual: 0,
        // Si el producto no tiene unidad de compra, esta nueva unidad puede ser tanto compra como venta
        es_unidad_compra: !tieneUnidadCompra, // Primera unidad del producto será unidad de compra
        es_unidad_venta: true // Siempre unidad de venta
      });

      await this.productoUnidadRepository.save(productoUnidad);
    }
  }
}