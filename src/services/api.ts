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
  permite_efectivo: (realData.marca as any)?.permite_efectivo !== false,
  permite_tarjeta: (realData.marca as any)?.permite_tarjeta !== false,
  permite_transferencia: (realData.marca as any)?.permite_transferencia !== false,
  tiempo_espera_delivery: (realData.marca as any)?.tiempo_espera_delivery || '30–45 min',
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

function parseMarcaFromBackend(m: any, estadoAtencion?: any): MarcaInfo {
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
    permite_efectivo: m.permite_efectivo !== false,
    permite_tarjeta: m.permite_tarjeta !== false,
    permite_transferencia: m.permite_transferencia !== false,
    costo_delivery: m.costo_delivery !== undefined ? Number(m.costo_delivery) : 0,
    tiempo_espera_delivery: m.tiempo_espera_delivery || '30–45 min',
    logo_url: m.logo_url || MARCA_INFO.logo_url,
    estado_atencion: estadoAtencion || m.estado_atencion,
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
  insumos_receta: (p.insumos_receta || []).map((i: any) => ({
    insumo_id: Number(i.insumo_id),
    nombre: i.nombre,
    cantidad: Number(i.cantidad ?? i.cantidad_receta ?? 0),
    unidad: i.unidad || 'kg',
    costo_unitario: Number(i.costo_unitario || 0),
    imagen_url: i.imagen_url || null,
  })),
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
              insumos_receta: (p.insumos_receta || []).map((i: any) => ({
                insumo_id: Number(i.insumo_id),
                nombre: i.nombre,
                cantidad: Number(i.cantidad ?? i.cantidad_receta ?? 0),
                unidad: i.unidad || 'kg',
                costo_unitario: Number(i.costo_unitario || 0),
                imagen_url: i.imagen_url || null,
              })),
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
        marca: parseMarcaFromBackend(data.marca, data.estado_atencion),
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

export async function sendOrderToFood(orderPayload: any): Promise<{ success: boolean; numero_orden?: number; pedido_id?: number; error?: string }> {
  const payloadConCocina = {
    ...orderPayload,
    enviar_a_cocina: true,
  };

  const MAX_RETRIES = 2;
  const TIMEOUT_MS = 15000;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(`${FOOD_BACKEND_URL}/api/public/pedidos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadConCocina),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        return {
          success: true,
          numero_orden: data.numero_orden,
          pedido_id: data.pedido_id,
        };
      } else {
        console.error(`[sendOrderToFood] Intento ${attempt}/${MAX_RETRIES} — HTTP ${res.status}`, await res.text().catch(() => ''));
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      const isTimeout = err?.name === 'AbortError';
      console.error(`[sendOrderToFood] Intento ${attempt}/${MAX_RETRIES} — ${isTimeout ? 'TIMEOUT' : 'ERROR'}:`, err?.message || err);
    }

    // Esperar antes de reintentar (backoff exponencial: 2s, 4s)
    if (attempt < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, attempt * 2000));
    }
  }

  // Todos los intentos fallaron — NO mentir al usuario
  console.error('[sendOrderToFood] Todos los intentos fallaron. El pedido NO fue registrado.');
  return {
    success: false,
    error: 'No pudimos registrar tu pedido en este momento. Por favor intentá nuevamente.',
  };
}

// Obtener el detalle (items) de un pedido activo del cliente
export interface PedidoDetalleItem {
  nombre_producto: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  notas_cocina: string | null;
  estado_cocina: string | null;
  modificadores: { nombre: string; precio_extra: number }[];
}

export interface PedidoDetalle {
  pedido_id: number;
  numero_orden: number;
  tipo_pedido: string;
  estado: string;
  total: number;
  subtotal: number;
  costo_envio: number;
  metodo_pago: string;
  created_at: string;
  notas: string | null;
  comprobante_url?: string | null;
  pagado?: boolean;
  estado_pago?: string;
  items: PedidoDetalleItem[];
}

export async function fetchPedidoDetalle(pedidoId: number, email: string): Promise<PedidoDetalle | null> {
  try {
    const params = new URLSearchParams({
      pedido_id: String(pedidoId),
      email,
      tenant_id: '1',
    });
    const res = await fetch(`${FOOD_BACKEND_URL}/api/public/pedido-detalle?${params.toString()}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Buscar sugerencias de dirección (autocompletado tipo Google Maps) biased a la ciudad del tenant
export interface AddressSuggestion {
  display_name: string;
  direccion: string;
  ciudad: string;
  departamento: string;
  pais: string;
  latitud: number;
  longitud: number;
  google_maps_url: string;
}

export async function searchAddress(query: string, tenantId = 1, ciudadBias = 'Tacuarembó'): Promise<AddressSuggestion[]> {
  if (!query || query.trim().length < 3) return [];
  const cleanQ = query.trim();

  // Extraer el número de puerta al final (ej: "18 de julio 258" -> calle "18 de julio", número "258")
  const trailingMatch = cleanQ.match(/^(.*?)\s+(\d{1,5}(?:\s*(?:bis|a|b|c))?)$/i);
  const streetOnly = trailingMatch ? trailingMatch[1].trim() : '';
  const userDoorNumber = trailingMatch ? trailingMatch[2].trim() : '';

  // 1. Intentar endpoint backend de Food
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const params = new URLSearchParams({
      q: cleanQ,
      tenant_id: String(tenantId),
      ciudad: ciudadBias,
    });

    const res = await fetch(`${FOOD_BACKEND_URL}/api/public/geocode?${params.toString()}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        // Asegurar que si el usuario tipeó un número de puerta, se mantenga en el resultado
        return data.map((item: AddressSuggestion) => {
          if (userDoorNumber && !new RegExp(`\\b${userDoorNumber}$`, 'i').test(item.direccion)) {
            return {
              ...item,
              direccion: `${item.direccion} ${userDoorNumber}`,
              display_name: `${item.direccion} ${userDoorNumber}, ${item.ciudad}, ${item.departamento}, ${item.pais}`,
              google_maps_url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${item.direccion} ${userDoorNumber}, ${item.ciudad}, Uruguay`)}`,
            };
          }
          return item;
        });
      }
    }
  } catch (err) {
    // Continuar a fallback OSM
  }

  // 2. Fallback resiliente directo con Photon (OpenStreetMap Autocomplete para Tacuarembó / Uruguay)
  try {
    const queriesToTry = [cleanQ];
    if (streetOnly && streetOnly !== cleanQ && streetOnly.length >= 2) {
      queriesToTry.push(streetOnly);
    }

    const allFeatures: any[] = [];
    for (const q of queriesToTry) {
      try {
        const pController = new AbortController();
        const pTimeout = setTimeout(() => pController.abort(), 2500);

        const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&lat=-31.71&lon=-55.98&limit=8`;
        const pRes = await fetch(photonUrl, { signal: pController.signal });
        clearTimeout(pTimeout);

        if (pRes.ok) {
          const pData = await pRes.json();
          if (pData.features && pData.features.length > 0) {
            allFeatures.push(...pData.features);
          }
        }
      } catch {}
    }

    if (allFeatures.length > 0) {
      const list: AddressSuggestion[] = [];
      const seen = new Set<string>();

      for (const f of allFeatures) {
        const p = f.properties || {};
        const coords = f.geometry?.coordinates || [];
        const lon = coords[0];
        const lat = coords[1];
        if (!lat || !lon) continue;

        const isUy = !p.countrycode || p.countrycode.toUpperCase() === 'UY';
        const isCity = [p.city, p.town, p.state, p.county, p.district]
          .filter(Boolean)
          .some((s: string) => s.toLowerCase().includes(ciudadBias.toLowerCase()));

        if (!isUy || !isCity) continue;

        const streetName = p.street || p.name || streetOnly || cleanQ;
        const finalDoorNumber = p.housenumber || userDoorNumber;
        let direccion = streetName;
        if (finalDoorNumber) {
          const endsWithNum = new RegExp(`\\b${finalDoorNumber}$`, 'i').test(streetName);
          if (!endsWithNum) {
            direccion = `${streetName} ${finalDoorNumber}`;
          }
        }

        const itemCity = p.city || p.town || ciudadBias;
        const itemState = p.state || ciudadBias;
        const itemCountry = p.country || 'Uruguay';

        const key = `${direccion}|${itemCity}`.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);

        list.push({
          display_name: [direccion, itemCity, itemState, itemCountry].filter(Boolean).join(', '),
          direccion,
          ciudad: itemCity,
          departamento: itemState,
          pais: itemCountry,
          latitud: lat,
          longitud: lon,
          google_maps_url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${direccion}, ${itemCity}, Uruguay`)}`,
        });
      }

      if (list.length > 0) {
        return list.slice(0, 5);
      }
    }
  } catch (err) {
    console.warn('Error en fallback de búsqueda de dirección:', err);
  }

  return [];
}

export async function uploadComprobanteTransferencia(
  pedidoId: number,
  file: File
): Promise<{ success: boolean; comprobante_url?: string; error?: string }> {
  try {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const res = await fetch(`${FOOD_BACKEND_URL}/api/public/pedidos/${pedidoId}/comprobante`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        base64,
        filename: file.name,
        mimeType: file.type || 'image/jpeg',
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error || 'Error subiendo comprobante' };
    }

    const data = await res.json();
    return { success: true, comprobante_url: data.comprobante_url };
  } catch (err: any) {
    console.error('Error al subir comprobante a Food backend:', err);
    return { success: false, error: err.message || 'Error de red' };
  }
}

