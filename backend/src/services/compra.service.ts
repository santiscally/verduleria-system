import { AppDataSource } from '../config/database';
import { Compra } from '../entities/compra.entity';
import { CompraDetalle } from '../entities/compra-detalle.entity';
import { HistoricoPreciosCompra } from '../entities/historico-precios-compra.entity';
import { OrdenCompra } from '../entities/orden-compra.entity';
import { OrdenCompraDetalle } from '../entities/orden-compra-detalle.entity';
import { ProductoUnidad } from '../entities/producto-unidad.entity';
import { Pedido } from '../entities/pedido.entity';
import { ICompra, EstadoCompra, EstadoOrdenCompra, EstadoPedido } from '../types';

interface CompraDetalleInput {
  producto_unidad_id: number;
  cantidad: number;
  precio_unitario: number;
}

export class CompraService {
  private compraRepository = AppDataSource.getRepository(Compra);
  private compraDetalleRepository = AppDataSource.getRepository(CompraDetalle);
  private historicoPreciosCompraRepository = AppDataSource.getRepository(HistoricoPreciosCompra);
  private ordenCompraRepository = AppDataSource.getRepository(OrdenCompra);
  private ordenCompraDetalleRepository = AppDataSource.getRepository(OrdenCompraDetalle);
  private productoUnidadRepository = AppDataSource.getRepository(ProductoUnidad);
  private pedidoRepository = AppDataSource.getRepository(Pedido);

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
      // Verificar que la orden existe y está confirmada
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

      // Verificar que no existe ya una compra para esta orden
      const compraExistente = await this.compraRepository.findOne({
        where: { orden_compra_id: ordenCompraId }
      });

      if (compraExistente) {
        throw new Error('Ya existe una compra para esta orden');
      }

      // Crear la compra
      const compra = this.compraRepository.create({
        orden_compra_id: ordenCompraId,
        fecha_compra: new Date(),
        estado: EstadoCompra.PENDIENTE,
        total_real: 0,
        confirmada: false
      });

      const compraGuardada = await queryRunner.manager.save(compra);

      // Crear detalles de compra
      let totalReal = 0;
      for (const detalle of detalles) {
        const compraDetalle = this.compraDetalleRepository.create({
          compra_id: compraGuardada.id,
          producto_unidad_id: detalle.producto_unidad_id,
          cantidad: detalle.cantidad,
          precio_unitario: detalle.precio_unitario
        });

        await queryRunner.manager.save(compraDetalle);
        totalReal += detalle.cantidad * detalle.precio_unitario;

        // Actualizar cantidad comprada en la orden de compra
        await queryRunner.manager.update(
          OrdenCompraDetalle,
          { 
            orden_compra_id: ordenCompraId,
            producto_unidad_id: detalle.producto_unidad_id
          },
          { cantidad_comprada: detalle.cantidad }
        );
      }

      // Actualizar total real
      compraGuardada.total_real = totalReal;
      await queryRunner.manager.save(compraGuardada);

      // Actualizar estado de la orden a EN_PROCESO
      ordenCompra.estado = EstadoOrdenCompra.EN_PROCESO;
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
      // Crear la compra sin orden asociada
      const compra = this.compraRepository.create({
        fecha_compra: new Date(),
        estado: EstadoCompra.PENDIENTE,
        total_real: 0,
        confirmada: false
      });

      const compraGuardada = await queryRunner.manager.save(compra);

      // Crear detalles de compra
      let totalReal = 0;
      for (const detalle of detalles) {
        const compraDetalle = this.compraDetalleRepository.create({
          compra_id: compraGuardada.id,
          producto_unidad_id: detalle.producto_unidad_id,
          cantidad: detalle.cantidad,
          precio_unitario: detalle.precio_unitario
        });

        await queryRunner.manager.save(compraDetalle);
        totalReal += detalle.cantidad * detalle.precio_unitario;
      }

      // Actualizar total real
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

      // Actualizar detalle
      Object.assign(detalle, data);
      await queryRunner.manager.save(detalle);

      // Recalcular total
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

      // Recalcular total
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

      // Actualizar stock de productos
      for (const detalle of compra.detalles) {
        const productoUnidad = await this.productoUnidadRepository.findOne({
          where: { id: detalle.producto_unidad_id }
        });

        if (!productoUnidad) {
          throw new Error(`Producto-Unidad ${detalle.producto_unidad_id} no encontrado`);
        }

        // Actualizar stock
        productoUnidad.stock_actual = Number(productoUnidad.stock_actual) + Number(detalle.cantidad);
        await queryRunner.manager.save(productoUnidad);

        // Registrar en histórico de precios de compra
        const historico = this.historicoPreciosCompraRepository.create({
          producto_unidad_id: detalle.producto_unidad_id,
          compra_id: id,
          precio: detalle.precio_unitario,
          fecha: new Date()
        });
        await queryRunner.manager.save(historico);
      }

      // Actualizar estado de la compra
      compra.estado = EstadoCompra.CONFIRMADA;
      compra.confirmada = true;
      await queryRunner.manager.save(compra);

      // Si tiene orden asociada, actualizar su estado
      if (compra.orden_compra_id) {
        await queryRunner.manager.update(
          OrdenCompra,
          compra.orden_compra_id,
          { estado: EstadoOrdenCompra.COMPLETADA }
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
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const compra = await this.findOne(id);
      if (!compra) {
        throw new Error('Compra no encontrada');
      }

      if (compra.confirmada) {
        throw new Error('No se puede cancelar una compra confirmada');
      }

      // Actualizar estado de la compra
      compra.estado = EstadoCompra.CANCELADA;
      await queryRunner.manager.save(compra);

      // Si tiene orden asociada, revertir su estado
      if (compra.orden_compra_id) {
        await queryRunner.manager.update(
          OrdenCompra,
          compra.orden_compra_id,
          { estado: EstadoOrdenCompra.CONFIRMADA }
        );

        // Limpiar cantidades compradas
        await queryRunner.manager.update(
          OrdenCompraDetalle,
          { orden_compra_id: compra.orden_compra_id },
          { cantidad_comprada: () => 'NULL' }
        );
      }

      await queryRunner.commitTransaction();

      return compra;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getHistoricoPreciosCompra(productoUnidadId: number, limit: number = 10) {
    return await this.historicoPreciosCompraRepository.find({
      where: { producto_unidad_id: productoUnidadId },
      relations: ['compra'],
      order: { fecha: 'DESC' },
      take: limit
    });
  }
}