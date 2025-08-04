// frontend/app/remitos/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { RemitoService, Remito } from '@/services/remito.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Download, CheckCircle, XCircle } from 'lucide-react';

export default function RemitoDetailPage() {
  const router = useRouter();
  const params = useParams();
  const remitoId = parseInt(params.id as string);
  const { toast } = useToast();

  const [remito, setRemito] = useState<Remito | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarRemito();
  }, [remitoId]);

  const cargarRemito = async () => {
    try {
      setLoading(true);
      const data = await RemitoService.obtenerRemitoPorId(remitoId);
      setRemito(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cargar el remito',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmarEntrega = async () => {
    try {
      await RemitoService.confirmarEntrega(remitoId);
      toast({
        title: 'Éxito',
        description: 'Entrega confirmada correctamente'
      });
      cargarRemito();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo confirmar la entrega',
        variant: 'destructive'
      });
    }
  };

  const anularRemito = async () => {
    if (!confirm('¿Está seguro de que desea anular este remito? Esta acción no se puede deshacer.')) {
      return;
    }
    
    try {
      await RemitoService.anularRemito(remitoId);
      toast({
        title: 'Éxito',
        description: 'Remito anulado correctamente'
      });
      router.push('/remitos');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo anular el remito',
        variant: 'destructive'
      });
    }
  };

  const descargarPDF = async () => {
    try {
      await RemitoService.descargarPDF(remitoId);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo descargar el PDF',
        variant: 'destructive'
      });
    }
  };

  const getEstadoBadge = (entregado: boolean) => {
    return entregado 
      ? <Badge variant="secondary">ENTREGADO</Badge>
      : <Badge variant="default">PENDIENTE</Badge>;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!remito) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p>Remito no encontrado</p>
              <Button onClick={() => router.push('/remitos')} className="mt-4">
                Volver a Remitos
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Remito R-{String(remito.id).padStart(6, '0')}</CardTitle>
              <CardDescription>
                Cliente: {remito.pedido?.cliente?.nombre || 'N/A'}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push('/remitos')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Button>
              <Button
                variant="outline"
                onClick={descargarPDF}
                title="Descargar PDF"
              >
                <Download className="h-4 w-4" />
              </Button>
              {!remito.entregado && (
                <>
                  <Button
                    variant="outline"
                    onClick={confirmarEntrega}
                    className="text-green-600"
                    title="Confirmar entrega"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={anularRemito}
                    className="text-red-600"
                    title="Anular remito"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Información del Remito</h3>
              <p><strong>Fecha de Emisión:</strong> {new Date(remito.fecha_emision).toLocaleDateString('es-AR')}</p>
              <p><strong>Total:</strong> ${Number(remito.total || 0).toFixed(2)}</p>
              <p><strong>Estado:</strong> {getEstadoBadge(remito.entregado)}</p>
              {remito.fecha_entrega && (
                <p><strong>Fecha de Entrega:</strong> {new Date(remito.fecha_entrega).toLocaleDateString('es-AR')}</p>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Cliente</h3>
              <p><strong>Nombre:</strong> {remito.pedido?.cliente?.nombre || 'N/A'}</p>
              <p><strong>Dirección:</strong> {remito.pedido?.cliente?.direccion || 'N/A'}</p>
              <p><strong>Teléfono:</strong> {remito.pedido?.cliente?.telefono || 'N/A'}</p>
              {remito.pedido?.cliente?.email && (
                <p><strong>Email:</strong> {remito.pedido.cliente.email}</p>
              )}
            </div>
          </div>

          <h3 className="text-lg font-semibold mb-4">Detalles del Remito</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead>Precio Unitario</TableHead>
                <TableHead>Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {remito.pedido?.detalles?.map((detalle: any) => {
                // Buscar el precio en el histórico de precios
                const historico = remito.historico_precios?.find((hp: any) => 
                  hp.producto_unidad?.id === detalle.producto_unidad?.id
                );
                const precio = historico?.precio || 0;
                
                return (
                  <TableRow key={detalle.id}>
                    <TableCell>{detalle.producto_unidad?.producto?.nombre || `Producto ${detalle.producto_unidad?.id}`}</TableCell>
                    <TableCell>{detalle.cantidad}</TableCell>
                    <TableCell>{detalle.producto_unidad?.unidad_medida?.nombre || `Unidad ${detalle.producto_unidad?.id}`}</TableCell>
                    <TableCell>${Number(precio || 0).toFixed(2)}</TableCell>
                    <TableCell>${(detalle.cantidad * precio).toFixed(2)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <div className="mt-6 text-right">
            <div className="text-xl font-semibold">
              Total: ${Number(remito.total || 0).toFixed(2)}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}