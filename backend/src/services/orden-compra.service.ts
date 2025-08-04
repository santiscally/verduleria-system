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

  async generarSugerencia() {
    // Obtener todos los pedidos pendientes con sus detalles
    const pedidosPendientes = await this.pedidoRepository.find({
      where: { estado: EstadoPedido.PENDIENTE },
      relations: ['detalles', 'detalles.producto_unidad', 'detalles.producto_unidad.producto', 'detalles.producto_unidad.unidad_medida']
    });

    if (pedidosPendientes.length === 0) {
      return { sugerencias: [], pedidos: [] };
    }

    // Agrupar cantidades por producto (no por producto-unidad)
    const necesidadesPorProducto = new Map<number, Map<number, number>>();
    
    for (const pedido of pedidosPendientes) {
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

    // Generar sugerencias considerando stock y conversiones
    const sugerencias: SugerenciaCompra[] = [];
    
    for (const [productoId, unidadesCantidades] of necesidadesPorProducto) {
      // Buscar la unidad de compra por defecto para este producto
      const unidadCompra = await this.productoUnidadRepository.findOne({
        where: {
          producto_id: productoId,
          es_unidad_compra: true
        },
        relations: ['producto', 'unidad_medida']
      });

      if (!unidadCompra) {
        // Si no hay unidad de compra, usar cada unidad por separado
        for (const [unidadId, cantidadNecesaria] of unidadesCantidades) {
          const productoUnidad = await this.productoUnidadRepository.findOne({
            where: {
              producto_id: productoId,
              unidad_medida_id: unidadId
            },
            relations: ['producto', 'unidad_medida']
          });

          if (productoUnidad) {
            const stockActual = Number(productoUnidad.stock_actual);
            const cantidadAComprar = Math.max(0, cantidadNecesaria - stockActual);

            if (cantidadAComprar > 0) {
              sugerencias.push({
                producto_unidad_id: productoUnidad.id,
                cantidad_necesaria: cantidadNecesaria,
                cantidad_stock: stockActual,
                cantidad_sugerida: cantidadAComprar,
                producto_unidad: productoUnidad
              });
            }
          }
        }
        continue;
      }

      // Convertir todas las cantidades a la unidad de compra
      let totalEnUnidadCompra = 0;
      let stockTotalEnUnidadCompra = 0;

      for (const [unidadId, cantidadNecesaria] of unidadesCantidades) {
        if (unidadId === unidadCompra.unidad_medida_id) {
          // Ya está en unidad de compra
          totalEnUnidadCompra += cantidadNecesaria;
          stockTotalEnUnidadCompra += Number(unidadCompra.stock_actual);
        } else {
          // Buscar conversión
          const conversion = await this.conversionRepository.findOne({
            where: {
              producto_id: productoId,
              unidad_origen_id: unidadId,
              unidad_destino_id: unidadCompra.unidad_medida_id
            }
          });

          if (conversion) {
            // Convertir cantidad a unidad de compra
            const cantidadConvertida = cantidadNecesaria * Number(conversion.factor_conversion);
            totalEnUnidadCompra += cantidadConvertida;
            
            // Obtener stock de esta unidad y convertirlo
            const productoUnidad = await this.productoUnidadRepository.findOne({
              where: {
                producto_id: productoId,
                unidad_medida_id: unidadId
              }
            });
            
            if (productoUnidad) {
              const stockConvertido = Number(productoUnidad.stock_actual) * Number(conversion.factor_conversion);
              stockTotalEnUnidadCompra += stockConvertido;
            }
          } else {
            // Si no hay conversión, es un error pero lo agregamos por separado
            const productoUnidad = await this.productoUnidadRepository.findOne({
              where: {
                producto_id: productoId,
                unidad_medida_id: unidadId
              },
              relations: ['producto', 'unidad_medida']
            });

            if (productoUnidad) {
              const stockActual = Number(productoUnidad.stock_actual);
              const cantidadAComprar = Math.max(0, cantidadNecesaria - stockActual);

              if (cantidadAComprar > 0) {
                sugerencias.push({
                  producto_unidad_id: productoUnidad.id,
                  cantidad_necesaria: cantidadNecesaria,
                  cantidad_stock: stockActual,
                  cantidad_sugerida: cantidadAComprar,
                  producto_unidad: productoUnidad
                });
              }
            }
          }
        }
      }

      // Calcular cantidad a comprar considerando stock total
      const cantidadTotalAComprar = Math.max(0, totalEnUnidadCompra - stockTotalEnUnidadCompra);

      if (cantidadTotalAComprar > 0) {
        // Separar en unidades enteras y fracción
        const unidadesEnteras = Math.floor(cantidadTotalAComprar);
        const fraccion = cantidadTotalAComprar - unidadesEnteras;

        // Agregar unidades enteras de compra
        if (unidadesEnteras > 0) {
          sugerencias.push({
            producto_unidad_id: unidadCompra.id,
            cantidad_necesaria: totalEnUnidadCompra,
            cantidad_stock: stockTotalEnUnidadCompra,
            cantidad_sugerida: unidadesEnteras,
            producto_unidad: unidadCompra
          });
        }

        // Si hay fracción, buscar una unidad menor para expresarla
        if (fraccion > 0.001) {
          // Buscar conversiones inversas para encontrar una unidad menor
          const conversionesInversas = await this.conversionRepository.find({
            where: {
              producto_id: productoId,
              unidad_destino_id: unidadCompra.unidad_medida_id
            },
            relations: ['unidad_origen']
          });

          if (conversionesInversas.length > 0) {
            // Usar la primera unidad menor encontrada
            const conversionInversa = conversionesInversas[0];
            const cantidadEnUnidadMenor = fraccion / Number(conversionInversa.factor_conversion);
            
            const productoUnidadMenor = await this.productoUnidadRepository.findOne({
              where: {
                producto_id: productoId,
                unidad_medida_id: conversionInversa.unidad_origen_id
              },
              relations: ['producto', 'unidad_medida']
            });

            if (productoUnidadMenor) {
              sugerencias.push({
                producto_unidad_id: productoUnidadMenor.id,
                cantidad_necesaria: 0,
                cantidad_stock: 0,
                cantidad_sugerida: cantidadEnUnidadMenor,
                producto_unidad: productoUnidadMenor
              });
            }
          } else {
            // Si no hay unidad menor, agregar la fracción en la misma unidad
            sugerencias.push({
              producto_unidad_id: unidadCompra.id,
              cantidad_necesaria: 0,
              cantidad_stock: 0,
              cantidad_sugerida: fraccion,
              producto_unidad: unidadCompra
            });
          }
        }
      }
    }

    return {
      sugerencias,
      pedidos: pedidosPendientes
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