// backend/src/controllers/orden-compra.controller.ts
import { Request, Response } from 'express';
import { OrdenCompraService } from '../services/orden-compra.service';
import PDFDocument from 'pdfkit';

export class OrdenCompraController {
  private ordenCompraService = new OrdenCompraService();

  async getAll(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const result = await this.ordenCompraService.findAll(page, limit);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getOne(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const ordenCompra = await this.ordenCompraService.findOne(id);
      
      if (!ordenCompra) {
        return res.status(404).json({
          success: false,
          error: 'Orden de compra no encontrada'
        });
      }
      
      res.json({
        success: true,
        data: ordenCompra
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async generarSugerencia(req: Request, res: Response) {
    try {
      const sugerencia = await this.ordenCompraService.generarSugerencia();
      
      res.json({
        success: true,
        data: sugerencia
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { detalles } = req.body;
      const ordenCompra = await this.ordenCompraService.create(detalles);
      
      res.status(201).json({
        success: true,
        data: ordenCompra
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async updateDetalle(req: Request, res: Response) {
    try {
      const ordenId = parseInt(req.params.id);
      const detalleId = parseInt(req.params.detalleId);
      const { cantidad_sugerida } = req.body;
      
      await this.ordenCompraService.updateDetalle(ordenId, detalleId, cantidad_sugerida);
      
      res.json({
        success: true,
        message: 'Detalle actualizado correctamente'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async deleteDetalle(req: Request, res: Response) {
    try {
      const ordenId = parseInt(req.params.id);
      const detalleId = parseInt(req.params.detalleId);
      
      await this.ordenCompraService.deleteDetalle(ordenId, detalleId);
      
      res.json({
        success: true,
        message: 'Detalle eliminado correctamente'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async confirmar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const ordenCompra = await this.ordenCompraService.confirmar(id);
      
      res.json({
        success: true,
        data: ordenCompra
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async cancelar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const ordenCompra = await this.ordenCompraService.cancelar(id);
      
      res.json({
        success: true,
        data: ordenCompra
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async generarPDF(req: Request, res: Response) {
    let doc: InstanceType<typeof PDFDocument> | null = null;
    
    try {
      const id = parseInt(req.params.id);
      const ordenCompra = await this.ordenCompraService.findOne(id);
      
      if (!ordenCompra) {
        return res.status(404).json({ message: 'Orden de compra no encontrada' });
      }

      // Crear documento PDF
      doc = new PDFDocument({ margin: 50 });
      
      // Headers para descarga
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=orden-compra-${ordenCompra.id}.pdf`);
      
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
      doc.fontSize(20).text('ORDEN DE COMPRA', 50, 50, { align: 'center' });
      doc.fontSize(14).text(`Número: OC-${String(ordenCompra.id).padStart(6, '0')}`, 50, 80);
      doc.fontSize(12).text(`Fecha: ${new Date(ordenCompra.fecha_orden).toLocaleDateString('es-AR')}`, 50, 100);
      doc.text(`Estado: ${ordenCompra.estado}`, 50, 120);
      
      // Línea separadora
      doc.moveTo(50, 150).lineTo(550, 150).stroke();
      
      // Agrupar productos por proveedor
      const productosPorProveedor = new Map<string, any[]>();
      
      for (const detalle of ordenCompra.detalles) {
        const proveedor = detalle.producto_unidad.producto.proveedor || 'Sin proveedor';
        if (!productosPorProveedor.has(proveedor)) {
          productosPorProveedor.set(proveedor, []);
        }
        productosPorProveedor.get(proveedor)!.push(detalle);
      }
      
      let yPosition = 170;
      
      // Iterar por cada proveedor
      for (const [proveedor, detalles] of productosPorProveedor) {
        // Verificar si necesitamos nueva página
        if (yPosition > 650) {
          doc.addPage();
          yPosition = 50;
        }
        
        // Título del proveedor
        doc.fontSize(14).font('Helvetica-Bold');
        doc.text(`Proveedor: ${proveedor}`, 50, yPosition);
        yPosition += 25;
        
        // Encabezados de la tabla
        doc.fontSize(11).font('Helvetica-Bold');
        doc.text('Producto', 50, yPosition);
        doc.text('Cantidad', 350, yPosition);
        doc.text('Unidad', 430, yPosition);
        
        // Línea bajo encabezados
        yPosition += 15;
        doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
        
        // Detalles del proveedor
        doc.font('Helvetica').fontSize(10);
        yPosition += 15;
        
        for (const detalle of detalles) {
          // Verificar si necesitamos nueva página
          if (yPosition > 700) {
            doc.addPage();
            yPosition = 50;
          }
          
          doc.text(detalle.producto_unidad.producto.nombre, 50, yPosition);
          doc.text(detalle.cantidad_sugerida.toString(), 350, yPosition);
          doc.text(detalle.producto_unidad.unidad_medida.nombre, 430, yPosition);
          
          yPosition += 20;
        }
        
        // Espacio entre proveedores
        yPosition += 15;
      }
      
      // Observaciones si las hay
      if (ordenCompra.observaciones) {
        if (yPosition > 650) {
          doc.addPage();
          yPosition = 50;
        }
        
        doc.fontSize(12).font('Helvetica-Bold');
        doc.text('Observaciones:', 50, yPosition);
        yPosition += 20;
        doc.font('Helvetica').fontSize(10);
        doc.text(ordenCompra.observaciones, 50, yPosition, { width: 500 });
      }
      
      // Espacio para firmas
      yPosition += 80;
      if (yPosition > 650) {
        doc.addPage();
        yPosition = 100;
      }
      
      doc.fontSize(10);
      doc.text('_______________________', 100, yPosition);
      doc.text('Autorizado por', 100, yPosition + 20);
      doc.text('_______________________', 350, yPosition);
      doc.text('Fecha', 350, yPosition + 20);
      
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