// frontend/src/app/clientes/page.tsx

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
  DialogTrigger,
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

import { ICliente } from '@/types';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { clienteService } from '@/services/cliente.services';

export default function ClientesPage() {
  const [clientes, setClientes] = useState<ICliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<ICliente | null>(null);
  const [formData, setFormData] = useState<ICliente>({
    nombre: '',
    direccion: '',
    telefono: '',
    email: '',
    contacto: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadClientes();
  }, [page]);

  const loadClientes = async () => {
    try {
      setLoading(true);
      const response = await clienteService.getAll(page, 10);
      if (response.success && response.data) {
        setClientes(response.data.data);
        setTotalPages(response.data.totalPages);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar clientes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadClientes();
      return;
    }

    try {
      setLoading(true);
      const response = await clienteService.search(searchQuery);
      if (response.success && response.data) {
        setClientes(response.data);
        setTotalPages(1);
        setPage(1);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al buscar clientes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedCliente(null);
    setFormData({
      nombre: '',
      direccion: '',
      telefono: '',
      email: '',
      contacto: '',
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (cliente: ICliente) => {
    setSelectedCliente(cliente);
    setFormData({
      nombre: cliente.nombre,
      direccion: cliente.direccion,
      telefono: cliente.telefono,
      email: cliente.email || '',
      contacto: cliente.contacto || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (cliente: ICliente) => {
    setSelectedCliente(cliente);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (selectedCliente) {
        const response = await clienteService.update(selectedCliente.id!, formData);
        if (response.success) {
          toast({
            title: 'Éxito',
            description: 'Cliente actualizado correctamente',
          });
        }
      } else {
        const response = await clienteService.create(formData);
        if (response.success) {
          toast({
            title: 'Éxito',
            description: 'Cliente creado correctamente',
          });
        }
      }
      setIsDialogOpen(false);
      loadClientes();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al guardar cliente',
        variant: 'destructive',
      });
    }
  };

  const confirmDelete = async () => {
    if (!selectedCliente) return;

    try {
      const response = await clienteService.delete(selectedCliente.id!);
      if (response.success) {
        toast({
          title: 'Éxito',
          description: 'Cliente eliminado correctamente',
        });
        loadClientes();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al eliminar cliente',
        variant: 'destructive',
      });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Clientes</h1>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Cliente
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar clientes..."
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
              <TableHead>Dirección</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Contacto</TableHead>
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
            ) : clientes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No se encontraron clientes
                </TableCell>
              </TableRow>
            ) : (
              clientes.map((cliente) => (
                <TableRow key={cliente.id}>
                  <TableCell className="font-medium">{cliente.nombre}</TableCell>
                  <TableCell>{cliente.direccion}</TableCell>
                  <TableCell>{cliente.telefono}</TableCell>
                  <TableCell>{cliente.email || '-'}</TableCell>
                  <TableCell>{cliente.contacto || '-'}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(cliente)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(cliente)}
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
                {selectedCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
              </DialogTitle>
              <DialogDescription>
                {selectedCliente
                  ? 'Modifica los datos del cliente'
                  : 'Ingresa los datos del nuevo cliente'}
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
                <Label htmlFor="direccion">Dirección *</Label>
                <Input
                  id="direccion"
                  value={formData.direccion}
                  onChange={(e) =>
                    setFormData({ ...formData, direccion: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="telefono">Teléfono *</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) =>
                    setFormData({ ...formData, telefono: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contacto">Contacto</Label>
                <Input
                  id="contacto"
                  value={formData.contacto}
                  onChange={(e) =>
                    setFormData({ ...formData, contacto: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">
                {selectedCliente ? 'Actualizar' : 'Crear'}
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
              cliente "{selectedCliente?.nombre}".
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