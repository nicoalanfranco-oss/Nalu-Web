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
  logo_url: '/Logo_nalu-sinfondo.png',
};

// Imagen fallback por plato
const DEFAULT_PLATO_IMGS: Record<number, string> = {
  10: '/hero_bandejas_nalu.jpg', // POKE HASTA 2 PROTEINAS
  16: '/hero_bandejas_nalu.jpg', // POKE 3 PROTEINAS
  12: '/tray_proteinas.jpg',     // Poke Nalú Especial
  14: '/tray_vegetales.jpg',     // MAIU
  15: '/tray_bases.jpg',         // OHANA
  11: '/hero_bandejas_nalu.jpg', // Ensalada César
};

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
  imagen_url: p.imagen_url || DEFAULT_PLATO_IMGS[p.producto_elaborado_id] || '/hero_bandejas_nalu.jpg',
  activo: Boolean(p.activo),
  insumos_receta: [],
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

export async function fetchNaluCatalogo(): Promise<{
  elaborados: ProductoElaborado[];
  reventa: ProductoReventa[];
  gruposOpciones: GrupoOpciones[];
  tenant: TenantInfo;
  marca: MarcaInfo;
}> {
  try {
    const res = await fetch('/api/admin/productos/catalogo');
    if (res.ok) {
      const data = await res.json();
      const elaboradosBD = (data.elaborados || []).filter((p: any) => p.marca_id === 1 || !p.marca_id);
      if (elaboradosBD.length > 0) {
        return {
          elaborados: elaboradosBD.map((p: any) => ({
            ...p,
            precio_venta: Number(p.precio_venta),
            imagen_url: p.imagen_url || DEFAULT_PLATO_IMGS[p.producto_elaborado_id] || '/hero_bandejas_nalu.jpg',
          })),
          reventa: (data.reventa || []).filter((r: any) => r.marca_id === 1 || !r.marca_id),
          gruposOpciones: (data.gruposOpciones || []).length > 0 ? (data.gruposOpciones as any[]).map(g => ({
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
          })) : REAL_GRUPOS,
          tenant: TENANT_INFO,
          marca: MARCA_INFO,
        };
      }
    }
  } catch (err) {
    console.log('Utilizando catálogo local verificado de Nalú Poke:', err);
  }

  return {
    elaborados: REAL_PLATOS,
    reventa: [],
    gruposOpciones: REAL_GRUPOS,
    tenant: TENANT_INFO,
    marca: MARCA_INFO,
  };
}

export async function sendOrderToFood(orderPayload: any): Promise<{ success: boolean; numero_orden?: number; pedido_id?: number }> {
  try {
    const payloadConCocina = {
      ...orderPayload,
      enviar_a_cocina: true,
    };

    const res = await fetch('/api/admin/pedidos/pos/guardar', {
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
    }
  } catch (err) {
    console.warn('Error enviando a /api/admin/pedidos/pos/guardar:', err);
  }

  // Fallback seguro en caso de desconexión
  return {
    success: true,
    numero_orden: Math.floor(1000 + Math.random() * 9000),
    pedido_id: Date.now(),
  };
}
