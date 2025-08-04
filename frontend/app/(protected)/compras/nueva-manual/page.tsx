'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { compraService, CompraDetalleInput } from '@/services/compra.service';
import { productoUnidadService } from '@/services/producto-unidad.service';
import { IProductoUnidad } from '@/types';
import { formatCurrency } from '@/lib/utils';

export default function NuevaCompraManualPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [productosUnidades, setProductosUnidades] = useState<IProductoUnidad[]>([]);
  const [detalles, setDetalles] = useState<CompraDetalleInput[]>([]);
  const [nuevoDetalle, setNuevoDetalle] = useState<CompraDetalleInput>({
    producto_unidad_id: 0,
    cantidad: 0,
    precio_unitario: 0
  });

  useEffect(() => {
    loadProductosUnidades();
  }, []);

  const loadProductosUnidades = async () => {
    try {
      const response = await productoUnidadService.getUnidadesCompra();
      if (response.success && response.data) {
        setProductosUnidades(response.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los productos',
        variant: 'destructive',
      });
    }
  };

  const handleAddDetalle = () => {
    if (!nuevoDetalle.producto_unidad_id || nuevoDetalle.cantidad <= 0 || nuevoDetalle.precio_unitario <= 0) {
      toast({
        title: 'Error',
        description: 'Completa todos los campos correctamente',
        variant: 'destructive',
      });
      return;
    }

    setDetalles([...detalles, { ...nuevoDetalle }]);
    setNuevoDetalle({
      producto_unidad_id: 0,
      cantidad: 0,
      precio_unitario: 0
    });
  };

  const handleRemoveDetalle = (index: number) => {
    setDetalles(detalles.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (detalles.length === 0) {
      toast({
        title: 'Error',
        description: 'Agrega al menos un producto',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const response = await compraService.createManual({ detalles });
      
      if (response.success) {
        toast({
          title: 'Éxito',
          description: 'Compra creada exitosamente',
        });
        router.push(`/compras/${response.data?.id}`);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo crear la compra',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getProductoInfo = (productoUnidadId: number) => {
    const pu = productosUnidades.find(p => p.id === productoUnidadId);
    return pu ? `${pu.producto?.nombre} - ${pu.unidad_medida?.abreviacion}` : '';
  };

  const calcularTotal = () => {
    return detalles.reduce((sum, d) => sum + (d.cantidad * d.precio_unitario), 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nueva Compra Manual</h1>
          <p className="text-gray-500">Registra una compra sin orden asociada</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agregar Productos</CardTitle>
          <CardDescription>Selecciona los productos y cantidades compradas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <Label>Producto</Label>
              <Select
                value={nuevoDetalle.producto_unidad_id.toString()}
                onValueChange={(value) => setNuevoDetalle({ ...nuevoDetalle, producto_unidad_id: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {productosUnidades.map((pu) => (
                    <SelectItem key={pu.id} value={pu.id!.toString()}>
                      {pu.producto?.nombre} - {pu.unidad_medida?.abreviacion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cantidad</Label>
              <Input
                type="number"
                step="0.001"
                placeholder="0"
                value={nuevoDetalle.cantidad || ''}
                onChange={(e) => setNuevoDetalle({ ...nuevoDetalle, cantidad: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Precio Unitario</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={nuevoDetalle.precio_unitario || ''}
                onChange={(e) => setNuevoDetalle({ ...nuevoDetalle, precio_unitario: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddDetalle} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Agregar
              </Button>
            </div>
          </div>

          {detalles.length > 0 && (
            <div className="mt-6 space-y-2">
              <h3 className="font-medium">Productos agregados:</h3>
              {detalles.map((detalle, index) => (
                <div key={index} className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <p className="font-medium">{getProductoInfo(detalle.producto_unidad_id)}</p>
                    <p className="text-sm text-gray-500">
                      {detalle.cantidad} x {formatCurrency(detalle.precio_unitario)} = {formatCurrency(detalle.cantidad * detalle.precio_unitario)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveDetalle(index)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              ))}
              
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium">Total:</span>
                  <span className="text-2xl font-bold">{formatCurrency(calcularTotal())}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.push('/compras')}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={loading || detalles.length === 0}>
          {loading ? 'Creando...' : 'Crear Compra'}
        </Button>
      </div>
    </div>
  );
}