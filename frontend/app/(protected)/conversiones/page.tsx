// frontend/src/app/conversiones/page.tsx


'use client';

import React, { useState, useEffect } from 'react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { conversionService } from '@/services/conversion.service';
import { productoService } from '@/services/producto.service';
import { unidadMedidaService } from '@/services/unidad-medida.service';
import { IConversion, IProducto, IUnidadMedida } from '@/types';
import { Plus, Pencil, Trash2, RefreshCw, Calculator, ArrowRight } from 'lucide-react';

export default function ConversionesPage() {
  const [conversiones, setConversiones] = useState<IConversion[]>([]);
  const [productos, setProductos] = useState<IProducto[]>([]);
  const [unidades, setUnidades] = useState<IUnidadMedida[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedConversion, setSelectedConversion] = useState<IConversion | null>(null);
  const [formData, setFormData] = useState<IConversion>({
    producto_id: 0,
    unidad_origen_id: 0,
    unidad_destino_id: 0,
    factor_conversion: 1,
  });

  // Estado para el calculador
  const [calculadorData, setCalculadorData] = useState({
    producto_id: 0,
    cantidad: 0,
    unidad_origen_id: 0,
    unidad_destino_id: 0,
    resultado: null as number | null,
  });

  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [page]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [conversionesRes, productosRes, unidadesRes] = await Promise.all([
        conversionService.getAll(page, 10),
        productoService.getAll(1, 100),
        unidadMedidaService.getAllSimple(),
      ]);

      if (conversionesRes.success && conversionesRes.data) {
        setConversiones(conversionesRes.data.data);
        setTotalPages(conversionesRes.data.totalPages);
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
    setSelectedConversion(null);
    setFormData({
      producto_id: 0,
      unidad_origen_id: 0,
      unidad_destino_id: 0,
      factor_conversion: 1,
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (conversion: IConversion) => {
    setSelectedConversion(conversion);
    setFormData({
      producto_id: conversion.producto_id,
      unidad_origen_id: conversion.unidad_origen_id,
      unidad_destino_id: conversion.unidad_destino_id,
      factor_conversion: conversion.factor_conversion,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (conversion: IConversion) => {
    setSelectedConversion(conversion);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.unidad_origen_id === formData.unidad_destino_id) {
      toast({
        title: 'Error',
        description: 'Las unidades de origen y destino deben ser diferentes',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (selectedConversion) {
        const response = await conversionService.update(selectedConversion.id!, {
          factor_conversion: formData.factor_conversion,
        });
        if (response.success) {
          toast({
            title: 'Éxito',
            description: 'Conversión actualizada correctamente',
          });
        }
      } else {
        const response = await conversionService.create(formData);
        if (response.success) {
          toast({
            title: 'Éxito',
            description: 'Conversión creada correctamente',
          });
        }
      }
      setIsDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Error al guardar conversión',
        variant: 'destructive',
      });
    }
  };

  const confirmDelete = async () => {
    if (!selectedConversion) return;

    try {
      const response = await conversionService.delete(selectedConversion.id!);
      if (response.success) {
        toast({
          title: 'Éxito',
          description: 'Conversión eliminada correctamente',
        });
        loadData();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al eliminar conversión',
        variant: 'destructive',
      });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const handleCalcular = async () => {
    const { producto_id, cantidad, unidad_origen_id, unidad_destino_id } = calculadorData;

    if (!producto_id || !cantidad || !unidad_origen_id || !unidad_destino_id) {
      toast({
        title: 'Error',
        description: 'Complete todos los campos para calcular',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await conversionService.convertir(
        producto_id,
        cantidad,
        unidad_origen_id,
        unidad_destino_id
      );
      if (response.success && response.data) {
        setCalculadorData({ ...calculadorData, resultado: response.data.cantidad_convertida });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Error al calcular conversión',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Conversiones</h1>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Conversión
        </Button>
      </div>

      {/* Calculador de Conversiones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calculador de Conversiones
          </CardTitle>
          <CardDescription>
            Convierte cantidades entre diferentes unidades de medida
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div>
              <Label>Producto</Label>
              <Select
                value={calculadorData.producto_id.toString()}
                onValueChange={(value) =>
                  setCalculadorData({ ...calculadorData, producto_id: parseInt(value), resultado: null })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona..." />
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
            <div>
              <Label>Cantidad</Label>
              <Input
                type="number"
                min="0"
                step="0.001"
                value={calculadorData.cantidad}
                onChange={(e) =>
                  setCalculadorData({ ...calculadorData, cantidad: parseFloat(e.target.value) || 0, resultado: null })
                }
              />
            </div>
            <div>
              <Label>De</Label>
              <Select
                value={calculadorData.unidad_origen_id.toString()}
                onValueChange={(value) =>
                  setCalculadorData({ ...calculadorData, unidad_origen_id: parseInt(value), resultado: null })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unidad origen" />
                </SelectTrigger>
                <SelectContent>
                  {unidades.map((unidad) => (
                    <SelectItem key={unidad.id} value={unidad.id!.toString()}>
                      {unidad.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>A</Label>
              <Select
                value={calculadorData.unidad_destino_id.toString()}
                onValueChange={(value) =>
                  setCalculadorData({ ...calculadorData, unidad_destino_id: parseInt(value), resultado: null })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unidad destino" />
                </SelectTrigger>
                <SelectContent>
                  {unidades.map((unidad) => (
                    <SelectItem key={unidad.id} value={unidad.id!.toString()}>
                      {unidad.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCalcular} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Calcular
            </Button>
          </div>
          {calculadorData.resultado !== null && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <p className="text-lg font-semibold text-green-800">
                {calculadorData.cantidad} {unidades.find(u => u.id === calculadorData.unidad_origen_id)?.abreviacion}
                {' '}<ArrowRight className="inline h-4 w-4" />{' '}
                {calculadorData.resultado} {unidades.find(u => u.id === calculadorData.unidad_destino_id)?.abreviacion}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Unidad Origen</TableHead>
              <TableHead>Unidad Destino</TableHead>
              <TableHead>Factor</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : conversiones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No se encontraron conversiones
                </TableCell>
              </TableRow>
            ) : (
              conversiones.map((conversion) => (
                <TableRow key={conversion.id}>
                  <TableCell className="font-medium">
                    {conversion.producto?.nombre || '-'}
                  </TableCell>
                  <TableCell>
                    {conversion.unidad_origen?.nombre} ({conversion.unidad_origen?.abreviacion})
                  </TableCell>
                  <TableCell>
                    {conversion.unidad_destino?.nombre} ({conversion.unidad_destino?.abreviacion})
                  </TableCell>
                  <TableCell>{conversion.factor_conversion}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(conversion)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(conversion)}
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
                {selectedConversion ? 'Editar Conversión' : 'Nueva Conversión'}
              </DialogTitle>
              <DialogDescription>
                {selectedConversion
                  ? 'Modifica el factor de conversión'
                  : 'Define la conversión entre unidades para un producto. La conversión inversa se creará automáticamente.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {!selectedConversion && (
                <>
                  <div className="grid gap-2">
                    <Label>Producto *</Label>
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
                    <Label>Unidad Origen *</Label>
                    <Select
                      value={formData.unidad_origen_id.toString()}
                      onValueChange={(value) =>
                        setFormData({ ...formData, unidad_origen_id: parseInt(value) })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona unidad origen" />
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
                  <div className="grid gap-2">
                    <Label>Unidad Destino *</Label>
                    <Select
                      value={formData.unidad_destino_id.toString()}
                      onValueChange={(value) =>
                        setFormData({ ...formData, unidad_destino_id: parseInt(value) })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona unidad destino" />
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
                <Label>Factor de Conversión *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.0001"
                  value={formData.factor_conversion}
                  onChange={(e) =>
                    setFormData({ ...formData, factor_conversion: parseFloat(e.target.value) || 1 })
                  }
                  required
                />
                <p className="text-sm text-gray-500">
                  1 {unidades.find(u => u.id === formData.unidad_origen_id)?.abreviacion || 'unidad origen'} = 
                  {' '}{formData.factor_conversion} {unidades.find(u => u.id === formData.unidad_destino_id)?.abreviacion || 'unidad destino'}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">
                {selectedConversion ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán permanentemente las
              conversiones entre "{selectedConversion?.unidad_origen?.nombre}" y "
              {selectedConversion?.unidad_destino?.nombre}" para el producto "
              {selectedConversion?.producto?.nombre}".
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