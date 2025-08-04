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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { ordenCompraService, SugerenciaCompra } from '@/services/orden-compra.service';
import { Loader2, AlertCircle, ShoppingCart, Package, Trash2, Save } from 'lucide-react';

export default function NuevaOrdenCompraPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sugerencias, setSugerencias] = useState<SugerenciaCompra[]>([]);
  const [pedidosCount, setPedidosCount] = useState(0);
  const [editedSugerencias, setEditedSugerencias] = useState<Map<number, SugerenciaCompra>>(new Map());

  useEffect(() => {
    generarSugerencia();
  }, []);

  const generarSugerencia = async () => {
    try {
      setLoading(true);
      const response = await ordenCompraService.generarSugerencia();
      if (response.success && response.data) {
        setSugerencias(response.data.sugerencias);
        setPedidosCount(response.data.pedidos.length);
        
        // Inicializar mapa de ediciones
        const editMap = new Map<number, SugerenciaCompra>();
        response.data.sugerencias.forEach((sug, index) => {
          editMap.set(index, { ...sug });
        });
        setEditedSugerencias(editMap);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al generar sugerencia de compra',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCantidadChange = (index: number, cantidad: string) => {
    const cantidadNum = parseFloat(cantidad) || 0;
    const updated = new Map(editedSugerencias);
    const item = updated.get(index);
    if (item) {
      item.cantidad_sugerida = cantidadNum;
      setEditedSugerencias(updated);
    }
  };

  const handleEliminarLinea = (index: number) => {
    const updated = new Map(editedSugerencias);
    updated.delete(index);
    
    // Re-indexar el mapa
    const newMap = new Map<number, SugerenciaCompra>();
    let newIndex = 0;
    updated.forEach((value) => {
      newMap.set(newIndex++, value);
    });
    
    setEditedSugerencias(newMap);
  };

  const handleGuardar = async () => {
    const detalles = Array.from(editedSugerencias.values())
      .filter(item => item.cantidad_sugerida > 0)
      .map(item => ({
        producto_unidad_id: item.producto_unidad_id,
        cantidad_sugerida: item.cantidad_sugerida
      }));

    if (detalles.length === 0) {
      toast({
        title: 'Error',
        description: 'Debe incluir al menos un producto en la orden',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const response = await ordenCompraService.create(detalles);
      if (response.success) {
        toast({
          title: 'Éxito',
          description: 'Orden de compra creada correctamente',
        });
        router.push('/ordenes-compra');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al crear orden de compra',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const calcularTotal = () => {
    return Array.from(editedSugerencias.values()).reduce((total, item) => {
      // Aquí podrías calcular un precio estimado si tuvieras histórico
      return total + item.cantidad_sugerida;
    }, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Nueva Orden de Compra</h1>
        <Button variant="outline" onClick={() => router.push('/ordenes-compra')}>
          Volver
        </Button>
      </div>

      {pedidosCount === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No hay pedidos pendientes para generar una orden de compra.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
              <CardDescription>
                Generando orden basada en {pedidosCount} pedido{pedidosCount > 1 ? 's' : ''} pendiente{pedidosCount > 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Productos a Comprar</CardTitle>
              <CardDescription>
                Revise y ajuste las cantidades sugeridas según necesidad
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Unidad</TableHead>
                      <TableHead>Cantidad Necesaria</TableHead>
                      <TableHead>Stock Actual</TableHead>
                      <TableHead>Cantidad Sugerida</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from(editedSugerencias.entries()).map(([index, item]) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {item.producto_unidad?.producto?.nombre || '-'}
                        </TableCell>
                        <TableCell>
                          {item.producto_unidad?.unidad_medida?.abreviacion || '-'}
                        </TableCell>
                        <TableCell>
                          {item.cantidad_necesaria > 0 ? item.cantidad_necesaria.toFixed(2) : '-'}
                        </TableCell>
                        <TableCell>
                          {item.cantidad_stock > 0 ? item.cantidad_stock.toFixed(2) : '-'}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.001"
                            value={item.cantidad_sugerida}
                            onChange={(e) => handleCantidadChange(index, e.target.value)}
                            className="w-32"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEliminarLinea(index)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {editedSugerencias.size === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No hay productos para comprar
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between items-center">
            <div className="text-lg font-semibold">
              Total de líneas: {editedSugerencias.size}
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                onClick={() => router.push('/ordenes-compra')}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleGuardar}
                disabled={saving || editedSugerencias.size === 0}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Orden
                  </>
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}