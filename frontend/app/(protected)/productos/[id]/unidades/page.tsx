'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Plus, Edit2, Trash2, ShoppingCart, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { productoUnidadService } from '@/services/producto-unidad.service';
import { unidadMedidaService } from '@/services/unidad-medida.service';
import { productoService } from '@/services/producto.service';
import { IProductoUnidad, IUnidadMedida, IProducto } from '@/types';

export default function ProductoUnidadesPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const productoId = parseInt(params.id as string);

  const [producto, setProducto] = useState<IProducto | null>(null);
  const [unidades, setUnidades] = useState<IProductoUnidad[]>([]);
  const [unidadesMedida, setUnidadesMedida] = useState<IUnidadMedida[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUnidad, setEditingUnidad] = useState<IProductoUnidad | null>(null);
  
  const [formData, setFormData] = useState<Partial<IProductoUnidad>>({
    producto_id: productoId,
    unidad_medida_id: 0,
    margen_ganancia: 50,
    stock_actual: 0,
    es_unidad_compra: false,
    es_unidad_venta: true
  });

  useEffect(() => {
    cargarDatos();
  }, [productoId]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Cargar producto
      const prodResponse = await productoService.getOne(productoId);
      if (prodResponse.success && prodResponse.data) {
        setProducto(prodResponse.data);
      }

      // Cargar unidades del producto
      const unidadesResponse = await productoUnidadService.getByProducto(productoId);
      if (unidadesResponse.success && unidadesResponse.data) {
        setUnidades(unidadesResponse.data);
      }

      // Cargar todas las unidades de medida
      const umResponse = await unidadMedidaService.getAllSimple();
      if (umResponse.success && umResponse.data) {
        setUnidadesMedida(umResponse.data);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudieron cargar los datos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (unidad?: IProductoUnidad) => {
    if (unidad) {
      setEditingUnidad(unidad);
      setFormData(unidad);
    } else {
      setEditingUnidad(null);
      setFormData({
        producto_id: productoId,
        unidad_medida_id: 0,
        margen_ganancia: 50,
        stock_actual: 0,
        es_unidad_compra: false,
        es_unidad_venta: true
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.unidad_medida_id || formData.unidad_medida_id === 0) {
      toast({
        title: 'Error',
        description: 'Selecciona una unidad de medida',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      if (editingUnidad) {
        // Actualizar
        const response = await productoUnidadService.update(editingUnidad.id!, formData);
        if (response.success) {
          toast({
            title: 'Éxito',
            description: 'Unidad actualizada correctamente',
          });
        }
      } else {
        // Crear
        const response = await productoUnidadService.create(formData as IProductoUnidad);
        if (response.success) {
          toast({
            title: 'Éxito',
            description: 'Unidad agregada correctamente',
          });
        }
      }

      setDialogOpen(false);
      cargarDatos();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo guardar la unidad',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta unidad?')) return;

    try {
      setLoading(true);
      const response = await productoUnidadService.delete(id);
      if (response.success) {
        toast({
          title: 'Éxito',
          description: 'Unidad eliminada correctamente',
        });
        cargarDatos();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar la unidad',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/productos')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{producto?.nombre || 'Producto'}</h1>
          <p className="text-gray-500">Gestión de unidades de medida y configuración</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Unidad
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingUnidad ? 'Editar Unidad' : 'Nueva Unidad'}
              </DialogTitle>
              <DialogDescription>
                Configura las propiedades de la unidad de medida para este producto.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label>Unidad de Medida</Label>
                <Select
                  value={formData.unidad_medida_id?.toString() || ''}
                  onValueChange={(value) => setFormData({ ...formData, unidad_medida_id: parseInt(value) })}
                  disabled={editingUnidad !== null}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar unidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {unidadesMedida
                      .filter(um => !unidades.some(u => u.unidad_medida_id === um.id && u.id !== editingUnidad?.id))
                      .map((um) => (
                        <SelectItem key={um.id} value={um.id!.toString()}>
                          {um.nombre} ({um.abreviacion})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Margen de Ganancia (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.margen_ganancia || 0}
                  onChange={(e) => setFormData({ ...formData, margen_ganancia: parseFloat(e.target.value) })}
                />
              </div>

              <div>
                <Label>Stock Actual</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.stock_actual || 0}
                  onChange={(e) => setFormData({ ...formData, stock_actual: parseFloat(e.target.value) })}
                  disabled={editingUnidad !== null}
                />
                {editingUnidad && (
                  <p className="text-xs text-gray-500 mt-1">
                    El stock se gestiona desde las compras y remitos
                  </p>
                )}
              </div>

              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="es_unidad_compra"
                    checked={formData.es_unidad_compra || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, es_unidad_compra: checked as boolean })}
                  />
                  <label htmlFor="es_unidad_compra" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-blue-500" />
                    Unidad de Compra
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="es_unidad_venta"
                    checked={formData.es_unidad_venta || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, es_unidad_venta: checked as boolean })}
                  />
                  <label htmlFor="es_unidad_venta" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    Unidad de Venta
                  </label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? 'Guardando...' : editingUnidad ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Unidades Configuradas</CardTitle>
          <CardDescription>
            Unidades de medida disponibles para este producto
          </CardDescription>
        </CardHeader>
        <CardContent>
          {unidades.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No hay unidades configuradas</p>
              <p className="text-sm">Agrega al menos una unidad para comenzar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {unidades.map((unidad) => (
                <div
                  key={unidad.id}
                  className="p-4 rounded-lg border bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">
                          {unidad.unidad_medida?.nombre} ({unidad.unidad_medida?.abreviacion})
                        </h3>
                        <div className="flex gap-1">
                          {unidad.es_unidad_compra && (
                            <Badge variant="default" className="bg-blue-500">
                              <ShoppingCart className="h-3 w-3 mr-1" />
                              Compra
                            </Badge>
                          )}
                          {unidad.es_unidad_venta && (
                            <Badge variant="default" className="bg-green-500">
                              <DollarSign className="h-3 w-3 mr-1" />
                              Venta
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Stock</p>
                          <p className="font-medium">{unidad.stock_actual} {unidad.unidad_medida?.abreviacion}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Margen</p>
                          <p className="font-medium">{unidad.margen_ganancia}%</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleOpenDialog(unidad)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(unidad.id!)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}