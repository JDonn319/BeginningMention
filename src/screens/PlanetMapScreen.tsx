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
  const rotXRef = useRef<number>(0.12);
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

    const hash = (a: number, b: number) => Math.abs(Math.sin(a * 12.9898 + b * 78.233) * 43758.5453) % 1;

    const render = () => {
      if (!draggingRef.current) {
        rotYRef.current += 0.0035;
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
      const cy = h * 0.48;
      const R = Math.min(w, h) * 0.34;

      // 1. Звезды космоса
      ctx.fillStyle = '#7ec8ff';
      for (let i = 0; i < 70; i++) {
        const sx = hash(i, 1) * w;
        const sy = hash(i, 3) * h;
        const tw = 0.4 + 0.6 * Math.abs(Math.sin(performance.now() / 800 + i));
        ctx.globalAlpha = tw * 0.7;
        ctx.fillRect(sx, sy, i % 7 === 0 ? 2 : 1, i % 7 === 0 ? 2 : 1);
      }
      ctx.globalAlpha = 1;

      // 2. Атмосферное свечение
      const g = ctx.createRadialGradient(cx - R * 0.2, cy - R * 0.25, R * 0.2, cx, cy, R * 1.25);
      g.addColorStop(0, 'rgba(0, 255, 242, 0.18)');
      g.addColorStop(0.55, 'rgba(80, 40, 180, 0.12)');
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.22, 0, Math.PI * 2);
      ctx.fill();

      // 3. Тело сферы планеты
      ctx.fillStyle = '#050018';
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();

      const chars = ' .,:;+*?%S#@';
      ctx.font = `${Math.max(7, Math.floor(R / 22))}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (let lat = -90; lat <= 90; lat += 8) {
        const step = Math.max(6, 8 / Math.cos((lat * Math.PI) / 180));
        for (let lon = 0; lon < 360; lon += step) {
          let [x, y, z] = latlon(lat, lon);
          [x, y, z] = rot3(x, y, z, rotXRef.current, rotYRef.current);
          if (z < 0) continue;

          const land = hash(lat, lon) > 0.62;
          const ice = Math.abs(lat) > 68;
          const ndot = x * 0.55 + y * 0.35 + z * 0.75;
          const bri = Math.max(0, Math.min(1, ndot * 0.7 + 0.25));
          const ci = Math.floor(bri * (chars.length - 1));
          const px = cx + x * R;
          const py = cy - y * R;

          if (ice) ctx.fillStyle = `rgba(180,240,255,${0.4 + bri * 0.6})`;
          else if (land) ctx.fillStyle = `rgba(0, ${Math.floor(180 + bri * 75)}, ${Math.floor(200 + bri * 40)}, ${0.55 + bri * 0.45})`;
          else ctx.fillStyle = `rgba(40, ${Math.floor(80 + bri * 80)}, ${Math.floor(160 + bri * 80)}, ${0.35 + bri * 0.5})`;

          ctx.fillText(land ? chars[Math.min(chars.length - 1, ci + 3)] : chars[ci], px, py);
        }
      }

      // 4. Орбитальное кольцо из символов
      for (let a = 0; a < Math.PI * 2; a += 0.05) {
        let rx = Math.cos(a) * 1.55, ry = Math.sin(a) * 0.08, rz = Math.sin(a) * 1.55 * 0.42;
        [rx, ry, rz] = rot3(rx, ry, rz, rotXRef.current * 0.4, rotYRef.current);
        if (rz < -0.05) continue;
        const px = cx + rx * R, py = cy - ry * R;
        ctx.globalAlpha = 0.25 + rz * 0.4;
        ctx.fillStyle = a % 0.2 < 0.1 ? '#ff2d95' : '#00fff2';
        ctx.fillText(a % 0.3 < 0.1 ? '·' : '+', px, py);
      }
      ctx.globalAlpha = 1;

      // 5. Проекция нод уровней
      const proj = PLANET_LEVELS.map((lvl) => {
        let [x, y, z] = latlon(lvl.lat, lvl.lon);
        [x, y, z] = rot3(x, y, z, rotXRef.current, rotYRef.current);
        return {
          lvl,
          px: cx + x * R * 1.02,
          py: cy - y * R * 1.02,
          front: z > 0.05
        };
      });

      // 6. ПУНКТИРНЫЕ ЛИНИИ ПУТЕЙ МЕЖДУ НОДАМИ (ВОССТАНОВЛЕНО!)
      ctx.setLineDash([3, 5]);
      PLANET_LEVELS.forEach((lvl) => {
        const a = proj[lvl.id];
        lvl.links.forEach((k) => {
          const b = proj[k];
          if (!b || (!a.front && !b.front)) return;

          const done = completedNodeIds.includes(lvl.id) && completedNodeIds.includes(k);
          const open = unlockedNodeIds.includes(lvl.id) || unlockedNodeIds.includes(k);

          ctx.strokeStyle = done ? 'rgba(57, 255, 20, 0.8)' : open ? 'rgba(0, 255, 242, 0.7)' : 'rgba(80, 80, 140, 0.25)';
          ctx.lineWidth = done ? 2 : 1.2;
          ctx.beginPath();
          ctx.moveTo(a.px, a.py);
          ctx.lineTo(b.px, b.py);
          ctx.stroke();
        });
      });
      ctx.setLineDash([]);

      // 7. Отрисовка самих нод
      const t = performance.now() / 400;
      proj.forEach((n) => {
        if (!n.front) return;
        const isUnlocked = unlockedNodeIds.includes(n.lvl.id);
        const isDone = completedNodeIds.includes(n.lvl.id);
        const r = isUnlocked ? 8 + Math.sin(t + n.lvl.id) * 1.5 : 5;

        ctx.beginPath();
        ctx.arc(n.px, n.py, r + 4, 0, Math.PI * 2);
        ctx.fillStyle = isDone ? 'rgba(57,255,20,0.15)' : isUnlocked ? 'rgba(0,255,242,0.18)' : 'rgba(80,80,120,0.12)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(n.px, n.py, r, 0, Math.PI * 2);
        ctx.fillStyle = isDone ? '#39ff14' : isUnlocked ? n.lvl.color : '#334155';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = isUnlocked ? 16 : 0;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();

        if (isUnlocked) {
          ctx.font = "9px 'Press Start 2P', monospace";
          ctx.fillStyle = '#ffffff';
          ctx.fillText(isDone ? '✓' : String(n.lvl.id + 1), n.px, n.py + 3);

          ctx.font = "8px 'Press Start 2P', monospace";
          ctx.fillStyle = n.lvl.color;
          ctx.fillText(n.lvl.name, n.px, n.py - 16);
        }
      });

      // 8. Орбитальный спутник
      const sat = performance.now() / 900;
      let sx = Math.cos(sat) * 1.7, sy = Math.sin(sat * 0.7) * 0.5, sz = Math.sin(sat) * 1.7;
      [sx, sy, sz] = rot3(sx, sy, sz, 0.2, rotYRef.current * 0.3);
      if (sz > 0) {
        ctx.fillStyle = '#ff2d95';
        ctx.fillText('[o]', cx + sx * R, cy - sy * R);
      }

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
    rotYRef.current += dx * 0.008;
    rotXRef.current = Math.max(-1.1, Math.min(1.1, rotXRef.current + dy * 0.006));
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    draggingRef.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = rect.width * 0.5;
    const cy = rect.height * 0.48;
    const R = Math.min(rect.width, rect.height) * 0.34;

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
      const px = cx + x * R * 1.02;
      const py = cy - y * R * 1.02;

      const dist = Math.hypot(e.clientX - rect.left - px, e.clientY - rect.top - py);
      if (dist < 26 && unlockedNodeIds.includes(lvl.id)) {
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
