import { AppDataSource } from '../config/database';
import { Pedido } from '../entities/pedido.entity';
import { PedidoDetalle } from '../entities/pedido-detalle.entity';
import { IPedido, EstadoPedido } from '../types';

export class PedidoService {
  private pedidoRepository = AppDataSource.getRepository(Pedido);
  private pedidoDetalleRepository = AppDataSource.getRepository(PedidoDetalle);

  async findAll(page: number = 1, limit: number = 10, estado?: EstadoPedido) {
    const query = this.pedidoRepository.createQueryBuilder('pedido')
      .leftJoinAndSelect('pedido.cliente', 'cliente')
      .leftJoinAndSelect('pedido.detalles', 'detalles')
      .leftJoinAndSelect('pedido.remito', 'remito')
      .leftJoinAndSelect('detalles.producto_unidad', 'producto_unidad')
      .leftJoinAndSelect('producto_unidad.producto', 'producto')
      .leftJoinAndSelect('producto_unidad.unidad_medida', 'unidad_medida')
      .orderBy('pedido.created_at', 'DESC');

    if (estado) {
      query.where('pedido.estado = :estado', { estado });
    }

    const [data, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async findOne(id: number): Promise<Pedido | null> {
    return await this.pedidoRepository.findOne({
      where: { id },
      relations: [
        'cliente',
        'detalles',
        'detalles.producto_unidad',
        'detalles.producto_unidad.producto',
        'detalles.producto_unidad.unidad_medida'
      ]
    });
  }

  async update(id: number, data: Partial<IPedido>): Promise<Pedido> {
    const pedido = await this.findOne(id);
    if (!pedido) {
      throw new Error('Pedido no encontrado');
    }

    Object.assign(pedido, data);
    return await this.pedidoRepository.save(pedido);
  }

  async updateEstado(id: number, estado: EstadoPedido): Promise<Pedido> {
    const pedido = await this.findOne(id);
    if (!pedido) {
      throw new Error('Pedido no encontrado');
    }

    pedido.estado = estado;
    
    // Si se marca como completado, actualizar incluido_en_compra
    if (estado === EstadoPedido.COMPLETADO) {
      pedido.incluido_en_compra = true;
    }
    
    return await this.pedidoRepository.save(pedido);
  }

  async delete(id: number): Promise<void> {
    const pedido = await this.findOne(id);
    if (!pedido) {
      throw new Error('Pedido no encontrado');
    }

    // Solo permitir eliminar pedidos pendientes
    if (pedido.estado !== EstadoPedido.PENDIENTE) {
      throw new Error('Solo se pueden eliminar pedidos pendientes');
    }

    // Eliminar detalles primero
    await this.pedidoDetalleRepository.delete({ pedido_id: id });
    
    // Eliminar pedido
    await this.pedidoRepository.delete(id);
  }

  async findByCliente(clienteId: number): Promise<Pedido[]> {
    return await this.pedidoRepository.find({
      where: { cliente_id: clienteId },
      relations: [
        'detalles',
        'detalles.producto_unidad',
        'detalles.producto_unidad.producto',
        'detalles.producto_unidad.unidad_medida'
      ],
      order: { created_at: 'DESC' }
    });
  }

  async findPendientes(): Promise<Pedido[]> {
    return await this.pedidoRepository.find({
      where: { estado: EstadoPedido.PENDIENTE },
      relations: [
        'cliente',
        'detalles',
        'detalles.producto_unidad',
        'detalles.producto_unidad.producto',
        'detalles.producto_unidad.unidad_medida'
      ],
      order: { created_at: 'ASC' }
    });
  }

  async calcularTotal(id: number): Promise<number> {
    const pedido = await this.findOne(id);
    if (!pedido || !pedido.detalles) {
      return 0;
    }

    return pedido.detalles.reduce((total, detalle) => {
      const subtotal = detalle.subtotal || (detalle.cantidad * (detalle.precio_unitario || 0));
      return total + Number(subtotal);
    }, 0);
  }
}