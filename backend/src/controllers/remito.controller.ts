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

      // Crear documento PDF
      doc = new PDFDocument();
      
      // Headers para descarga
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=remito-${remito.id}.pdf`);
      
      // Pipe el documento a la respuesta
      doc.pipe(res);
      
      // Manejar errores del stream
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
      doc.fontSize(20).text('REMITO', 50, 50);
      doc.fontSize(14).text(`Número: R-${String(remito.id).padStart(6, '0')}`, 50, 80);
      doc.fontSize(12).text(`Fecha: ${new Date(remito.fecha_emision).toLocaleDateString('es-AR')}`, 50, 100);
      
      // Datos del cliente
      doc.fontSize(14).text('Cliente:', 50, 140);
      doc.fontSize(12).text(`${remito.pedido.cliente.nombre}`, 50, 160);
      // Si en el futuro se agrega CUIT: doc.text(`CUIT: ${remito.pedido.cliente.cuit || 'N/A'}`, 50, 180);
      doc.text(`Dirección: ${remito.pedido.cliente.direccion || 'N/A'}`, 50, 180);
      doc.text(`Teléfono: ${remito.pedido.cliente.telefono || 'N/A'}`, 50, 200);
      
      // Línea separadora
      doc.moveTo(50, 230).lineTo(550, 230).stroke();
      
      // Encabezados de la tabla
      let yPosition = 250;
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('Producto', 50, yPosition);
      doc.text('Cantidad', 250, yPosition);
      doc.text('Unidad', 320, yPosition);
      doc.text('Precio Unit.', 400, yPosition);
      doc.text('Subtotal', 480, yPosition);
      
      // Línea bajo encabezados
      yPosition += 20;
      doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
      
      // Detalles del remito
      doc.font('Helvetica');
      yPosition += 20;
      
      // Crear un mapa de precios desde el histórico
      const preciosMap = new Map();
      if (remito.historico_precios) {
        remito.historico_precios.forEach((hp: any) => {
          const key = hp.producto_unidad.id;
          // Convertir el precio a número al guardarlo en el mapa
          preciosMap.set(key, Number(hp.precio) || 0);
        });
      }

      for (const detalle of remito.pedido.detalles) {
        const key = detalle.producto_unidad.id;
        // El precio ya es número gracias a la conversión anterior
        const precio = preciosMap.get(key) || 0;
        
        doc.text(detalle.producto_unidad.producto.nombre, 50, yPosition);
        doc.text(detalle.cantidad.toString(), 250, yPosition);
        doc.text(detalle.producto_unidad.unidad_medida.nombre, 320, yPosition);
        doc.text(`$${precio.toFixed(2)}`, 400, yPosition);
        doc.text(`$${(Number(detalle.cantidad) * precio).toFixed(2)}`, 480, yPosition);
        
        yPosition += 20;
        
        // Verificar si necesitamos nueva página
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
        }
      }
      
      // Línea antes del total
      yPosition += 10;
      doc.moveTo(350, yPosition).lineTo(550, yPosition).stroke();
      
      // Total
      yPosition += 20;
      doc.font('Helvetica-Bold');
      doc.text('TOTAL:', 400, yPosition);
      doc.text(`$${Number(remito.total || 0).toFixed(2)}`, 480, yPosition);
      
      // Estado de entrega
      yPosition += 40;
      doc.font('Helvetica');
      if (remito.entregado) {
        doc.text('Estado: ENTREGADO', 50, yPosition);
        if (remito.fecha_entrega) {
          doc.text(`Fecha de entrega: ${new Date(remito.fecha_entrega).toLocaleDateString('es-AR')}`, 50, yPosition + 20);
        }
      } else {
        doc.text('Estado: PENDIENTE DE ENTREGA', 50, yPosition);
      }
      
      // Espacio para firma
      yPosition += 60;
      if (yPosition > 650) {
        doc.addPage();
        yPosition = 100;
      }
      
      doc.text('_______________________', 50, yPosition);
      doc.text('Firma y aclaración', 50, yPosition + 20);
      doc.text('_______________________', 350, yPosition);
      doc.text('Fecha de recepción', 350, yPosition + 20);
      
      // Finalizar el documento
      doc.end();
      
    } catch (error: any) {
      console.error('Error generando PDF:', error);
      
      // Si hay un documento creado, intentar cerrarlo
      if (doc) {
        try {
          doc.end();
        } catch (endError) {
          console.error('Error cerrando documento PDF:', endError);
        }
      }
      
      // Solo enviar respuesta de error si los headers no han sido enviados
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error generando PDF: ' + error.message });
      }
    }
  }
}