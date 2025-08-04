'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, X, Edit, Trash2, ShoppingCart, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import { ordenCompraService } from '@/services/orden-compra.service';
import { compraService } from '@/services/compra.service';
import { IOrdenCompra, EstadoOrdenCompra } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function OrdenCompraDetallePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [orden, setOrden] = useState<IOrdenCompra | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingDetalle, setEditingDetalle] = useState<number | null>(null);
  const [cantidadEdit, setCantidadEdit] = useState(0);

  useEffect(() => {
    loadOrden();
  }, [params.id]);

  const loadOrden = async () => {
    try {
      setLoading(true);
      const response = await ordenCompraService.getOne(parseInt(params.id));
      
      if (response.success && response.data) {
        setOrden(response.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cargar la orden de compra',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmar = async () => {
    if (!orden) return;
    
    try {
      const response = await ordenCompraService.confirmar(orden.id!);
      if (response.success) {
        toast({
          title: 'Éxito',
          description: 'Orden confirmada correctamente',
        });
        loadOrden();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo confirmar la orden',
        variant: 'destructive',
      });
    }
  };

  const handleCancelar = async () => {
    if (!orden) return;
    
    try {
      const response = await ordenCompraService.cancelar(orden.id!);
      if (response.success) {
        toast({
          title: 'Éxito',
          description: 'Orden cancelada',
        });
        router.push('/ordenes-compra');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cancelar la orden',
        variant: 'destructive',
      });
    }
  };

  const handleVerCompra = async () => {
    if (!orden) return;
    
    const comprasResponse = await compraService.getAll(1, 10);
    if (comprasResponse.success && comprasResponse.data) {
      const compra = comprasResponse.data.find(
        (c: any) => c.orden_compra_id === orden.id
      );
      if (compra) {
        router.push(`/compras/${compra.id}`);
      }
    }
  };

  const startEditDetalle = (detalle: any) => {
    setEditingDetalle(detalle.id);
    setCantidadEdit(detalle.cantidad_sugerida);
  };

  const handleUpdateDetalle = async (detalleId: number) => {
    if (!orden) return;
    
    try {
      const response = await ordenCompraService.updateDetalle(
        orden.id!,
        detalleId,
        cantidadEdit
      );
      
      if (response.success) {
        toast({
          title: 'Éxito',
          description: 'Cantidad actualizada',
        });
        setEditingDetalle(null);
        loadOrden();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la cantidad',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteDetalle = async (detalleId: number) => {
    if (!orden) return;
    
    try {
      const response = await ordenCompraService.deleteDetalle(orden.id!, detalleId);
      if (response.success) {
        toast({
          title: 'Éxito',
          description: 'Detalle eliminado',
        });
        loadOrden();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el detalle',
        variant: 'destructive',
      });
    }
  };

  const getEstadoBadge = (estado: EstadoOrdenCompra) => {
    const variants: Record<EstadoOrdenCompra, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      [EstadoOrdenCompra.BORRADOR]: { variant: 'secondary', label: 'Borrador' },
      [EstadoOrdenCompra.CONFIRMADA]: { variant: 'default', label: 'Confirmada' },
      [EstadoOrdenCompra.EN_PROCESO]: { variant: 'outline', label: 'En Proceso' },
      [EstadoOrdenCompra.COMPLETADA]: { variant: 'default', label: 'Completada' },
      [EstadoOrdenCompra.CANCELADA]: { variant: 'destructive', label: 'Cancelada' }
    };
    
    const config = variants[estado];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  if (!orden) {
    return <div className="text-center py-8">Orden no encontrada</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Orden de Compra #{orden.id}</h1>
            <p className="text-gray-500">Detalle de la orden</p>
          </div>
        </div>
        <div className="flex gap-2">
          {orden.estado === EstadoOrdenCompra.BORRADOR && (
            <>
              <Button
                variant="outline"
                className="text-green-600 hover:text-green-700"
                onClick={handleConfirmar}
              >
                <Check className="mr-2 h-4 w-4" />
                Confirmar
              </Button>
              <Button
                variant="outline"
                className="text-red-600 hover:text-red-700"
                onClick={handleCancelar}
              >
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
            </>
          )}
          {orden.estado === EstadoOrdenCompra.CONFIRMADA && (
            <Button onClick={() => router.push(`/compras/nueva?ordenId=${orden.id}`)}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Registrar Compra
            </Button>
          )}
          {(orden.estado === EstadoOrdenCompra.EN_PROCESO || 
            orden.estado === EstadoOrdenCompra.COMPLETADA) && (
            <Button onClick={handleVerCompra}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Ver Compra
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Fecha</Label>
              <p className="text-lg">{formatDate(orden.fecha_orden)}</p>
            </div>
            <div>
              <Label>Estado</Label>
              <div className="mt-1">{getEstadoBadge(orden.estado)}</div>
            </div>
            <div>
              <Label>Total Estimado</Label>
              <p className="text-2xl font-bold">{formatCurrency(orden.total_estimado)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Productos:</span>
                <span className="font-medium">{orden.detalles?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Items totales:</span>
                <span className="font-medium">
                  {orden.detalles?.reduce((sum, d) => sum + Number(d.cantidad_sugerida), 0).toFixed(2) || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Observaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              {orden.observaciones || 'Sin observaciones'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Productos de la Orden</CardTitle>
          <CardDescription>Lista compacta de productos incluidos</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead className="text-right">Necesaria</TableHead>
                <TableHead className="text-right">Sugerida</TableHead>
                {orden.estado === EstadoOrdenCompra.BORRADOR && (
                  <TableHead className="text-right">Acciones</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {orden.detalles?.map((detalle) => (
                <TableRow key={detalle.id}>
                  <TableCell className="font-medium">
                    {detalle.producto_unidad?.producto?.nombre || '-'}
                  </TableCell>
                  <TableCell>
                    {detalle.producto_unidad?.unidad_medida?.abreviacion || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {detalle.cantidad_sugerida}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingDetalle === detalle.id ? (
                      <Input
                        type="number"
                        value={cantidadEdit}
                        onChange={(e) => setCantidadEdit(parseFloat(e.target.value))}
                        className="w-20 h-8 text-right"
                      />
                    ) : (
                      detalle.cantidad_sugerida
                    )}
                  </TableCell>
                  {orden.estado === EstadoOrdenCompra.BORRADOR && (
                    <TableCell className="text-right">
                      {editingDetalle === detalle.id ? (
                        <div className="flex gap-1 justify-end">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => handleUpdateDetalle(detalle.id!)}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => setEditingDetalle(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-1 justify-end">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => startEditDetalle(detalle)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteDetalle(detalle.id!)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}