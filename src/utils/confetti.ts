// Micro-utilidad de confeti visual de alto rendimiento (Canvas 2D nativo, 0 dependencias)
// Brinda feedback celebratorio instantáneo en la confirmación de pedidos.

export function launchConfetti(durationMs = 1500) {
  if (typeof window === 'undefined') return;

  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '99999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }

  const width = (canvas.width = window.innerWidth);
  const height = (canvas.height = window.innerHeight);

  const colors = ['#1F9D55', '#10B981', '#F59E0B', '#FF5A36', '#3B82F6', '#EC4899', '#8B5CF6'];
  const particleCount = 75;

  interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    w: number;
    h: number;
    color: string;
    rotation: number;
    vRotation: number;
    opacity: number;
  }

  const particles: Particle[] = [];
  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI - Math.PI / 2; // Arriba
    const speed = 7 + Math.random() * 9;
    particles.push({
      x: width * 0.5 + (Math.random() - 0.5) * 100,
      y: height * 0.45,
      vx: Math.sin(angle) * speed * (Math.random() > 0.5 ? 1 : -1),
      vy: -Math.cos(angle) * speed - 2,
      w: 8 + Math.random() * 8,
      h: 6 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      vRotation: (Math.random() - 0.5) * 15,
      opacity: 1,
    });
  }

  const startTime = Date.now();

  function animate() {
    if (!ctx) return;
    const elapsed = Date.now() - startTime;
    const progress = elapsed / durationMs;

    ctx.clearRect(0, 0, width, height);

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35; // Gravedad
      p.vx *= 0.98; // Resistencia del aire
      p.rotation += p.vRotation;

      if (progress > 0.6) {
        p.opacity = Math.max(0, 1 - (progress - 0.6) / 0.4);
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }

    if (elapsed < durationMs) {
      requestAnimationFrame(animate);
    } else {
      canvas.remove();
    }
  }

  requestAnimationFrame(animate);
}

