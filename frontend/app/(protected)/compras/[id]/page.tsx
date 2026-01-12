// frontend/src/app/compras/[id]/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Check, X, Edit2, Save, AlertTriangle, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { compraService } from '@/services/compra.service';
import { ICompra, ICompraDetalle, EstadoCompra } from '@/types';

export default function CompraDetallePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const compraId = parseInt(params.id as string);

  const [compra, setCompra] = useState<ICompra | null>(null);
  const [loading, setLoading] = useState(true);
  const [warnings, setWarnings] = useState<string[]>([]);
  
  // Estados para edición
  const [editingDetalle, setEditingDetalle] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    cantidad: 0,
    precio_unitario: 0,
    precio_total: 0,
    usar_precio_total: false
  });

  // Estados para kg reales
  const [editingKg, setEditingKg] = useState<number | null>(null);
  const [kgRealesInput, setKgRealesInput] = useState<string>('');

  useEffect(() => {
    loadCompra();
  }, [compraId]);

  const loadCompra = async () => {
    try {
      setLoading(true);
      const response = await compraService.getOne(compraId);
      if (response.success && response.data) {
        setCompra(response.data);
        // Cargar warnings
        const warningsResponse = await compraService.getWarningsKgReales(compraId);
        if (warningsResponse.success) {
          setWarnings(warningsResponse.data || []);
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cargar la compra',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmar = async () => {
    if (!compra) return;
    
    try {
      const response = await compraService.confirmar(compra.id!);
      if (response.success) {
        toast({
          title: 'Éxito',
          description: 'Compra confirmada y stock actualizado',
        });
        loadCompra();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo confirmar la compra',
        variant: 'destructive',
      });
    }
  };

  const handleCancelar = async () => {
    if (!compra) return;
    
    try {
      const response = await compraService.cancelar(compra.id!);
      if (response.success) {
        toast({
          title: 'Éxito',
          description: 'Compra cancelada',
        });
        router.push('/compras');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cancelar la compra',
        variant: 'destructive',
      });
    }
  };

  const startEditDetalle = (detalle: ICompraDetalle) => {
    setEditingDetalle(detalle.id!);
    setEditForm({
      cantidad: Number(detalle.cantidad),
      precio_unitario: Number(detalle.precio_unitario),
      precio_total: Number(detalle.cantidad) * Number(detalle.precio_unitario),
      usar_precio_total: false
    });
  };

  const handleUpdateDetalle = async () => {
    if (!compra || !editingDetalle) return;
    
    try {
      const precio_unitario = editForm.usar_precio_total 
        ? editForm.precio_total / editForm.cantidad
        : editForm.precio_unitario;

      const response = await compraService.updateDetalle(
        compra.id!,
        editingDetalle,
        {
          cantidad: editForm.cantidad,
          precio_unitario: precio_unitario
        }
      );
      
      if (response.success) {
        toast({ title: 'Éxito', description: 'Detalle actualizado' });
        setEditingDetalle(null);
        loadCompra();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el detalle',
        variant: 'destructive',
      });
    }
  };

  // NUEVO: Guardar kg reales
  const handleSaveKgReales = async (detalleId: number) => {
    if (!compra) return;
    
    const kgReales = parseFloat(kgRealesInput);
    if (isNaN(kgReales) || kgReales <= 0) {
      toast({
        title: 'Error',
        description: 'Ingrese un valor válido mayor a 0',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await compraService.updateKgReales(compra.id!, detalleId, {
        cantidad_kg_real: kgReales
      });
      
      if (response.success) {
        toast({ title: 'Éxito', description: 'Kg reales actualizados' });
        setEditingKg(null);
        setKgRealesInput('');
        loadCompra();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar los kg reales',
        variant: 'destructive',
      });
    }
  };

  const startEditKg = (detalle: ICompraDetalle) => {
    setEditingKg(detalle.id!);
    setKgRealesInput(detalle.cantidad_kg_real?.toString() || '');
  };

  const getEstadoBadge = (estado: EstadoCompra) => {
    const variants: Record<EstadoCompra, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      [EstadoCompra.PENDIENTE]: { variant: 'secondary', label: 'Pendiente' },
      [EstadoCompra.CONFIRMADA]: { variant: 'default', label: 'Confirmada' },
      [EstadoCompra.CANCELADA]: { variant: 'destructive', label: 'Cancelada' },
    };
    const config = variants[estado] || { variant: 'outline', label: estado };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Determina si un detalle necesita kg reales (no está en kg)
  const necesitaKgReales = (detalle: ICompraDetalle) => {
    const unidadNombre = detalle.producto_unidad?.unidad_medida?.nombre?.toLowerCase() || '';
    return !['kg', 'kilo', 'kilogramo', 'kilogramos'].includes(unidadNombre);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>;
  }

  if (!compra) {
    return <div className="text-center py-10">Compra no encontrada</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Compra #{compra.id}</h1>
            <p className="text-gray-500">
              {new Date(compra.fecha_compra).toLocaleDateString('es-AR')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getEstadoBadge(compra.estado)}
        </div>
      </div>

      {/* Warnings de kg reales */}
      {warnings.length > 0 && !compra.confirmada && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Faltan kg reales por ingresar:</strong>
            <ul className="list-disc list-inside mt-2">
              {warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Info de la compra */}
      <Card>
        <CardHeader>
          <CardTitle>Información de la Compra</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-gray-500">Estado</Label>
              <p className="font-medium">{compra.estado}</p>
            </div>
            <div>
              <Label className="text-gray-500">Total</Label>
              <p className="font-medium text-xl">${Number(compra.total_real).toFixed(2)}</p>
            </div>
            <div>
              <Label className="text-gray-500">Orden de Compra</Label>
              <p className="font-medium">{compra.orden_compra_id || 'Manual'}</p>
            </div>
            <div>
              <Label className="text-gray-500">Confirmada</Label>
              <p className="font-medium">{compra.confirmada ? 'Sí' : 'No'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detalles */}
      <Card>
        <CardHeader>
          <CardTitle>Detalles de la Compra</CardTitle>
          <CardDescription>
            Para productos que no están en KG, ingrese los kg reales recibidos para calcular el costo correcto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead>Precio Unit.</TableHead>
                <TableHead>Subtotal</TableHead>
                <TableHead className="bg-yellow-50">Kg Reales</TableHead>
                <TableHead className="bg-yellow-50">$/kg</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {compra.detalles?.map((detalle) => (
                <TableRow key={detalle.id}>
                  <TableCell className="font-medium">
                    {detalle.producto_unidad?.producto?.nombre || 'N/A'}
                  </TableCell>
                  
                  {/* Cantidad */}
                  <TableCell>
                    {editingDetalle === detalle.id ? (
                      <Input
                        type="number"
                        step="0.001"
                        value={editForm.cantidad}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          cantidad: parseFloat(e.target.value) || 0
                        })}
                        className="w-24"
                      />
                    ) : (
                      Number(detalle.cantidad).toFixed(3)
                    )}
                  </TableCell>
                  
                  {/* Unidad */}
                  <TableCell>
                    {detalle.producto_unidad?.unidad_medida?.nombre || 'N/A'}
                  </TableCell>
                  
                  {/* Precio Unitario */}
                  <TableCell>
                    {editingDetalle === detalle.id ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={editForm.precio_unitario}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          precio_unitario: parseFloat(e.target.value) || 0
                        })}
                        className="w-28"
                      />
                    ) : (
                      `$${Number(detalle.precio_unitario).toFixed(2)}`
                    )}
                  </TableCell>
                  
                  {/* Subtotal */}
                  <TableCell className="font-medium">
                    ${(Number(detalle.cantidad) * Number(detalle.precio_unitario)).toFixed(2)}
                  </TableCell>
                  
                  {/* Kg Reales */}
                  <TableCell className="bg-yellow-50">
                    {necesitaKgReales(detalle) ? (
                      editingKg === detalle.id ? (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            step="0.001"
                            value={kgRealesInput}
                            onChange={(e) => setKgRealesInput(e.target.value)}
                            className="w-20"
                            placeholder="0.000"
                          />
                          <Button size="sm" variant="ghost" onClick={() => handleSaveKgReales(detalle.id!)}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setEditingKg(null); setKgRealesInput(''); }}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {detalle.cantidad_kg_real ? (
                            <span className="text-green-600 font-medium">
                              {Number(detalle.cantidad_kg_real).toFixed(3)} kg
                            </span>
                          ) : (
                            <span className="text-red-500 text-sm">Pendiente</span>
                          )}
                          {!compra.confirmada && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => startEditKg(detalle)}
                            >
                              <Scale className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )
                    ) : (
                      <span className="text-gray-400">N/A (ya en kg)</span>
                    )}
                  </TableCell>
                  
                  {/* Precio por kg */}
                  <TableCell className="bg-yellow-50">
                    {detalle.precio_por_kg ? (
                      <span className="font-medium text-blue-600">
                        ${Number(detalle.precio_por_kg).toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  
                  {/* Acciones */}
                  <TableCell>
                    {!compra.confirmada && (
                      editingDetalle === detalle.id ? (
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={handleUpdateDetalle}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingDetalle(null)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => startEditDetalle(detalle)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Acciones */}
      {!compra.confirmada && compra.estado !== EstadoCompra.CANCELADA && (
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={handleCancelar}>
            <X className="h-4 w-4 mr-2" />
            Cancelar Compra
          </Button>
          <Button onClick={handleConfirmar}>
            <Check className="h-4 w-4 mr-2" />
            Confirmar Compra
            {warnings.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {warnings.length} warnings
              </Badge>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}