import { CartItem, ProductoElaborado, ProductoReventa, GrupoOpciones } from '../types/food';

declare const __APP_BUILD_TIME__: string;

const LAST_ACTIVE_KEY = 'nalu_last_active_time';
const UPDATE_ATTEMPT_KEY = 'nalu_update_attempt_v1';
const INACTIVITY_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutos de inactividad
const HARD_REFRESH_THRESHOLD_MS = 2 * 60 * 60 * 1000; // 2 horas (sesión abandonada)
const CHECK_COOLDOWN_MS = 10 * 1000;
const RETRY_SAME_BUILD_COOLDOWN_MS = 2 * 60 * 1000;

let inFlightVersionCheck: Promise<boolean> | null = null;
let lastCheckTimestamp = 0;
let reloadInProgress = false;

export function getCurrentBundleBuildTime(): number {
  try {
    return Number(__APP_BUILD_TIME__) || 0;
  } catch {
    return 0;
  }
}

export function isAppReloading(): boolean {
  return reloadInProgress;
}

export function cleanVersionQueryParam(): void {
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.has('_app_v')) {
      url.searchParams.delete('_app_v');
      const cleanUrl = url.pathname + (url.searchParams.toString() ? `?${url.searchParams.toString()}` : '') + url.hash;
      window.history.replaceState(null, '', cleanUrl || '/');
    }
  } catch {}
}

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

export async function purgeAllCachesAndServiceWorkers(unregisterSw = false): Promise<void> {
  console.warn('[CachePurge] Purgando Cache Storage y actualizando Service Worker...');

  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
      console.log('[CachePurge] Caches eliminados:', keys);
    } catch (e) {
      console.warn('[CachePurge] Error purgando Cache Storage:', e);
    }
  }

  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        if (unregisterSw) {
          await reg.unregister();
          console.log('[CachePurge] SW desregistrado:', reg.scope);
        } else {
          if (reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
          await reg.update().catch(() => {});
        }
      }
    } catch (e) {
      console.warn('[CachePurge] Error actualizando SW:', e);
    }
  }

  try {
    localStorage.removeItem('nalu_cached_catalog_v2');
    sessionStorage.removeItem('nalu_catalogo_cache_v3');
  } catch {}
}

function shouldSkipReloadForLoopGuard(remoteBuildTime: number): boolean {
  try {
    const raw = sessionStorage.getItem(UPDATE_ATTEMPT_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (
      Number(parsed?.buildTime) === remoteBuildTime &&
      Date.now() - Number(parsed?.attemptedAt || 0) < RETRY_SAME_BUILD_COOLDOWN_MS
    ) {
      return true;
    }
  } catch {}
  return false;
}

function markUpdateAttempt(remoteBuildTime: number): void {
  try {
    sessionStorage.setItem(
      UPDATE_ATTEMPT_KEY,
      JSON.stringify({ buildTime: remoteBuildTime, attemptedAt: Date.now() })
    );
  } catch {}
}

function reloadWithCacheBust(remoteBuildTime: number): void {
  if (reloadInProgress) return;
  reloadInProgress = true;

  try {
    const url = new URL(window.location.href);
    url.searchParams.set('_app_v', String(remoteBuildTime));
    window.location.replace(url.toString());
  } catch {
    window.location.reload();
  }
}

export async function checkAppVersionAndPurge(force = false): Promise<boolean> {
  if ((import.meta as any).env?.DEV) return false;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return false;
  if (reloadInProgress) return true;

  const now = Date.now();
  if (!force && now - lastCheckTimestamp < CHECK_COOLDOWN_MS) {
    return false;
  }

  if (inFlightVersionCheck) {
    return inFlightVersionCheck;
  }

  inFlightVersionCheck = (async () => {
    try {
      lastCheckTimestamp = Date.now();
      const res = await fetch(`/version.json?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });

      if (!res.ok) return false;

      const remote = await res.json();
      const remoteBuildTime = Number(remote?.buildTime || 0);
      const currentBundleBuildTime = getCurrentBundleBuildTime();

      if (!remoteBuildTime || !currentBundleBuildTime) {
        return false;
      }

      if (remoteBuildTime !== currentBundleBuildTime) {
        if (shouldSkipReloadForLoopGuard(remoteBuildTime)) {
          console.warn('[VersionCheck] Ya se intentó recargar para este build hace unos segundos; esperando propagación de CDN.');
          return false;
        }

        console.warn(
          `[VersionCheck] NUEVA VERSIÓN DETECTADA: Remota (${remoteBuildTime}) vs Bundle actual (${currentBundleBuildTime}). Actualizando PWA...`
        );

        markUpdateAttempt(remoteBuildTime);
        await purgeAllCachesAndServiceWorkers(false);
        reloadWithCacheBust(remoteBuildTime);
        return true;
      }
    } catch (err) {
      console.warn('[VersionCheck] No se pudo verificar version.json:', err);
    } finally {
      inFlightVersionCheck = null;
    }
    return false;
  })();

  return inFlightVersionCheck;
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
