// backend/src/services/pedido-import.service.ts

import { AppDataSource } from '../config/database';
import { Pedido } from '../entities/pedido.entity';
import { PedidoDetalle } from '../entities/pedido-detalle.entity';
import { Cliente } from '../entities/cliente.entity';
import { Producto } from '../entities/producto.entity';
import { UnidadMedida } from '../entities/unidad-medida.entity';
import { ProductoUnidad } from '../entities/producto-unidad.entity';
import { Conversion } from '../entities/conversion.entity';
import { IPedidoImportRow, EstadoPedido } from '../types';
import { parseCSV } from '../utils/csv-parser';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  newClientes: string[];
  newProductos: string[];
  newUnidades: string[];
  newProductoUnidades: {
    producto: string;
    unidad: string;
    necesitaConfig: boolean;
  }[];
  missingConversions: {
    producto: string;
    unidadVenta: string;
    unidadesCompra: string[];
  }[];
  parsedData: ImportedRow[];
}

interface ImportedRow extends IPedidoImportRow {
  rowNumber: number;
}

interface ImportResult {
  success: boolean;
  pedidosCreados: number;
  errors?: string[];
}

export class PedidoImportService {
  private clienteRepository = AppDataSource.getRepository(Cliente);
  private productoRepository = AppDataSource.getRepository(Producto);
  private unidadRepository = AppDataSource.getRepository(UnidadMedida);
  private productoUnidadRepository = AppDataSource.getRepository(ProductoUnidad);
  private conversionRepository = AppDataSource.getRepository(Conversion);
  private pedidoRepository = AppDataSource.getRepository(Pedido);
  private pedidoDetalleRepository = AppDataSource.getRepository(PedidoDetalle);

  async validateCSV(fileContent: string): Promise<ValidationResult> {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      newClientes: [],
      newProductos: [],
      newUnidades: [],
      newProductoUnidades: [],
      missingConversions: [],
      parsedData: []
    };

    try {
      // Parsear CSV
      const records = parseCSV(fileContent);

      if (records.length === 0) {
        result.valid = false;
        result.errors.push('El archivo CSV está vacío');
        return result;
      }

      // Validar estructura del CSV
      const requiredColumns = ['cliente', 'producto', 'unidad_medida', 'cantidad'];
      const headers = Object.keys(records[0]).map(h => h.toLowerCase());
      
      for (const col of requiredColumns) {
        if (!headers.includes(col)) {
          result.valid = false;
          result.errors.push(`Columna requerida '${col}' no encontrada en el CSV`);
        }
      }

      if (!result.valid) return result;

      // Obtener datos existentes
      const [clientes, productos, unidades] = await Promise.all([
        this.clienteRepository.find(),
        this.productoRepository.find(),
        this.unidadRepository.find()
      ]);

      const clientesMap = new Map(clientes.map(c => [c.nombre.toLowerCase(), c]));
      const productosMap = new Map(productos.map(p => [p.nombre.toLowerCase(), p]));
      const unidadesMap = new Map(unidades.map(u => [u.nombre.toLowerCase(), u]));

      // Sets para tracking
      const newClientesSet = new Set<string>();
      const newProductosSet = new Set<string>();
      const newUnidadesSet = new Set<string>();
      const newProductoUnidadesMap = new Map<string, { producto: string; unidad: string }>();
      
      // Mapa para rastrear todas las conversiones que necesitamos verificar
      const conversionesParaVerificar = new Map<string, {
        producto: string;
        productoId?: number;
        unidad1: string;
        unidad2: string;
      }>();

      // Procesar cada fila
      for (let i = 0; i < records.length; i++) {
        const row = records[i];
        const rowNumber = i + 2;

        // Filtrar filas vacías
        if (!row.cliente?.trim() && !row.producto?.trim() && !row.unidad_medida?.trim()) {
          continue;
        }

        const importedRow: ImportedRow = {
          rowNumber,
          cliente: row.cliente?.trim() || '',
          producto: row.producto?.trim() || '',
          unidad_medida: row.unidad_medida?.trim() || '',
          cantidad: parseFloat(row.cantidad) || 0
        };

        // Validar campos vacíos
        if (!importedRow.cliente) {
          result.errors.push(`Fila ${rowNumber}: Cliente vacío`);
          result.valid = false;
          continue;
        }
        if (!importedRow.producto) {
          result.errors.push(`Fila ${rowNumber}: Producto vacío`);
          result.valid = false;
          continue;
        }
        if (!importedRow.unidad_medida) {
          result.errors.push(`Fila ${rowNumber}: Unidad de medida vacía`);
          result.valid = false;
          continue;
        }
        if (importedRow.cantidad <= 0) {
          result.errors.push(`Fila ${rowNumber}: Cantidad debe ser mayor a 0`);
          result.valid = false;
          continue;
        }

        // Detectar nuevos clientes
        if (!clientesMap.has(importedRow.cliente.toLowerCase())) {
          newClientesSet.add(importedRow.cliente);
        }

        // Detectar nuevas unidades
        if (!unidadesMap.has(importedRow.unidad_medida.toLowerCase())) {
          newUnidadesSet.add(importedRow.unidad_medida);
        }

        // Detectar nuevos productos
        const productoExiste = productosMap.has(importedRow.producto.toLowerCase());
        if (!productoExiste) {
          newProductosSet.add(importedRow.producto);
          
          // Para productos nuevos, automáticamente registrar su primera unidad
          const key = `${importedRow.producto}-${importedRow.unidad_medida}`;
          if (!newProductoUnidadesMap.has(key)) {
            newProductoUnidadesMap.set(key, {
              producto: importedRow.producto,
              unidad: importedRow.unidad_medida
            });
          }
        }

        // Verificar relación producto-unidad
        if (productoExiste) {
          const producto = productosMap.get(importedRow.producto.toLowerCase());
          const unidad = unidadesMap.get(importedRow.unidad_medida.toLowerCase());
          
          if (producto && unidad) {
            const productoUnidad = await this.productoUnidadRepository.findOne({
              where: {
                producto_id: producto.id,
                unidad_medida_id: unidad.id
              }
            });

            // Si no existe la relación producto-unidad, registrarla como nueva
            if (!productoUnidad) {
              const key = `${importedRow.producto}-${importedRow.unidad_medida}`;
              newProductoUnidadesMap.set(key, {
                producto: importedRow.producto,
                unidad: importedRow.unidad_medida
              });
            }
          }
        }

        result.parsedData.push(importedRow);
      }

      // Detectar productos con múltiples unidades y verificar conversiones
      const productoUnidadesMap = new Map<string, Set<string>>();

      for (const row of result.parsedData) {
        const productoKey = row.producto.toLowerCase();
        if (!productoUnidadesMap.has(productoKey)) {
          productoUnidadesMap.set(productoKey, new Set());
        }
        productoUnidadesMap.get(productoKey)!.add(row.unidad_medida.toLowerCase());
      }

      // Para cada producto con múltiples unidades, verificar conversiones
      for (const [productoKey, unidadesSet] of productoUnidadesMap) {
        if (unidadesSet.size > 1) {
          const producto = productosMap.get(productoKey);
          const productoNombre = Array.from(result.parsedData)
            .find(r => r.producto.toLowerCase() === productoKey)?.producto || productoKey;
          
          const unidadesArray = Array.from(unidadesSet);
          
          // Warning para el usuario
          result.warnings.push(
            `El producto "${productoNombre}" tiene ${unidadesArray.length} unidades diferentes: ${unidadesArray.join(', ')}`
          );
          
          // Solo procesar si el producto existe Y todas las unidades existen
          if (producto) {
            for (let i = 0; i < unidadesArray.length - 1; i++) {
              for (let j = i + 1; j < unidadesArray.length; j++) {
                const unidad1 = unidadesMap.get(unidadesArray[i]);
                const unidad2 = unidadesMap.get(unidadesArray[j]);
                
                if (unidad1 && unidad2) {
                  // Verificar si existe conversión en cualquier dirección
                  const conversionExiste = await this.conversionRepository.findOne({
                    where: [
                      {
                        producto_id: producto.id,
                        unidad_origen_id: unidad1.id,
                        unidad_destino_id: unidad2.id
                      },
                      {
                        producto_id: producto.id,
                        unidad_origen_id: unidad2.id,
                        unidad_destino_id: unidad1.id
                      }
                    ]
                  });
                  
                  if (!conversionExiste) {
                    // Usar una clave única para evitar duplicados
                    const key = `${producto.id}-${Math.min(unidad1.id, unidad2.id)}-${Math.max(unidad1.id, unidad2.id)}`;
                    if (!conversionesParaVerificar.has(key)) {
                      conversionesParaVerificar.set(key, {
                        producto: productoNombre,
                        productoId: producto.id,
                        unidad1: unidad1.nombre,
                        unidad2: unidad2.nombre
                      });
                    }
                  }
                }
              }
            }
          }
        }
      }

      // Convertir sets a arrays
      result.newClientes = Array.from(newClientesSet);
      result.newProductos = Array.from(newProductosSet);
      result.newUnidades = Array.from(newUnidadesSet);
      result.newProductoUnidades = Array.from(newProductoUnidadesMap.values()).map(pu => {
        // Si es un producto nuevo, su primera unidad será tanto de compra como de venta por defecto
        const esProductoNuevo = newProductosSet.has(pu.producto);
        return {
          ...pu,
          necesitaConfig: !esProductoNuevo,
          esUnidadCompra: esProductoNuevo,
          esUnidadVenta: true,
          margenGanancia: 50
        };
      });
      
      // Convertir a formato esperado (solo UNA conversión por par de unidades)
      result.missingConversions = Array.from(conversionesParaVerificar.values()).map(conv => ({
        producto: conv.producto,
        unidadVenta: conv.unidad2,
        unidadesCompra: [conv.unidad1]
      }));

    } catch (error: any) {
      result.valid = false;
      result.errors.push(`Error al parsear CSV: ${error.message}`);
    }

    return result;
  }

  async createEntities(data: {
    clientes: any[],
    productos: any[],
    unidades: any[],
    productoUnidades: any[]
  }): Promise<void> {
    // Crear unidades de medida
    const unidadesCreadas = new Map<string, UnidadMedida>();
    for (const unidadData of data.unidades) {
      const unidad = this.unidadRepository.create({
        nombre: unidadData.nombre,
        abreviacion: unidadData.abreviacion || unidadData.nombre.substring(0, 3).toUpperCase()
      });
      const unidadGuardada = await this.unidadRepository.save(unidad);
      unidadesCreadas.set(unidadData.nombre.toLowerCase(), unidadGuardada);
    }

    // Crear clientes
    for (const clienteData of data.clientes) {
      const cliente = this.clienteRepository.create({
        nombre: clienteData.nombre,
        direccion: clienteData.direccion || 'Pendiente',
        telefono: clienteData.telefono || 'Pendiente',
        email: clienteData.email,
        contacto: clienteData.contacto
      });
      await this.clienteRepository.save(cliente);
    }

    // Crear productos
    const productosCreados = new Map<string, Producto>();
    for (const productoData of data.productos) {
      const producto = this.productoRepository.create({
        nombre: productoData.nombre,
        proveedor: productoData.proveedor
      });
      const productoGuardado = await this.productoRepository.save(producto);
      productosCreados.set(productoData.nombre.toLowerCase(), productoGuardado);
    }

    // Crear relaciones producto-unidad
    for (const puData of data.productoUnidades) {
      // Buscar producto y unidad
      let producto = productosCreados.get(puData.producto.toLowerCase());
      if (!producto) {
        producto = await this.productoRepository.findOne({
          where: { nombre: puData.producto }
        }) || undefined;
      }

      let unidad = unidadesCreadas.get(puData.unidad.toLowerCase());
      if (!unidad) {
        unidad = await this.unidadRepository.findOne({
          where: { nombre: puData.unidad }
        }) || undefined;
      }

      if (producto && unidad) {
        const productoUnidad = this.productoUnidadRepository.create({
          producto_id: producto.id,
          unidad_medida_id: unidad.id,
          margen_ganancia: puData.margenGanancia || 50,
          stock_actual: 0,
          es_unidad_compra: puData.esUnidadCompra !== undefined ? puData.esUnidadCompra : false,
          es_unidad_venta: puData.esUnidadVenta !== undefined ? puData.esUnidadVenta : true
        });
        await this.productoUnidadRepository.save(productoUnidad);

        // Si es unidad de venta y hay unidad de compra, crear conversión
        if (puData.factorConversion && puData.unidadCompraId) {
          const conversion = this.conversionRepository.create({
            producto_id: producto.id,
            unidad_origen_id: unidad.id,
            unidad_destino_id: puData.unidadCompraId,
            factor_conversion: puData.factorConversion
          });
          await this.conversionRepository.save(conversion);

          // Crear conversión inversa
          const conversionInversa = this.conversionRepository.create({
            producto_id: producto.id,
            unidad_origen_id: puData.unidadCompraId,
            unidad_destino_id: unidad.id,
            factor_conversion: 1 / puData.factorConversion
          });
          await this.conversionRepository.save(conversionInversa);
        }
      }
    }
  }

  async import(rows: ImportedRow[]): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      pedidosCreados: 0,
      errors: []
    };

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Obtener mapas actualizados
      const [clientes, productos, unidades] = await Promise.all([
        this.clienteRepository.find(),
        this.productoRepository.find(),
        this.unidadRepository.find()
      ]);

      const clientesMap = new Map(clientes.map(c => [c.nombre.toLowerCase(), c]));
      const productosMap = new Map(productos.map(p => [p.nombre.toLowerCase(), p]));
      const unidadesMap = new Map(unidades.map(u => [u.nombre.toLowerCase(), u]));

      // Agrupar por cliente
      const pedidosPorCliente = new Map<number, ImportedRow[]>();
      
      for (const row of rows) {
        const cliente = clientesMap.get(row.cliente.toLowerCase());
        if (!cliente) {
          result.errors?.push(`Cliente '${row.cliente}' no encontrado`);
          continue;
        }

        if (!pedidosPorCliente.has(cliente.id)) {
          pedidosPorCliente.set(cliente.id, []);
        }
        pedidosPorCliente.get(cliente.id)!.push(row);
      }

      // Crear pedidos
      for (const [clienteId, items] of pedidosPorCliente) {
        // Crear pedido
        const pedido = this.pedidoRepository.create({
          cliente_id: clienteId,
          fecha_pedido: new Date(),
          estado: EstadoPedido.PENDIENTE,
          incluido_en_compra: false,
          fecha_importacion: new Date(),
          total: 0
        });
        
        const pedidoGuardado = await queryRunner.manager.save(pedido);

        // Crear detalles
        for (const item of items) {
          const producto = productosMap.get(item.producto.toLowerCase());
          const unidad = unidadesMap.get(item.unidad_medida.toLowerCase());

          if (!producto || !unidad) continue;

          // Buscar producto_unidad
          const productoUnidad = await this.productoUnidadRepository.findOne({
            where: {
              producto_id: producto.id,
              unidad_medida_id: unidad.id
            }
          });

          if (!productoUnidad) {
            result.errors?.push(`No existe relación ${producto.nombre}-${unidad.nombre}`);
            continue;
          }

          const detalle = this.pedidoDetalleRepository.create({
            pedido_id: pedidoGuardado.id,
            producto_unidad_id: productoUnidad.id,
            cantidad: item.cantidad
          });
          await queryRunner.manager.save(detalle);
        }

        result.pedidosCreados++;
      }

      await queryRunner.commitTransaction();
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      result.success = false;
      result.errors?.push(`Error al importar: ${error.message}`);
    } finally {
      await queryRunner.release();
    }

    return result;
  }
}