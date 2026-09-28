import React, { useEffect, useRef, useState } from 'react';
import { PLANET_14_NODES, PlanetNode } from '../templates/asciiModels';
import { theCaveScenario } from '../locations/theCave';
import { LocationScenario } from '../locations/types';

interface Props {
  onStartScenario: (scenario: LocationScenario) => void;
  onBackToMenuConfirmed: () => void;
}

export const PlanetMapScreen: React.FC<Props> = ({ onStartScenario, onBackToMenuConfirmed }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rotYRef = useRef<number>(0.4);
  const rotXRef = useRef<number>(0.15);
  const draggingRef = useRef<boolean>(false);
  const lastMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [activeCaveBriefing, setActiveCaveBriefing] = useState<boolean>(false);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);
  const [selectedNode, setSelectedNode] = useState<PlanetNode | null>(null);

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
        rotYRef.current += 0.0025;
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

      const cx = w * 0.58;
      const cy = h * 0.5;
      const R = Math.min(w, h) * 0.38;

      // Звезды
      ctx.fillStyle = '#7ec8ff';
      for (let i = 0; i < 80; i++) {
        const sx = hash(i, 1) * w;
        const sy = hash(i, 3) * h;
        const tw = 0.3 + 0.7 * Math.abs(Math.sin(performance.now() / 900 + i));
        ctx.globalAlpha = tw * 0.65;
        ctx.fillRect(sx, sy, i % 5 === 0 ? 2 : 1, i % 5 === 0 ? 2 : 1);
      }
      ctx.globalAlpha = 1;

      // Символьная планета с процедурными темно-синими материками
      const baseChars = '01#*+%:;.~';
      ctx.font = `${Math.max(6, Math.floor(R / 24))}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (let lat = -88; lat <= 88; lat += 6) {
        const step = Math.max(5, 7 / Math.cos((lat * Math.PI) / 180));
        for (let lon = 0; lon < 360; lon += step) {
          let [x, y, z] = latlon(lat, lon);
          [x, y, z] = rot3(x, y, z, rotXRef.current, rotYRef.current);
          if (z < 0) continue;

          const continentNoise = Math.sin(lat * 0.08) * Math.cos(lon * 0.08) + hash(lat, lon) * 0.4;
          const isContinent = continentNoise > 0.15;

          const ndot = x * 0.55 + y * 0.35 + z * 0.75;
          const bri = Math.max(0, Math.min(1, ndot * 0.7 + 0.25));
          const ci = Math.floor(bri * (baseChars.length - 1));
          const px = cx + x * R;
          const py = cy - y * R;

          if (isContinent) {
            ctx.fillStyle = `rgba(14, 38, 95, ${0.7 + bri * 0.3})`;
            ctx.fillText('#', px, py);
          } else {
            ctx.fillStyle = `rgba(0, 180, 240, ${0.2 + bri * 0.4})`;
            ctx.fillText(baseChars[ci], px, py);
          }
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
      ctx.setLineDash([3, 4]);
      PLANET_14_NODES.forEach((node) => {
        const a = proj[node.id];
        node.links.forEach((targetId) => {
          const b = proj[targetId];
          if (!b || (!a.front && !b.front)) return;

          ctx.strokeStyle = node.isUnlocked ? 'rgba(0, 255, 242, 0.7)' : 'rgba(60, 70, 120, 0.25)';
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
        const r = n.node.isUnlocked ? 8 + Math.sin(t) * 1.5 : 4;

        ctx.beginPath();
        ctx.arc(n.px, n.py, r, 0, Math.PI * 2);
        ctx.fillStyle = n.node.isUnlocked ? '#00fff2' : '#334155';
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.font = "8px 'Press Start 2P', monospace";
        ctx.fillStyle = n.node.isUnlocked ? '#00fff2' : '#64748b';
        ctx.fillText(n.node.isUnlocked ? `[1] ${n.node.name}` : `[${n.node.id + 1}]`, n.px, n.py - 12);
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
    const cx = rect.width * 0.58;
    const cy = rect.height * 0.5;
    const R = Math.min(rect.width, rect.height) * 0.38;

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
        if (node.id === 0) {
          setActiveCaveBriefing(true);
        } else {
          setSelectedNode(node);
        }
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

      {/* ОПИСАНИЕ ПЕЩЕРЫ: ЧИСТЫЙ ТЕКСТ БЕЗ РАМОК СВЕРХУ СЛЕВА */}
      {activeCaveBriefing && (
        <div style={{ position: 'absolute', top: 24, left: 24, zIndex: 10, maxWidth: '440px', pointerEvents: 'auto' }}>
          <div style={{ fontSize: '18px', color: '#00fff2', letterSpacing: '2px', textShadow: '0 0 10px #00fff2' }}>
            {theCaveScenario.name}
          </div>
          <div style={{ fontSize: '10px', color: '#c8f0ff', lineHeight: 1.8, marginTop: '10px' }}>
            {theCaveScenario.description}
          </div>
          <div style={{ marginTop: '16px', display: 'flex', gap: '14px' }}>
            <button
              onClick={() => onStartScenario(theCaveScenario)}
              style={{ background: 'transparent', border: 'none', color: '#39ff14', fontFamily: 'inherit', fontSize: '11px', cursor: 'pointer', padding: 0, textShadow: '0 0 8px #39ff14' }}
            >
              [ ВОЙТИ В СЕКТОР ]
            </button>
            <button
              onClick={() => setActiveCaveBriefing(false)}
              style={{ background: 'transparent', border: 'none', color: '#64748b', fontFamily: 'inherit', fontSize: '11px', cursor: 'pointer', padding: 0 }}
            >
              [ ОТМЕНА ]
            </button>
          </div>
        </div>
      )}

      {/* КНОПКА ВЫХОДА В МЕНЮ */}
      <div style={{ position: 'absolute', top: 16, right: 16 }}>
        <button
          onClick={() => setShowExitConfirm(true)}
          style={{ background: 'transparent', border: 'none', color: '#00fff2', fontFamily: 'inherit', fontSize: '9px', cursor: 'pointer' }}
        >
          [ ВЫЙТИ В МЕНЮ ]
        </button>
      </div>

      {/* ЗАКРЫТЫЕ СЕКТОРЫ */}
      {selectedNode && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ maxWidth: '420px', color: '#ef4444', textAlign: 'center', lineHeight: 1.8 }}>
            <div style={{ fontSize: '12px', marginBottom: '8px' }}>[{selectedNode.name.toUpperCase()}]</div>
            <div style={{ fontSize: '9px', color: '#94a3b8' }}>СЕКТОР ЗАБЛОКИРОВАН. СНАЧАЛА ПРОЙДИТЕ ПЕЩЕРУ.</div>
            <button
              onClick={() => setSelectedNode(null)}
              style={{ marginTop: '14px', background: 'transparent', border: 'none', color: '#00fff2', fontFamily: 'inherit', fontSize: '9px', cursor: 'pointer' }}
            >
              [ ЗАКРЫТЬ ]
            </button>
          </div>
        </div>
      )}

      {/* ПОДТВЕРЖДЕНИЕ ВЫХОДА */}
      {showExitConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center' }}>
            <div style={{ fontSize: '11px', color: '#ff2233', marginBottom: '4px' }}>ВЫЙТИ В ГЛАВНОЕ МЕНЮ?</div>
            <button
              onClick={onBackToMenuConfirmed}
              style={{ background: 'transparent', border: 'none', color: '#ff2233', fontFamily: 'inherit', fontSize: '10px', cursor: 'pointer' }}
            >
              [ ПОДТВЕРДИТЬ ]
            </button>
            <button
              onClick={() => setShowExitConfirm(false)}
              style={{ background: 'transparent', border: 'none', color: '#00fff2', fontFamily: 'inherit', fontSize: '10px', cursor: 'pointer' }}
            >
              [ ВЕРНУТЬСЯ ]
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
