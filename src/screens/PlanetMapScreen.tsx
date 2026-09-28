import React, { useEffect, useRef } from 'react';
import { PLANET_LEVELS } from '../templates/asciiModels';

interface Props {
  completedNodeIds: number[];
  unlockedNodeIds: number[];
  onSelectNode: (nodeId: number) => void;
  onOpenSquad: () => void;
  onBackToMenu: () => void;
}

export const PlanetMapScreen: React.FC<Props> = ({
  completedNodeIds,
  unlockedNodeIds,
  onSelectNode,
  onOpenSquad,
  onBackToMenu
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rotYRef = useRef<number>(0.35);
  const rotXRef = useRef<number>(0.15);
  const draggingRef = useRef<boolean>(false);
  const lastMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const rot3 = (x: number, y: number, z: number, rx: number, ry: number) => {
      const cy = Math.cos(ry), sy = Math.sin(ry);
      let xz = x * cy - z * sy, zz = x * sy + z * cy;
      const cx = Math.cos(rx), sx = Math.sin(rx);
      let yz = y * cx - zz * sx, z2 = y * sx + zz * cx;
      return [xz, yz, z2];
    };

    const latlon = (lat: number, lon: number) => {
      const la = (lat * Math.PI) / 180, lo = (lon * Math.PI) / 180;
      return [Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo)];
    };

    const render = () => {
      if (!draggingRef.current) {
        rotYRef.current += 0.003;
      }

      const w = window.innerWidth;
      const h = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }
      ctx.resetTransform();
      ctx.scale(dpr, dpr);

      ctx.fillStyle = '#020010';
      ctx.fillRect(0, 0, w, h);

      const cx = w * 0.5;
      const cy = h * 0.52;
      const R = Math.min(w, h) * 0.35;

      // 3D Сфера планеты из символов
      const chars = ' .,:;+*?%S#@';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (let lat = -90; lat <= 90; lat += 8) {
        const step = Math.max(6, 8 / Math.cos((lat * Math.PI) / 180));
        for (let lon = 0; lon < 360; lon += step) {
          let [x, y, z] = latlon(lat, lon);
          [x, y, z] = rot3(x, y, z, rotXRef.current, rotYRef.current);
          if (z < 0) continue;

          const ndot = x * 0.55 + y * 0.35 + z * 0.75;
          const bri = Math.max(0, Math.min(1, ndot * 0.7 + 0.25));
          const ci = Math.floor(bri * (chars.length - 1));
          const px = cx + x * R;
          const py = cy - y * R;

          ctx.fillStyle = `rgba(0, ${Math.floor(180 + bri * 75)}, ${Math.floor(200 + bri * 40)}, ${0.4 + bri * 0.6})`;
          ctx.fillText(chars[ci], px, py);
        }
      }

      // Ноды секторов
      PLANET_LEVELS.forEach((lvl) => {
        let [x, y, z] = latlon(lvl.lat, lvl.lon);
        [x, y, z] = rot3(x, y, z, rotXRef.current, rotYRef.current);
        if (z < 0.05) return;

        const px = cx + x * R * 1.05;
        const py = cy - y * R * 1.05;
        const isUnlocked = unlockedNodeIds.includes(lvl.id);
        const isDone = completedNodeIds.includes(lvl.id);

        ctx.beginPath();
        ctx.arc(px, py, isUnlocked ? 9 : 6, 0, Math.PI * 2);
        ctx.fillStyle = isDone ? '#39ff14' : isUnlocked ? lvl.color : '#334155';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = isUnlocked ? 14 : 0;
        ctx.fill();
        ctx.shadowBlur = 0;

        if (isUnlocked) {
          ctx.font = "8px 'Press Start 2P', monospace";
          ctx.fillStyle = '#ffffff';
          ctx.fillText(isDone ? '✓' : String(lvl.id + 1), px, py);

          ctx.fillStyle = lvl.color;
          ctx.fillText(lvl.name, px, py - 14);
        }
      });

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [completedNodeIds, unlockedNodeIds]);

  const handlePointerDown = (e: React.PointerEvent) => {
    draggingRef.current = true;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - lastMouseRef.current.x;
    const dy = e.clientY - lastMouseRef.current.y;
    rotYRef.current += dx * 0.007;
    rotXRef.current = Math.max(-1.1, Math.min(1.1, rotXRef.current + dy * 0.006));
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    draggingRef.current = false;
    // Клик по ноде
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = rect.width * 0.5;
    const cy = rect.height * 0.52;
    const R = Math.min(rect.width, rect.height) * 0.35;

    const rot3 = (x: number, y: number, z: number, rx: number, ry: number) => {
      const cy1 = Math.cos(ry), sy1 = Math.sin(ry);
      let xz = x * cy1 - z * sy1, zz = x * sy1 + z * cy1;
      const cx1 = Math.cos(rx), sx1 = Math.sin(rx);
      let yz = y * cx1 - zz * sx1, z2 = y * sx1 + zz * cx1;
      return [xz, yz, z2];
    };
    const latlon = (lat: number, lon: number) => {
      const la = (lat * Math.PI) / 180, lo = (lon * Math.PI) / 180;
      return [Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo)];
    };

    PLANET_LEVELS.forEach((lvl) => {
      let [x, y, z] = latlon(lvl.lat, lvl.lon);
      [x, y, z] = rot3(x, y, z, rotXRef.current, rotYRef.current);
      if (z < 0.05) return;
      const px = cx + x * R * 1.05;
      const py = cy - y * R * 1.05;

      const dist = Math.hypot(e.clientX - rect.left - px, e.clientY - rect.top - py);
      if (dist < 24 && unlockedNodeIds.includes(lvl.id)) {
        onSelectNode(lvl.id);
      }
    });
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#020010', overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
      />

      <div style={{ position: 'absolute', top: 12, left: 16, right: 16, display: 'flex', justifyContent: 'space-between', pointerEvents: 'none' }}>
        <div style={{ background: 'rgba(2,0,20,0.85)', border: '1px solid #00fff2', padding: '8px 14px', pointerEvents: 'auto' }}>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '10px', color: '#00fff2' }}>
            [ AXION-7 // 3D КАРТА СЕКТОРОВ ]
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
            ВРАЩАЙТЕ ПЛАНЕТУ ПАЛЬЦЕМ // ВЫБЕРИТЕ СВЕТЯЩУЮСЯ НОДУ
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', pointerEvents: 'auto' }}>
          <button
            onClick={onOpenSquad}
            style={{ background: 'rgba(0,255,242,0.1)', border: '1px solid #00fff2', color: '#00fff2', fontFamily: "'Press Start 2P', monospace", fontSize: '9px', padding: '8px 12px', cursor: 'pointer' }}
          >
            [ ОТРЯД ]
          </button>
          <button
            onClick={onBackToMenu}
            style={{ background: 'transparent', border: '1px solid #64748b', color: '#94a3b8', fontFamily: "'Press Start 2P', monospace", fontSize: '9px', padding: '8px 12px', cursor: 'pointer' }}
          >
            [ МЕНЮ ]
          </button>
        </div>
      </div>
    </div>
  );
};
