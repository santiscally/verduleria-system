'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge'
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
import { ordenCompraService } from '@/services/orden-compra.service';
import { IOrdenCompra, EstadoOrdenCompra } from '@/types';
import { Plus, Eye, FileText, XCircle, CheckCircle } from 'lucide-react';

export default function OrdenesCompraPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [ordenes, setOrdenes] = useState<IOrdenCompra[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrden, setSelectedOrden] = useState<IOrdenCompra | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  useEffect(() => {
    loadOrdenes();
  }, [page]);

  const loadOrdenes = async () => {
    try {
      setLoading(true);
      const response = await ordenCompraService.getAll(page, 10);
      if (response.success && response.data) {
        setOrdenes(response.data.data);
        setTotalPages(response.data.totalPages);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar órdenes de compra',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNuevaOrden = () => {
    router.push('/ordenes-compra/nueva');
  };

  const handleVerDetalle = (orden: IOrdenCompra) => {
    router.push(`/ordenes-compra/${orden.id}`);
  };

  const handleConfirmar = (orden: IOrdenCompra) => {
    setSelectedOrden(orden);
    setIsConfirmDialogOpen(true);
  };

  const handleCancelar = (orden: IOrdenCompra) => {
    setSelectedOrden(orden);
    setIsCancelDialogOpen(true);
  };

  const confirmOrder = async () => {
    if (!selectedOrden) return;

    try {
      const response = await ordenCompraService.confirmar(selectedOrden.id!);
      if (response.success) {
        toast({
          title: 'Éxito',
          description: 'Orden confirmada correctamente',
        });
        loadOrdenes();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al confirmar orden',
        variant: 'destructive',
      });
    } finally {
      setIsConfirmDialogOpen(false);
    }
  };

  const cancelOrder = async () => {
    if (!selectedOrden) return;

    try {
      const response = await ordenCompraService.cancelar(selectedOrden.id!);
      if (response.success) {
        toast({
          title: 'Éxito',
          description: 'Orden cancelada correctamente',
        });
        loadOrdenes();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cancelar orden',
        variant: 'destructive',
      });
    } finally {
      setIsCancelDialogOpen(false);
    }
  };

  const getEstadoBadge = (estado: EstadoOrdenCompra) => {
    const config = {
      [EstadoOrdenCompra.BORRADOR]: { label: 'Borrador', className: 'bg-gray-100 text-gray-800' },
      [EstadoOrdenCompra.CONFIRMADA]: { label: 'Confirmada', className: 'bg-blue-100 text-blue-800' },
      [EstadoOrdenCompra.EN_PROCESO]: { label: 'En Proceso', className: 'bg-yellow-100 text-yellow-800' },
      [EstadoOrdenCompra.COMPLETADA]: { label: 'Completada', className: 'bg-green-100 text-green-800' },
      [EstadoOrdenCompra.CANCELADA]: { label: 'Cancelada', className: 'bg-red-100 text-red-800' },
    };
    
    const { label, className } = config[estado];
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
        <h1 className="text-3xl font-bold">Órdenes de Compra</h1>
        <Button onClick={handleNuevaOrden}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Orden
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Órdenes</CardTitle>
          <CardDescription>
            Gestione las órdenes de compra para el mercado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Orden</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total Estimado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      Cargando...
                    </TableCell>
                  </TableRow>
                ) : ordenes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      No se encontraron órdenes de compra
                    </TableCell>
                  </TableRow>
                ) : (
                  ordenes.map((orden) => (
                    <TableRow key={orden.id}>
                      <TableCell className="font-medium">#{orden.id}</TableCell>
                      <TableCell>{formatDate(orden.fecha_orden)}</TableCell>
                      <TableCell>{getEstadoBadge(orden.estado)}</TableCell>
                      <TableCell>{orden.detalles?.length || 0}</TableCell>
                      <TableCell>{formatCurrency(Number(orden.total_estimado))}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVerDetalle(orden)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {orden.estado === EstadoOrdenCompra.BORRADOR && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleConfirmar(orden)}
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelar(orden)}
                            >
                              <XCircle className="h-4 w-4 text-red-600" />
                            </Button>
                          </>
                        )}
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

      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar orden de compra?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción confirmará la orden de compra #{selectedOrden?.id}.
              Una vez confirmada, no podrá editarse.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmOrder}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar orden de compra?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción cancelará la orden de compra #{selectedOrden?.id} y
              revertirá los pedidos a estado pendiente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={cancelOrder} className="bg-red-600 hover:bg-red-700">
              Sí, cancelar orden
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}