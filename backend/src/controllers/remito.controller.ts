// backend/src/controllers/remito.controller.ts

import { Request, Response } from 'express';
import { RemitoService } from '../services/remito.service';
import PDFDocument from 'pdfkit';

export class RemitoController {
  private remitoService = new RemitoService();

  async obtenerPreciosSugeridos(req: Request, res: Response) {
    try {
      const pedidoId = parseInt(req.params.pedidoId);
      const precios = await this.remitoService.getPreciosSugeridos(pedidoId);
      res.json(precios);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  // NUEVO: Recalcular precio cuando cambia la unidad de medida
  async recalcularPrecioPorUnidad(req: Request, res: Response) {
    try {
      const productoId = parseInt(req.params.productoId);
      const unidadId = parseInt(req.params.unidadId);
      const cantidad = parseFloat(req.query.cantidad as string) || 1;

      const resultado = await this.remitoService.recalcularPrecioPorUnidad(
        productoId,
        unidadId,
        cantidad
      );

      res.json({
        success: true,
        data: resultado
      });
    } catch (error: any) {
      res.status(400).json({ 
        success: false,
        message: error.message 
      });
    }
  }

  async crearRemito(req: Request, res: Response) {
    try {
      const { pedidoId, detalles } = req.body;
      const remito = await this.remitoService.crearRemito(pedidoId, detalles);
      res.status(201).json(remito);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async obtenerRemitos(req: Request, res: Response) {
    try {
      const filtros = req.query;
      const remitos = await this.remitoService.obtenerRemitos(filtros);
      res.json(remitos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async obtenerRemitoPorId(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const remito = await this.remitoService.obtenerRemitoPorId(id);
      
      if (!remito) {
        return res.status(404).json({ message: 'Remito no encontrado' });
      }
      
      res.json(remito);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async confirmarEntrega(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const remito = await this.remitoService.confirmarEntrega(id);
      res.json(remito);
    } catch (error: any) {
      console.error('Error en confirmarEntrega:', error);
      res.status(400).json({ 
        success: false,
        message: error.message || 'Error al confirmar la entrega' 
      });
    }
  }

  async anularRemito(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const remito = await this.remitoService.anularRemito(id);
      res.json({ message: 'Remito anulado correctamente', remito });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async generarPDF(req: Request, res: Response) {
    let doc: InstanceType<typeof PDFDocument> | null = null;
    
    try {
      const id = parseInt(req.params.id);
      const remito = await this.remitoService.obtenerRemitoPorId(id);
      
      if (!remito) {
        return res.status(404).json({ message: 'Remito no encontrado' });
      }

      doc = new PDFDocument({ margin: 50 });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=remito-${remito.id}.pdf`);
      
      doc.pipe(res);
      
      doc.on('error', (error: any) => {
        console.error('Error en PDF stream:', error);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Error generando PDF' });
        }
      });
      
      res.on('error', (error: any) => {
        console.error('Error en response stream:', error);
      });

      // Encabezado
      doc.fontSize(20).font('Helvetica-Bold').text('REMITO', 50, 50);
      doc.fontSize(12).font('Helvetica');
      doc.text(`Número: R-${String(remito.id).padStart(6, '0')}`, 50, 80);
      doc.text(`Fecha: ${new Date(remito.fecha_emision).toLocaleDateString('es-AR')}`, 50, 95);
      
      // Datos del cliente
      doc.fontSize(14).font('Helvetica-Bold').text('Cliente:', 50, 130);
      doc.fontSize(12).font('Helvetica');
      doc.text(`${remito.pedido.cliente.nombre}`, 50, 150);
      doc.text(`Dirección: ${remito.pedido.cliente.direccion || 'N/A'}`, 50, 165);
      doc.text(`Teléfono: ${remito.pedido.cliente.telefono || 'N/A'}`, 50, 180);
      
      // Línea separadora
      doc.moveTo(50, 210).lineTo(550, 210).stroke();
      
      // Encabezados de la tabla
      let yPosition = 230;
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Producto', 50, yPosition, { width: 150 });
      doc.text('Cant.', 200, yPosition, { width: 50 });
      doc.text('Unidad', 250, yPosition, { width: 60 });
      doc.text('$/kg', 310, yPosition, { width: 60 });
      doc.text('P.Unit.', 370, yPosition, { width: 70 });
      doc.text('Subtotal', 440, yPosition, { width: 80 });
      
      // Línea bajo encabezados
      yPosition += 15;
      doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
      
      // Detalles del remito
      doc.font('Helvetica').fontSize(9);
      yPosition += 10;
      
      // Crear mapa de precios desde el histórico
      const preciosMap = new Map();
      if (remito.historico_precios) {
        remito.historico_precios.forEach((hp: any) => {
          const key = hp.producto_unidad.id;
          preciosMap.set(key, Number(hp.precio) || 0);
        });
      }

      let totalCalculado = 0;

      for (const detalle of remito.pedido.detalles) {
        const key = detalle.producto_unidad.id;
        const precio = preciosMap.get(key) || 0;
        const subtotal = Number(detalle.cantidad) * precio;
        totalCalculado += subtotal;
        
        // Truncar nombre si es muy largo
        const nombreProducto = detalle.producto_unidad.producto.nombre.length > 25 
          ? detalle.producto_unidad.producto.nombre.substring(0, 23) + '...'
          : detalle.producto_unidad.producto.nombre;
        
        doc.text(nombreProducto, 50, yPosition, { width: 150 });
        doc.text(Number(detalle.cantidad).toFixed(2), 200, yPosition, { width: 50 });
        doc.text(detalle.producto_unidad.unidad_medida.abreviacion || detalle.producto_unidad.unidad_medida.nombre, 250, yPosition, { width: 60 });
        doc.text('-', 310, yPosition, { width: 60 }); // Placeholder para $/kg
        doc.text(`$${precio.toFixed(2)}`, 370, yPosition, { width: 70 });
        doc.text(`$${subtotal.toFixed(2)}`, 440, yPosition, { width: 80 });
        
        yPosition += 18;
        
        // Nueva página si es necesario
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
        }
      }
      
      // Línea antes del total
      yPosition += 10;
      doc.moveTo(350, yPosition).lineTo(550, yPosition).stroke();
      
      // Total
      yPosition += 15;
      doc.font('Helvetica-Bold').fontSize(12);
      doc.text('TOTAL:', 370, yPosition);
      doc.text(`$${Number(remito.total || totalCalculado).toFixed(2)}`, 440, yPosition);
      
      // Estado de entrega
      yPosition += 40;
      doc.font('Helvetica').fontSize(10);
      if (remito.entregado) {
        doc.text('Estado: ENTREGADO', 50, yPosition);
        if (remito.fecha_entrega) {
          doc.text(`Fecha de entrega: ${new Date(remito.fecha_entrega).toLocaleDateString('es-AR')}`, 50, yPosition + 15);
        }
      } else {
        doc.text('Estado: PENDIENTE DE ENTREGA', 50, yPosition);
      }
      
      // Espacio para firma
      yPosition += 60;
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 100;
      }
      
      doc.fontSize(10);
      doc.text('_______________________________', 50, yPosition);
      doc.text('Firma y aclaración del receptor', 50, yPosition + 15);
      doc.text('_______________________________', 320, yPosition);
      doc.text('Fecha de recepción', 320, yPosition + 15);
      
      doc.end();
      
    } catch (error: any) {
      console.error('Error generando PDF:', error);
      
      if (doc) {
        try {
          doc.end();
        } catch (endError) {
          console.error('Error cerrando documento PDF:', endError);
        }
      }
      
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error generando PDF: ' + error.message });
      }
    }
  }
}