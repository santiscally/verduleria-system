-- backend/migrations/add_kg_reales_precio_kg.sql
-- Migración: Agregar campos para kg reales y precio por kg

-- 1. Agregar columnas a compras_detalles
ALTER TABLE compras_detalles 
ADD COLUMN IF NOT EXISTS cantidad_kg_real DECIMAL(10,3) NULL;

ALTER TABLE compras_detalles 
ADD COLUMN IF NOT EXISTS precio_por_kg DECIMAL(10,2) NULL;

COMMENT ON COLUMN compras_detalles.cantidad_kg_real IS 'Kg reales recibidos en la compra. NULL si aún no se pesó o si la unidad ya es kg.';
COMMENT ON COLUMN compras_detalles.precio_por_kg IS 'Precio por kg calculado = (cantidad * precio_unitario) / cantidad_kg_real';

-- 2. Agregar columna a historico_precios_compra
ALTER TABLE historico_precios_compra 
ADD COLUMN IF NOT EXISTS precio_por_kg DECIMAL(10,2) NULL;

COMMENT ON COLUMN historico_precios_compra.precio_por_kg IS 'Precio por kg al momento de la compra. Usado para calcular precios de venta en cualquier unidad.';

-- 3. Índice para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_historico_compra_precio_kg 
ON historico_precios_compra(producto_unidad_id, fecha DESC) 
WHERE precio_por_kg IS NOT NULL;

-- 4. Verificar que existe la unidad "kg"
INSERT INTO unidades_medida (nombre, abreviacion, created_at, updated_at)
SELECT 'Kilogramo', 'kg', NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM unidades_medida 
    WHERE LOWER(nombre) IN ('kg', 'kilogramo', 'kilo') 
    OR LOWER(abreviacion) = 'kg'
);

-- 5. Vista útil para debugging (opcional)
CREATE OR REPLACE VIEW v_ultimo_precio_kg AS
SELECT DISTINCT ON (p.id)
    p.id as producto_id,
    p.nombre as producto_nombre,
    hpc.precio_por_kg,
    hpc.fecha as fecha_compra,
    um.nombre as unidad_compra
FROM productos p
JOIN productos_unidades pu ON p.id = pu.producto_id
JOIN historico_precios_compra hpc ON pu.id = hpc.producto_unidad_id
JOIN unidades_medida um ON pu.unidad_medida_id = um.id
WHERE hpc.precio_por_kg IS NOT NULL
ORDER BY p.id, hpc.fecha DESC;

-- ROLLBACK (en caso de necesitar revertir)
-- ALTER TABLE compras_detalles DROP COLUMN IF EXISTS cantidad_kg_real;
-- ALTER TABLE compras_detalles DROP COLUMN IF EXISTS precio_por_kg;
-- ALTER TABLE historico_precios_compra DROP COLUMN IF EXISTS precio_por_kg;
-- DROP INDEX IF EXISTS idx_historico_compra_precio_kg;
-- DROP VIEW IF EXISTS v_ultimo_precio_kg;