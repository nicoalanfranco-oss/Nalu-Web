const { Pool } = require('c:/Users/nicoa/OneDrive/Documentos/9 - Nico Labs/Food/server/node_modules/pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({ connectionString: 'postgres://nlanfranco:Lurenata19@34.66.159.181:5432/facturacion' });

async function exportRealData() {
  try {
    // 1. Marca y Tenant Info
    const tenantRes = await pool.query('SELECT * FROM food.tenants WHERE tenant_id = 1');
    const marcaRes = await pool.query('SELECT * FROM food.marcas WHERE tenant_id = 1 AND marca_id = 1');

    // 2. Platos Elaborados (Nalu Poke: marca_id = 1 o null activo)
    const prodsRes = await pool.query(`
      SELECT producto_elaborado_id, marca_id, nombre, categoria, descripcion, precio_venta, es_personalizable, imagen_url, activo
      FROM food.productos_elaborados
      WHERE tenant_id = 1 AND (marca_id = 1 OR marca_id IS NULL) AND activo = true
      ORDER BY producto_elaborado_id ASC
    `);

    // 3. Insumos con sus etiquetas personalizables y fotos reales
    const insumosRes = await pool.query(`
      SELECT insumo_id, nombre, categoria, categoria_personalizable, costo_unitario, imagen_url
      FROM food.insumos
      WHERE tenant_id = 1 AND activo = true
      ORDER BY categoria_personalizable, nombre ASC
    `);

    // 4. Grupos de opciones y sus opciones con insumos vinculados
    const gruposRes = await pool.query(`
      SELECT g.grupo_id, g.producto_elaborado_id, g.nombre, g.paso_orden, g.min_opciones, g.max_opciones,
             COALESCE(
               json_agg(
                 json_build_object(
                   'opcion_id', o.opcion_id,
                   'nombre', o.nombre,
                   'precio_extra', o.precio_extra,
                   'insumo_id', o.insumo_id,
                   'imagen_url', i.imagen_url
                 ) ORDER BY o.opcion_id ASC
               ) FILTER (WHERE o.opcion_id IS NOT NULL),
               '[]'::json
             ) AS opciones
      FROM food.grupos_opciones g
      LEFT JOIN food.opciones_personalizacion o ON g.grupo_id = o.grupo_id AND o.activo = true
      LEFT JOIN food.insumos i ON o.insumo_id = i.insumo_id
      WHERE g.tenant_id = 1 AND g.activo = true
      GROUP BY g.grupo_id
      ORDER BY g.producto_elaborado_id, g.paso_orden ASC
    `);

    const data = {
      tenant: tenantRes.rows[0],
      marca: marcaRes.rows[0],
      platos: prodsRes.rows,
      insumos: insumosRes.rows,
      gruposOpciones: gruposRes.rows
    };

    const outPath = path.join(__dirname, 'src', 'services', 'nalu_real_data.json');
    fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf-8');
    console.log('✅ Datos reales exportados a:', outPath);
    console.log('Platos:', data.platos.length);
    console.log('Insumos:', data.insumos.length);
    console.log('Grupos:', data.gruposOpciones.length);
  } catch (err) {
    console.error('Error exportando datos:', err);
  } finally {
    await pool.end();
  }
}

exportRealData();
