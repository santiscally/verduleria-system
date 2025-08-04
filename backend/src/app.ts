
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import clienteRoutes from './routes/cliente.routes';
import productoRoutes from './routes/producto.routes';
import unidadMedidaRoutes from './routes/unidad-medida.routes';
import productoUnidadRoutes from './routes/producto-unidad.routes';
import conversionRoutes from './routes/conversion.routes';
import pedidoImportRoutes from './routes/pedido-import.routes';
import ordenCompraRoutes from './routes/orden-compra.routes';
import pedidoRoutes from './routes/pedido.routes';
import compraRoutes from './routes/compra.routes';
import remitoRoutes from './routes/remito.routes';

dotenv.config();

const app = express();

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/unidades-medida', unidadMedidaRoutes);
app.use('/api/productos-unidades', productoUnidadRoutes);
app.use('/api/conversiones', conversionRoutes);
app.use('/api/pedidos/import', pedidoImportRoutes);
app.use('/api/ordenes-compra', ordenCompraRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/compras', compraRoutes);
app.use('/api/remitos', remitoRoutes);
// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Error interno del servidor'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada'
  });
});

export default app;