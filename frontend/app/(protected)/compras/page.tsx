'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Eye, Check, X, Package, DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { compraService } from '@/services/compra.service';
import { ICompra, EstadoCompra } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function ComprasPage() {
  const router = useRouter();
  const [compras, setCompras] = useState<ICompra[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Estadísticas
  const [stats, setStats] = useState({
    pendientes: 0,
    confirmadas: 0,
    totalMes: 0,
    totalConfirmado: 0
  });

  useEffect(() => {
    loadCompras();
  }, [page]);

  const loadCompras = async () => {
    try {
      setLoading(true);
      const response = await compraService.getAll(page, 10);
      
      
      if (response.success && response.data) {
        setCompras(response.data);
        setTotalPages(response.totalPages);

        
        // Calcular estadísticas usando los datos recién obtenidos
        const pendientes = response.data.filter((c: ICompra) => c.estado === EstadoCompra.PENDIENTE).length;
        const confirmadas = response.data.filter((c: ICompra) => c.estado === EstadoCompra.CONFIRMADA).length;
        const totalMes = response.data.filter((c: ICompra) => {
          const compraDate = new Date(c.fecha_compra);
          const now = new Date();
          return compraDate.getMonth() === now.getMonth() && compraDate.getFullYear() === now.getFullYear();
        }).length;
        const totalConfirmado = response.data
          .filter((c: ICompra) => c.estado === EstadoCompra.CONFIRMADA)
          .reduce((sum: number, c: ICompra) => sum + Number(c.total_real), 0);
        
        setStats({ pendientes, confirmadas, totalMes, totalConfirmado });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las compras',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmar = async (id: number) => {
    try {
      const response = await compraService.confirmar(id);
      if (response.success) {
        toast({
          title: 'Éxito',
          description: 'Compra confirmada y stock actualizado',
        });
        loadCompras();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo confirmar la compra',
        variant: 'destructive',
      });
    }
  };

  const handleCancelar = async (id: number) => {
    try {
      const response = await compraService.cancelar(id);
      if (response.success) {
        toast({
          title: 'Éxito',
          description: 'Compra cancelada',
        });
        loadCompras();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cancelar la compra',
        variant: 'destructive',
      });
    }
  };

  const getEstadoBadge = (estado: EstadoCompra) => {
    const variants: Record<EstadoCompra, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      [EstadoCompra.PENDIENTE]: { variant: 'secondary', label: 'Pendiente' },
      [EstadoCompra.CONFIRMADA]: { variant: 'default', label: 'Confirmada' },
      [EstadoCompra.CANCELADA]: { variant: 'destructive', label: 'Cancelada' }
    };
    
    const config = variants[estado];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Compras</h1>
          <p className="text-gray-500">Gestión de compras y actualización de stock</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push('/compras/nueva-manual')}>
            <Plus className="mr-2 h-4 w-4" />
            Compra Manual
          </Button>
          <Button onClick={() => router.push('/ordenes-compra')} variant="outline">
            Ver Órdenes
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Package className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendientes}</div>
            <p className="text-xs text-muted-foreground">Por confirmar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmadas</CardTitle>
            <Check className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.confirmadas}</div>
            <p className="text-xs text-muted-foreground">Stock actualizado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compras del Mes</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMes}</div>
            <p className="text-xs text-muted-foreground">Este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Confirmado</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalConfirmado)}</div>
            <p className="text-xs text-muted-foreground">Inversión real</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Compras</CardTitle>
          <CardDescription>Gestiona las compras realizadas</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Cargando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Orden</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(compras?.length) === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No hay compras registradas
                    </TableCell>
                  </TableRow>
                ) : (
                  compras?.map((compra) => (
                    <TableRow key={compra.id}>
                      <TableCell className="font-medium">#{compra.id}</TableCell>
                      <TableCell>{formatDate(compra.fecha_compra)}</TableCell>
                      <TableCell>
                        {compra.orden_compra_id ? (
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => router.push(`/ordenes-compra/${compra.orden_compra_id}`)}
                          >
                            #{compra.orden_compra_id}
                          </Button>
                        ) : (
                          <span className="text-gray-500">Manual</span>
                        )}
                      </TableCell>
                      <TableCell>{formatCurrency(compra.total_real)}</TableCell>
                      <TableCell>{getEstadoBadge(compra.estado)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/compras/${compra.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {compra.estado === EstadoCompra.PENDIENTE && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:text-green-700"
                                onClick={() => handleConfirmar(compra.id!)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleCancelar(compra.id!)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <span className="flex items-center px-4">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >
                Siguiente
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}