export interface TenantInfo {
  tenant_id: number;
  nombre: string;
  rut?: string;
  direccion: string;
  telefono: string;
  fecha_nacimiento?: string;
  email?: string;
}

export interface MarcaInfo {
  marca_id: number;
  nombre: string;
  color_primario: string;
  dias_atencion: string;
  horario_atencion: string;
  permite_salon: boolean;
  permite_delivery: boolean;
  permite_takeaway: boolean;
  logo_url?: string;
}

export interface InsumoReceta {
  insumo_id: number;
  nombre: string;
  cantidad: number;
  unidad: string;
  costo_unitario?: number;
  imagen_url?: string | null;
}

export interface OpcionPersonalizacion {
  opcion_id: number;
  nombre: string;
  precio_extra: number;
  costo_extra?: number;
  cantidad_insumo?: number;
  unidad_insumo?: string;
  imagen_url?: string | null;
}

export interface GrupoOpciones {
  grupo_id: number;
  producto_elaborado_id: number;
  marca_id?: number | null;
  nombre: string;
  paso_orden: number;
  min_opciones: number;
  max_opciones: number;
  peso_porcion_gramos?: number | null;
  activo?: boolean;
  opciones: OpcionPersonalizacion[];
}

export interface ProductoElaborado {
  producto_elaborado_id: number;
  tenant_id: number;
  marca_id?: number | null;
  nombre: string;
  categoria: string;
  descripcion?: string | null;
  precio_venta: number;
  es_personalizable: boolean;
  formato_venta?: string;
  imagen_url?: string | null;
  activo: boolean;
  marca_nombre?: string;
  insumos_receta?: InsumoReceta[];
}

export interface ProductoReventa {
  producto_reventa_id: number;
  tenant_id: number;
  marca_id?: number | null;
  nombre: string;
  categoria: string;
  descripcion?: string | null;
  precio_venta: number;
  stock_actual: number;
  imagen_url?: string | null;
  activo: boolean;
  sin_stock?: boolean;
}

export interface CartItemModifier {
  opcion_id: number;
  nombre: string;
  precio_extra: number;
  grupo_nombre?: string;
}

export interface CartItem {
  id: string; // unique cart uuid
  producto_id: number;
  tipo: 'elaborado' | 'reventa';
  nombre: string;
  categoria: string;
  precio_base: number;
  precio_unitario: number; // base + sum(modificadores)
  cantidad: number;
  imagen_url?: string | null;
  modificadores: CartItemModifier[];
  notas?: string;
}

export interface OrderCustomerInfo {
  nombre: string;
  email?: string;
  telefono: string;
  tipo_entrega: 'delivery' | 'takeaway';
  direccion?: string;
  apartamento?: string;
  google_maps_url?: string;
  latitud?: number;
  longitud?: number;
  referencia?: string;
  metodo_pago: 'efectivo' | 'transferencia' | 'tarjeta' | 'pos_tarjeta';
  paga_con?: string;
  notas_generales?: string;
}
