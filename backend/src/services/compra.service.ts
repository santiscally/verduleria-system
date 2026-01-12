// backend/src/services/compra.service.ts

import { AppDataSource } from '../config/database';
import { Compra } from '../entities/compra.entity';
import { CompraDetalle } from '../entities/compra-detalle.entity';
import { HistoricoPreciosCompra } from '../entities/historico-precios-compra.entity';
import { OrdenCompra } from '../entities/orden-compra.entity';
import { OrdenCompraDetalle } from '../entities/orden-compra-detalle.entity';
import { ProductoUnidad } from '../entities/producto-unidad.entity';
import { Pedido } from '../entities/pedido.entity';
import { UnidadMedida } from '../entities/unidad-medida.entity';
import { Conversion } from '../entities/conversion.entity';
import { ICompra, EstadoCompra, EstadoOrdenCompra, EstadoPedido } from '../types';

interface CompraDetalleInput {
  producto_unidad_id: number;
  cantidad: number;
  precio_unitario: number;
}

interface UpdateKgRealesInput {
  cantidad_kg_real: number;
}

export class CompraService {
  private compraRepository = AppDataSource.getRepository(Compra);
  private compraDetalleRepository = AppDataSource.getRepository(CompraDetalle);
  private historicoPreciosCompraRepository = AppDataSource.getRepository(HistoricoPreciosCompra);
  private ordenCompraRepository = AppDataSource.getRepository(OrdenCompra);
  private ordenCompraDetalleRepository = AppDataSource.getRepository(OrdenCompraDetalle);
  private productoUnidadRepository = AppDataSource.getRepository(ProductoUnidad);
  private pedidoRepository = AppDataSource.getRepository(Pedido);
  private unidadMedidaRepository = AppDataSource.getRepository(UnidadMedida);
  private conversionRepository = AppDataSource.getRepository(Conversion);

  async findAll(page: number = 1, limit: number = 10) {
    const [data, total] = await this.compraRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      relations: [
        'orden_compra',
        'detalles',
        'detalles.producto_unidad',
        'detalles.producto_unidad.producto',
        'detalles.producto_unidad.unidad_medida'
      ],
      order: { created_at: 'DESC' }
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async findOne(id: number): Promise<Compra | null> {
    return await this.compraRepository.findOne({
      where: { id },
      relations: [
        'orden_compra',
        'detalles',
        'detalles.producto_unidad',
        'detalles.producto_unidad.producto',
        'detalles.producto_unidad.unidad_medida'
      ]
    });
  }

  async createFromOrden(ordenCompraId: number, detalles: CompraDetalleInput[]) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const ordenCompra = await this.ordenCompraRepository.findOne({
        where: { id: ordenCompraId },
        relations: ['detalles']
      });

      if (!ordenCompra) {
        throw new Error('Orden de compra no encontrada');
      }

      if (ordenCompra.estado !== EstadoOrdenCompra.CONFIRMADA) {
        throw new Error('La orden de compra debe estar confirmada');
      }

      const compraExistente = await this.compraRepository.findOne({
        where: { orden_compra_id: ordenCompraId }
      });

      if (compraExistente) {
        throw new Error('Ya existe una compra para esta orden');
      }

      const compra = this.compraRepository.create({
        orden_compra_id: ordenCompraId,
        fecha_compra: new Date(),
        estado: EstadoCompra.PENDIENTE,
        total_real: 0,
        confirmada: false
      });

      const compraGuardada = await queryRunner.manager.save(compra);

      let totalReal = 0;
      for (const detalle of detalles) {
        const compraDetalle = this.compraDetalleRepository.create({
          compra_id: compraGuardada.id,
          producto_unidad_id: detalle.producto_unidad_id,
          cantidad: detalle.cantidad,
          precio_unitario: detalle.precio_unitario,
          cantidad_kg_real: null,
          precio_por_kg: null
        });

        await queryRunner.manager.save(compraDetalle);
        totalReal += detalle.cantidad * detalle.precio_unitario;

        await queryRunner.manager.update(
          OrdenCompraDetalle,
          { 
            orden_compra_id: ordenCompraId,
            producto_unidad_id: detalle.producto_unidad_id
          },
          { cantidad_comprada: detalle.cantidad }
        );
      }

      compraGuardada.total_real = totalReal;
      await queryRunner.manager.save(compraGuardada);

      ordenCompra.estado = EstadoOrdenCompra.COMPLETADA;
      await queryRunner.manager.save(ordenCompra);

      await queryRunner.commitTransaction();

      return await this.findOne(compraGuardada.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async createManual(detalles: CompraDetalleInput[]) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const compra = this.compraRepository.create({
        fecha_compra: new Date(),
        estado: EstadoCompra.PENDIENTE,
        total_real: 0,
        confirmada: false
      });

      const compraGuardada = await queryRunner.manager.save(compra);

      let totalReal = 0;
      for (const detalle of detalles) {
        const compraDetalle = this.compraDetalleRepository.create({
          compra_id: compraGuardada.id,
          producto_unidad_id: detalle.producto_unidad_id,
          cantidad: detalle.cantidad,
          precio_unitario: detalle.precio_unitario,
          cantidad_kg_real: null,
          precio_por_kg: null
        });

        await queryRunner.manager.save(compraDetalle);
        totalReal += detalle.cantidad * detalle.precio_unitario;
      }

      compraGuardada.total_real = totalReal;
      await queryRunner.manager.save(compraGuardada);

      await queryRunner.commitTransaction();

      return await this.findOne(compraGuardada.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async update(id: number, data: Partial<ICompra>) {
    const compra = await this.findOne(id);
    if (!compra) {
      throw new Error('Compra no encontrada');
    }

    if (compra.confirmada) {
      throw new Error('No se puede modificar una compra confirmada');
    }

    Object.assign(compra, data);
    return await this.compraRepository.save(compra);
  }

  async updateDetalle(id: number, detalleId: number, data: Partial<CompraDetalleInput>) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const detalle = await this.compraDetalleRepository.findOne({
        where: { id: detalleId, compra_id: id },
        relations: ['compra']
      });

      if (!detalle) {
        throw new Error('Detalle no encontrado');
      }

      if (detalle.compra.confirmada) {
        throw new Error('No se puede modificar una compra confirmada');
      }

      Object.assign(detalle, data);
      await queryRunner.manager.save(detalle);

      const detalles = await queryRunner.manager.find(CompraDetalle, {
        where: { compra_id: id }
      });

      let totalReal = 0;
      for (const d of detalles) {
        totalReal += Number(d.cantidad) * Number(d.precio_unitario);
      }

      await queryRunner.manager.update(Compra, id, { total_real: totalReal });

      await queryRunner.commitTransaction();

      return detalle;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // NUEVO: Método para actualizar kg reales de un detalle
  async updateKgReales(compraId: number, detalleId: number, data: UpdateKgRealesInput) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const detalle = await this.compraDetalleRepository.findOne({
        where: { id: detalleId, compra_id: compraId },
        relations: ['compra', 'producto_unidad', 'producto_unidad.unidad_medida']
      });

      if (!detalle) {
        throw new Error('Detalle no encontrado');
      }

      if (detalle.compra.confirmada) {
        throw new Error('No se puede modificar una compra confirmada');
      }

      // Calcular precio por kg
      const totalPagado = Number(detalle.cantidad) * Number(detalle.precio_unitario);
      const precioPorKg = totalPagado / data.cantidad_kg_real;

      detalle.cantidad_kg_real = data.cantidad_kg_real;
      detalle.precio_por_kg = precioPorKg;

      await queryRunner.manager.save(detalle);
      await queryRunner.commitTransaction();

      return detalle;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // NUEVO: Obtener warnings de detalles sin kg reales
  async getWarningsKgReales(compraId: number): Promise<string[]> {
    const compra = await this.findOne(compraId);
    if (!compra) {
      throw new Error('Compra no encontrada');
    }

    const warnings: string[] = [];

    for (const detalle of compra.detalles || []) {
      const unidadNombre = detalle.producto_unidad?.unidad_medida?.nombre?.toLowerCase() || '';
      const esKg = ['kg', 'kilo', 'kilogramo', 'kilogramos'].includes(unidadNombre);

      if (!esKg && detalle.cantidad_kg_real === null) {
        const productoNombre = detalle.producto_unidad?.producto?.nombre || 'Producto desconocido';
        const unidad = detalle.producto_unidad?.unidad_medida?.nombre || 'unidad';
        warnings.push(`${productoNombre} (${detalle.cantidad} ${unidad}): Falta ingresar kg reales`);
      }
    }

    return warnings;
  }

  async deleteDetalle(id: number, detalleId: number) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const compra = await this.compraRepository.findOne({ where: { id } });
      if (!compra) {
        throw new Error('Compra no encontrada');
      }

      if (compra.confirmada) {
        throw new Error('No se puede modificar una compra confirmada');
      }

      const result = await queryRunner.manager.delete(CompraDetalle, {
        id: detalleId,
        compra_id: id
      });

      if (result.affected === 0) {
        throw new Error('Detalle no encontrado');
      }

      const detalles = await queryRunner.manager.find(CompraDetalle, {
        where: { compra_id: id }
      });

      let totalReal = 0;
      for (const d of detalles) {
        totalReal += Number(d.cantidad) * Number(d.precio_unitario);
      }

      await queryRunner.manager.update(Compra, id, { total_real: totalReal });

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // MODIFICADO: Confirmar compra con lógica de precio_por_kg
  async confirmar(id: number) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const compra = await this.findOne(id);
      if (!compra) {
        throw new Error('Compra no encontrada');
      }

      if (compra.confirmada) {
        throw new Error('La compra ya está confirmada');
      }

      if (!compra.detalles || compra.detalles.length === 0) {
        throw new Error('La compra no tiene detalles');
      }

      for (const detalle of compra.detalles) {
        const productoUnidad = await this.productoUnidadRepository.findOne({
          where: { id: detalle.producto_unidad_id },
          relations: ['unidad_medida']
        });

        if (!productoUnidad) {
          throw new Error(`Producto-Unidad ${detalle.producto_unidad_id} no encontrado`);
        }

        // Actualizar stock
        productoUnidad.stock_actual = Number(productoUnidad.stock_actual) + Number(detalle.cantidad);
        await queryRunner.manager.save(productoUnidad);

        // Calcular precio_por_kg si no se ingresó manualmente
        let precioPorKg = detalle.precio_por_kg;
        
        const unidadNombre = productoUnidad.unidad_medida?.nombre?.toLowerCase() || '';
        const esKg = ['kg', 'kilo', 'kilogramo', 'kilogramos'].includes(unidadNombre);

        if (esKg) {
          precioPorKg = Number(detalle.precio_unitario);
          detalle.cantidad_kg_real = Number(detalle.cantidad);
          detalle.precio_por_kg = precioPorKg;
          await queryRunner.manager.save(detalle);
        } else if (precioPorKg === null && detalle.cantidad_kg_real !== null) {
          const totalPagado = Number(detalle.cantidad) * Number(detalle.precio_unitario);
          precioPorKg = totalPagado / Number(detalle.cantidad_kg_real);
          detalle.precio_por_kg = precioPorKg;
          await queryRunner.manager.save(detalle);
        }

        // Registrar en histórico de precios de compra
        const historico = this.historicoPreciosCompraRepository.create({
          producto_unidad_id: detalle.producto_unidad_id,
          compra_id: id,
          precio: detalle.precio_unitario,
          precio_por_kg: precioPorKg,
          fecha: new Date()
        });
        await queryRunner.manager.save(historico);
      }

      compra.estado = EstadoCompra.CONFIRMADA;
      compra.confirmada = true;
      await queryRunner.manager.save(compra);

      if (compra.orden_compra_id) {
        await queryRunner.manager.update(
          Pedido,
          { estado: EstadoPedido.EN_COMPRA, incluido_en_compra: true },
          { estado: EstadoPedido.EN_PROCESO }
        );
      }

      await queryRunner.commitTransaction();

      return await this.findOne(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async cancelar(id: number) {
    const compra = await this.findOne(id);
    if (!compra) {
      throw new Error('Compra no encontrada');
    }

    if (compra.confirmada) {
      throw new Error('No se puede cancelar una compra confirmada');
    }

    compra.estado = EstadoCompra.CANCELADA;
    return await this.compraRepository.save(compra);
  }

  async getHistoricoPreciosCompra(productoUnidadId: number, limit: number = 10) {
    return await this.historicoPreciosCompraRepository.find({
      where: { producto_unidad_id: productoUnidadId },
      order: { fecha: 'DESC' },
      take: limit,
      relations: ['producto_unidad', 'producto_unidad.producto', 'producto_unidad.unidad_medida']
    });
  }

  // NUEVO: Obtener último precio por kg de un producto
  async getUltimoPrecioPorKg(productoId: number): Promise<number | null> {
    const historico = await this.historicoPreciosCompraRepository
      .createQueryBuilder('hpc')
      .innerJoin('hpc.producto_unidad', 'pu')
      .where('pu.producto_id = :productoId', { productoId })
      .andWhere('hpc.precio_por_kg IS NOT NULL')
      .orderBy('hpc.fecha', 'DESC')
      .getOne();

    return historico?.precio_por_kg || null;
  }
}