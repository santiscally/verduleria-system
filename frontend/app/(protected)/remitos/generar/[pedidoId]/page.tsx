// frontend/src/app/remitos/nuevo/[pedidoId]/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, AlertTriangle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { RemitoService, PrecioSugerido, DetalleRemitoInput } from '@/services/remito.service';
import { pedidoService } from '@/services/pedido.service';
import { IPedido } from '@/types';

interface PrecioDetalle {
  pedidoDetalleId: number;
  productoId: number;
  unidadMedidaId: number;
  productoUnidadId: number;
  cantidad: number;
  precioSeleccionado: number;
  tipoPrecio: 'calculado' | 'ultimo' | 'manual';
}

export default function NuevoRemitoPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const pedidoId = parseInt(params.pedidoId as string);

  const [pedido, setPedido] = useState<IPedido | null>(null);
  const [preciosSugeridos, setPreciosSugeridos] = useState<PrecioSugerido[]>([]);
  const [preciosDetalles, setPreciosDetalles] = useState<Record<string, PrecioDetalle>>({});
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    loadData();
  }, [pedidoId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pedidoResponse, preciosData] = await Promise.all([
        pedidoService.getOne(pedidoId),
        RemitoService.obtenerPreciosSugeridos(pedidoId)
      ]);

      if (!pedidoResponse.data) {
        toast({ title: 'Error', description: 'No se pudo cargar el pedido', variant: 'destructive' });
        router.push('/pedidos');
        return;
      }

      setPedido(pedidoResponse.data);
      setPreciosSugeridos(preciosData);

      // Inicializar precios
      const detallesIniciales: Record<string, PrecioDetalle> = {};
      preciosData.forEach((precio) => {
        const key = `${precio.productoId}-${precio.unidadMedidaId}`;
        detallesIniciales[key] = {
          pedidoDetalleId: precio.pedidoDetalleId,
          productoId: precio.productoId,
          unidadMedidaId: precio.unidadMedidaId,
          productoUnidadId: precio.productoUnidadId,
          cantidad: precio.cantidad,
          precioSeleccionado: precio.precioCalculado || 0,
          tipoPrecio: 'calculado'
        };
      });
      setPreciosDetalles(detallesIniciales);
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar los datos', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Cambiar unidad de medida
  const handleUnidadChange = async (key: string, nuevaUnidadId: number, precioSugerido: PrecioSugerido) => {
    try {
      const resultado = await RemitoService.recalcularPrecioPorUnidad(
        precioSugerido.productoId,
        nuevaUnidadId,
        preciosDetalles[key]?.cantidad || 1
      );

      // Actualizar el precio sugerido en la lista
      const nuevosPrecios = preciosSugeridos.map(p => {
        if (`${p.productoId}-${p.unidadMedidaId}` === key) {
          const nuevaUnidad = p.unidadesDisponibles.find(u => u.id === nuevaUnidadId);
          return {
            ...p,
            unidadMedidaId: nuevaUnidadId,
            productoUnidadId: resultado.productoUnidadId,
            unidadNombre: nuevaUnidad?.nombre || p.unidadNombre,
            precioCalculado: resultado.precioSugerido,
            costoBase: resultado.costoBase,
            warningConversion: resultado.warning
          };
        }
        return p;
      });
      setPreciosSugeridos(nuevosPrecios);

      // Actualizar detalle
      const nuevoKey = `${precioSugerido.productoId}-${nuevaUnidadId}`;
      setPreciosDetalles(prev => {
        const { [key]: old, ...rest } = prev;
        return {
          ...rest,
          [nuevoKey]: {
            ...old,
            unidadMedidaId: nuevaUnidadId,
            productoUnidadId: resultado.productoUnidadId,
            precioSeleccionado: resultado.precioSugerido,
            tipoPrecio: 'calculado'
          }
        };
      });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo recalcular el precio', variant: 'destructive' });
    }
  };

  const handleCantidadChange = (key: string, cantidad: number) => {
    setPreciosDetalles(prev => ({
      ...prev,
      [key]: { ...prev[key], cantidad }
    }));
  };

  const handlePrecioManualChange = (key: string, precio: number) => {
    setPreciosDetalles(prev => ({
      ...prev,
      [key]: { ...prev[key], precioSeleccionado: precio, tipoPrecio: 'manual' }
    }));
  };

  const handleTipoPrecioChange = (key: string, tipo: 'calculado' | 'ultimo', precioSugerido: PrecioSugerido) => {
    let nuevoPrecio = 0;
    if (tipo === 'calculado') {
      nuevoPrecio = precioSugerido.precioCalculado;
    } else if (tipo === 'ultimo' && precioSugerido.ultimoPrecioCobrado) {
      nuevoPrecio = precioSugerido.ultimoPrecioCobrado;
    }

    setPreciosDetalles(prev => ({
      ...prev,
      [key]: { ...prev[key], precioSeleccionado: nuevoPrecio, tipoPrecio: tipo }
    }));
  };

  const calcularTotal = () => {
    return Object.values(preciosDetalles).reduce((total, d) => {
      return total + (d.cantidad * d.precioSeleccionado);
    }, 0);
  };

  const generarRemito = async () => {
    try {
      setGuardando(true);
      
      const detalles: DetalleRemitoInput[] = Object.values(preciosDetalles).map(d => ({
        pedidoDetalleId: d.pedidoDetalleId,
        productoUnidadId: d.productoUnidadId,
        cantidad: d.cantidad,
        precio: d.precioSeleccionado
      }));

      const remito = await RemitoService.crearRemito(pedidoId, detalles);
      
      toast({ title: 'Éxito', description: 'Remito generado correctamente' });
      router.push(`/remitos/${remito.id}`);
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.response?.data?.message || 'No se pudo generar el remito', 
        variant: 'destructive' 
      });
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Generar Remito</h1>
          <p className="text-gray-500">
            Pedido #{pedidoId} - {pedido?.cliente?.nombre}
          </p>
        </div>
      </div>

      {/* Info del cliente */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-gray-500">Nombre</Label>
              <p className="font-medium">{pedido?.cliente?.nombre}</p>
            </div>
            <div>
              <Label className="text-gray-500">Dirección</Label>
              <p className="font-medium">{pedido?.cliente?.direccion || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-gray-500">Teléfono</Label>
              <p className="font-medium">{pedido?.cliente?.telefono || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detalles del remito */}
      <Card>
        <CardHeader>
          <CardTitle>Detalles del Remito</CardTitle>
          <CardDescription>
            Puede editar cantidad, unidad y precio. El precio por kg es solo referencia.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead className="bg-blue-50">$/kg (ref)</TableHead>
                <TableHead>Costo Base</TableHead>
                <TableHead>Margen</TableHead>
                <TableHead>Precio Calculado</TableHead>
                <TableHead>Último Precio</TableHead>
                <TableHead>Precio Final</TableHead>
                <TableHead>Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {preciosSugeridos.map((precio) => {
                const key = `${precio.productoId}-${precio.unidadMedidaId}`;
                const detalle = preciosDetalles[key];
                
                return (
                  <TableRow key={key}>
                    {/* Producto */}
                    <TableCell>
                      <div>
                        <p className="font-medium">{precio.productoNombre}</p>
                        {precio.warningConversion && (
                          <div className="flex items-center gap-1 text-orange-500 text-xs mt-1">
                            <AlertTriangle className="h-3 w-3" />
                            {precio.warningConversion}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    {/* Cantidad (editable) */}
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={detalle?.cantidad || 0}
                        onChange={(e) => handleCantidadChange(key, parseFloat(e.target.value) || 0)}
                        className="w-20"
                      />
                    </TableCell>
                    
                    {/* Unidad (dropdown) */}
                    <TableCell>
                      <Select
                        value={precio.unidadMedidaId.toString()}
                        onValueChange={(v) => handleUnidadChange(key, parseInt(v), precio)}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {precio.unidadesDisponibles.map((u) => (
                            <SelectItem key={u.id} value={u.id.toString()}>
                              {u.nombre}
                              {u.factorConversion === null && ' ⚠️'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    
                    {/* Precio por kg (no editable, referencia) */}
                    <TableCell className="bg-blue-50">
                      {precio.precioPorKg ? (
                        <span className="font-medium text-blue-600">
                          ${precio.precioPorKg.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-orange-500 text-sm">Sin dato</span>
                      )}
                    </TableCell>
                    
                    {/* Costo Base */}
                    <TableCell>
                      ${precio.costoBase.toFixed(2)}
                    </TableCell>
                    
                    {/* Margen */}
                    <TableCell>
                      {precio.margenGanancia}%
                    </TableCell>
                    
                    {/* Precio Calculado (radio) */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`precio-${key}`}
                          checked={detalle?.tipoPrecio === 'calculado'}
                          onChange={() => handleTipoPrecioChange(key, 'calculado', precio)}
                        />
                        <span className={detalle?.tipoPrecio === 'calculado' ? 'font-medium' : ''}>
                          ${precio.precioCalculado.toFixed(2)}
                        </span>
                      </div>
                    </TableCell>
                    
                    {/* Último Precio (radio) */}
                    <TableCell>
                      {precio.ultimoPrecioCobrado ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`precio-${key}`}
                            checked={detalle?.tipoPrecio === 'ultimo'}
                            onChange={() => handleTipoPrecioChange(key, 'ultimo', precio)}
                          />
                          <span className={detalle?.tipoPrecio === 'ultimo' ? 'font-medium' : ''}>
                            ${precio.ultimoPrecioCobrado.toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    
                    {/* Precio Final (editable) */}
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={detalle?.precioSeleccionado || 0}
                        onChange={(e) => handlePrecioManualChange(key, parseFloat(e.target.value) || 0)}
                        className="w-24"
                      />
                    </TableCell>
                    
                    {/* Subtotal */}
                    <TableCell className="font-medium">
                      ${((detalle?.cantidad || 0) * (detalle?.precioSeleccionado || 0)).toFixed(2)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Total */}
          <div className="mt-6 flex justify-end">
            <div className="text-right">
              <Label className="text-gray-500">Total del Remito</Label>
              <p className="text-3xl font-bold">${calcularTotal().toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warnings globales */}
      {preciosSugeridos.some(p => p.warningConversion) && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Algunos productos no tienen precio por kg registrado o falta conversión. 
            Los precios pueden no ser precisos.
          </AlertDescription>
        </Alert>
      )}

      {/* Acciones */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button onClick={generarRemito} disabled={guardando}>
          <Check className="h-4 w-4 mr-2" />
          {guardando ? 'Generando...' : 'Generar Remito'}
        </Button>
      </div>
    </div>
  );
}