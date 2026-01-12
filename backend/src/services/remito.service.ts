// backend/src/services/remito.service.ts

import { AppDataSource } from '../config/database';
import { Remito } from '../entities/remito.entity';
import { Pedido } from '../entities/pedido.entity';
import { HistoricoPrecios } from '../entities/historico-precios.entity';
import { HistoricoPreciosCompra } from '../entities/historico-precios-compra.entity';
import { Conversion } from '../entities/conversion.entity';
import { UnidadMedida } from '../entities/unidad-medida.entity';
import { EstadoPedido } from '../types';
import { ProductoUnidad } from '../entities';
import { ProductoUnidadService } from './producto-unidad.service';

export interface PrecioSugerido {
  pedidoDetalleId: number;
  productoId: number;
  unidadMedidaId: number;
  productoUnidadId: number;
  productoNombre: string;
  unidadNombre: string;
  precioCalculado: number;
  ultimoPrecioCobrado: number | null;
  costoBase: number;
  precioPorKg: number | null;
  margenGanancia: number;
  cantidad: number;
  unidadesDisponibles: {
    id: number;
    productoUnidadId: number;
    nombre: string;
    abreviacion: string;
    precioSugerido: number;
    factorConversion: number | null;
  }[];
  warningConversion: string | null;
}

export interface DetalleRemitoInput {
  pedidoDetalleId: number;
  productoUnidadId: number;
  cantidad: number;
  precio: number;
}

export class RemitoService {
  private remitoRepository = AppDataSource.getRepository(Remito);
  private pedidoRepository = AppDataSource.getRepository(Pedido);
  private productoUnidadRepository = AppDataSource.getRepository(ProductoUnidad);
  private productoUnidadService = new ProductoUnidadService();
  private historicoRepository = AppDataSource.getRepository(HistoricoPrecios);
  private historicoPreciosCompraRepository = AppDataSource.getRepository(HistoricoPreciosCompra);
  private conversionRepository = AppDataSource.getRepository(Conversion);
  private unidadMedidaRepository = AppDataSource.getRepository(UnidadMedida);

  private async getUnidadKgId(): Promise<number | null> {
    const unidadKg = await this.unidadMedidaRepository.findOne({
      where: [
        { nombre: 'kg' },
        { nombre: 'Kg' },
        { nombre: 'KG' },
        { nombre: 'kilogramo' },
        { nombre: 'Kilogramo' },
        { abreviacion: 'kg' },
        { abreviacion: 'Kg' }
      ]
    });
    return unidadKg?.id || null;
  }

  private async getFactorConversionAKg(productoId: number, unidadOrigenId: number, unidadKgId: number): Promise<number | null> {
    if (unidadOrigenId === unidadKgId) {
      return 1;
    }

    const conversionDirecta = await this.conversionRepository.findOne({
      where: {
        producto_id: productoId,
        unidad_origen_id: unidadOrigenId,
        unidad_destino_id: unidadKgId
      }
    });

    if (conversionDirecta) {
      return Number(conversionDirecta.factor_conversion);
    }

    const conversionInversa = await this.conversionRepository.findOne({
      where: {
        producto_id: productoId,
        unidad_origen_id: unidadKgId,
        unidad_destino_id: unidadOrigenId
      }
    });

    if (conversionInversa) {
      return 1 / Number(conversionInversa.factor_conversion);
    }

    return null;
  }

  async getPreciosSugeridos(pedidoId: number): Promise<PrecioSugerido[]> {
    const pedido = await this.pedidoRepository.findOne({
      where: { id: pedidoId },
      relations: [
        'cliente', 
        'detalles', 
        'detalles.producto_unidad', 
        'detalles.producto_unidad.producto', 
        'detalles.producto_unidad.unidad_medida'
      ]
    });

    if (!pedido) {
      throw new Error('Pedido no encontrado');
    }

    const unidadKgId = await this.getUnidadKgId();
    const preciosSugeridos: PrecioSugerido[] = [];

    for (const detalle of pedido.detalles) {
      const productoId = detalle.producto_unidad.producto.id;
      const unidadPedidoId = detalle.producto_unidad.unidad_medida.id;
      
      const ultimaCompraConPrecioKg = await this.historicoPreciosCompraRepository
        .createQueryBuilder('hpc')
        .innerJoin('hpc.producto_unidad', 'pu')
        .where('pu.producto_id = :productoId', { productoId })
        .andWhere('hpc.precio_por_kg IS NOT NULL')
        .orderBy('hpc.fecha', 'DESC')
        .getOne();

      const precioPorKg = ultimaCompraConPrecioKg?.precio_por_kg 
        ? Number(ultimaCompraConPrecioKg.precio_por_kg) 
        : null;

      const ultimoPrecio = await this.historicoRepository.findOne({
        where: {
          cliente: { id: pedido.cliente.id },
          producto_unidad: { id: detalle.producto_unidad.id }
        },
        order: { fecha: 'DESC' }
      });

      const unidadesProducto = await this.productoUnidadRepository.find({
        where: { producto_id: productoId, es_unidad_venta: true },
        relations: ['unidad_medida']
      });

      const margenGanancia = Number(detalle.producto_unidad.margen_ganancia) || 50;
      let costoBase = 0;
      let precioCalculado = 0;
      let warningConversion: string | null = null;

      if (precioPorKg !== null && unidadKgId !== null) {
        const factorConversion = await this.getFactorConversionAKg(productoId, unidadPedidoId, unidadKgId);
        
        if (factorConversion !== null) {
          costoBase = precioPorKg * factorConversion;
          precioCalculado = costoBase * (1 + margenGanancia / 100);
        } else {
          warningConversion = `Falta conversión a KG para ${detalle.producto_unidad.unidad_medida.nombre}`;
          if (ultimoPrecio) {
            precioCalculado = Number(ultimoPrecio.precio);
            costoBase = precioCalculado / (1 + margenGanancia / 100);
          }
        }
      } else {
        const ultimaCompraDirecta = await this.historicoPreciosCompraRepository.findOne({
          where: { producto_unidad: { id: detalle.producto_unidad.id } },
          order: { fecha: 'DESC' }
        });

        if (ultimaCompraDirecta) {
          costoBase = Number(ultimaCompraDirecta.precio);
          precioCalculado = costoBase * (1 + margenGanancia / 100);
        }

        if (precioPorKg === null) {
          warningConversion = 'No hay precio por KG registrado. Ingrese kg reales en la compra.';
        }
      }

      const unidadesDisponibles: PrecioSugerido['unidadesDisponibles'] = [];
      
      for (const pu of unidadesProducto) {
        let precioUnidad = 0;
        let factorConversionUnidad: number | null = null;

        if (precioPorKg !== null && unidadKgId !== null) {
          factorConversionUnidad = await this.getFactorConversionAKg(productoId, pu.unidad_medida.id, unidadKgId);
          
          if (factorConversionUnidad !== null) {
            const costoUnidad = precioPorKg * factorConversionUnidad;
            const margenUnidad = Number(pu.margen_ganancia) || 50;
            precioUnidad = costoUnidad * (1 + margenUnidad / 100);
          }
        }

        unidadesDisponibles.push({
          id: pu.unidad_medida.id,
          productoUnidadId: pu.id,
          nombre: pu.unidad_medida.nombre,
          abreviacion: pu.unidad_medida.abreviacion,
          precioSugerido: precioUnidad,
          factorConversion: factorConversionUnidad
        });
      }

      preciosSugeridos.push({
        pedidoDetalleId: detalle.id,
        productoId: productoId,
        unidadMedidaId: unidadPedidoId,
        productoUnidadId: detalle.producto_unidad.id,
        productoNombre: detalle.producto_unidad.producto.nombre,
        unidadNombre: detalle.producto_unidad.unidad_medida.nombre,
        precioCalculado: Number(precioCalculado) || 0,
        ultimoPrecioCobrado: ultimoPrecio?.precio ? Number(ultimoPrecio.precio) : null,
        costoBase: Number(costoBase) || 0,
        precioPorKg: precioPorKg,
        margenGanancia: margenGanancia,
        cantidad: Number(detalle.cantidad) || 0,
        unidadesDisponibles: unidadesDisponibles,
        warningConversion: warningConversion
      });
    }

    return preciosSugeridos;
  }

  async recalcularPrecioPorUnidad(
    productoId: number, 
    nuevaUnidadId: number, 
    cantidad: number
  ): Promise<{
    productoUnidadId: number;
    precioSugerido: number;
    precioPorKg: number | null;
    costoBase: number;
    factorConversion: number | null;
    warning: string | null;
  }> {
    const unidadKgId = await this.getUnidadKgId();
    
    const productoUnidad = await this.productoUnidadRepository.findOne({
      where: { producto_id: productoId, unidad_medida_id: nuevaUnidadId },
      relations: ['unidad_medida']
    });

    if (!productoUnidad) {
      throw new Error('No existe relación producto-unidad para esta combinación');
    }

    const ultimaCompra = await this.historicoPreciosCompraRepository
      .createQueryBuilder('hpc')
      .innerJoin('hpc.producto_unidad', 'pu')
      .where('pu.producto_id = :productoId', { productoId })
      .andWhere('hpc.precio_por_kg IS NOT NULL')
      .orderBy('hpc.fecha', 'DESC')
      .getOne();

    const precioPorKg = ultimaCompra?.precio_por_kg ? Number(ultimaCompra.precio_por_kg) : null;
    
    let precioSugerido = 0;
    let costoBase = 0;
    let factorConversion: number | null = null;
    let warning: string | null = null;

    if (precioPorKg !== null && unidadKgId !== null) {
      factorConversion = await this.getFactorConversionAKg(productoId, nuevaUnidadId, unidadKgId);
      
      if (factorConversion !== null) {
        costoBase = precioPorKg * factorConversion;
        const margen = Number(productoUnidad.margen_ganancia) || 50;
        precioSugerido = costoBase * (1 + margen / 100);
      } else {
        warning = `Falta conversión a KG para ${productoUnidad.unidad_medida.nombre}`;
      }
    } else {
      warning = 'No hay precio por KG registrado';
    }

    return {
      productoUnidadId: productoUnidad.id,
      precioSugerido,
      precioPorKg,
      costoBase,
      factorConversion,
      warning
    };
  }

  async crearRemito(pedidoId: number, detalles: DetalleRemitoInput[]): Promise<Remito> {
    try {
      const pedido = await this.pedidoRepository.findOne({
        where: { id: pedidoId },
        relations: ['cliente', 'detalles', 'detalles.producto_unidad', 'detalles.producto_unidad.producto', 'detalles.producto_unidad.unidad_medida']
      });

      if (!pedido) {
        throw new Error('Pedido no encontrado');
      }

      const remitoExistente = await this.remitoRepository.findOne({
        where: { pedido_id: pedidoId }
      });

      if (remitoExistente) {
        throw new Error('Ya existe un remito para este pedido');
      }

      let total = 0;
      for (const detalle of detalles) {
        total += detalle.cantidad * detalle.precio;
      }

      const remito = new Remito();
      remito.pedido_id = pedidoId;
      remito.fecha_emision = new Date();
      remito.total = total;
      remito.entregado = false;

      const remitoGuardado = await this.remitoRepository.save(remito);

      for (const detalle of detalles) {
        const historico = new HistoricoPrecios();
        historico.cliente = pedido.cliente;
        historico.producto_unidad = { id: detalle.productoUnidadId } as any;
        historico.precio = detalle.precio;
        historico.fecha = new Date();
        historico.remito = remitoGuardado;
        await this.historicoRepository.save(historico);
      }

      pedido.estado = EstadoPedido.EN_PROCESO;
      await this.pedidoRepository.save(pedido);

      return remitoGuardado;
    } catch (error) {
      throw error;
    }
  }

  async obtenerRemitos(filtros?: any) {
    const where: any = {};
    
    if (filtros?.clienteId) {
      where.pedido = { cliente_id: filtros.clienteId };
    }

    return await this.remitoRepository.find({
      where,
      relations: [
        'pedido',
        'pedido.cliente',
        'pedido.detalles',
        'pedido.detalles.producto_unidad',
        'pedido.detalles.producto_unidad.producto',
        'pedido.detalles.producto_unidad.unidad_medida',
        'historico_precios',
        'historico_precios.producto_unidad',
        'historico_precios.producto_unidad.producto',
        'historico_precios.producto_unidad.unidad_medida'
      ],
      order: { created_at: 'DESC' }
    });
  }

  async obtenerRemitoPorId(id: number) {
    return await this.remitoRepository.findOne({
      where: { id },
      relations: [
        'pedido',
        'pedido.cliente',
        'pedido.detalles',
        'pedido.detalles.producto_unidad',
        'pedido.detalles.producto_unidad.producto',
        'pedido.detalles.producto_unidad.unidad_medida',
        'historico_precios',
        'historico_precios.producto_unidad',
        'historico_precios.producto_unidad.producto',
        'historico_precios.producto_unidad.unidad_medida'
      ]
    });
  }

  async confirmarEntrega(id: number): Promise<Remito> {
    const remito = await this.remitoRepository.findOne({
      where: { id },
      relations: [
        'pedido',
        'pedido.detalles',
        'pedido.detalles.producto_unidad',
        'historico_precios',
        'historico_precios.producto_unidad'
      ]
    });

    if (!remito) {
      throw new Error('Remito no encontrado');
    }

    if (remito.entregado) {
      throw new Error('El remito ya fue entregado');
    }

    remito.entregado = true;
    remito.fecha_entrega = new Date();

    for (const hp of remito.historico_precios || []) {
      const detallePedido = remito.pedido?.detalles?.find(
        d => d.producto_unidad_id === hp.producto_unidad_id
      );
      
      if (detallePedido) {
        await this.productoUnidadService.updateStock(
          hp.producto_unidad_id, 
          Number(detallePedido.cantidad), 
          "restar"
        );
      }
    }
    
    const pedido = remito.pedido;
    pedido.estado = EstadoPedido.COMPLETADO;
    await this.pedidoRepository.save(pedido);

    return await this.remitoRepository.save(remito);
  }

  async anularRemito(id: number): Promise<Remito> {
    const remito = await this.remitoRepository.findOne({
      where: { id },
      relations: ['pedido', 'historico_precios']
    });

    if (!remito) {
      throw new Error('Remito no encontrado');
    }

    if (remito.historico_precios && remito.historico_precios.length > 0) {
      await this.historicoRepository.remove(remito.historico_precios);
    }

    const pedido = remito.pedido;
    pedido.estado = EstadoPedido.PENDIENTE;
    await this.pedidoRepository.save(pedido);

    await this.remitoRepository.remove(remito);

    return remito;
  }
}