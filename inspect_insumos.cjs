const { Pool } = require('c:/Users/nicoa/OneDrive/Documentos/9 - Nico Labs/Food/server/node_modules/pg');
const pool = new Pool({ connectionString: 'postgres://nlanfranco:Lurenata19@34.66.159.181:5432/facturacion' });

async function run() {
  try {
    const cols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_schema = 'food' AND table_name = 'insumos'");
    console.log('Columnas food.insumos:', cols.rows.map(c => c.column_name));

    // Revisar tablas relacionadas con estructuras o roles
    const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'food'");
    console.log('Tablas en schema food:', tables.rows.map(t => t.table_name).filter(t => t.includes('estructura') || t.includes('regla') || t.includes('opcion') || t.includes('insumo') || t.includes('grupo') || t.includes('rol') || t.includes('etiqueta')));

    const ins = await pool.query("SELECT insumo_id, nombre, categoria, categoria_personalizable, imagen_url FROM food.insumos WHERE tenant_id = 1");
    console.log('Total insumos:', ins.rows.length);
    console.log('Categorias personalizables:', [...new Set(ins.rows.map(i => i.categoria_personalizable))]);

    console.log('\n--- INSUMOS CON ETIQUETAS ---');
    ins.rows.forEach(i => {
      console.log(`ID: ${i.insumo_id} | ${i.nombre} | Cat: ${i.categoria} | Etiqueta/CatPers: ${i.categoria_personalizable} | Foto: ${i.imagen_url ? 'SI' : 'NO'}`);
    });

    // Check estructuras si existe tabla
    try {
      const est = await pool.query("SELECT * FROM food.estructuras_armado WHERE tenant_id = 1");
      console.log('\n--- ESTRUCTURAS ARMADO ---');
      console.log(est.rows);
    } catch (e) {
      console.log('No existe food.estructuras_armado o error:', e.message);
    }

    try {
      const pasos = await pool.query("SELECT * FROM food.estructuras_armado_pasos");
      console.log('\n--- PASOS ESTRUCTURAS ---');
      console.log(pasos.rows);
    } catch (e) {
      console.log('No existe food.estructuras_armado_pasos o error:', e.message);
    }

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
run();
