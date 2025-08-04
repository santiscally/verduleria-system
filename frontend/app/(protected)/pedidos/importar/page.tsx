'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { pedidoImportService, ValidationResult } from '@/services/pedido-import.service';
import { conversionService } from '@/services/conversion.service';
import { ICliente, IProducto, IUnidadMedida } from '@/types';
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  Users,
  Package,
  RefreshCw,
  Loader2,
  Download,
  Ruler,
} from 'lucide-react';

export default function ImportarPedidosPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [step, setStep] = useState<'upload' | 'validate' | 'entities' | 'conversions' | 'import'>('upload');
  
  // Estados para confirmación de entidades
  const [isEntityDialogOpen, setIsEntityDialogOpen] = useState(false);
  const [newClientes, setNewClientes] = useState<Partial<ICliente>[]>([]);
  const [newProductos, setNewProductos] = useState<Partial<IProducto>[]>([]);
  const [newUnidades, setNewUnidades] = useState<Partial<IUnidadMedida>[]>([]);
  
  // Estados para conversiones
  const [isConversionDialogOpen, setIsConversionDialogOpen] = useState(false);
  const [currentConversion, setCurrentConversion] = useState<any>(null);
  const [conversionIndex, setConversionIndex] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setValidationResult(null);
      setStep('upload');
    }
  };

  const handleValidate = async () => {
    if (!file) return;

    setLoading(true);
    setStep('validate');
    try {
      const response = await pedidoImportService.validateCSV(file);
      if (response.success && response.data) {
        setValidationResult(response.data);
        
        // Preparar entidades nuevas
        setNewClientes(response.data.newClientes.map(nombre => ({ nombre })));
        setNewProductos(response.data.newProductos.map(nombre => ({ nombre })));
        setNewUnidades(response.data.newUnidades.map(nombre => ({ nombre, abreviacion: nombre.substring(0, 3).toUpperCase() })));
        
        if (!response.data.valid) {
          toast({
            title: 'Validación fallida',
            description: 'Revise los errores encontrados',
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al validar el archivo',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEntities = async () => {
    setLoading(true);
    try {
      const productoUnidades = validationResult?.newProductoUnidades.map(pu => ({
        producto: pu.producto,
        unidad: pu.unidad,
        esUnidadCompra: pu.esUnidadCompra !== undefined ? pu.esUnidadCompra : false,
        esUnidadVenta: pu.esUnidadVenta !== undefined ? pu.esUnidadVenta : true
      })) || [];

      const response = await pedidoImportService.createEntities(
        newClientes,
        newProductos,
        newUnidades,
        productoUnidades
      );
      
      if (response.success) {
        toast({
          title: 'Éxito',
          description: 'Entidades creadas correctamente',
        });
        setIsEntityDialogOpen(false);
        setStep('entities');
        
        // Si hay conversiones faltantes, mostrarlas
        if (validationResult?.missingConversions && validationResult.missingConversions.length > 0) {
          setConversionIndex(0);
          setCurrentConversion({
            ...validationResult.missingConversions[0],
            factor_conversion: 1
          });
          setIsConversionDialogOpen(true);
        } else {
          // Si no hay conversiones faltantes, importar directamente
          handleImport();
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al crear entidades',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConversion = async () => {
    if (!currentConversion) return;

    setLoading(true);
    try {
      // Crear la conversión usando nombres (el backend debería manejar la búsqueda de IDs)
      const response = await conversionService.create({
        productoNombre: currentConversion.producto,
        unidadOrigenNombre: currentConversion.unidadesCompra[0],
        unidadDestinoNombre: currentConversion.unidadVenta, // Primera unidad de compra
        factor_conversion: currentConversion.factor_conversion
      });

      if (response.success) {
        toast({
          title: 'Éxito',
          description: 'Conversión creada correctamente',
        });

        // Esperar 2 segundos antes de continuar
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Verificar si hay más conversiones
        if (validationResult && conversionIndex < validationResult.missingConversions.length - 1) {
          const nextIndex = conversionIndex + 1;
          setConversionIndex(nextIndex);
          setCurrentConversion({
            ...validationResult.missingConversions[nextIndex],
            factor_conversion: 1
          });
        } else {
          setIsConversionDialogOpen(false);
          handleImport();
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al crear conversión',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!validationResult) return;

    setLoading(true);
    setStep('import');
    try {
      const response = await pedidoImportService.import(validationResult.parsedData);
      if (response.success && response.data) {
        toast({
          title: 'Éxito',
          description: `Se importaron ${response.data.pedidosCreados} pedidos correctamente`,
        });
        setTimeout(() => {
          router.push('/pedidos');
        }, 2000);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al importar pedidos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (!validationResult) return;

    if (validationResult.newClientes.length > 0 || validationResult.newProductos.length > 0 || validationResult.newUnidades.length > 0) {
      setIsEntityDialogOpen(true);
    } else if (validationResult.missingConversions.length > 0) {
      setConversionIndex(0);
      setCurrentConversion({
        ...validationResult.missingConversions[0],
        factor_conversion: 1
      });
      setIsConversionDialogOpen(true);
    } else {
      handleImport();
    }
  };

  const downloadTemplate = () => {
    const csvContent = 'cliente,producto,unidad_medida,cantidad\n' +
      'Restaurant La Esquina,Tomate,kg,5\n' +
      'Restaurant La Esquina,Lechuga,unidad,10\n' +
      'Café Central,Papa,kg,20';
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_pedidos.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Importar Pedidos</h1>
        <p className="text-gray-600">Cargue un archivo CSV con los pedidos de los clientes</p>
      </div>

      <Card className="mx-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Cargar archivo CSV</CardTitle>
              <CardDescription>
                Seleccione un archivo CSV con los pedidos a importar
              </CardDescription>
            </div>
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Descargar Plantilla
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
            <Upload className="h-12 w-12 text-gray-400 mb-4" />
            <Label htmlFor="csv-file" className="cursor-pointer">
              <span className="text-primary hover:underline">Seleccionar archivo</span>
              <span className="text-gray-600"> o arrastrar aquí</span>
            </Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={loading}
              className="hidden"
            />
            <p className="text-sm text-gray-500 mt-2">CSV hasta 10MB</p>
          </div>

          {file && (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                Archivo seleccionado: {file.name}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-center">
            <Button
              onClick={handleValidate}
              disabled={!file || loading}
              className="min-w-[200px]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validando...
                </>
              ) : (
                'Validar Archivo'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {validationResult && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados de Validación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Errores */}
            {validationResult.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc pl-5 space-y-1">
                    {validationResult.errors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Advertencias */}
            {validationResult.warnings.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc pl-5 space-y-1">
                    {validationResult.warnings.map((warning, idx) => (
                      <li key={idx}>{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Nuevas entidades */}
            <div className="grid gap-4 md:grid-cols-3">
              {validationResult.newClientes.length > 0 && (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <h3 className="font-medium">Nuevos Clientes</h3>
                  </div>
                  <p className="text-2xl font-bold">{validationResult.newClientes.length}</p>
                </div>
              )}

              {validationResult.newProductos.length > 0 && (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-5 w-5 text-green-600" />
                    <h3 className="font-medium">Nuevos Productos</h3>
                  </div>
                  <p className="text-2xl font-bold">{validationResult.newProductos.length}</p>
                </div>
              )}

              {validationResult.newUnidades.length > 0 && (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Ruler className="h-5 w-5 text-purple-600" />
                    <h3 className="font-medium">Nuevas Unidades</h3>
                  </div>
                  <p className="text-2xl font-bold">{validationResult.newUnidades.length}</p>
                </div>
              )}
            </div>

            {/* Conversiones faltantes */}
            {validationResult.missingConversions.length > 0 && (
              <Alert>
                <RefreshCw className="h-4 w-4" />
                <AlertDescription>
                  Se requieren {validationResult.missingConversions.length} conversiones de unidades
                </AlertDescription>
              </Alert>
            )}

            {validationResult.valid && (
              <div className="flex justify-center pt-4">
                <Button onClick={handleContinue} className="min-w-[200px]">
                  Continuar con la Importación
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog para crear entidades */}
      <Dialog open={isEntityDialogOpen} onOpenChange={setIsEntityDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Confirmar Nuevas Entidades</DialogTitle>
            <DialogDescription>
              Configure la información adicional para las nuevas entidades
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {newClientes.length > 0 && (
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Clientes ({newClientes.length})
                </h4>
                <div className="space-y-3">
                  {newClientes.map((cliente, idx) => (
                    <div key={idx} className="border rounded-lg p-3 space-y-2">
                      <div>
                        <Label>Nombre</Label>
                        <Input
                          value={cliente.nombre || ''}
                          onChange={(e) => {
                            const updated = [...newClientes];
                            updated[idx] = { ...updated[idx], nombre: e.target.value };
                            setNewClientes(updated);
                          }}
                        />
                      </div>
                      <div>
                        <Label>Teléfono (opcional)</Label>
                        <Input
                          value={cliente.telefono || ''}
                          onChange={(e) => {
                            const updated = [...newClientes];
                            updated[idx] = { ...updated[idx], telefono: e.target.value };
                            setNewClientes(updated);
                          }}
                          placeholder="Ej: 11-4567-8900"
                        />
                      </div>
                      <div>
                        <Label>Dirección (opcional)</Label>
                        <Input
                          value={cliente.direccion || ''}
                          onChange={(e) => {
                            const updated = [...newClientes];
                            updated[idx] = { ...updated[idx], direccion: e.target.value };
                            setNewClientes(updated);
                          }}
                          placeholder="Ej: Av. Corrientes 1234"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {newProductos.length > 0 && (
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Productos ({newProductos.length})
                </h4>
                <div className="space-y-3">
                  {newProductos.map((producto, idx) => (
                    <div key={idx} className="border rounded-lg p-3 space-y-2">
                      <div>
                        <Label>Nombre</Label>
                        <Input
                          value={producto.nombre || ''}
                          onChange={(e) => {
                            const updated = [...newProductos];
                            updated[idx] = { ...updated[idx], nombre: e.target.value };
                            setNewProductos(updated);
                          }}
                        />
                      </div>
                      <div>
                        <Label>Descripción (opcional)</Label>
                        <Input
                          value={producto.proveedor || ''}
                          onChange={(e) => {
                            const updated = [...newProductos];
                            updated[idx] = { ...updated[idx], proveedor: e.target.value };
                            setNewProductos(updated);
                          }}
                          placeholder="Descripción del producto"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {newUnidades.length > 0 && (
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Ruler className="h-4 w-4" />
                  Unidades ({newUnidades.length})
                </h4>
                <div className="space-y-3">
                  {newUnidades.map((unidad, idx) => (
                    <div key={idx} className="border rounded-lg p-3 space-y-2">
                      <div>
                        <Label>Nombre</Label>
                        <Input
                          value={unidad.nombre || ''}
                          onChange={(e) => {
                            const updated = [...newUnidades];
                            updated[idx] = { ...updated[idx], nombre: e.target.value };
                            setNewUnidades(updated);
                          }}
                        />
                      </div>
                      <div>
                        <Label>Abreviación</Label>
                        <Input
                          value={unidad.abreviacion || ''}
                          onChange={(e) => {
                            const updated = [...newUnidades];
                            updated[idx] = { ...updated[idx], abreviacion: e.target.value };
                            setNewUnidades(updated);
                          }}
                          placeholder="Ej: kg, un, doc"
                          maxLength={10}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEntityDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateEntities} disabled={loading}>
              {loading ? 'Creando...' : 'Crear Entidades'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para conversiones */}
      <Dialog open={isConversionDialogOpen} onOpenChange={setIsConversionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Definir Conversión</DialogTitle>
            <DialogDescription>
              Configure la conversión de unidades para el producto
            </DialogDescription>
          </DialogHeader>

          {currentConversion && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <Label className="text-base font-semibold">Producto</Label>
                <p className="text-lg">{currentConversion.producto}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-3">
                  <Label className="text-sm text-gray-600">Unidad de Compra</Label>
                  <p className="font-medium">{currentConversion.unidadesCompra?.[0]}</p>
                </div>
                <div className="border rounded-lg p-3">
                  <Label className="text-sm text-gray-600">Unidad de Venta</Label>
                  <p className="font-medium">{currentConversion.unidadVenta}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="factor">Factor de Conversión</Label>
                <div className="flex items-center gap-3">
                  <span className="text-sm">1 {currentConversion.unidadesCompra?.[0]} =</span>
                  <Input
                    id="factor"
                    type="number"
                    step="0.001"
                    value={currentConversion.factor_conversion}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Mantener el valor como string si termina en punto o es string vacío
                      const numValue = value === '' || value.endsWith('.') || value.endsWith('.0') 
                        ? value 
                        : parseFloat(value);
                      
                      setCurrentConversion({
                        ...currentConversion,
                        factor_conversion: numValue
                      });
                    }}
                    onBlur={(e) => {
                      // Al perder el foco, asegurar que sea un número válido
                      const numValue = parseFloat(e.target.value) || 1;
                      setCurrentConversion({
                        ...currentConversion,
                        factor_conversion: numValue
                      });
                    }}
                    className="w-24"
                  />
                  <span className="text-sm">{currentConversion.unidadVenta}</span>
                </div>
                <p className="text-sm text-gray-600">
                  Ejemplo: Si 1 cajón contiene 10 kg, ingrese 10
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConversionDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateConversion} disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar y Continuar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}