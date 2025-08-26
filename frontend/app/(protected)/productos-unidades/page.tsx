// frontend/src/app/productos-unidades/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { productoUnidadService } from '@/services/producto-unidad.service';
import { productoService } from '@/services/producto.service';
import { unidadMedidaService } from '@/services/unidad-medida.service';
import { IProductoUnidad, IProducto, IUnidadMedida } from '@/types';
import { Plus, Pencil, Trash2, Package, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';

export default function ProductosUnidadesPage() {
  const [productosUnidades, setProductosUnidades] = useState<IProductoUnidad[]>([]);
  const [productos, setProductos] = useState<IProducto[]>([]);
  const [unidades, setUnidades] = useState<IUnidadMedida[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<IProductoUnidad | null>(null);
  const [stockForm, setStockForm] = useState({
    cantidad: 0,
    operacion: 'sumar' as 'sumar' | 'restar' | 'establecer',
  });
  const [formData, setFormData] = useState<IProductoUnidad>({
    producto_id: 0,
    unidad_medida_id: 0,
    margen_ganancia: 0,
    stock_actual: 0,
    es_unidad_compra: false,
    es_unidad_venta: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [page]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productosUnidadesRes, productosRes, unidadesRes] = await Promise.all([
        productoUnidadService.getAll(page, 10),
        productoService.getAll(1, 100),
        unidadMedidaService.getAllSimple(),
      ]);

      if (productosUnidadesRes.success && productosUnidadesRes.data) {
        setProductosUnidades(productosUnidadesRes.data.data);
        setTotalPages(productosUnidadesRes.data.totalPages);
      }
      if (productosRes.success && productosRes.data) {
        setProductos(productosRes.data.data);
      }
      if (unidadesRes.success && unidadesRes.data) {
        setUnidades(unidadesRes.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar datos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedItem(null);
    setFormData({
      producto_id: 0,
      unidad_medida_id: 0,
      margen_ganancia: 0,
      stock_actual: 0,
      es_unidad_compra: false,
      es_unidad_venta: true,
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (item: IProductoUnidad) => {
    setSelectedItem(item);
    setFormData({
      producto_id: item.producto_id,
      unidad_medida_id: item.unidad_medida_id,
      margen_ganancia: item.margen_ganancia,
      stock_actual: item.stock_actual,
      es_unidad_compra: item.es_unidad_compra,
      es_unidad_venta: item.es_unidad_venta,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (item: IProductoUnidad) => {
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleStock = (item: IProductoUnidad) => {
    setSelectedItem(item);
    setStockForm({
      cantidad: 0,
      operacion: 'sumar',
    });
    setIsStockDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (selectedItem) {
        const response = await productoUnidadService.update(selectedItem.id!, {
          margen_ganancia: formData.margen_ganancia,
          stock_actual: formData.stock_actual,
          es_unidad_compra: formData.es_unidad_compra,
          es_unidad_venta: formData.es_unidad_venta,
        });
        if (response.success) {
          toast({
            title: 'Éxito',
            description: 'Relación actualizada correctamente',
          });
        }
      } else {
        const response = await productoUnidadService.create(formData);
        if (response.success) {
          toast({
            title: 'Éxito',
            description: 'Relación creada correctamente',
          });
        }
      }
      setIsDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || error.response?.data?.error || 'Error al guardar',
        variant: 'destructive',
      });
    }
  };

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedItem) return;

    try {
      const response = await productoUnidadService.updateStock(
        selectedItem.id!,
        stockForm.cantidad,
        stockForm.operacion
      );
      if (response.success) {
        toast({
          title: 'Éxito',
          description: 'Stock actualizado correctamente',
        });
        setIsStockDialogOpen(false);
        loadData();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Error al actualizar stock',
        variant: 'destructive',
      });
    }
  };

  const confirmDelete = async () => {
    if (!selectedItem) return;

    try {
      const response = await productoUnidadService.delete(selectedItem.id!);
      if (response.success) {
        toast({
          title: 'Éxito',
          description: 'Relación eliminada correctamente',
        });
        loadData();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al eliminar relación',
        variant: 'destructive',
      });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Productos - Unidades</h1>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Relación
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Unidad</TableHead>
              <TableHead>Margen %</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Unidad Compra</TableHead>
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
            ) : productosUnidades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No se encontraron relaciones
                </TableCell>
              </TableRow>
            ) : (
              productosUnidades.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.producto?.nombre || '-'}
                  </TableCell>
                  <TableCell>{item.unidad_medida?.nombre || '-'}</TableCell>
                  <TableCell>{item.margen_ganancia}%</TableCell>
                  <TableCell>{Number(item.stock_actual).toFixed(0)}</TableCell>
                  <TableCell>
                    <Checkbox
                      checked={item.es_unidad_compra}
                      onCheckedChange={async (checked) => {
                        try {
                          const response = await productoUnidadService.update(item.id!, {
                            es_unidad_compra: checked as boolean
                          });
                          if (response.success) {
                            toast({
                              title: 'Éxito',
                              description: checked 
                                ? 'Marcado como unidad de compra' 
                                : 'Desmarcado como unidad de compra',
                            });
                            loadData();
                          }
                        } catch (error: any) {
                          toast({
                            title: 'Error',
                            description: error.message || 'Error al actualizar unidad de compra',
                            variant: 'destructive',
                          });
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleStock(item)}
                      title="Gestionar stock"
                    >
                      <Package className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(item)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(item)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {selectedItem ? 'Editar Relación' : 'Nueva Relación'}
              </DialogTitle>
              <DialogDescription>
                {selectedItem
                  ? 'Modifica los datos de la relación producto-unidad'
                  : 'Crea una nueva relación entre producto y unidad de medida'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {!selectedItem && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="producto">Producto *</Label>
                    <Select
                      value={formData.producto_id.toString()}
                      onValueChange={(value) =>
                        setFormData({ ...formData, producto_id: parseInt(value) })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un producto" />
                      </SelectTrigger>
                      <SelectContent>
                        {productos.map((producto) => (
                          <SelectItem key={producto.id} value={producto.id!.toString()}>
                            {producto.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="unidad">Unidad de Medida *</Label>
                    <Select
                      value={formData.unidad_medida_id.toString()}
                      onValueChange={(value) =>
                        setFormData({ ...formData, unidad_medida_id: parseInt(value) })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una unidad" />
                      </SelectTrigger>
                      <SelectContent>
                        {unidades.map((unidad) => (
                          <SelectItem key={unidad.id} value={unidad.id!.toString()}>
                            {unidad.nombre} ({unidad.abreviacion})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              <div className="grid gap-2">
                <Label htmlFor="margen">Margen de Ganancia (%)</Label>
                <Input
                  id="margen"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.margen_ganancia}
                  onChange={(e) =>
                    setFormData({ ...formData, margen_ganancia: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="stock">Stock Actual</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.stock_actual}
                  onChange={(e) =>
                    setFormData({ ...formData, stock_actual: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="es_unidad_compra"
                    checked={formData.es_unidad_compra}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, es_unidad_compra: checked as boolean })
                    }
                  />
                  <Label htmlFor="es_unidad_compra">
                    Es unidad de compra (solo puede haber una por producto)
                  </Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">
                {selectedItem ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen}>
        <DialogContent>
          <form onSubmit={handleStockSubmit}>
            <DialogHeader>
              <DialogTitle>Gestionar Stock</DialogTitle>
              <DialogDescription>
                {selectedItem?.producto?.nombre} - {selectedItem?.unidad_medida?.abreviacion}
                <br />
                Stock actual: {selectedItem?.stock_actual}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="operacion">Operación</Label>
                <Select
                  value={stockForm.operacion}
                  onValueChange={(value: 'sumar' | 'restar' | 'establecer') =>
                    setStockForm({ ...stockForm, operacion: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sumar">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Sumar al stock
                      </div>
                    </SelectItem>
                    <SelectItem value="restar">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4" />
                        Restar del stock
                      </div>
                    </SelectItem>
                    <SelectItem value="establecer">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Establecer stock
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cantidad">Cantidad</Label>
                <Input
                  id="cantidad"
                  type="number"
                  min="0"
                  step="0.001"
                  value={stockForm.cantidad}
                  onChange={(e) =>
                    setStockForm({ ...stockForm, cantidad: parseFloat(e.target.value) || 0 })
                  }
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Actualizar Stock</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la
              relación entre "{selectedItem?.producto?.nombre}" y "
              {selectedItem?.unidad_medida?.nombre}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}