/**
 * Utilidad para retroalimentación háptica en dispositivos móviles táctiles
 */
export const triggerHaptic = (type: 'light' | 'medium' | 'success' = 'light') => {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      if (type === 'light') {
        navigator.vibrate(12);
      } else if (type === 'medium') {
        navigator.vibrate(25);
      } else if (type === 'success') {
        navigator.vibrate([15, 35, 20]);
      }
    } catch {
      // Silencioso en navegadores sin soporte o permisos
    }
  }
};
