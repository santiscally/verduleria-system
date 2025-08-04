'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { pedidoService } from '@/services/pedido.service';
import { IPedido, EstadoPedido } from '@/types';
import { FileText, Clock, Package, TrendingUp, Eye, Trash2, Upload, Search, FileCheck } from 'lucide-react';

export default function PedidosPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [pedidos, setPedidos] = useState<IPedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filtroEstado, setFiltroEstado] = useState<EstadoPedido | 'todos'>('todos');
  const [selectedPedido, setSelectedPedido] = useState<IPedido | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Estadísticas
  const [stats, setStats] = useState({
    pendientes: 0,
    enCompra: 0,
    completados: 0,
    totalDia: 0,
  });

  useEffect(() => {
    loadPedidos();
    loadStats();
  }, [page, filtroEstado]);

  const loadPedidos = async () => {
    try {
      setLoading(true);
      const estado = filtroEstado === 'todos' ? undefined : filtroEstado;
      const response = await pedidoService.getAll(page, 10, estado);
      if (response.success && response.data) {
        setPedidos(response.data.data);
        setTotalPages(response.data.totalPages);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar pedidos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Aquí podrías hacer llamadas específicas para obtener estadísticas
      // Por ahora, calculamos desde los pedidos cargados
      const pendientesRes = await pedidoService.getAll(1, 100, EstadoPedido.PENDIENTE);
      const enCompraRes = await pedidoService.getAll(1, 100, EstadoPedido.EN_COMPRA);
      const completadosRes = await pedidoService.getAll(1, 100, EstadoPedido.COMPLETADO);

      if (pendientesRes.success && enCompraRes.success && completadosRes.success) {
        setStats({
          pendientes: pendientesRes.data?.total || 0,
          enCompra: enCompraRes.data?.total || 0,
          completados: completadosRes.data?.total || 0,
          totalDia: 0, // Calcular total del día
        });
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  const handleVerDetalle = (pedido: IPedido) => {
    router.push(`/pedidos/${pedido.id}`);
  };

  const handleImportar = () => {
    router.push('/pedidos/importar');
  };

  const handleGenerarRemito = (pedido: IPedido) => {
    router.push(`/remitos/generar/${pedido.id}`);
  };

  const handleVerRemito = (pedido: IPedido) => {
    // Aquí podrías hacer una consulta para obtener el remito del pedido
    // Por ahora, redirigimos a la lista de remitos con filtro
    router.push(`/remitos/${pedido.remito?.id}`);
  };

  const handleDelete = (pedido: IPedido) => {
    if (pedido.estado !== EstadoPedido.PENDIENTE) {
      toast({
        title: 'Error',
        description: 'Solo se pueden eliminar pedidos pendientes',
        variant: 'destructive',
      });
      return;
    }
    setSelectedPedido(pedido);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedPedido) return;

    try {
      const response = await pedidoService.delete(selectedPedido.id!);
      if (response.success) {
        toast({
          title: 'Éxito',
          description: 'Pedido eliminado correctamente',
        });
        loadPedidos();
        loadStats();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al eliminar pedido',
        variant: 'destructive',
      });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const getEstadoBadge = (estado: EstadoPedido) => {
    const config = {
      [EstadoPedido.PENDIENTE]: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800' },
      [EstadoPedido.EN_COMPRA]: { label: 'En Compra', className: 'bg-blue-100 text-blue-800' },
      [EstadoPedido.EN_PROCESO]: { label: 'En Proceso', className: 'bg-purple-100 text-purple-800' },
      [EstadoPedido.PARCIAL]: { label: 'Parcial', className: 'bg-orange-100 text-orange-800' },
      [EstadoPedido.COMPLETADO]: { label: 'Completado', className: 'bg-green-100 text-green-800' },
    };
    
    const { label, className } = config[estado] || { label: estado, className: 'bg-gray-100 text-gray-800' };
    return <Badge className={className}>{label}</Badge>;
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Pedidos</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/remitos')}>
            <FileCheck className="mr-2 h-4 w-4" />
            Ver Remitos
          </Button>
          <Button onClick={handleImportar}>
            <Upload className="mr-2 h-4 w-4" />
            Importar Pedidos
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pedidos Pendientes
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendientes}</div>
            <p className="text-xs text-muted-foreground">
              Esperando procesamiento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              En Compra
            </CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.enCompra}</div>
            <p className="text-xs text-muted-foreground">
              Incluidos en órdenes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completados
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completados}</div>
            <p className="text-xs text-muted-foreground">
              Listos para entrega
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total del Día
            </CardTitle>
            <FileText className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalDia)}</div>
            <p className="text-xs text-muted-foreground">
              Ventas totales
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Pedidos</CardTitle>
          <CardDescription>
            Gestione los pedidos de clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Select value={filtroEstado} onValueChange={(value) => setFiltroEstado(value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value={EstadoPedido.PENDIENTE}>Pendiente</SelectItem>
                  <SelectItem value={EstadoPedido.EN_COMPRA}>En Compra</SelectItem>
                  <SelectItem value={EstadoPedido.EN_PROCESO}>En Proceso</SelectItem>
                  <SelectItem value={EstadoPedido.PARCIAL}>Parcial</SelectItem>
                  <SelectItem value={EstadoPedido.COMPLETADO}>Completado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      Cargando...
                    </TableCell>
                  </TableRow>
                ) : pedidos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      No se encontraron pedidos
                    </TableCell>
                  </TableRow>
                ) : (
                  pedidos.map((pedido) => (
                    <TableRow key={pedido.id}>
                      <TableCell className="font-medium">#{pedido.id}</TableCell>
                      <TableCell>{pedido.cliente?.nombre || '-'}</TableCell>
                      <TableCell>{formatDate(pedido.fecha_pedido)}</TableCell>
                      <TableCell>{getEstadoBadge(pedido.estado)}</TableCell>
                      <TableCell>{pedido.detalles?.length || 0}</TableCell>
                      <TableCell>{formatCurrency(Number(pedido.total))}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleVerDetalle(pedido)}
                            title="Ver detalle"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {(!pedido.remito) && (
                          <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleGenerarRemito(pedido)}
                                title="Generar remito"
                              >
                                <FileCheck className="h-4 w-4" />
                          </Button>
                          )}

                          {pedido.estado === EstadoPedido.PENDIENTE && (
                            <>                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(pedido)}
                                title="Eliminar pedido"
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </>
                          )}
                          
                          {(pedido.remito) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleVerRemito(pedido)}
                              title="Ver remito"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <span className="text-sm">
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

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el
              pedido #{selectedPedido?.id} del cliente {selectedPedido?.cliente?.nombre}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}