import React, { useEffect, useRef } from 'react';

export interface GradientASCIIProps {
  colors?: string[];
  shape?: 'horizon' | 'radial' | 'sphere' | 'torus';
  characters?: string;
  cellSize?: number;
  density?: number;
  glyphOpacity?: number;
  glow?: number;
  depthOfField?: number;
  flicker?: number;
  softness?: number;
  scale?: number;
  flow?: number;
  speed?: number;
  gradientOpacity?: number;
  grain?: number;
  variation?: number;
  mouseInteraction?: boolean;
  scrambleRadius?: number;
  clickEffect?: 'wave' | 'pulse' | 'none';
  intro?: boolean;
  lightMode?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const GradientASCII: React.FC<GradientASCIIProps> = ({
  colors = ['#1e3fd8', '#f6f8ff', '#a5d8ff', '#38bdf8'],
  characters = ' =+xX0S8#@',
  cellSize = 18,
  glyphOpacity = 0.85,
  glow = 0.2,
  speed = 1,
  gradientOpacity = 0.9,
  mouseInteraction = true,
  clickEffect = 'wave',
  lightMode = false,
  className = '',
  style = {}
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let width = (canvas.width = container.clientWidth * dpr);
    let height = (canvas.height = container.clientHeight * dpr);

    const handleResize = () => {
      if (!container || !canvas) return;
      width = canvas.width = container.clientWidth * dpr;
      height = canvas.height = container.clientHeight * dpr;
    };

    window.addEventListener('resize', handleResize);

    const charList = characters.split('');
    const step = cellSize * dpr;

    let mouseX = width * 0.5;
    let mouseY = height * 0.35;
    let targetX = mouseX;
    let targetY = mouseY;

    // Click wave state
    const ripples: Array<{ x: number; y: number; radius: number; maxRadius: number; life: number }> = [];

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      targetX = (e.clientX - rect.left) * dpr;
      targetY = (e.clientY - rect.top) * dpr;
    };

    const handleClick = (e: MouseEvent) => {
      if (clickEffect === 'wave') {
        const rect = canvas.getBoundingClientRect();
        ripples.push({
          x: (e.clientX - rect.left) * dpr,
          y: (e.clientY - rect.top) * dpr,
          radius: 0,
          maxRadius: Math.max(width, height) * 0.5,
          life: 1
        });
      }
    };

    if (mouseInteraction) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      window.addEventListener('click', handleClick, { passive: true });
    }

    let t = 0;

    const render = () => {
      t += 0.015 * speed;

      mouseX += (targetX - mouseX) * 0.08;
      mouseY += (targetY - mouseY) * 0.08;

      ctx.clearRect(0, 0, width, height);

      // Advance ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += 8 * speed;
        r.life = 1 - r.radius / r.maxRadius;
        if (r.life <= 0) {
          ripples.splice(i, 1);
        }
      }

      const cols = Math.ceil(width / step) + 1;
      const rows = Math.ceil(height / step) + 1;

      ctx.font = `600 ${step * 0.85}px 'JetBrains Mono', monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const maxDist = Math.max(width, height) * 0.6;

      for (let r = 0; r < rows; r++) {
        const y = r * step + step / 2;
        for (let c = 0; c < cols; c++) {
          const x = c * step + step / 2;

          // Flow wave
          const wave = Math.sin(x * 0.003 + y * 0.002 + t) * 0.5 + 0.5;

          // Mouse proximity
          const dx = x - mouseX;
          const dy = y - mouseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const mouseFactor = Math.max(0, 1 - dist / maxDist);

          // Ripple modulation
          let rippleBoost = 0;
          for (const rip of ripples) {
            const rDist = Math.abs(Math.sqrt((x - rip.x) ** 2 + (y - rip.y) ** 2) - rip.radius);
            if (rDist < 60) {
              rippleBoost += (1 - rDist / 60) * rip.life * 0.5;
            }
          }

          const intensity = Math.min(1, Math.max(0, wave * 0.6 + mouseFactor * 0.5 + rippleBoost));
          const charIdx = Math.floor(intensity * (charList.length - 1));
          const char = charList[charIdx] || ' ';

          if (intensity > 0.05 && char.trim()) {
            // Sample color from palette
            const colorIdx = Math.min(colors.length - 1, Math.floor(intensity * colors.length));
            const baseColor = colors[colorIdx] || colors[0];

            ctx.globalAlpha = Math.min(1, intensity * glyphOpacity * gradientOpacity);
            ctx.fillStyle = baseColor;

            if (glow > 0) {
              ctx.shadowColor = baseColor;
              ctx.shadowBlur = glow * 12;
            } else {
              ctx.shadowBlur = 0;
            }

            ctx.fillText(char, x, y);
          }
        }
      }

      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mouseInteraction) {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('click', handleClick);
      }
      cancelAnimationFrame(animId);
    };
  }, [
    colors,
    characters,
    cellSize,
    glyphOpacity,
    glow,
    speed,
    gradientOpacity,
    mouseInteraction,
    clickEffect,
    lightMode
  ]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full relative overflow-hidden pointer-events-none select-none ${className}`}
      style={style}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};

export default GradientASCII;
