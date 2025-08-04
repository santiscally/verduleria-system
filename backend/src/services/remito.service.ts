// backend/src/services/remito.service.ts
import { AppDataSource } from '../config/database';
import { Remito } from '../entities/remito.entity';
import { Pedido } from '../entities/pedido.entity';
import { HistoricoPrecios } from '../entities/historico-precios.entity';
import { HistoricoPreciosCompra } from '../entities/historico-precios-compra.entity';
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
  precioCalculado: number; // costo + margen
  ultimoPrecioCobrado: number | null;
  costoBase: number;
  margenGanancia: number;
  cantidad: number;
}

export interface DetalleRemitoInput {
  pedidoDetalleId: number;
  productoUnidadId: number;
  cantidad: number;
  precio: number; // precio final seleccionado por el usuario
}

export class RemitoService {
  private remitoRepository = AppDataSource.getRepository(Remito);
  private pedidoRepository = AppDataSource.getRepository(Pedido);
  private productoUnidadRepository = AppDataSource.getRepository(ProductoUnidad);
  private productoUnidadService = new ProductoUnidadService();
  private historicoRepository = AppDataSource.getRepository(HistoricoPrecios);
  private historicoPreciosCompraRepository = AppDataSource.getRepository(HistoricoPreciosCompra);

  async getPreciosSugeridos(pedidoId: number): Promise<PrecioSugerido[]> {
    const pedido = await this.pedidoRepository.findOne({
      where: { id: pedidoId },
      relations: ['cliente', 'detalles', 'detalles.producto_unidad', 'detalles.producto_unidad.producto', 'detalles.producto_unidad.unidad_medida']
    });

    if (!pedido) {
      throw new Error('Pedido no encontrado');
    }

    const preciosSugeridos: PrecioSugerido[] = [];

    for (const detalle of pedido.detalles) {
      // Obtener el último precio de compra
      const ultimaCompra = await this.historicoPreciosCompraRepository.findOne({
        where: {
          producto_unidad: { id: detalle.producto_unidad.id }
        },
        order: { fecha: 'DESC' }
      });

      // Obtener el último precio cobrado a este cliente
      const ultimoPrecio = await this.historicoRepository.findOne({
        where: {
          cliente: { id: pedido.cliente.id },
          producto_unidad: { id: detalle.producto_unidad.id }
        },
        order: { fecha: 'DESC' }
      });

      const costoBase = Number(ultimaCompra?.precio) || 0;
      const margenGanancia = Number(detalle.producto_unidad.margen_ganancia) || 50; // 50% por defecto
      const precioCalculado = costoBase * (1 + margenGanancia / 100);

      preciosSugeridos.push({
        pedidoDetalleId: detalle.id,
        productoId: detalle.producto_unidad.producto.id,
        unidadMedidaId: detalle.producto_unidad.unidad_medida.id,
        productoUnidadId: detalle.producto_unidad.id,
        productoNombre: detalle.producto_unidad.producto.nombre,
        unidadNombre: detalle.producto_unidad.unidad_medida.nombre,
        precioCalculado: Number(precioCalculado) || 0,
        ultimoPrecioCobrado: ultimoPrecio?.precio ? Number(ultimoPrecio.precio) : null,
        costoBase: Number(costoBase) || 0,
        margenGanancia: Number(margenGanancia) || 0,
        cantidad: Number(detalle.cantidad) || 0
      });
    }

    return preciosSugeridos;
  }

  async crearRemito(pedidoId: number, detalles: DetalleRemitoInput[]): Promise<Remito> {

    try{
      const pedido = await this.pedidoRepository.findOne({
        where: { id: pedidoId },
        relations: ['cliente', 'detalles', 'detalles.producto_unidad', 'detalles.producto_unidad.producto', 'detalles.producto_unidad.unidad_medida']
      });

      if (!pedido) {
        throw new Error('Pedido no encontrado');
      }

      // Verificar si ya existe un remito para este pedido
      const remitoExistente = await this.remitoRepository.findOne({
        where: { pedido_id: pedidoId }
      });

      if (remitoExistente) {
        throw new Error('Ya existe un remito para este pedido');
      }

      // Calcular total
      let total = 0;
      for (const detalle of detalles) {
        total += detalle.cantidad * detalle.precio;
      }

      // Crear el remito
      const remito = new Remito();
      remito.pedido_id = pedidoId;
      remito.fecha_emision = new Date();
      remito.total = total;
      remito.entregado = false;

      // Guardar remito
      const remitoGuardado = await this.remitoRepository.save(remito);

      // Guardar histórico de precios para cada producto
      for (const detalle of detalles) {
        const historico = new HistoricoPrecios();
        historico.cliente = pedido.cliente;
        historico.producto_unidad = { id: detalle.productoUnidadId } as any;
        historico.precio = detalle.precio;
        historico.fecha = new Date();
        historico.remito = remitoGuardado;
        await this.historicoRepository.save(historico);
      }

      // Actualizar estado del pedido
      pedido.estado = EstadoPedido.EN_COMPRA;
      await this.pedidoRepository.save(pedido);

      return remitoGuardado;
    }catch(error){
      throw error;
    }
  }

  async obtenerRemitos(filtros?: any) {
    const query = this.remitoRepository.createQueryBuilder('remito')
      .leftJoinAndSelect('remito.pedido', 'pedido')
      .leftJoinAndSelect('pedido.cliente', 'cliente')
      .leftJoinAndSelect('pedido.detalles', 'detalles')
      .leftJoinAndSelect('detalles.producto_unidad', 'producto_unidad')
      .leftJoinAndSelect('producto_unidad.producto', 'producto')
      .leftJoinAndSelect('producto_unidad.unidad_medida', 'unidad_medida')
      .leftJoinAndSelect('remito.historico_precios', 'historico_precios')
      .orderBy('remito.fecha_emision', 'DESC');

    if (filtros?.clienteId) {
      query.andWhere('cliente.id = :clienteId', { clienteId: filtros.clienteId });
    }

    if (filtros?.entregado !== undefined) {
      query.andWhere('remito.entregado = :entregado', { entregado: filtros.entregado });
    }

    if (filtros?.fechaDesde) {
      query.andWhere('remito.fecha_emision >= :fechaDesde', { fechaDesde: filtros.fechaDesde });
    }

    if (filtros?.fechaHasta) {
      query.andWhere('remito.fecha_emision <= :fechaHasta', { fechaHasta: filtros.fechaHasta });
    }

    return await query.getMany();
  }

  async obtenerRemitoPorId(id: number): Promise<Remito | null> {
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
    const remito = await this.obtenerRemitoPorId(id);

    if (!remito) {
      throw new Error('Remito no encontrado');
    }

    remito.entregado = true;
    remito.fecha_entrega = new Date();

    for (const detalle of remito.pedido.detalles) {
      await this.productoUnidadService.updateStock(detalle.producto_unidad_id, detalle.cantidad, "restar");
    }
    
    // Actualizar estado del pedido
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

    // Eliminar histórico de precios asociado
    if (remito.historico_precios && remito.historico_precios.length > 0) {
      await this.historicoRepository.remove(remito.historico_precios);
    }

    // Actualizar estado del pedido
    const pedido = remito.pedido;
    pedido.estado = EstadoPedido.PENDIENTE;
    await this.pedidoRepository.save(pedido);

    // Eliminar el remito
    await this.remitoRepository.remove(remito);

    return remito;
  }
}