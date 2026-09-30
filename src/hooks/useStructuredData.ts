/**
 * useStructuredData — Hook que inyecta JSON-LD dinámico en el <head>
 *
 * Genera datos estructurados Schema.org que Google lee para mostrar
 * "rich results": horarios, precios, platos, servicios (delivery/takeaway/salón).
 *
 * Se actualiza automáticamente cada vez que cambia la data desde la API.
 */

import { useEffect } from 'react';
import { ProductoElaborado, ProductoReventa, TenantInfo, MarcaInfo } from '../types/food';

interface StructuredDataOptions {
  tenant: TenantInfo;
  marca: MarcaInfo;
  platos: ProductoElaborado[];
  reventa: ProductoReventa[];
}

// URL canónica del sitio
const SITE_URL = 'https://naludeuna.com.uy';
const CURRENCY = 'UYU';

/**
 * Convierte el string de horarios del sistema al formato HH:MM de Schema.org
 * Ejemplo: "10:00 a 13:00 hs" → opens: "10:00", closes: "13:00"
 */
function parseHorario(horarioStr: string): { opens: string; closes: string } | null {
  const match = horarioStr.match(/(\d{1,2}:\d{2})\s*(?:a|-|–)\s*(\d{1,2}:\d{2})/i);
  if (!match) return null;
  return { opens: match[1], closes: match[2] };
}

/**
 * Mapea los días de atención a los nombres de Schema.org
 * Ejemplo: "Lunes a Viernes" → ["Monday","Tuesday","Wednesday","Thursday","Friday"]
 */
function parseDiasAtencion(diasStr: string): string[] {
  const lower = diasStr.toLowerCase();

  const diasMap: Record<string, string> = {
    lunes: 'Monday', martes: 'Tuesday', miércoles: 'Wednesday',
    miercoles: 'Wednesday', jueves: 'Thursday', viernes: 'Friday',
    sábado: 'Saturday', sabado: 'Saturday', domingo: 'Sunday',
  };

  // "Lunes a Viernes" → días entre lunes y viernes
  const rangoMatch = lower.match(/(\w+)\s+a\s+(\w+)/);
  if (rangoMatch) {
    const orden = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    const desde = rangoMatch[1].normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const hasta = rangoMatch[2].normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const idxDesde = orden.indexOf(desde);
    const idxHasta = orden.indexOf(hasta);
    if (idxDesde !== -1 && idxHasta !== -1) {
      return orden.slice(idxDesde, idxHasta + 1)
        .map(d => diasMap[d] || d);
    }
  }

  // Días individuales separados por coma
  return lower.split(/[,y]+/)
    .map(d => d.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
    .map(d => diasMap[d])
    .filter(Boolean);
}

/**
 * Construye los MenuItem para Schema.org
 */
function buildMenuItems(platos: ProductoElaborado[]) {
  return platos
    .filter(p => p.activo)
    .map(p => ({
      '@type': 'MenuItem',
      name: p.nombre,
      description: p.descripcion || undefined,
      offers: {
        '@type': 'Offer',
        price: Number(p.precio_venta).toFixed(2),
        priceCurrency: CURRENCY,
        availability: 'https://schema.org/InStock',
      },
      ...(p.imagen_url && !p.imagen_url.startsWith('/hero')
        ? { image: `${SITE_URL}${p.imagen_url}` }
        : {}),
    }));
}

/**
 * Construye los tipos de cocina a partir de las categorías activas
 */
function buildCuisines(platos: ProductoElaborado[]): string[] {
  const categorias = [...new Set(platos.filter(p => p.activo).map(p => p.categoria))];
  const cuisineMap: Record<string, string> = {
    Pokes: 'Hawaiian',
    Ensaladas: 'Salad',
    Bebidas: 'Beverages',
  };
  return [
    ...categorias.map(c => cuisineMap[c] || c),
    'Healthy',
    'Fresh',
  ].filter(Boolean);
}

/**
 * Construye el catálogo de productos de reventa (bebidas)
 */
function buildReventa(reventa: ProductoReventa[]) {
  if (!reventa.length) return undefined;
  return {
    '@type': 'OfferCatalog',
    name: 'Bebidas y Extras',
    itemListElement: reventa
      .filter(r => r.activo)
      .map(r => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Product',
          name: r.nombre,
          category: r.categoria || 'Bebidas',
        },
        price: Number(r.precio_venta).toFixed(2),
        priceCurrency: CURRENCY,
      })),
  };
}

export function useStructuredData({ tenant, marca, platos, reventa }: StructuredDataOptions) {
  useEffect(() => {
    if (!tenant || !marca || platos.length === 0) return;

    const horario = parseHorario(marca.horario_atencion);
    const dias = parseDiasAtencion(marca.dias_atencion);
    const menuItems = buildMenuItems(platos);
    const cuisines = buildCuisines(platos);
    const bebidasCatalog = buildReventa(reventa);

    // Determinar servicios habilitados dinámicamente desde la BD
    const amenityFeatures = [
      ...(marca.permite_delivery ? [{ '@type': 'LocationFeatureSpecification', name: 'Delivery a domicilio', value: true }] : []),
      ...(marca.permite_takeaway ? [{ '@type': 'LocationFeatureSpecification', name: 'Takeaway / Para llevar', value: true }] : []),
      ...(marca.permite_salon   ? [{ '@type': 'LocationFeatureSpecification', name: 'Comer en el lugar', value: true }] : []),
    ];

    // === Schema: Restaurant (menú completo, horarios, precios) ===
    const restaurantSchema = {
      '@context': 'https://schema.org',
      '@type': 'Restaurant',
      '@id': `${SITE_URL}/#restaurant`,
      name: marca.nombre || tenant.nombre,
      url: SITE_URL,
      image: `${SITE_URL}/Logo_nalu-sinfondo.png`,
      logo: `${SITE_URL}/Logo_nalu-sinfondo.png`,
      description:
        'Nalú Poke Bowls — Comida saludable, fresca y personalizada en Tacuarembó. ' +
        'Bowls a medida con proteínas premium, ingredientes frescos y bajas calorías.',
      telephone: tenant.telefono,
      email: tenant.email,
      address: {
        '@type': 'PostalAddress',
        streetAddress: tenant.direccion,
        addressLocality: 'Tacuarembó',
        addressCountry: 'UY',
      },
      servesCuisine: cuisines,
      priceRange: '$$',
      currenciesAccepted: CURRENCY,
      paymentAccepted: 'Efectivo, Tarjeta de crédito, Débito',

      // Horarios dinámicos desde la base de datos
      openingHoursSpecification: (dias.length > 0 && horario)
        ? dias.map(dia => ({
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: `https://schema.org/${dia}`,
            opens: horario.opens,
            closes: horario.closes,
          }))
        : undefined,

      // Menú dinámico con todos los platos y sus precios actuales
      hasMenu: {
        '@type': 'Menu',
        name: `Menú ${marca.nombre || 'Nalú'} — Actualizado`,
        hasMenuSection: [
          {
            '@type': 'MenuSection',
            name: 'Bowls, Pokes y Ensaladas',
            hasMenuItem: menuItems,
          },
        ],
      },

      // Catálogo de bebidas
      ...(bebidasCatalog ? { hasOfferCatalog: bebidasCatalog } : {}),

      // Servicios habilitados
      amenityFeature: amenityFeatures,

      // Timestamp de última actualización (sincronizado con la API)
      dateModified: new Date().toISOString(),
    };

    // === Schema: LocalBusiness (SEO local, Google Maps) ===
    const localBusinessSchema = {
      '@context': 'https://schema.org',
      '@type': ['FoodEstablishment', 'LocalBusiness'],
      name: marca.nombre || tenant.nombre,
      url: SITE_URL,
      telephone: tenant.telefono,
      address: {
        '@type': 'PostalAddress',
        streetAddress: tenant.direccion,
        addressLocality: 'Tacuarembó',
        addressRegion: 'Tacuarembó',
        addressCountry: 'UY',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: -31.7333,
        longitude: -55.9833,
      },
      // Formato corto de horarios (también dinámico)
      openingHours: (dias.length > 0 && horario)
        ? dias.map(d => `${d.slice(0, 2)} ${horario.opens}-${horario.closes}`)
        : undefined,
      amenityFeature: amenityFeatures,
    };

    // === Inyectar / actualizar en el <head> ===
    const SCRIPT_ID_RESTAURANT = 'nalu-schema-restaurant';
    const SCRIPT_ID_LOCAL_BIZ  = 'nalu-schema-localbusiness';

    const injectOrUpdate = (id: string, data: object) => {
      let el = document.getElementById(id) as HTMLScriptElement | null;
      if (!el) {
        el = document.createElement('script');
        el.id = id;
        el.type = 'application/ld+json';
        document.head.appendChild(el);
      }
      el.textContent = JSON.stringify(data, null, 2);
    };

    injectOrUpdate(SCRIPT_ID_RESTAURANT, restaurantSchema);
    injectOrUpdate(SCRIPT_ID_LOCAL_BIZ,  localBusinessSchema);

    // Cleanup al desmontar el componente
    return () => {
      [SCRIPT_ID_RESTAURANT, SCRIPT_ID_LOCAL_BIZ].forEach(id => {
        document.getElementById(id)?.remove();
      });
    };
  }, [tenant, marca, platos, reventa]);
}
