// frontend/app/remitos/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RemitoService, Remito } from '@/services/remito.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, Eye, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function RemitosPage() {
  const [remitos, setRemitos] = useState<Remito[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    entregado: 'todos',
    fechaDesde: '',
    fechaHasta: ''
  });
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    cargarRemitos();
  }, [filtros]);

  const cargarRemitos = async () => {
    try {
      setLoading(true);
      const filtrosAplicados = Object.entries(filtros).reduce((acc, [key, value]) => {
        if (value !== '' && value !== 'todos') {
          if (key === 'entregado') {
            acc[key] = value === 'true';
          } else {
            acc[key] = value;
          }
        }
        return acc;
      }, {} as any);
      
      const data = await RemitoService.obtenerRemitos(filtrosAplicados);
      setRemitos(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los remitos',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmarEntrega = async (id: number) => {
    try {
      await RemitoService.confirmarEntrega(id);
      toast({
        title: 'Éxito',
        description: 'Entrega confirmada correctamente'
      });
      cargarRemitos();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo confirmar la entrega',
        variant: 'destructive'
      });
    }
  };

  const anularRemito = async (id: number) => {
    if (!confirm('¿Está seguro de que desea anular este remito? Esta acción no se puede deshacer.')) {
      return;
    }
    
    try {
      await RemitoService.anularRemito(id);
      toast({
        title: 'Éxito',
        description: 'Remito anulado correctamente'
      });
      cargarRemitos();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo anular el remito',
        variant: 'destructive'
      });
    }
  };

  const descargarPDF = async (id: number) => {
    try {
      await RemitoService.descargarPDF(id);
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

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Remitos</CardTitle>
          <CardDescription>Gestión de remitos y facturación</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={filtros.entregado} onValueChange={(value) => setFiltros({...filtros, entregado: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="false">Pendiente</SelectItem>
                <SelectItem value="true">Entregado</SelectItem>
              </SelectContent>
            </Select>
            
            <Input
              type="date"
              placeholder="Fecha desde"
              value={filtros.fechaDesde}
              onChange={(e) => setFiltros({...filtros, fechaDesde: e.target.value})}
            />
            
            <Input
              type="date"
              placeholder="Fecha hasta"
              value={filtros.fechaHasta}
              onChange={(e) => setFiltros({...filtros, fechaHasta: e.target.value})}
            />
            
            <Button onClick={() => router.push('/pedidos')} variant="outline">
              Ir a Pedidos
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Fecha Emisión</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha Entrega</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {remitos.map((remito) => (
                  <TableRow key={remito.id}>
                    <TableCell className="font-medium">R-{String(remito.id).padStart(6, '0')}</TableCell>
                    <TableCell>{new Date(remito.fecha_emision).toLocaleDateString('es-AR')}</TableCell>
                    <TableCell>{remito.pedido?.cliente?.nombre || 'N/A'}</TableCell>
                    <TableCell>${Number(remito.total || 0).toFixed(2)}</TableCell>
                    <TableCell>{getEstadoBadge(remito.entregado)}</TableCell>
                    <TableCell>
                      {remito.fecha_entrega 
                        ? new Date(remito.fecha_entrega).toLocaleDateString('es-AR')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/remitos/${remito.id}`)}
                          title="Ver detalle"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => descargarPDF(remito.id)}
                          title="Descargar PDF"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        
                        {!remito.entregado && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600"
                              onClick={() => confirmarEntrega(remito.id)}
                              title="Confirmar entrega"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600"
                              onClick={() => anularRemito(remito.id)}
                              title="Anular remito"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}