import { useEffect, useRef } from 'react';

export function TacticalBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Seeded RNG for deterministic random numbers
    let seed = 1337;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    let animationId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    const hexSize = 40;
    const hexHeight = hexSize * Math.sqrt(3);

    interface Node {
      x: number;
      y: number;
      pulse: number;
      pulseSpeed: number;
      delay: number;
      baseAlpha: number;
      radiusOffset: number;
      hasGlow: boolean;
    }

    const nodes: Node[] = [];
    const cols = Math.ceil(canvas.width / (hexSize * 1.5)) + 1;
    const rows = Math.ceil(canvas.height / hexHeight) + 1;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * hexSize * 1.5;
        const y = row * hexHeight + (col % 2 === 1 ? hexHeight / 2 : 0);
        nodes.push({
          x,
          y,
          pulse: rand() * Math.PI * 2,
          pulseSpeed: 0.028 + rand() * 0.03,
          delay: rand() * 200,
          baseAlpha: 0.05 + rand() * 0.18,
          radiusOffset: rand() * 1.5,
          hasGlow: rand() < 0.2
        });
      }
    }

    const drawHexagon = (x: number, y: number, size: number, alpha: number) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const hx = x + size * Math.cos(angle);
        const hy = y + size * Math.sin(angle);
        i === 0 ? ctx.moveTo(hx, hy) : ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.strokeStyle = `rgba(255, 70, 85, ${alpha})`;
      ctx.stroke();
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      nodes.forEach((node) => {
        node.pulse += node.pulseSpeed;
        const alpha = 0.04 + Math.sin(node.pulse) * 0.03;
        drawHexagon(node.x, node.y, hexSize * 0.9, alpha);
      });

      // Draw glowing node pulses (hex intersections)
      nodes.forEach((node) => {
        if (!node.hasGlow) return;

        const time = node.pulse * 1.15 + node.delay * 0.01;
        const pulse = (Math.sin(time) + 1) / 2;

        const alpha = node.baseAlpha + pulse * 0.22;
        const radius = 1.2 + pulse * 1.6 + node.radiusOffset;

        // Core dot
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 70, 85, ${alpha})`;
        ctx.fill();

        // Glow bloom
        const glow = ctx.createRadialGradient(
          node.x,
          node.y,
          0,
          node.x,
          node.y,
          10
        );
        glow.addColorStop(0, `rgba(255, 70, 85, ${alpha * 0.6})`);
        glow.addColorStop(1, 'rgba(255, 70, 85, 0)');

        ctx.beginPath();
        ctx.arc(node.x, node.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
      });

      animationId = requestAnimationFrame(draw);
    };

    animationId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ background: 'hsl(var(--background))' }}
    />
  );
}
