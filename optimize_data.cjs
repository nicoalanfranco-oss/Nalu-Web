/**
 * Script de optimización: Extrae imágenes base64 del JSON pesado
 * a archivos separados en /public/ingredients/ y genera un JSON ligero.
 */
const fs = require('fs');
const path = require('path');

const INPUT = path.join(__dirname, 'src', 'services', 'nalu_real_data.json');
const OUTPUT = path.join(__dirname, 'src', 'services', 'nalu_catalog.json');
const IMG_DIR = path.join(__dirname, 'public', 'ingredients');

// Crear carpeta de imágenes
if (!fs.existsSync(IMG_DIR)) {
  fs.mkdirSync(IMG_DIR, { recursive: true });
}

const data = JSON.parse(fs.readFileSync(INPUT, 'utf-8'));

let imgCount = 0;

function extractBase64Image(base64Str, prefix, id) {
  if (!base64Str || !base64Str.startsWith('data:image')) return null;
  
  // Detectar formato
  const match = base64Str.match(/^data:image\/(jpeg|jpg|png|webp|gif);base64,(.+)$/);
  if (!match) return null;
  
  const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
  const buffer = Buffer.from(match[2], 'base64');
  const filename = `${prefix}_${id}.${ext}`;
  const filepath = path.join(IMG_DIR, filename);
  
  fs.writeFileSync(filepath, buffer);
  imgCount++;
  
  return `/ingredients/${filename}`;
}

// Procesar tenant - limpiar imagen_url si tiene base64
const tenant = {
  tenant_id: data.tenant?.tenant_id,
  nombre: data.tenant?.nombre,
  rut: data.tenant?.rut,
  direccion: data.tenant?.direccion,
  telefono: data.tenant?.telefono,
  email: data.tenant?.email,
};

// Procesar marca - limpiar datos innecesarios
const marca = {
  marca_id: data.marca?.marca_id,
  nombre: data.marca?.nombre,
  color_primario: data.marca?.color_primario,
  dias_atencion: data.marca?.dias_atencion,
  horario_atencion: data.marca?.horario_atencion,
  permite_salon: data.marca?.permite_salon,
  permite_delivery: data.marca?.permite_delivery,
  permite_takeaway: data.marca?.permite_takeaway,
};

// Procesar platos - solo datos necesarios
const platos = (data.platos || []).map(p => {
  const imgUrl = extractBase64Image(p.imagen_url, 'plato', p.producto_elaborado_id);
  return {
    producto_elaborado_id: p.producto_elaborado_id,
    tenant_id: p.tenant_id,
    marca_id: p.marca_id,
    nombre: p.nombre,
    categoria: p.categoria,
    descripcion: p.descripcion,
    precio_venta: p.precio_venta,
    es_personalizable: p.es_personalizable,
    imagen_url: imgUrl,
    activo: p.activo,
  };
});

// Procesar grupos de opciones - extraer imágenes de cada opción
const gruposOpciones = (data.gruposOpciones || []).map(g => ({
  grupo_id: g.grupo_id,
  producto_elaborado_id: g.producto_elaborado_id,
  nombre: g.nombre,
  paso_orden: g.paso_orden,
  min_opciones: g.min_opciones,
  max_opciones: g.max_opciones,
  opciones: (g.opciones || []).map(o => {
    const imgUrl = extractBase64Image(o.imagen_url, 'opt', o.opcion_id);
    return {
      opcion_id: o.opcion_id,
      nombre: o.nombre,
      precio_extra: o.precio_extra || 0,
      imagen_url: imgUrl,
    };
  }),
}));

// Generar JSON ligero
const catalog = { tenant, marca, platos, gruposOpciones };
const jsonStr = JSON.stringify(catalog, null, 2);
fs.writeFileSync(OUTPUT, jsonStr, 'utf-8');

const originalSize = fs.statSync(INPUT).size;
const newSize = Buffer.byteLength(jsonStr, 'utf-8');

console.log('');
console.log('=== Optimización de Datos Nalú Web ===');
console.log(`📦 JSON original: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
console.log(`📦 JSON optimizado: ${(newSize / 1024).toFixed(1)} KB`);
console.log(`🖼️  Imágenes extraídas: ${imgCount} archivos`);
console.log(`📂 Carpeta: /public/ingredients/`);
console.log(`💾 Reducción: ${((1 - newSize / originalSize) * 100).toFixed(1)}%`);
console.log('');
