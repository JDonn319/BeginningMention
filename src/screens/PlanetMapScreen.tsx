import React, { useEffect, useRef, useState } from 'react';
import { PLANET_14_NODES, PlanetNode } from '../templates/asciiModels';

interface Props {
  onBackToMenuConfirmed: () => void;
}

export const PlanetMapScreen: React.FC<Props> = ({ onBackToMenuConfirmed }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rotYRef = useRef<number>(0.35);
  const rotXRef = useRef<number>(0.12);
  const draggingRef = useRef<boolean>(false);
  const lastMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [selectedNode, setSelectedNode] = useState<PlanetNode | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);

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
      const cy = h * 0.5;
      const R = Math.min(w, h) * 0.36;

      // Звезды
      ctx.fillStyle = '#7ec8ff';
      for (let i = 0; i < 75; i++) {
        const sx = hash(i, 1) * w;
        const sy = hash(i, 3) * h;
        const tw = 0.4 + 0.6 * Math.abs(Math.sin(performance.now() / 800 + i));
        ctx.globalAlpha = tw * 0.7;
        ctx.fillRect(sx, sy, i % 6 === 0 ? 2 : 1, i % 6 === 0 ? 2 : 1);
      }
      ctx.globalAlpha = 1;

      // 3D-сфера из символов
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
          const ndot = x * 0.55 + y * 0.35 + z * 0.75;
          const bri = Math.max(0, Math.min(1, ndot * 0.7 + 0.25));
          const ci = Math.floor(bri * (chars.length - 1));
          const px = cx + x * R;
          const py = cy - y * R;

          ctx.fillStyle = land
            ? `rgba(0, ${Math.floor(180 + bri * 75)}, ${Math.floor(200 + bri * 40)}, ${0.55 + bri * 0.45})`
            : `rgba(40, ${Math.floor(80 + bri * 80)}, ${Math.floor(160 + bri * 80)}, ${0.35 + bri * 0.5})`;

          ctx.fillText(land ? chars[Math.min(chars.length - 1, ci + 3)] : chars[ci], px, py);
        }
      }

      // Проекция нод
      const proj = PLANET_14_NODES.map((node) => {
        let [x, y, z] = latlon(node.lat, node.lon);
        [x, y, z] = rot3(x, y, z, rotXRef.current, rotYRef.current);
        return {
          node,
          px: cx + x * R * 1.02,
          py: cy - y * R * 1.02,
          front: z > 0.05
        };
      });

      // Пунктирные связующие линии
      ctx.setLineDash([3, 5]);
      PLANET_14_NODES.forEach((node) => {
        const a = proj[node.id];
        node.links.forEach((targetId) => {
          const b = proj[targetId];
          if (!b || (!a.front && !b.front)) return;

          ctx.strokeStyle = node.isUnlocked ? 'rgba(0, 255, 242, 0.65)' : 'rgba(80, 80, 140, 0.25)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(a.px, a.py);
          ctx.lineTo(b.px, b.py);
          ctx.stroke();
        });
      });
      ctx.setLineDash([]);

      // Отрисовка нод
      const t = performance.now() / 400;
      proj.forEach((n) => {
        if (!n.front) return;
        const r = n.node.isUnlocked ? 8 + Math.sin(t + n.node.id) * 1.5 : 5;

        ctx.beginPath();
        ctx.arc(n.px, n.py, r, 0, Math.PI * 2);
        ctx.fillStyle = n.node.isUnlocked ? '#00fff2' : '#334155';
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.font = "8px 'Press Start 2P', monospace";
        ctx.fillStyle = n.node.isUnlocked ? '#00fff2' : '#64748b';
        ctx.fillText(n.node.isUnlocked ? `[1] ${n.node.name}` : `[${n.node.id + 1}]`, n.px, n.py - 14);
      });

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, []);

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
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = rect.width * 0.5;
    const cy = rect.height * 0.5;
    const R = Math.min(rect.width, rect.height) * 0.36;

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

    PLANET_14_NODES.forEach((node) => {
      let [x, y, z] = latlon(node.lat, node.lon);
      [x, y, z] = rot3(x, y, z, rotXRef.current, rotYRef.current);
      if (z < 0.05) return;
      const px = cx + x * R * 1.02;
      const py = cy - y * R * 1.02;

      const dist = Math.hypot(e.clientX - rect.left - px, e.clientY - rect.top - py);
      if (dist < 26) {
        setSelectedNode(node);
      }
    });
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#020010', overflow: 'hidden', fontFamily: "'Press Start 2P', monospace" }}>
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
      />

      <div style={{ position: 'absolute', top: 14, right: 16 }}>
        <button
          onClick={() => setShowExitConfirm(true)}
          style={{ background: 'transparent', border: '1px solid #00fff2', color: '#00fff2', fontFamily: 'inherit', fontSize: '9px', padding: '8px 14px', cursor: 'pointer' }}
        >
          [ ВЫЙТИ В МЕНЮ ]
        </button>
      </div>

      {selectedNode && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ width: '100%', maxWidth: '460px', background: '#020010', border: '2px solid #00fff2', padding: '18px', boxSizing: 'border-box' }}>
            <div style={{ fontSize: '10px', color: '#00fff2', marginBottom: '8px' }}>
              +-----------------------------------------+<br />
              | СЕКТОР: {selectedNode.name.toUpperCase()}<br />
              +-----------------------------------------+
            </div>
            <div style={{ fontSize: '9px', color: selectedNode.isUnlocked ? '#39ff14' : '#ef4444', margin: '14px 0', lineHeight: 1.6 }}>
              {selectedNode.isUnlocked ? (
                <>
                  СТАТУС: [ ВХОД ЗАПЕЧАТАН ]<br />
                  СЮЖЕТ И БОСС НАХОДЯТСЯ В РАЗРАБОТКЕ.
                </>
              ) : (
                <>
                  СТАТУС: [ СЕКТОР ЗАБЛОКИРОВАН ]<br />
                  ТРЕБУЕТСЯ ЗАЧИСТКА ПРЕДЫДУЩИХ ЗОН.
                </>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedNode(null)}
                style={{ background: 'transparent', border: '1px solid #00fff2', color: '#00fff2', fontFamily: 'inherit', fontSize: '9px', padding: '8px 16px', cursor: 'pointer' }}
              >
                [ ЗАКРЫТЬ ]
              </button>
            </div>
          </div>
        </div>
      )}

      {showExitConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ width: '100%', maxWidth: '420px', background: '#020010', border: '2px solid #ff0055', padding: '18px', boxSizing: 'border-box', textAlign: 'center' }}>
            <div style={{ fontSize: '9px', color: '#ff0055', marginBottom: '14px' }}>
              +---------------------------------------+<br />
              |       ВЫХОД В ГЛАВНОЕ МЕНЮ?           |<br />
              +---------------------------------------+
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
              <button
                onClick={onBackToMenuConfirmed}
                style={{ width: '220px', background: 'rgba(255,0,85,0.2)', border: '1px solid #ff0055', color: '#ff0055', fontFamily: 'inherit', fontSize: '9px', padding: '10px', cursor: 'pointer' }}
              >
                [ ПОДТВЕРДИТЬ ]
              </button>
              <button
                onClick={() => setShowExitConfirm(false)}
                style={{ width: '220px', background: 'transparent', border: '1px solid #00fff2', color: '#00fff2', fontFamily: 'inherit', fontSize: '9px', padding: '10px', cursor: 'pointer' }}
              >
                [ ВЕРНУТЬСЯ ]
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
