// frontend/src/app/productos/page.tsx

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
import { productoService } from '@/services/producto.service';
import { IProducto } from '@/types';
import { Plus, Pencil, Trash2, Search, Package } from 'lucide-react';

export default function ProductosPage() {
  const [productos, setProductos] = useState<IProducto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState<IProducto | null>(null);
  const [formData, setFormData] = useState<IProducto>({
    nombre: '',
    proveedor: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadProductos();
  }, [page]);

  const loadProductos = async () => {
    try {
      setLoading(true);
      const response = await productoService.getAll(page, 10);
      if (response.success && response.data) {
        setProductos(response.data.data);
        setTotalPages(response.data.totalPages);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar productos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadProductos();
      return;
    }

    try {
      setLoading(true);
      const response = await productoService.search(searchQuery);
      if (response.success && response.data) {
        setProductos(response.data);
        setTotalPages(1);
        setPage(1);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al buscar productos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedProducto(null);
    setFormData({
      nombre: '',
      proveedor: '',
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (producto: IProducto) => {
    setSelectedProducto(producto);
    setFormData({
      nombre: producto.nombre,
      proveedor: producto.proveedor || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (producto: IProducto) => {
    setSelectedProducto(producto);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (selectedProducto) {
        const response = await productoService.update(selectedProducto.id!, formData);
        if (response.success) {
          toast({
            title: 'Éxito',
            description: 'Producto actualizado correctamente',
          });
        }
      } else {
        const response = await productoService.create(formData);
        if (response.success) {
          toast({
            title: 'Éxito',
            description: 'Producto creado correctamente',
          });
        }
      }
      setIsDialogOpen(false);
      loadProductos();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al guardar producto',
        variant: 'destructive',
      });
    }
  };

  const confirmDelete = async () => {
    if (!selectedProducto) return;

    try {
      const response = await productoService.delete(selectedProducto.id!);
      if (response.success) {
        toast({
          title: 'Éxito',
          description: 'Producto eliminado correctamente',
        });
        loadProductos();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Error al eliminar producto',
        variant: 'destructive',
      });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Productos</h1>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Producto
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar productos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch} variant="secondary">
          Buscar
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>Unidades</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : productos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  No se encontraron productos
                </TableCell>
              </TableRow>
            ) : (
              productos.map((producto) => (
                <TableRow key={producto.id}>
                  <TableCell className="font-medium">{producto.nombre}</TableCell>
                  <TableCell>{producto.proveedor || '-'}</TableCell>
                  <TableCell>
                    {producto.producto_unidades?.length || 0} unidades
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(producto)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(producto)}
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
                {selectedProducto ? 'Editar Producto' : 'Nuevo Producto'}
              </DialogTitle>
              <DialogDescription>
                {selectedProducto
                  ? 'Modifica los datos del producto'
                  : 'Ingresa los datos del nuevo producto'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="proveedor">Proveedor</Label>
                <Input
                  id="proveedor"
                  value={formData.proveedor}
                  onChange={(e) =>
                    setFormData({ ...formData, proveedor: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">
                {selectedProducto ? 'Actualizar' : 'Crear'}
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
              Esta acción no se puede deshacer. Se eliminará permanentemente el
              producto "{selectedProducto?.nombre}".
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