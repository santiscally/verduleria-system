import { AppDataSource } from '../config/database';
import { OrdenCompra } from '../entities/orden-compra.entity';
import { OrdenCompraDetalle } from '../entities/orden-compra-detalle.entity';
import { Pedido } from '../entities/pedido.entity';
import { PedidoDetalle } from '../entities/pedido-detalle.entity';
import { ProductoUnidad } from '../entities/producto-unidad.entity';
import { Conversion } from '../entities/conversion.entity';
import { IOrdenCompra, EstadoOrdenCompra, EstadoPedido, EstadoCompra } from '../types';
import { Compra, CompraDetalle } from '../entities';

interface SugerenciaCompra {
  producto_unidad_id: number;
  cantidad_necesaria: number;
  cantidad_stock: number;
  cantidad_sugerida: number;
  producto_unidad?: ProductoUnidad;
}

export class OrdenCompraService {
  private ordenCompraRepository = AppDataSource.getRepository(OrdenCompra);
  private ordenCompraDetalleRepository = AppDataSource.getRepository(OrdenCompraDetalle);
  private pedidoRepository = AppDataSource.getRepository(Pedido);
  private pedidoDetalleRepository = AppDataSource.getRepository(PedidoDetalle);
  private productoUnidadRepository = AppDataSource.getRepository(ProductoUnidad);
  private conversionRepository = AppDataSource.getRepository(Conversion);

  async findAll(page: number = 1, limit: number = 10) {
    const [data, total] = await this.ordenCompraRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      relations: ['detalles', 'detalles.producto_unidad', 'detalles.producto_unidad.producto', 'detalles.producto_unidad.unidad_medida'],
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

  async findOne(id: number): Promise<OrdenCompra | null> {
    return await this.ordenCompraRepository.findOne({
      where: { id },
      relations: ['detalles', 'detalles.producto_unidad', 'detalles.producto_unidad.producto', 'detalles.producto_unidad.unidad_medida']
    });
  }

// Reemplazar el método generarSugerencia en orden-compra.service.ts
// Solo incluyo el método que necesitas cambiar

  async generarSugerencia() {
    // Obtener pedidos pendientes
    const pedidos = await this.pedidoRepository.find({
      where: { estado: EstadoPedido.PENDIENTE },
      relations: ['detalles', 'detalles.producto_unidad', 'detalles.producto_unidad.producto', 'detalles.producto_unidad.unidad_medida']
    });

    if (pedidos.length === 0) {
      return {
        sugerencias: [],
        pedidos: []
      };
    }

    // Agrupar necesidades por producto
    const necesidadesPorProducto = new Map<number, Map<number, number>>();
    
    for (const pedido of pedidos) {
      for (const detalle of pedido.detalles) {
        const productoId = detalle.producto_unidad.producto_id;
        const unidadId = detalle.producto_unidad.unidad_medida_id;
        
        if (!necesidadesPorProducto.has(productoId)) {
          necesidadesPorProducto.set(productoId, new Map());
        }
        
        const unidadesProducto = necesidadesPorProducto.get(productoId)!;
        const cantidadActual = unidadesProducto.get(unidadId) || 0;
        unidadesProducto.set(unidadId, cantidadActual + Number(detalle.cantidad));
      }
    }

    // Generar sugerencias de compra
    const sugerencias: SugerenciaCompra[] = [];

    for (const [productoId, unidades] of necesidadesPorProducto.entries()) {
      // Buscar todas las unidades disponibles para este producto
      const unidadesCompra = await this.productoUnidadRepository.find({
        where: { producto_id: productoId },
        relations: ['producto', 'unidad_medida']
      });

      if (unidadesCompra.length === 0) {
        console.warn(`Producto ${productoId} sin unidades configuradas`);
        continue;
      }

      // Buscar unidad de compra preferida
      const unidadCompra = unidadesCompra.find(pu => pu.es_unidad_compra);

      if (!unidadCompra) {
        // Si NO hay unidad de compra definida, crear una sugerencia por cada unidad de medida
        console.warn(`Producto ${productoId} sin unidad de compra definida. Generando sugerencias por cada unidad.`);
        
        for (const [unidadId, cantidadNecesaria] of unidades.entries()) {
          const unidadProducto = unidadesCompra.find(pu => pu.unidad_medida_id === unidadId);
          
          if (unidadProducto) {
            const stockActual = Math.floor(Number(unidadProducto.stock_actual));
            const cantidadNecesariaRedondeada = cantidadNecesaria;
            const cantidadAComprar = Math.max(0, cantidadNecesariaRedondeada - stockActual);

            if (cantidadAComprar > 0) {
              sugerencias.push({
                producto_unidad_id: unidadProducto.id,
                cantidad_necesaria: cantidadNecesariaRedondeada,
                cantidad_stock: stockActual,
                cantidad_sugerida: cantidadAComprar,
                producto_unidad: unidadProducto
              });
            }
          }
        }
        continue; // Pasar al siguiente producto
      }

      // Si HAY unidad de compra, intentar convertir todo a esa unidad
      let totalEnUnidadCompra = 0;
      const unidadesSinConversion: Map<number, number> = new Map();

      for (const [unidadId, cantidadNecesaria] of unidades.entries()) {
        if (unidadId === unidadCompra.unidad_medida_id) {
          // Ya está en la unidad correcta
          totalEnUnidadCompra += cantidadNecesaria;
        } else {
          // Buscar conversión
          const conversionDirecta = await this.conversionRepository.findOne({
            where: {
              producto_id: productoId,
              unidad_origen_id: unidadId,
              unidad_destino_id: unidadCompra.unidad_medida_id
            }
          });

          const conversionInversa = await this.conversionRepository.findOne({
            where: {
              producto_id: productoId,
              unidad_origen_id: unidadCompra.unidad_medida_id,
              unidad_destino_id: unidadId
            }
          });

          if (conversionDirecta) {
            // Si hay conversión directa, convertir y sumar
            totalEnUnidadCompra += cantidadNecesaria * Number(conversionDirecta.factor_conversion);
          } else if (conversionInversa) {
            // Si hay conversión inversa, convertir y sumar
            totalEnUnidadCompra += cantidadNecesaria / Number(conversionInversa.factor_conversion);
          } else {
            // NO hay conversión - guardar para procesar por separado
            console.warn(`No se encontró conversión para producto ${productoId} de unidad ${unidadId} a ${unidadCompra.unidad_medida_id}`);
            unidadesSinConversion.set(unidadId, cantidadNecesaria);
          }
        }
      }

      // Crear sugerencia para la unidad de compra principal (si hay algo que comprar)
      if (totalEnUnidadCompra > 0) {
        const stockActual = Math.floor(Number(unidadCompra.stock_actual));
        const cantidadNecesariaRedondeada = totalEnUnidadCompra;
        const cantidadAComprar = Math.max(0, cantidadNecesariaRedondeada - stockActual);

        if (cantidadAComprar > 0) {
          sugerencias.push({
            producto_unidad_id: unidadCompra.id,
            cantidad_necesaria: cantidadNecesariaRedondeada,
            cantidad_stock: stockActual,
            cantidad_sugerida: cantidadAComprar,
            producto_unidad: unidadCompra
          });
        }
      }

      // Crear sugerencias separadas para las unidades sin conversión
      for (const [unidadId, cantidadNecesaria] of unidadesSinConversion.entries()) {
        const unidadProducto = unidadesCompra.find(pu => pu.unidad_medida_id === unidadId);
        
        if (unidadProducto) {
          const stockActual = Math.floor(Number(unidadProducto.stock_actual));
          const cantidadNecesariaRedondeada = cantidadNecesaria;
          const cantidadAComprar = Math.max(0, cantidadNecesariaRedondeada - stockActual);

          if (cantidadAComprar > 0) {
            sugerencias.push({
              producto_unidad_id: unidadProducto.id,
              cantidad_necesaria: cantidadNecesariaRedondeada,
              cantidad_stock: stockActual,
              cantidad_sugerida: cantidadAComprar,
              producto_unidad: unidadProducto
            });
          }
        }
      }
    }

    return {
      sugerencias,
      pedidos
    };
  }

  async create(detalles: { producto_unidad_id: number; cantidad_sugerida: number; }[]) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Crear orden de compra
      const ordenCompra = this.ordenCompraRepository.create({
        fecha_orden: new Date(),
        estado: EstadoOrdenCompra.BORRADOR,
        total_estimado: 0,
        observaciones: 'Generada automáticamente desde pedidos pendientes'
      });
      
      const ordenGuardada = await queryRunner.manager.save(ordenCompra);

      // Crear detalles
      for (const detalle of detalles) {
        const ordenDetalle = this.ordenCompraDetalleRepository.create({
          orden_compra_id: ordenGuardada.id,
          producto_unidad_id: detalle.producto_unidad_id,
          cantidad_sugerida: detalle.cantidad_sugerida
        });
        await queryRunner.manager.save(ordenDetalle);
      }

      // Actualizar estado de pedidos a EN_COMPRA
      await queryRunner.manager.update(
        Pedido,
        { estado: EstadoPedido.PENDIENTE },
        { estado: EstadoPedido.EN_COMPRA, incluido_en_compra: true }
      );

      await queryRunner.commitTransaction();

      return await this.findOne(ordenGuardada.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async update(id: number, data: Partial<IOrdenCompra>) {
    const orden = await this.findOne(id);
    if (!orden) {
      throw new Error('Orden de compra no encontrada');
    }

    Object.assign(orden, data);
    return await this.ordenCompraRepository.save(orden);
  }

  async updateDetalle(id: number, detalleId: number, cantidad: number) {
    const detalle = await this.ordenCompraDetalleRepository.findOne({
      where: { id: detalleId, orden_compra_id: id }
    });

    if (!detalle) {
      throw new Error('Detalle no encontrado');
    }

    detalle.cantidad_sugerida = cantidad;
    return await this.ordenCompraDetalleRepository.save(detalle);
  }

  async deleteDetalle(id: number, detalleId: number) {
    const result = await this.ordenCompraDetalleRepository.delete({
      id: detalleId,
      orden_compra_id: id
    });

    if (result.affected === 0) {
      throw new Error('Detalle no encontrado');
    }
  }

async confirmar(id: number) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const orden = await this.findOne(id);
      if (!orden) {
        throw new Error('Orden de compra no encontrada');
      }

      if (orden.estado !== EstadoOrdenCompra.BORRADOR) {
        throw new Error('Solo se pueden confirmar órdenes en estado borrador');
      }

      // Actualizar estado de la orden
      orden.estado = EstadoOrdenCompra.CONFIRMADA;
      await queryRunner.manager.save(orden);

      // Crear compra automáticamente con los detalles de la orden
      const compra = queryRunner.manager.create(Compra, {
        orden_compra_id: id,
        fecha_compra: new Date(),
        estado: EstadoCompra.PENDIENTE,
        total_real: 0,
        confirmada: false
      });

      const compraGuardada = await queryRunner.manager.save(compra);
      console.log("COMPRA GUARDADA")
      console.log(compraGuardada)
      // Crear detalles de compra basados en la orden
      for (const detalleOrden of orden.detalles) {
        const compraDetalle = queryRunner.manager.create(CompraDetalle, {
          compra_id: compraGuardada.id,
          producto_unidad_id: detalleOrden.producto_unidad_id,
          cantidad: detalleOrden.cantidad_sugerida,
          precio_unitario: 0 // Se debe actualizar manualmente
        });
        await queryRunner.manager.save(compraDetalle);
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
      const orden = await this.findOne(id);
      if (!orden) {
        throw new Error('Orden de compra no encontrada');
      }

      // Actualizar estado de la orden
      orden.estado = EstadoOrdenCompra.CANCELADA;
      await queryRunner.manager.save(orden);

      // Revertir pedidos a estado PENDIENTE
      await queryRunner.manager.update(
        Pedido,
        { estado: EstadoPedido.EN_COMPRA, incluido_en_compra: true },
        { estado: EstadoPedido.PENDIENTE, incluido_en_compra: false }
      );

      await queryRunner.commitTransaction();
      return orden;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}