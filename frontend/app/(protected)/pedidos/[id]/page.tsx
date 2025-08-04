'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { pedidoService } from '@/services/pedido.service';
import { IPedido, IPedidoDetalle, EstadoPedido } from '@/types';
import { Loader2, ArrowLeft, User, Calendar, Package, FileText, FileCheck } from 'lucide-react';

export default function PedidoDetallePage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [pedido, setPedido] = useState<IPedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingEstado, setUpdatingEstado] = useState(false);

  const pedidoId = parseInt(params.id as string);

  useEffect(() => {
    if (pedidoId) {
      loadPedido();
    }
  }, [pedidoId]);

  const loadPedido = async () => {
    try {
      setLoading(true);
      const response = await pedidoService.getOne(pedidoId);
      if (response.success && response.data) {
        setPedido(response.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar pedido',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEstadoChange = async (nuevoEstado: EstadoPedido) => {
    if (!pedido) return;

    setUpdatingEstado(true);
    try {
      const response = await pedidoService.updateEstado(pedidoId, nuevoEstado);
      if (response.success) {
        toast({
          title: 'Éxito',
          description: 'Estado actualizado correctamente',
        });
        loadPedido();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al actualizar estado',
        variant: 'destructive',
      });
    } finally {
      setUpdatingEstado(false);
    }
  };

  const getEstadoBadge = (estado: EstadoPedido) => {
    const config = {
      [EstadoPedido.PENDIENTE]: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800' },
      [EstadoPedido.EN_COMPRA]: { label: 'En Compra', className: 'bg-blue-100 text-blue-800' },
      [EstadoPedido.EN_PROCESO]: { label: 'En Proceso', className: 'bg-purple-100 text-purple-800' },
      [EstadoPedido.PARCIAL]: { label: 'Parcial', className: 'bg-orange-100 text-orange-800' },
      [EstadoPedido.COMPLETADO]: { label: 'Completado', className: 'bg-green-100 text-green-800' },
    };
    
    const { label, className } = config[estado] || { label: estado, className: 'bg-gray-100 text-gray-800' };
    return <Badge className={className}>{label}</Badge>;
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  const calcularSubtotal = (detalle: IPedidoDetalle) => {
    return Number(detalle.cantidad) * Number(detalle.precio_unitario || 0);
  };

  const handleGenerarRemito = () => {
    router.push(`/remitos/generar/${pedidoId}`);
  };

  const handleVerRemito = () => {
    router.push(`/remitos?pedidoId=${pedidoId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="text-center py-8">
        <p>Pedido no encontrado</p>
        <Button onClick={() => router.push('/pedidos')} className="mt-4">
          Volver a pedidos
        </Button>
      </div>
    );
  }

  const canChangeEstado = pedido.estado !== EstadoPedido.COMPLETADO && pedido.estado !== EstadoPedido.EN_PROCESO;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/pedidos')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-3xl font-bold">Pedido #{pedido.id}</h1>
          {getEstadoBadge(pedido.estado)}
        </div>
        
        <div className="flex gap-2">
          {pedido.estado === EstadoPedido.PENDIENTE && (
            <Button onClick={handleGenerarRemito}>
              <FileCheck className="h-4 w-4 mr-2" />
              Generar Remito
            </Button>
          )}
          
          {(pedido.estado === EstadoPedido.EN_PROCESO || 
            pedido.estado === EstadoPedido.COMPLETADO) && (
            <Button variant="outline" onClick={handleVerRemito}>
              <FileText className="h-4 w-4 mr-2" />
              Ver Remito
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información del Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-gray-600">Nombre</p>
              <p className="font-medium">{pedido.cliente?.nombre || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Dirección</p>
              <p className="font-medium">{pedido.cliente?.direccion || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Teléfono</p>
              <p className="font-medium">{pedido.cliente?.telefono || '-'}</p>
            </div>
            {pedido.cliente?.email && (
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{pedido.cliente.email}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Información del Pedido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-gray-600">Fecha del Pedido</p>
              <p className="font-medium">{formatDate(pedido.fecha_pedido)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Fecha de Importación</p>
              <p className="font-medium">{formatDate(pedido.fecha_importacion)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Estado</p>
              <div className="flex items-center gap-2 mt-1">
                {canChangeEstado ? (
                  <Select
                    value={pedido.estado}
                    onValueChange={(value) => handleEstadoChange(value as EstadoPedido)}
                    disabled={updatingEstado}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={EstadoPedido.PENDIENTE}>Pendiente</SelectItem>
                      <SelectItem value={EstadoPedido.EN_COMPRA}>En Compra</SelectItem>
                      <SelectItem value={EstadoPedido.PARCIAL}>Parcial</SelectItem>
                      <SelectItem value={EstadoPedido.COMPLETADO}>Completado</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-2">
                    {getEstadoBadge(pedido.estado)}
                    {pedido.estado === EstadoPedido.EN_PROCESO && (
                      <span className="text-sm text-gray-600">(Remito generado)</span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Incluido en Compra</p>
              <p className="font-medium">
                {pedido.incluido_en_compra ? (
                  <Badge className="bg-green-100 text-green-800">Sí</Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-800">No</Badge>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Detalle del Pedido
          </CardTitle>
          <CardDescription>
            Productos solicitados por el cliente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="text-right">Precio Unit.</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pedido.detalles?.map((detalle, index) => (
                  <TableRow key={detalle.id || index}>
                    <TableCell className="font-medium">
                      {detalle.producto_unidad?.producto?.nombre || '-'}
                    </TableCell>
                    <TableCell>
                      {detalle.producto_unidad?.unidad_medida?.abreviacion || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(detalle.cantidad).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {detalle.precio_unitario 
                        ? formatCurrency(Number(detalle.precio_unitario))
                        : '-'
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      {detalle.precio_unitario 
                        ? formatCurrency(calcularSubtotal(detalle))
                        : '-'
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableRow>
                <TableCell colSpan={4} className="text-right font-bold">
                  Total:
                </TableCell>
                <TableCell className="text-right font-bold">
                  {formatCurrency(Number(pedido.total))}
                </TableCell>
              </TableRow>
            </Table>
          </div>

          {(!pedido.detalles || pedido.detalles.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              No hay productos en este pedido
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}