import React, { useEffect, useRef, useState } from 'react';
import { TREE_TEMPLATES, GROUND_STAMPS } from '../templates/asciiModels';

interface Props {
  onStartNewGame: () => void;
}

export const MainMenuScreen: React.FC<Props> = ({ onStartNewGame }) => {
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let tick = 0;

    const render = () => {
      tick++;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }
      ctx.resetTransform();
      ctx.scale(dpr, dpr);

      ctx.fillStyle = '#01040a';
      ctx.fillRect(0, 0, w, h);

      const CELL_W = w / 100;
      const CELL_H = h / 42;
      ctx.font = `${Math.floor(CELL_H * 0.95)}px monospace`;
      ctx.textBaseline = 'top';

      // Небо и мерцающие звезды
      for (let r = 0; r < 20; r++) {
        for (let c = 0; c < 100; c += 2) {
          if ((c * 23 + r * 67) % 100 < 4) {
            ctx.fillStyle = `rgba(180, 220, 255, ${0.08 + Math.sin(tick * 0.04 + c) * 0.04})`;
            ctx.fillText('.', c * CELL_W, r * CELL_H);
          }
        }
      }

      // Луна
      ctx.fillStyle = '#e0f2fe';
      ['  .---.  ', ' /     \\ ', '|  (o)  |', ' \\     / ', "  '---'  "].forEach((l, i) => {
        ctx.fillText(l, 86 * CELL_W, (3 + i) * CELL_H);
      });

      // Дальние ели
      for (let c = 4; c < 94; c += 16) {
        const tree = TREE_TEMPLATES[c % 2];
        ctx.fillStyle = '#0b192e';
        tree.forEach((line, li) => ctx.fillText(line, c * CELL_W, (21 - tree.length + li) * CELL_H));
      }

      // Синеватый рельеф земли из символов
      for (let c = 0; c < 100; c++) {
        const gStart = Math.floor(21 + Math.sin(c * 0.1) * 2);
        for (let r = gStart; r < 42; r++) {
          const depth = r - gStart;
          ctx.fillStyle = depth === 0 ? '#1e3a6a' : '#081120';
          ctx.fillText(GROUND_STAMPS[0][c % GROUND_STAMPS[0].length], c * CELL_W, r * CELL_H);
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#01040a', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />

      <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <img
          src="/basiclogo.png"
          alt="BeginningMention"
          style={{ maxHeight: '180px', marginBottom: '24px', filter: 'drop-shadow(0 0 25px rgba(0,255,242,0.4))' }}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />

        <div style={{ width: '100vw', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div
            onClick={onStartNewGame}
            onPointerEnter={() => setSelectedIdx(0)}
            style={{
              width: '100%',
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontFamily: "'Press Start 2P', monospace",
              fontSize: '12px',
              color: '#00fff2',
              background: selectedIdx === 0 ? 'rgba(0,255,242,0.18)' : 'transparent',
              boxShadow: selectedIdx === 0 ? 'inset 0 0 15px rgba(0,255,242,0.15)' : 'none'
            }}
          >
            {selectedIdx === 0 ? '> НОВАЯ ЭКСПЕДИЦИЯ' : '  НОВАЯ ЭКСПЕДИЦИЯ'}
          </div>

          <div
            style={{
              width: '100%',
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'not-allowed',
              fontFamily: "'Press Start 2P', monospace",
              fontSize: '12px',
              color: '#475569'
            }}
          >
            ЗАГРУЗКИ (LOCKED)
          </div>
        </div>
      </div>
    </div>
  );
};
