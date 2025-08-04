'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, X, Edit, Trash2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { compraService } from '@/services/compra.service';
import { ICompra, EstadoCompra } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@radix-ui/react-select';

export default function CompraDetallePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [compra, setCompra] = useState<ICompra | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingDetalle, setEditingDetalle] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    cantidad: 0,
    precio_unitario: 0,
    precio_total: 0,
    usar_precio_total: false
  });

  useEffect(() => {
    loadCompra();
  }, [params.id]);

  const loadCompra = async () => {
    try {
      setLoading(true);
      const response = await compraService.getOne(parseInt(params.id));
      
      if (response.success && response.data) {
        setCompra(response.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cargar la compra',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmar = async () => {
    if (!compra) return;
    
    try {
      const response = await compraService.confirmar(compra.id!);
      if (response.success) {
        toast({
          title: 'Éxito',
          description: 'Compra confirmada y stock actualizado',
        });
        loadCompra();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo confirmar la compra',
        variant: 'destructive',
      });
    }
  };

  const handleCancelar = async () => {
    if (!compra) return;
    
    try {
      const response = await compraService.cancelar(compra.id!);
      if (response.success) {
        toast({
          title: 'Éxito',
          description: 'Compra cancelada',
        });
        router.push('/compras');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cancelar la compra',
        variant: 'destructive',
      });
    }
  };

  const startEditDetalle = (detalle: any) => {
    setEditingDetalle(detalle.id);
    setEditForm({
      cantidad: detalle.cantidad,
      precio_unitario: detalle.precio_unitario,
      precio_total: detalle.cantidad * detalle.precio_unitario,
      usar_precio_total: false
    });
  };

  const handleUpdateDetalle = async () => {
    if (!compra || !editingDetalle) return;
    
    try {
      const precio_unitario = editForm.usar_precio_total 
        ? editForm.precio_total / editForm.cantidad
        : editForm.precio_unitario;

      const response = await compraService.updateDetalle(
        compra.id!,
        editingDetalle,
        {
          cantidad: editForm.cantidad,
          precio_unitario: precio_unitario
        }
      );
      
      if (response.success) {
        toast({
          title: 'Éxito',
          description: 'Detalle actualizado',
        });
        setEditingDetalle(null);
        loadCompra();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el detalle',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteDetalle = async (detalleId: number) => {
    if (!compra) return;
    
    try {
      const response = await compraService.deleteDetalle(compra.id!, detalleId);
      if (response.success) {
        toast({
          title: 'Éxito',
          description: 'Detalle eliminado',
        });
        loadCompra();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el detalle',
        variant: 'destructive',
      });
    }
  };

  const getEstadoBadge = (estado: EstadoCompra) => {
    const variants: Record<EstadoCompra, { variant: 'default' | 'secondary' | 'destructive', label: string }> = {
      [EstadoCompra.PENDIENTE]: { variant: 'secondary', label: 'Pendiente' },
      [EstadoCompra.CONFIRMADA]: { variant: 'default', label: 'Confirmada' },
      [EstadoCompra.CANCELADA]: { variant: 'destructive', label: 'Cancelada' }
    };
    
    const config = variants[estado];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  if (!compra) {
    return <div className="text-center py-8">Compra no encontrada</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Compra #{compra.id}</h1>
            <p className="text-gray-500">Detalle de la compra</p>
          </div>
        </div>
        {compra.estado === EstadoCompra.PENDIENTE && (
          <div className="flex gap-2">
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
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Fecha</Label>
              <p className="text-lg">{formatDate(compra.fecha_compra)}</p>
            </div>
            <div>
              <Label>Estado</Label>
              <div className="mt-1">{getEstadoBadge(compra.estado)}</div>
            </div>
            <div>
              <Label>Orden de Compra</Label>
              <p className="text-lg">
                {compra.orden_compra_id ? (
                  <Button
                    variant="link"
                    className="p-0 h-auto"
                    onClick={() => router.push(`/ordenes-compra/${compra.orden_compra_id}`)}
                  >
                    #{compra.orden_compra_id}
                  </Button>
                ) : (
                  'Compra Manual'
                )}
              </p>
            </div>
            <div>
              <Label>Total</Label>
              <p className="text-2xl font-bold">{formatCurrency(compra.total_real)}</p>
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
                <span>Productos diferentes:</span>
                <span className="font-medium">{compra.detalles?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Total items:</span>
                <span className="font-medium">
                  {compra.detalles?.reduce((sum, d) => sum + Number(d.cantidad), 0) || 0}
                </span>
              </div>
              {compra.confirmada && (
                <div className="pt-2 border-t">
                  <div className="flex items-center gap-2 text-green-600">
                    <Package className="h-4 w-4" />
                    <span className="font-medium">Stock actualizado</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalles de la Compra</CardTitle>
          <CardDescription>Productos incluidos en esta compra</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {compra.detalles?.map((detalle) => (
              <div key={detalle.id} className="border rounded-lg p-4">
                {editingDetalle === detalle.id ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label>Cantidad</Label>
                        <Input
                          type="number"
                          step="0.001"
                          value={editForm.cantidad}
                          onChange={(e) => {
                            const cantidad = parseFloat(e.target.value) || 0;
                            setEditForm({ 
                              ...editForm, 
                              cantidad,
                              precio_total: cantidad * editForm.precio_unitario
                            });
                          }}
                        />
                      </div>
                      <div>
                        <Label>Tipo de precio</Label>
                        <Select
                          value={editForm.usar_precio_total.toString()}
                          onValueChange={(value) => setEditForm({ ...editForm, usar_precio_total: value === 'true' })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="false">Precio Unitario</SelectItem>
                            <SelectItem value="true">Precio Total</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      {editForm.usar_precio_total ? (
                        <div>
                          <Label>Precio Total</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={editForm.precio_total}
                            onChange={(e) => {
                              const precio_total = parseFloat(e.target.value) || 0;
                              setEditForm({ 
                                ...editForm, 
                                precio_total,
                                precio_unitario: editForm.cantidad > 0 ? precio_total / editForm.cantidad : 0
                              });
                            }}
                          />
                          <p className="text-sm text-gray-500 mt-1">
                            Precio unitario: {formatCurrency(editForm.cantidad > 0 ? editForm.precio_total / editForm.cantidad : 0)}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <Label>Precio Unitario</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={editForm.precio_unitario}
                            onChange={(e) => {
                              const precio_unitario = parseFloat(e.target.value) || 0;
                              setEditForm({ 
                                ...editForm, 
                                precio_unitario,
                                precio_total: editForm.cantidad * precio_unitario
                              });
                            }}
                          />
                          <p className="text-sm text-gray-500 mt-1">
                            Total: {formatCurrency(editForm.cantidad * editForm.precio_unitario)}
                          </p>
                        </div>
                      )}
                      <div className="flex items-end gap-2">
                        <Button onClick={handleUpdateDetalle}>Guardar</Button>
                        <Button variant="outline" onClick={() => setEditingDetalle(null)}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">
                        {detalle.producto_unidad?.producto?.nombre} - {detalle.producto_unidad?.unidad_medida?.abreviacion}
                      </p>
                      <p className="text-sm text-gray-500">
                        {detalle.cantidad} x {formatCurrency(detalle.precio_unitario)} = {formatCurrency(detalle.cantidad * detalle.precio_unitario)}
                      </p>
                    </div>
                    {compra.estado === EstadoCompra.PENDIENTE && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEditDetalle(detalle)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteDetalle(detalle.id!)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}