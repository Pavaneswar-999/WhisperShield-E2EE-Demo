import React, { useEffect, useRef, useState, useMemo } from 'react';

export interface TextPressureProps {
  text?: string;
  flex?: boolean;
  alpha?: boolean;
  stroke?: boolean;
  width?: boolean;
  weight?: boolean;
  italic?: boolean;
  radius?: number;
  smoothing?: number;
  idle?: 'wave' | 'pulse' | 'none';
  idleSpeed?: number;
  clickRipple?: boolean;
  strokeColor?: string;
  strokeWidth?: number;
  minFontSize?: number;
  scale?: boolean;
  textColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const TextPressure: React.FC<TextPressureProps> = ({
  text = 'Hello!',
  flex = true,
  alpha = false,
  stroke = false,
  width = true,
  weight = true,
  italic = true,
  radius = 0.5,
  smoothing = 0.5,
  idle = 'wave',
  idleSpeed = 1,
  clickRipple = true,
  strokeColor = '#60899B',
  strokeWidth = 2,
  minFontSize = 36,
  scale = false,
  textColor,
  className = '',
  style = {}
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const spansRef = useRef<(HTMLSpanElement | null)[]>([]);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; radius: number; maxRadius: number; life: number }>>([]);

  const characters = useMemo(() => text.split(''), [text]);

  // Click ripple handler
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!clickRipple || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRipples((prev) => [
      ...prev,
      { x, y, radius: 0, maxRadius: Math.max(rect.width, rect.height) * 0.8, life: 1 }
    ]);
  };

  useEffect(() => {
    let animId: number;
    let t = 0;

    const updateChars = () => {
      t += 0.03 * idleSpeed;

      // Advance ripples
      if (ripples.length > 0) {
        setRipples((prev) =>
          prev
            .map((r) => ({
              ...r,
              radius: r.radius + 12 * idleSpeed,
              life: 1 - r.radius / r.maxRadius
            }))
            .filter((r) => r.life > 0)
        );
      }

      if (!containerRef.current) {
        animId = requestAnimationFrame(updateChars);
        return;
      }

      const rect = containerRef.current.getBoundingClientRect();
      const maxDistance = Math.max(rect.width, rect.height) * radius;

      spansRef.current.forEach((span, index) => {
        if (!span) return;

        const charRect = span.getBoundingClientRect();
        const charCenterX = charRect.left + charRect.width / 2 - rect.left;
        const charCenterY = charRect.top + charRect.height / 2 - rect.top;

        let pressure = 0;

        // 1. Mouse distance pressure
        if (mousePos && isHovered) {
          const dx = mousePos.x - charCenterX;
          const dy = mousePos.y - charCenterY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDistance) {
            const norm = 1 - dist / maxDistance;
            pressure = Math.pow(norm, 1 / (smoothing + 0.1));
          }
        }

        // 2. Idle Wave pressure
        if (idle === 'wave') {
          const wavePhase = t + index * 0.45;
          const waveVal = (Math.sin(wavePhase) + 1) * 0.5;
          pressure = Math.max(pressure, waveVal * 0.65);
        } else if (idle === 'pulse') {
          const pulseVal = (Math.sin(t * 1.5) + 1) * 0.5;
          pressure = Math.max(pressure, pulseVal * 0.7);
        }

        // 3. Ripple shockwave boost
        for (const rip of ripples) {
          const rDx = rip.x - charCenterX;
          const rDy = rip.y - charCenterY;
          const rDist = Math.sqrt(rDx * rDx + rDy * rDy);
          const diff = Math.abs(rDist - rip.radius);
          if (diff < 80) {
            const boost = (1 - diff / 80) * rip.life * 0.9;
            pressure = Math.min(1, pressure + boost);
          }
        }

        // Calculate typography parameters
        const wght = weight ? Math.round(200 + pressure * 700) : 400; // 200 to 900
        const wdth = width ? 1 + pressure * 0.35 : 1;
        const slant = italic ? -pressure * 14 : 0; // -14deg slant on pressure
        const charScale = scale ? 1 + pressure * 0.15 : 1;
        const charAlpha = alpha ? 0.35 + pressure * 0.65 : 1;

        span.style.fontWeight = `${wght}`;
        span.style.fontVariationSettings = `'wght' ${wght}, 'wdth' ${Math.round(wdth * 100)}`;
        span.style.transform = `scale3d(${charScale * wdth}, ${charScale}, 1) skewX(${slant}deg)`;
        span.style.opacity = `${charAlpha}`;

        if (stroke) {
          span.style.webkitTextStroke = `${strokeWidth}px ${strokeColor}`;
        }
      });

      animId = requestAnimationFrame(updateChars);
    };

    animId = requestAnimationFrame(updateChars);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [
    characters,
    mousePos,
    isHovered,
    ripples,
    radius,
    smoothing,
    idle,
    idleSpeed,
    weight,
    width,
    italic,
    scale,
    alpha,
    stroke,
    strokeColor,
    strokeWidth
  ]);

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      onMouseMove={(e) => {
        if (!containerRef.current) return;
        const r = containerRef.current.getBoundingClientRect();
        setMousePos({ x: e.clientX - r.left, y: e.clientY - r.top });
        setIsHovered(true);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setMousePos(null);
      }}
      className={`relative select-none cursor-pointer flex items-center ${
        flex ? 'justify-between w-full' : 'justify-center inline-flex'
      } ${className}`}
      style={{
        minHeight: `${minFontSize * 1.5}px`,
        color: textColor || 'currentColor',
        ...style
      }}
    >
      {characters.map((char, i) => (
        <span
          key={i}
          ref={(el) => {
            spansRef.current[i] = el;
          }}
          className="inline-block transition-transform duration-75 will-change-transform font-sans"
          style={{
            fontSize: `clamp(${minFontSize}px, 6vw, ${minFontSize * 2.2}px)`,
            lineHeight: 1,
            margin: char === ' ' ? '0 0.25em' : '0 0.015em',
            display: 'inline-block'
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </div>
  );
};

export default TextPressure;