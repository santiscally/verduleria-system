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
import { ordenCompraService } from '@/services/orden-compra.service';
import { IOrdenCompra, EstadoOrdenCompra } from '@/types';
import { Plus, Eye, FileText, XCircle, CheckCircle, Download } from 'lucide-react';

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

  const handleDescargarPDF = async (orden: IOrdenCompra) => {
    try {
      await ordenCompraService.descargarPDF(orden.id!);
      toast({
        title: 'Éxito',
        description: 'PDF descargado correctamente',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al descargar el PDF',
        variant: 'destructive',
      });
    }
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
        description: 'Error al confirmar la orden',
        variant: 'destructive',
      });
    } finally {
      setIsConfirmDialogOpen(false);
      setSelectedOrden(null);
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
        description: 'Error al cancelar la orden',
        variant: 'destructive',
      });
    } finally {
      setIsCancelDialogOpen(false);
      setSelectedOrden(null);
    }
  };

  const getEstadoBadge = (estado: EstadoOrdenCompra) => {
    const config: Record<EstadoOrdenCompra, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      [EstadoOrdenCompra.BORRADOR]: { variant: 'secondary', label: 'Borrador' },
      [EstadoOrdenCompra.CONFIRMADA]: { variant: 'default', label: 'Confirmada' },
      [EstadoOrdenCompra.EN_PROCESO]: { variant: 'outline', label: 'En Proceso' },
      [EstadoOrdenCompra.COMPLETADA]: { variant: 'default', label: 'Completada' },
      [EstadoOrdenCompra.CANCELADA]: { variant: 'destructive', label: 'Cancelada' }
    };
    
    return <Badge variant={config[estado].variant}>{config[estado].label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Órdenes de Compra</h1>
          <p className="text-gray-500">Gestión de órdenes de compra a proveedores</p>
        </div>
        <Button onClick={handleNuevaOrden}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Orden
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Órdenes</CardTitle>
          <CardDescription>
            Todas las órdenes de compra generadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Orden</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Productos</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordenes.map((orden) => (
                    <TableRow key={orden.id}>
                      <TableCell className="font-medium">
                        OC-{String(orden.id).padStart(6, '0')}
                      </TableCell>
                      <TableCell>
                        {new Date(orden.fecha_orden).toLocaleDateString('es-AR')}
                      </TableCell>
                      <TableCell>{getEstadoBadge(orden.estado)}</TableCell>
                      <TableCell>{orden.detalles?.length || 0} productos</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleVerDetalle(orden)}
                            title="Ver detalle"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {orden.estado === EstadoOrdenCompra.CONFIRMADA && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDescargarPDF(orden)}
                              title="Descargar PDF"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          {orden.estado === EstadoOrdenCompra.BORRADOR && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-green-600"
                                onClick={() => handleConfirmar(orden)}
                                title="Confirmar orden"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600"
                                onClick={() => handleCancelar(orden)}
                                title="Cancelar orden"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    Anterior
                  </Button>
                  <span className="py-2 px-4">
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
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Orden de Compra</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro de confirmar esta orden de compra? Una vez confirmada,
              podrá proceder con la compra a los proveedores.
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
            <AlertDialogTitle>Cancelar Orden de Compra</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro de cancelar esta orden de compra? Esta acción no se
              puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={cancelOrder} className="bg-red-600">
              Sí, cancelar orden
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}