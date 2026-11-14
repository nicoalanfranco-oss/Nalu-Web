import { CartItem, ProductoElaborado, ProductoReventa, GrupoOpciones } from '../types/food';

const LOCAL_BUILD_TIME_KEY = 'nalu_client_app_build_time';
const LOCAL_VERSION_KEY = 'nalu_client_app_version';
const LAST_ACTIVE_KEY = 'nalu_last_active_time';
const INACTIVITY_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutos de inactividad
const HARD_REFRESH_THRESHOLD_MS = 2 * 60 * 60 * 1000; // 2 horas (sesión abandonada)

export function recordUserActivity() {
  try {
    localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
  } catch {}
}

export function checkInactivityState(): { isStale: boolean; shouldHardReload: boolean; minutesIdle: number } {
  try {
    const raw = localStorage.getItem(LAST_ACTIVE_KEY);
    if (!raw) {
      recordUserActivity();
      return { isStale: false, shouldHardReload: false, minutesIdle: 0 };
    }
    const lastActive = Number(raw);
    const idleMs = Date.now() - lastActive;
    const minutesIdle = Math.round(idleMs / (1000 * 60));

    return {
      isStale: idleMs > INACTIVITY_THRESHOLD_MS,
      shouldHardReload: idleMs > HARD_REFRESH_THRESHOLD_MS,
      minutesIdle,
    };
  } catch {
    return { isStale: false, shouldHardReload: false, minutesIdle: 0 };
  }
}

export async function purgeAllCachesAndServiceWorkers(): Promise<void> {
  console.warn('[CachePurge] Ejecutando purga total de Service Workers y Cache Storage...');

  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        await reg.unregister();
        console.log('[CachePurge] SW desregistrado:', reg.scope);
      }
    } catch (e) {
      console.warn('[CachePurge] Error desregistrando SW:', e);
    }
  }

  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
      console.log('[CachePurge] Caches eliminados:', keys);
    } catch (e) {
      console.warn('[CachePurge] Error purgando Cache Storage:', e);
    }
  }

  try {
    localStorage.removeItem('nalu_cached_catalog_v2');
    sessionStorage.clear();
  } catch {}
}

export async function checkAppVersionAndPurge(): Promise<boolean> {
  try {
    const timestamp = Date.now();
    const res = await fetch(`/version.json?_t=${timestamp}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
    });

    if (!res.ok) return false;

    const remote = await res.json();
    const remoteBuildTime = Number(remote.buildTime || 0);
    const remoteVersion = String(remote.version || '1.0.0');

    const localBuildTime = Number(localStorage.getItem(LOCAL_BUILD_TIME_KEY) || 0);
    const localVersion = localStorage.getItem(LOCAL_VERSION_KEY);

    if (!localBuildTime || !localVersion) {
      localStorage.setItem(LOCAL_BUILD_TIME_KEY, String(remoteBuildTime));
      localStorage.setItem(LOCAL_VERSION_KEY, remoteVersion);
      return false;
    }

    if (remoteBuildTime > localBuildTime || (remoteVersion && remoteVersion !== localVersion)) {
      console.warn(`[VersionCheck] NUEVA VERSIÓN DETECTADA: Remota ${remoteVersion} (${remoteBuildTime}) vs Local ${localVersion} (${localBuildTime}). Actualizando app...`);

      await purgeAllCachesAndServiceWorkers();

      localStorage.setItem(LOCAL_BUILD_TIME_KEY, String(remoteBuildTime));
      localStorage.setItem(LOCAL_VERSION_KEY, remoteVersion);

      window.location.reload();
      return true;
    }
  } catch (err) {
    console.warn('[VersionCheck] No se pudo verificar version.json:', err);
  }
  return false;
}

export function sanitizeCartItems(
  cart: CartItem[],
  platos: ProductoElaborado[],
  reventa: ProductoReventa[],
  grupos: GrupoOpciones[] = []
): { validCart: CartItem[]; removedCount: number; removedNames: string[] } {
  if (!cart || cart.length === 0) {
    return { validCart: [], removedCount: 0, removedNames: [] };
  }

  if (platos.length === 0 && reventa.length === 0) {
    return { validCart: cart, removedCount: 0, removedNames: [] };
  }

  const removedNames: string[] = [];

  const validCart = cart.filter(item => {
    if (item.tipo === 'elaborado') {
      const matchPlato = platos.find(p => p.producto_elaborado_id === item.producto_id && p.activo !== false);
      if (!matchPlato) {
        removedNames.push(item.nombre);
        return false;
      }
      return true;
    } else if (item.tipo === 'reventa') {
      const matchReventa = reventa.find(r => r.producto_reventa_id === item.producto_id && r.activo !== false && !r.sin_stock);
      if (!matchReventa) {
        removedNames.push(item.nombre);
        return false;
      }
      return true;
    }
    return true;
  });

  return {
    validCart,
    removedCount: cart.length - validCart.length,
    removedNames,
  };
}

