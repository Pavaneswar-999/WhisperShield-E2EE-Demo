import React, { useEffect, useRef } from 'react';

export interface PatternWavesProps {
  preset?: string;
  color?: string;
  backgroundColor?: string;
  fade?: 'edges' | 'top' | 'bottom' | 'none';
  interactive?: boolean;
  cursorSize?: number;
  cursorStrength?: number;
  pattern?: 'dot' | 'cross' | 'char';
  wave?: 'silk' | 'sine' | 'fluid';
  spacing?: number;
  markSize?: number;
  depth?: number;
  light?: number;
  shine?: number;
  contrast?: number;
  speed?: number;
  scale?: number;
  direction?: number;
  opacity?: number;
  fadeSize?: number;
  characters?: string;
  intro?: boolean;
  paused?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const PatternWaves: React.FC<PatternWavesProps> = ({
  color = '#ffffff',
  backgroundColor = '#120f17',
  fade = 'edges',
  interactive = true,
  cursorSize = 50,
  cursorStrength = 0.6,
  pattern = 'dot',
  spacing = 10,
  markSize = 0.95,
  depth = 0.95,
  shine = 0.8,
  contrast = 1.2,
  speed = 0.35,
  scale = 1,
  direction = 20,
  opacity = 1,
  fadeSize = 0.5,
  characters = '.:-=+*#%@',
  paused = false,
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

    // Mouse coordinates
    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetMouseX = mouseX;
    let targetMouseY = mouseY;
    let isHovered = false;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      targetMouseX = (e.clientX - rect.left) * dpr;
      targetMouseY = (e.clientY - rect.top) * dpr;
      isHovered = true;
    };

    const handleMouseLeave = () => {
      isHovered = false;
    };

    if (interactive) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      window.addEventListener('mouseleave', handleMouseLeave);
    }

    let t = 0;
    const dirRad = (direction * Math.PI) / 180;
    const cosDir = Math.cos(dirRad);
    const sinDir = Math.sin(dirRad);

    const charList = characters.split('');

    const render = () => {
      if (!paused) {
        t += 0.02 * speed;
      }

      // Smooth mouse lerping
      mouseX += (targetMouseX - mouseX) * 0.08;
      mouseY += (targetMouseY - mouseY) * 0.08;

      // Fill background
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);

      const step = spacing * dpr * scale;
      const cols = Math.ceil(width / step) + 2;
      const rows = Math.ceil(height / step) + 2;

      const curRadius = cursorSize * dpr * 2;

      for (let r = -1; r < rows; r++) {
        const y = r * step;
        for (let c = -1; c < cols; c++) {
          const x = c * step;

          // Silk Wave equation: multi-frequency sinusoidal displacement
          const nx = (x * cosDir - y * sinDir) * 0.004;
          const ny = (x * sinDir + y * cosDir) * 0.004;

          const wave1 = Math.sin(nx * 1.5 + t);
          const wave2 = Math.cos(ny * 2.2 - t * 0.8);
          const wave3 = Math.sin((nx + ny) * 1.8 + t * 1.2);
          let w = (wave1 + wave2 + wave3) / 3;

          // Interactive mouse displacement ripple
          if (interactive && isHovered) {
            const dx = x - mouseX;
            const dy = y - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < curRadius) {
              const influence = Math.cos((dist / curRadius) * Math.PI * 0.5);
              w += influence * cursorStrength * 0.6;
            }
          }

          // Depth and shine normalization (0 to 1)
          const normW = Math.max(0, Math.min(1, (w * depth + 1) * 0.5));
          const lum = Math.pow(normW, contrast) * shine;

          // Edge fade calculation
          let edgeFade = 1;
          if (fade === 'edges') {
            const edgeDistX = Math.min(x, width - x) / (width * fadeSize * 0.5);
            const edgeDistY = Math.min(y, height - y) / (height * fadeSize * 0.5);
            edgeFade = Math.min(1, Math.max(0, edgeDistX)) * Math.min(1, Math.max(0, edgeDistY));
          }

          const alpha = lum * opacity * edgeFade;

          if (alpha > 0.02) {
            ctx.fillStyle = color;
            ctx.globalAlpha = Math.min(1, alpha);

            if (pattern === 'dot') {
              const rDot = Math.max(0.8, (step * 0.28 * markSize) * normW);
              ctx.beginPath();
              ctx.arc(x, y, rDot, 0, Math.PI * 2);
              ctx.fill();
            } else if (pattern === 'cross') {
              const arm = Math.max(1.5, (step * 0.22 * markSize) * normW);
              ctx.lineWidth = Math.max(1, 1.2 * dpr);
              ctx.strokeStyle = color;
              ctx.beginPath();
              ctx.moveTo(x - arm, y);
              ctx.lineTo(x + arm, y);
              ctx.moveTo(x, y - arm);
              ctx.lineTo(x, y + arm);
              ctx.stroke();
            } else if (pattern === 'char') {
              const charIdx = Math.floor(normW * (charList.length - 1));
              ctx.font = `${Math.max(8, step * 0.8 * markSize)}px monospace`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(charList[charIdx] || '.', x, y);
            }
          }
        }
      }

      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (interactive) {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseleave', handleMouseLeave);
      }
      cancelAnimationFrame(animId);
    };
  }, [
    color,
    backgroundColor,
    fade,
    interactive,
    cursorSize,
    cursorStrength,
    pattern,
    spacing,
    markSize,
    depth,
    shine,
    contrast,
    speed,
    scale,
    direction,
    opacity,
    fadeSize,
    characters,
    paused
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

export default PatternWaves;
