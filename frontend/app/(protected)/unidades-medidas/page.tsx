// frontend/src/app/unidades-medida/page.tsx

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
import { unidadMedidaService } from '@/services/unidad-medida.service';
import { IUnidadMedida } from '@/types';
import { Plus, Pencil, Trash2, Search, Ruler } from 'lucide-react';

export default function UnidadesMedidaPage() {
  const [unidades, setUnidades] = useState<IUnidadMedida[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUnidad, setSelectedUnidad] = useState<IUnidadMedida | null>(null);
  const [formData, setFormData] = useState<IUnidadMedida>({
    nombre: '',
    abreviacion: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadUnidades();
  }, [page]);

  const loadUnidades = async () => {
    try {
      setLoading(true);
      const response = await unidadMedidaService.getAll(page, 10);
      if (response.success && response.data) {
        setUnidades(response.data.data);
        setTotalPages(response.data.totalPages);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar unidades de medida',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadUnidades();
      return;
    }

    try {
      setLoading(true);
      const response = await unidadMedidaService.search(searchQuery);
      if (response.success && response.data) {
        setUnidades(response.data);
        setTotalPages(1);
        setPage(1);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al buscar unidades de medida',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedUnidad(null);
    setFormData({
      nombre: '',
      abreviacion: '',
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (unidad: IUnidadMedida) => {
    setSelectedUnidad(unidad);
    setFormData({
      nombre: unidad.nombre,
      abreviacion: unidad.abreviacion,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (unidad: IUnidadMedida) => {
    setSelectedUnidad(unidad);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (selectedUnidad) {
        const response = await unidadMedidaService.update(selectedUnidad.id!, formData);
        if (response.success) {
          toast({
            title: 'Éxito',
            description: 'Unidad de medida actualizada correctamente',
          });
        }
      } else {
        const response = await unidadMedidaService.create(formData);
        if (response.success) {
          toast({
            title: 'Éxito',
            description: 'Unidad de medida creada correctamente',
          });
        }
      }
      setIsDialogOpen(false);
      loadUnidades();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al guardar unidad de medida',
        variant: 'destructive',
      });
    }
  };

  const confirmDelete = async () => {
    if (!selectedUnidad) return;

    try {
      const response = await unidadMedidaService.delete(selectedUnidad.id!);
      if (response.success) {
        toast({
          title: 'Éxito',
          description: 'Unidad de medida eliminada correctamente',
        });
        loadUnidades();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Error al eliminar unidad de medida',
        variant: 'destructive',
      });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Unidades de Medida</h1>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Unidad
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar unidades..."
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
              <TableHead>Abreviación</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : unidades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                  No se encontraron unidades de medida
                </TableCell>
              </TableRow>
            ) : (
              unidades.map((unidad) => (
                <TableRow key={unidad.id}>
                  <TableCell className="font-medium">{unidad.nombre}</TableCell>
                  <TableCell>{unidad.abreviacion}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(unidad)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(unidad)}
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
                {selectedUnidad ? 'Editar Unidad de Medida' : 'Nueva Unidad de Medida'}
              </DialogTitle>
              <DialogDescription>
                {selectedUnidad
                  ? 'Modifica los datos de la unidad de medida'
                  : 'Ingresa los datos de la nueva unidad de medida'}
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
                  placeholder="Ej: Kilogramo"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="abreviacion">Abreviación *</Label>
                <Input
                  id="abreviacion"
                  value={formData.abreviacion}
                  onChange={(e) =>
                    setFormData({ ...formData, abreviacion: e.target.value })
                  }
                  placeholder="Ej: kg"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">
                {selectedUnidad ? 'Actualizar' : 'Crear'}
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
              Esta acción no se puede deshacer. Se eliminará permanentemente la
              unidad de medida "{selectedUnidad?.nombre}".
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