import { AppDataSource } from '../config/database';
import { Cliente } from '../entities/cliente.entity';
import { ICliente } from '../types';

export class ClienteService {
  private clienteRepository = AppDataSource.getRepository(Cliente);

  async findAll(page: number = 1, limit: number = 10) {
    const [data, total] = await this.clienteRepository.findAndCount({
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

  async findOne(id: number): Promise<Cliente | null> {
    return await this.clienteRepository.findOne({
      where: { id }
    });
  }

  async create(clienteData: ICliente): Promise<Cliente> {
    const cliente = this.clienteRepository.create(clienteData);
    return await this.clienteRepository.save(cliente);
  }

  async update(id: number, clienteData: Partial<ICliente>): Promise<Cliente> {
    const cliente = await this.findOne(id);
    if (!cliente) {
      throw new Error('Cliente no encontrado');
    }
    
    Object.assign(cliente, clienteData);
    return await this.clienteRepository.save(cliente);
  }

  async delete(id: number): Promise<void> {
    const result = await this.clienteRepository.delete(id);
    if (result.affected === 0) {
      throw new Error('Cliente no encontrado');
    }
  }

  async search(query: string) {
    return await this.clienteRepository
      .createQueryBuilder('cliente')
      .where('cliente.nombre ILIKE :query', { query: `%${query}%` })
      .orWhere('cliente.email ILIKE :query', { query: `%${query}%` })
      .orWhere('cliente.telefono ILIKE :query', { query: `%${query}%` })
      .orderBy('cliente.nombre', 'ASC')
      .getMany();
  }
}