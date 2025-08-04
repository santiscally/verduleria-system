// frontend/src/app/page.tsx

// frontend/src/app/(protected)/page.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { productoService } from '@/services/producto.service';
import { productoUnidadService } from '@/services/producto-unidad.service';
import { Package, Users, ShoppingCart, TrendingUp, AlertTriangle, BarChart3 } from 'lucide-react';
import { clienteService } from '@/services/cliente.services';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalProductos: 0,
    totalClientes: 0,
    productosConStock: 0,
    productosSinStock: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      const [productosRes, clientesRes, productosConStockRes] = await Promise.all([
        productoService.getAll(1, 1),
        clienteService.getAll(1, 1),
        productoService.getProductosConStock(),
      ]);

      let totalProductos = 0;
      let totalClientes = 0;
      let productosConStock = 0;

      if (productosRes.success && productosRes.data) {
        totalProductos = productosRes.data.total;
      }
      if (clientesRes.success && clientesRes.data) {
        totalClientes = clientesRes.data.total;
      }
      if (productosConStockRes.success && productosConStockRes.data) {
        productosConStock = productosConStockRes.data.length;
      }

      setStats({
        totalProductos,
        totalClientes,
        productosConStock,
        productosSinStock: totalProductos - productosConStock,
      });
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-500">Bienvenido al Sistema de Gestión de Verdulería</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Productos
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.totalProductos}
            </div>
            <p className="text-xs text-muted-foreground">
              Productos registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Clientes
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.totalClientes}
            </div>
            <p className="text-xs text-muted-foreground">
              Clientes activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Productos con Stock
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {loading ? '...' : stats.productosConStock}
            </div>
            <p className="text-xs text-muted-foreground">
              Disponibles para venta
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Productos sin Stock
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {loading ? '...' : stats.productosSinStock}
            </div>
            <p className="text-xs text-muted-foreground">
              Requieren reposición
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>
              Accesos directos a las funciones más utilizadas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <a 
              href="/pedidos/importar" 
              className="flex items-center gap-2 p-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ShoppingCart className="h-5 w-5 text-green-600" />
              <span>Nuevo Pedido</span>
            </a>
            <a 
              href="/productos" 
              className="flex items-center gap-2 p-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Package className="h-5 w-5 text-blue-600" />
              <span>Gestionar Productos</span>
            </a>
            <a 
              href="/clientes" 
              className="flex items-center gap-2 p-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Users className="h-5 w-5 text-purple-600" />
              <span>Gestionar Clientes</span>
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado del Sistema</CardTitle>
            <CardDescription>
              Información general del sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Base de datos</span>
              <span className="text-sm font-medium text-green-600">Conectada</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Versión</span>
              <span className="text-sm font-medium">1.0.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Última actualización</span>
              <span className="text-sm font-medium">Hoy</span>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}