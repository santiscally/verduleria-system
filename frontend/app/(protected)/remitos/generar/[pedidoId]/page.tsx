// frontend/app/remitos/generar/[pedidoId]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { RemitoService, PrecioSugerido, DetalleRemitoInput } from '@/services/remito.service';
import { pedidoService } from '@/services/pedido.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
// import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Save } from 'lucide-react';
import { EstadoPedido } from '@/types';

interface PrecioDetalle {
  pedidoDetalleId: number;
  productoId: number;
  unidadMedidaId: number;
  productoUnidadId: number;
  cantidad: number;
  precioSeleccionado: number;
  tipoPrecio: 'calculado' | 'ultimo' | 'manual';
}

export default function GenerarRemitoPage() {
  const router = useRouter();
  const params = useParams();
  const pedidoId = parseInt(params.pedidoId as string);
  const { toast } = useToast();

  const [pedido, setPedido] = useState<any>(null);
  const [preciosSugeridos, setPreciosSugeridos] = useState<PrecioSugerido[]>([]);
  const [preciosDetalles, setPreciosDetalles] = useState<Record<string, PrecioDetalle>>({});
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, [pedidoId]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [pedidoData, preciosData] = await Promise.all([
        pedidoService.getOne(pedidoId).then(response => response.data),
        RemitoService.obtenerPreciosSugeridos(pedidoId)
      ]);

      if (!pedidoData) {
        toast({
          title: 'Error',
          description: 'No se pudo cargar el pedido',
          variant: 'destructive'
        });
        router.push('/pedidos');
        return;
      }

      setPedido(pedidoData);
      setPreciosSugeridos(preciosData);

      // Verificar que el pedido esté en estado PENDIENTE

      // Verificar que el pedido tenga detalles
      if (!pedidoData.detalles || pedidoData.detalles.length === 0) {
        toast({
          title: 'Error',
          description: 'El pedido no tiene productos',
          variant: 'destructive'
        });
        router.push('/pedidos');
        return;
      }

      // Inicializar precios detalles con precio calculado por defecto
      const detallesIniciales: Record<string, PrecioDetalle> = {};
      pedidoData.detalles.forEach((detalle: any, index: number) => {
        const precioSugerido = preciosData[index];
        if (precioSugerido) {
          const key = `${precioSugerido.productoId}-${precioSugerido.unidadMedidaId}`;
          detallesIniciales[key] = {
            pedidoDetalleId: detalle.id,
            productoId: precioSugerido.productoId,
            unidadMedidaId: precioSugerido.unidadMedidaId,
            productoUnidadId: precioSugerido.productoUnidadId,
            cantidad: detalle.cantidad || 0,
            precioSeleccionado: precioSugerido.precioCalculado || 0,
            tipoPrecio: 'calculado'
          };
        }
      });
      setPreciosDetalles(detallesIniciales);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTipoPrecioChange = (key: string, tipo: 'calculado' | 'ultimo' | 'manual') => {
    const precioIndex = preciosSugeridos.findIndex(p => 
      key === `${p.productoId}-${p.unidadMedidaId}`
    );
    const precioSugerido = preciosSugeridos[precioIndex];

    if (!precioSugerido || !preciosDetalles[key]) return;

    let nuevoPrecio = 0;
    if (tipo === 'calculado') {
      nuevoPrecio = precioSugerido.precioCalculado || 0;
    } else if (tipo === 'ultimo' && precioSugerido.ultimoPrecioCobrado) {
      nuevoPrecio = precioSugerido.ultimoPrecioCobrado;
    }

    setPreciosDetalles({
      ...preciosDetalles,
      [key]: {
        ...preciosDetalles[key],
        tipoPrecio: tipo,
        precioSeleccionado: nuevoPrecio
      }
    });
  };

  const handlePrecioManualChange = (key: string, valor: string) => {
    if (!preciosDetalles[key]) return;
    
    const precio = parseFloat(valor) || 0;
    setPreciosDetalles({
      ...preciosDetalles,
      [key]: {
        ...preciosDetalles[key],
        precioSeleccionado: precio,
        tipoPrecio: 'manual'
      }
    });
  };

  const calcularTotal = () => {
    return Object.values(preciosDetalles).reduce((total, precioDetalle) => {
      return total + ((precioDetalle.cantidad || 0) * (precioDetalle.precioSeleccionado || 0));
    }, 0);
  };

  const generarRemito = async () => {
    try {
      setGuardando(true);
      
      const detalles: DetalleRemitoInput[] = Object.values(preciosDetalles).map(detalle => ({
        pedidoDetalleId: detalle.pedidoDetalleId,
        productoUnidadId: detalle.productoUnidadId,
        cantidad: detalle.cantidad,
        precio: detalle.precioSeleccionado
      }));

      await RemitoService.crearRemito(pedidoId, detalles);
      
      toast({
        title: 'Éxito',
        description: 'Remito generado correctamente'
      });
      
      router.push('/remitos');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo generar el remito',
        variant: 'destructive'
      });
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Generar Remito</CardTitle>
              <CardDescription>
                Pedido #{pedido?.id} - {pedido?.cliente?.nombre}
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead>Costo</TableHead>
                <TableHead>Margen</TableHead>
                <TableHead>Precio Calc.</TableHead>
                <TableHead>Último Precio</TableHead>
                <TableHead>Precio Final</TableHead>
                <TableHead>Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pedido?.detalles?.map((detalle: any, index: number) => {
                const precioSugerido = preciosSugeridos[index];
                if (!precioSugerido) return null;
                
                const key = `${precioSugerido.productoId}-${precioSugerido.unidadMedidaId}`;
                const precioDetalle = preciosDetalles[key];
                
                return (
                  <TableRow key={detalle.id || index}>
                    <TableCell>{precioSugerido.productoNombre || detalle.producto_unidad?.producto?.nombre || `Producto ${precioSugerido.productoId}`}</TableCell>
                    <TableCell>{detalle.cantidad || 0}</TableCell>
                    <TableCell>{precioSugerido.unidadNombre || detalle.producto_unidad?.unidad_medida?.nombre || `Unidad ${precioSugerido.unidadMedidaId}`}</TableCell>
                    <TableCell>${(precioSugerido.costoBase || 0).toFixed(2)}</TableCell>
                    <TableCell>{precioSugerido.margenGanancia || 0}%</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <input 
                          type="radio" 
                          value="calculado" 
                          name={`precio-${key}`}
                          checked={precioDetalle?.tipoPrecio === 'calculado'}
                          onChange={(e) => handleTipoPrecioChange(key, e.target.value as any)}
                          id={`calc-${key}`} 
                        />
                        <Label htmlFor={`calc-${key}`}>
                          ${(precioSugerido.precioCalculado || 0).toFixed(2)}
                        </Label>
                      </div>
                    </TableCell>
                    <TableCell>
                      {precioSugerido.ultimoPrecioCobrado ? (
                        <div className="flex items-center space-x-2">
                          <input 
                            type="radio" 
                            value="ultimo" 
                            name={`precio-${key}`}
                            checked={precioDetalle?.tipoPrecio === 'ultimo'}
                            onChange={(e) => handleTipoPrecioChange(key, e.target.value as any)}
                            id={`ultimo-${key}`} 
                          />
                          <Label htmlFor={`ultimo-${key}`}>
                            ${(precioSugerido.ultimoPrecioCobrado || 0).toFixed(2)}
                          </Label>
                        </div>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <input 
                          type="radio" 
                          value="manual" 
                          name={`precio-${key}`}
                          checked={precioDetalle?.tipoPrecio === 'manual'}
                          onChange={(e) => handleTipoPrecioChange(key, e.target.value as any)}
                          id={`manual-${key}`} 
                        />
                        <Input
                          type="number"
                          step="0.01"
                          value={precioDetalle?.tipoPrecio === 'manual' ? precioDetalle.precioSeleccionado : ''}
                          onChange={(e) => handlePrecioManualChange(key, e.target.value)}
                          placeholder="0.00"
                          className="w-24"
                          disabled={precioDetalle?.tipoPrecio !== 'manual'}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      ${((detalle.cantidad || 0) * (precioDetalle?.precioSeleccionado || 0)).toFixed(2)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <div className="mt-6 flex justify-between items-center">
            <div className="text-xl font-semibold">
              Total: ${calcularTotal().toFixed(2)}
            </div>
            <Button onClick={generarRemito} disabled={guardando}>
              <Save className="mr-2 h-4 w-4" />
              {guardando ? 'Generando...' : 'Generar Remito'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}