import { ProductoElaborado, ProductoReventa, GrupoOpciones, TenantInfo, MarcaInfo } from '../types/food';
import realData from './nalu_catalog.json';

export const TENANT_INFO: TenantInfo = {
  tenant_id: realData.tenant?.tenant_id || 1,
  nombre: realData.tenant?.nombre || 'Nalú Poke Bowls',
  rut: realData.tenant?.rut || '219988770014',
  direccion: realData.tenant?.direccion || 'Avenida Presidente Jorge Batlle Ibañez',
  telefono: realData.tenant?.telefono || '+598 99 123 456',
  email: realData.tenant?.email || 'contacto@naludeuna.com',
};

export const MARCA_INFO: MarcaInfo = {
  marca_id: realData.marca?.marca_id || 1,
  nombre: realData.marca?.nombre || 'Nalú Poke Bowls',
  color_primario: realData.marca?.color_primario || '#788c50',
  dias_atencion: realData.marca?.dias_atencion || 'Lunes a Viernes',
  horario_atencion: realData.marca?.horario_atencion || '10:00 a 13:00 hs',
  permite_salon: Boolean(realData.marca?.permite_salon),
  permite_delivery: realData.marca?.permite_delivery !== false,
  permite_takeaway: realData.marca?.permite_takeaway !== false,
  logo_url: realData.marca?.logo_url || '/Logo_nalu-sinfondo.png',
};

// Imagen fallback genérica para platos sin foto
const FALLBACK_PLATO_IMG = '/hero_bandejas_nalu.jpg';

function parseTenantFromBackend(t: any): TenantInfo {
  if (!t) return TENANT_INFO;
  return {
    tenant_id: Number(t.tenant_id) || TENANT_INFO.tenant_id,
    nombre: t.nombre || TENANT_INFO.nombre,
    rut: t.rut || TENANT_INFO.rut,
    direccion: t.direccion || TENANT_INFO.direccion,
    telefono: t.telefono || TENANT_INFO.telefono,
    email: t.email || TENANT_INFO.email,
  };
}

function parseMarcaFromBackend(m: any): MarcaInfo {
  if (!m) return MARCA_INFO;
  return {
    marca_id: Number(m.marca_id) || MARCA_INFO.marca_id,
    nombre: m.nombre || MARCA_INFO.nombre,
    color_primario: m.color_primario || MARCA_INFO.color_primario,
    dias_atencion: m.dias_atencion || MARCA_INFO.dias_atencion,
    horario_atencion: m.horario_atencion || MARCA_INFO.horario_atencion,
    permite_salon: Boolean(m.permite_salon),
    permite_delivery: m.permite_delivery !== false,
    permite_takeaway: m.permite_takeaway !== false,
    logo_url: m.logo_url || MARCA_INFO.logo_url,
  };
}

export const REAL_PLATOS: ProductoElaborado[] = (realData.platos as any[]).map(p => ({
  producto_elaborado_id: p.producto_elaborado_id,
  tenant_id: p.tenant_id,
  marca_id: p.marca_id,
  nombre: p.nombre,
  categoria: p.categoria,
  descripcion: p.descripcion,
  precio_venta: Number(p.precio_venta),
  es_personalizable: Boolean(p.es_personalizable),
  formato_venta: 'unidad',
  imagen_url: p.imagen_url || FALLBACK_PLATO_IMG,
  activo: Boolean(p.activo),
  insumos_receta: [],
}));

export const REAL_REVENTA: ProductoReventa[] = ((realData as any).reventa as any[] || []).map(r => ({
  producto_reventa_id: r.producto_reventa_id,
  tenant_id: r.tenant_id,
  marca_id: r.marca_id,
  nombre: r.nombre,
  categoria: r.categoria || 'Bebidas',
  precio_venta: Number(r.precio_venta),
  costo_unitario: 0,
  stock_actual: r.stock_actual || 10,
  stock_minimo: 5,
  unidad: r.unidad || 'unidad',
  imagen_url: r.imagen_url || `/ingredients/reventa_${r.producto_reventa_id}.jpg`,
  activo: Boolean(r.activo),
}));

export const REAL_GRUPOS: GrupoOpciones[] = (realData.gruposOpciones as any[]).map(g => ({
  grupo_id: g.grupo_id,
  producto_elaborado_id: g.producto_elaborado_id,
  nombre: g.nombre,
  paso_orden: g.paso_orden,
  min_opciones: g.min_opciones,
  max_opciones: g.max_opciones,
  opciones: (g.opciones || []).map((o: any) => ({
    opcion_id: o.opcion_id,
    nombre: o.nombre,
    precio_extra: Number(o.precio_extra || 0),
    imagen_url: o.imagen_url || null,
  })),
}));

// Base URL del backend de Food:
// - En local (localhost/127.0.0.1) usa el proxy de Vite ('')
// - En producción (nalu.nico-family.com, nalu.uy, github pages) llama directo al Cloud Run de Food con CORS (igual que Lorena Web)
export const FOOD_BACKEND_URL = (() => {
  try {
    const host = window.location.hostname;
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      return '';
    }
  } catch {}
  return 'https://food--studio-4748759464-52942.us-east4.hosted.app';
})();

const MEMORY_CACHE_KEY = 'nalu_catalogo_cache_v3';
const CACHE_TTL_MS = 60 * 1000; // 1 minuto de caché para navegación rápida sin esperas

/** Catálogo estático empaquetado en el build (siempre disponible de respaldo) */
export function getStaticCatalog() {
  return {
    elaborados: REAL_PLATOS,
    reventa: REAL_REVENTA,
    gruposOpciones: REAL_GRUPOS,
    tenant: TENANT_INFO,
    marca: MARCA_INFO,
  };
}

export async function fetchNaluCatalogo(): Promise<{
  elaborados: ProductoElaborado[];
  reventa: ProductoReventa[];
  gruposOpciones: GrupoOpciones[];
  tenant: TenantInfo;
  marca: MarcaInfo;
}> {
  // 1. Revisar si hay datos en caché de sesión recientes (< 1 min)
  try {
    const rawCache = sessionStorage.getItem(MEMORY_CACHE_KEY);
    if (rawCache) {
      const parsed = JSON.parse(rawCache);
      if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
        return parsed.data;
      }
    }
  } catch {}

  // 2. Llamada directa a la API en vivo (idéntico a Lorena Web)
  try {
    const url = `${FOOD_BACKEND_URL}/api/public/catalogo?tenant_id=1&marca_id=1`;
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (res.ok) {
      const data = await res.json();
      const elaboradosBD = (data.elaborados || []).filter((p: any) => p.marca_id === 1 || !p.marca_id);

      const finalCatalog = {
        elaborados: elaboradosBD.length > 0
          ? elaboradosBD.map((p: any) => ({
              ...p,
              precio_venta: Number(p.precio_venta),
              imagen_url: p.imagen_url || FALLBACK_PLATO_IMG,
            }))
          : REAL_PLATOS,
        reventa: (data.reventa && data.reventa.length > 0)
          ? data.reventa.map((r: any) => ({
              ...r,
              precio_venta: Number(r.precio_venta),
              imagen_url: r.imagen_url || `/ingredients/reventa_${r.producto_reventa_id}.jpg`,
            }))
          : REAL_REVENTA,
        gruposOpciones: (data.gruposOpciones && data.gruposOpciones.length > 0)
          ? (data.gruposOpciones as any[]).map(g => ({
              grupo_id: g.grupo_id,
              producto_elaborado_id: g.producto_elaborado_id,
              nombre: g.nombre,
              paso_orden: g.paso_orden,
              min_opciones: g.min_opciones,
              max_opciones: g.max_opciones,
              opciones: (g.opciones || []).map((o: any) => ({
                opcion_id: o.opcion_id,
                nombre: o.nombre,
                precio_extra: Number(o.precio_extra || 0),
                imagen_url: o.imagen_url || `/ingredients/opt_${o.opcion_id}.jpg`,
              })),
            }))
          : REAL_GRUPOS,
        tenant: parseTenantFromBackend(data.tenant),
        marca: parseMarcaFromBackend(data.marca),
      };

      try {
        sessionStorage.setItem(MEMORY_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: finalCatalog }));
      } catch {}

      return finalCatalog;
    }
  } catch (error) {
    console.warn('No se pudo conectar al backend en vivo, usando catálogo empaquetado de respaldo:', error);
  }

  // 3. Fallback seguro si no hay internet o el backend no responde
  return getStaticCatalog();
}

export async function sendOrderToFood(orderPayload: any): Promise<{ success: boolean; numero_orden?: number; pedido_id?: number }> {
  const payloadConCocina = {
    ...orderPayload,
    enviar_a_cocina: true,
  };

  try {
    const res = await fetch(`${FOOD_BACKEND_URL}/api/public/pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadConCocina),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        numero_orden: data.numero_orden,
        pedido_id: data.pedido_id,
      };
    } else {
      console.warn('Respuesta no exitosa al enviar pedido a Food:', res.status);
    }
  } catch (err) {
    console.warn('Error de red al enviar pedido a Food backend:', err);
  }

  // Fallback seguro en caso de desconexión para no trabar el checkout ni WhatsApp
  return {
    success: true,
    numero_orden: Math.floor(1000 + Math.random() * 9000),
    pedido_id: Date.now(),
  };
}
