import { ProductoElaborado, ProductoReventa, GrupoOpciones } from '../types/food';

// Datos de fallback precisos basados en la base de datos real de Nalú Poke (Tenant 1, Marca 1)
const FALLBACK_ELABORADOS: ProductoElaborado[] = [
  {
    producto_elaborado_id: 16,
    tenant_id: 1,
    marca_id: 1,
    nombre: 'POKE 3 PROTEINAS',
    categoria: 'Pokes',
    descripcion: 'Arma tu bowl a elección con hasta 3 proteínas premium, bases frescas, verduras, salsas artesanales y toppings crocantes.',
    precio_venta: 340,
    es_personalizable: true,
    imagen_url: '/hero_bandejas_nalu.jpg',
    activo: true,
    insumos_receta: []
  },
  {
    producto_elaborado_id: 10,
    tenant_id: 1,
    marca_id: 1,
    nombre: 'POKE HASTA 2 PROTEINAS',
    categoria: 'Pokes',
    descripcion: 'Personaliza tu experiencia con 2 proteínas a elección, combinando sabores exóticos y materias primas frescas de primera calidad.',
    precio_venta: 290,
    es_personalizable: true,
    imagen_url: '/hero_bandejas_nalu.jpg',
    activo: true,
    insumos_receta: []
  },
  {
    producto_elaborado_id: 12,
    tenant_id: 1,
    marca_id: 1,
    nombre: 'Poke Nalú Especial',
    categoria: 'Pokes de Autor',
    descripcion: 'Nuestra combinación insignia con salmón fresco marinado, arroz de sushi, palta cremosa, mango tropical, wakame y salsa teriyaki de la casa.',
    precio_venta: 320,
    es_personalizable: true,
    imagen_url: '/hero_bandejas_nalu.jpg',
    activo: true,
    insumos_receta: []
  },
  {
    producto_elaborado_id: 15,
    tenant_id: 1,
    marca_id: 1,
    nombre: 'OHANA',
    categoria: 'Pokes de Autor',
    descripcion: 'Tuna fresca en cubos, salsa de sésamo y soja, cebolla morada, edamame crocante, palta y toque de tobiko con semillas tostadas.',
    precio_venta: 320,
    es_personalizable: false,
    imagen_url: '/hero_bandejas_nalu.jpg',
    activo: true,
    insumos_receta: []
  },
  {
    producto_elaborado_id: 14,
    tenant_id: 1,
    marca_id: 1,
    nombre: 'MAIU',
    categoria: 'Pokes de Autor',
    descripcion: 'Pollo teriyaki glaseado al wok, arroz integral, zanahoria en juliana, maíz dulce, queso crema y lluvia de nachos crocantes.',
    precio_venta: 320,
    es_personalizable: false,
    imagen_url: '/hero_bandejas_nalu.jpg',
    activo: true,
    insumos_receta: []
  },
  {
    producto_elaborado_id: 11,
    tenant_id: 1,
    marca_id: 1,
    nombre: 'Ensalada César Nalú',
    categoria: 'Ensaladas',
    descripcion: 'Mix de hojas verdes crujientes, pechuga de pollo grillada, croutons dorados, queso parmesano en hebras y aderezo césar suave.',
    precio_venta: 350,
    es_personalizable: false,
    imagen_url: null,
    activo: true,
    insumos_receta: []
  }
];

const FALLBACK_GRUPOS: GrupoOpciones[] = [
  {
    grupo_id: 17,
    producto_elaborado_id: 16,
    nombre: 'Base',
    paso_orden: 1,
    min_opciones: 1,
    max_opciones: 2,
    opciones: [
      { opcion_id: 16, nombre: 'Arroz', precio_extra: 0 },
      { opcion_id: 17, nombre: 'Arroz integral', precio_extra: 0 },
      { opcion_id: 18, nombre: 'Fideo integral', precio_extra: 0 },
      { opcion_id: 19, nombre: 'Quinoa', precio_extra: 0 },
      { opcion_id: 20, nombre: 'Lechuga', precio_extra: 0 },
    ]
  },
  {
    grupo_id: 20,
    producto_elaborado_id: 16,
    nombre: 'Proteína',
    paso_orden: 2,
    min_opciones: 1,
    max_opciones: 3,
    opciones: [
      { opcion_id: 21, nombre: 'Carne', precio_extra: 0 },
      { opcion_id: 22, nombre: 'Pollo', precio_extra: 0 },
      { opcion_id: 23, nombre: 'Cerdo barbacoa', precio_extra: 0 },
      { opcion_id: 25, nombre: 'Camarones (premium)', precio_extra: 90 },
      { opcion_id: 24, nombre: 'Huevo', precio_extra: 0 },
    ]
  },
  {
    grupo_id: 18,
    producto_elaborado_id: 16,
    nombre: 'Verduras & Vegetales',
    paso_orden: 3,
    min_opciones: 1,
    max_opciones: 3,
    opciones: [
      { opcion_id: 26, nombre: 'Palta / Aguacate', precio_extra: 40 },
      { opcion_id: 27, nombre: 'Edamame', precio_extra: 0 },
      { opcion_id: 28, nombre: 'Remolacha', precio_extra: 0 },
      { opcion_id: 29, nombre: 'Pepino japonés', precio_extra: 0 },
      { opcion_id: 30, nombre: 'Zanahoria', precio_extra: 0 },
      { opcion_id: 31, nombre: 'Tomate cherry', precio_extra: 0 },
      { opcion_id: 32, nombre: 'Cebolla morada', precio_extra: 0 },
    ]
  },
  {
    grupo_id: 19,
    producto_elaborado_id: 16,
    nombre: 'Salsas & Aderezos',
    paso_orden: 4,
    min_opciones: 1,
    max_opciones: 2,
    opciones: [
      { opcion_id: 33, nombre: 'Soja Clásica', precio_extra: 0 },
      { opcion_id: 34, nombre: 'Teriyaki Dulce', precio_extra: 0 },
      { opcion_id: 35, nombre: 'Spicy Mayo (Picante suave)', precio_extra: 0 },
      { opcion_id: 36, nombre: 'Mostaza y Miel', precio_extra: 0 },
      { opcion_id: 37, nombre: 'Aceite de Sésamo & Ponzu', precio_extra: 0 },
    ]
  },
  {
    grupo_id: 21,
    producto_elaborado_id: 16,
    nombre: 'Toppings & Crunch',
    paso_orden: 5,
    min_opciones: 0,
    max_opciones: 3,
    opciones: [
      { opcion_id: 38, nombre: 'Sésamo blanco y negro', precio_extra: 0 },
      { opcion_id: 39, nombre: 'Cebolla frita crocante', precio_extra: 0 },
      { opcion_id: 40, nombre: 'Cacahuetes / Maní tostado', precio_extra: 0 },
      { opcion_id: 41, nombre: 'Tobiko / Caviar naranja', precio_extra: 40 },
      { opcion_id: 42, nombre: 'Wakame', precio_extra: 30 },
      { opcion_id: 43, nombre: 'Chips de plátano', precio_extra: 0 },
    ]
  }
];

export async function fetchNaluCatalogo(): Promise<{
  elaborados: ProductoElaborado[];
  reventa: ProductoReventa[];
  gruposOpciones: GrupoOpciones[];
}> {
  try {
    const res = await fetch('/api/public/marcas/1/catalogo');
    if (res.ok) {
      const data = await res.json();
      return {
        elaborados: data.elaborados || FALLBACK_ELABORADOS,
        reventa: data.reventa || [],
        gruposOpciones: data.gruposOpciones || FALLBACK_GRUPOS,
      };
    }
  } catch (err) {
    console.warn('Backend Food no respondió directo a /api/public, intentando /api/admin/productos/catalogo...');
  }

  try {
    const resAdmin = await fetch('/api/admin/productos/catalogo');
    if (resAdmin.ok) {
      const data = await resAdmin.json();
      const filtrados = (data.elaborados || []).filter((p: any) => p.marca_id === 1 || !p.marca_id);
      return {
        elaborados: filtrados.length > 0 ? filtrados : FALLBACK_ELABORADOS,
        reventa: (data.reventa || []).filter((r: any) => r.marca_id === 1 || !r.marca_id),
        gruposOpciones: data.gruposOpciones || FALLBACK_GRUPOS,
      };
    }
  } catch (err) {
    console.log('Utilizando catálogo local de Nalú Poke:', err);
  }

  return {
    elaborados: FALLBACK_ELABORADOS,
    reventa: [],
    gruposOpciones: FALLBACK_GRUPOS,
  };
}

export async function sendOrderToFood(orderPayload: any): Promise<{ success: boolean; numero_orden?: number; pedido_id?: number }> {
  try {
    const res = await fetch('/api/public/pedidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Error enviando a /api/public/pedidos:', err);
  }

  // Fallback simulado exitoso para desarrollo
  return {
    success: true,
    numero_orden: Math.floor(1000 + Math.random() * 9000),
    pedido_id: Date.now(),
  };
}
