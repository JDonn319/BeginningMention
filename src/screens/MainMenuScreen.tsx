import React, { useEffect, useRef, useState } from 'react';

// ==========================================
// ШАБЛОНЫ ОКРУЖЕНИЯ (TEMPLATES)
// ==========================================

// Силуэты башен и шпилей далекого королевства на горизонте
const KINGDOM_SPIRES = [
  '     /\\                 /\\                        /\\                 ',
  '    /  \\      /|\\      /  \\       |\\  /|         /  \\      /|\\       ',
  '   / /\\ \\    / | \\    / /\\ \\     /  \\/  \\       / /\\ \\    / | \\      ',
  '  | [  ] |  | [ ] |  | [  ] |   | [][][] |     | [  ] |  | [ ] |     ',
  '  |      |--|     |--|      |---|        |-----|      |--|     |---- '
];

// 3 типа хвойных деревьев
const TREE_TEMPLATES = [
  // Тип 1: Высокая ель
  [
    '   /\\   ',
    '  /**\\  ',
    ' /****\\ ',
    '/******\\',
    '  ||||  '
  ],
  // Тип 2: Широкая сосна
  [
    '    /\\    ',
    '   //\\\\   ',
    '  ///\\\\\\  ',
    ' ////\\\\\\\\ ',
    '    ||    '
  ],
  // Тип 3: Редкая ель
  [
    '   |^|   ',
    '  /|+|\\  ',
    ' /++|++\\ ',
    '   |||   '
  ]
];

// Паттерны слоев земли
const GROUND_STAMPS = [
  '~^~..~~~=~=~..~~~^~...~~~~=~~~..~~~^~..~~~=~=~',
  '#%##%#%%##%%###%%%##%#%%%###%%##%%####%%#%##%#',
  '##############################################',
  '++===++---===+++===---===+++++===---===+++++++'
];

export const MainMenuScreen: React.FC = () => {
  const [screen, setScreen] = useState<'MENU' | 'GAME'>('MENU');
  const [fadeOpacity, setFadeOpacity] = useState<number>(0);
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [hasSave] = useState<boolean>(() => !!localStorage.getItem('bm_save'));

  const menuCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Плавный переход в кат-сцену
  const handleStartGame = () => {
    setFadeOpacity(1);
    setTimeout(() => {
      setScreen('GAME');
      setTimeout(() => {
        setFadeOpacity(0);
      }, 1400); // 1.4 секунды абсолютной темноты
    }, 900);
  };

  // ==========================================
  // РЕНДЕР ГЛАВНОГО МЕНЮ
  // ==========================================
  useEffect(() => {
    if (screen !== 'MENU') return;
    const canvas = menuCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let tick = 0;
    const CELL_W = 10;
    const CELL_H = 14;

    const renderMenu = () => {
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

      const cols = Math.ceil(w / CELL_W);
      const rows = Math.ceil(h / CELL_H);
      ctx.font = `${CELL_H}px "Fira Code", monospace`;
      ctx.textBaseline = 'top';

      // 1. НЕБО И ЗВЕЗДЫ
      for (let r = 0; r < Math.floor(rows * 0.5); r++) {
        for (let c = 0; c < cols; c++) {
          const seed = (c * 23 + r * 67) % 100;
          if (seed < 4) {
            const tw = Math.sin(tick * 0.04 + c + r) * 0.04;
            ctx.fillStyle = `rgba(180, 220, 255, ${0.08 + tw})`;
            ctx.fillText('.', c * CELL_W, r * CELL_H);
          } else if (seed === 5) {
            ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
            ctx.fillText('+', c * CELL_W, r * CELL_H);
          }
        }
      }

      // ЛУНА
      const moonCol = cols - 14;
      const moon = ['  .---.  ', ' /     \\ ', '|  (o)  |', ' \\     / ', "  '---'  "];
      ctx.fillStyle = '#e0f2fe';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 15;
      moon.forEach((l, i) => ctx.fillText(l, moonCol * CELL_W, (3 + i) * CELL_H));
      ctx.shadowBlur = 0;

      // 2. ДАЛЬНИЕ ЕЛИ НА ГОРИЗОНТЕ (50% экрана)
      const horizonRow = Math.floor(rows * 0.48);
      for (let c = 2; c < cols - 8; c += 14) {
        const tree = TREE_TEMPLATES[c % 3];
        ctx.fillStyle = '#0b192e';
        tree.forEach((line, li) => {
          ctx.fillText(line, c * CELL_W, (horizonRow - tree.length + li) * CELL_H);
        });
      }

      // 3. МЯГКИЙ РЕЛЬЕФ ЗЕМЛИ (БЕЗ ЯДОВИТО-СИНЕГО КОНТУРА)
      for (let c = 0; c < cols; c++) {
        const groundStart = Math.floor(
          rows * 0.5 + Math.sin(c * 0.12) * 1.5 + Math.cos(c * 0.04) * 2
        );

        for (let r = groundStart; r < rows; r++) {
          const depth = r - groundStart;
          let ch = '#';
          let color = '#091325';

          // Мягкий гармоничный переход от приглушенно-синего в глубокий ночной цвет
          if (depth === 0) {
            ch = GROUND_STAMPS[0][c % GROUND_STAMPS[0].length];
            color = '#1e3a6a'; // Спокойный сумеречный синий
          } else if (depth === 1) {
            ch = GROUND_STAMPS[1][c % GROUND_STAMPS[1].length];
            color = '#172d54';
          } else if (depth < 4) {
            ch = GROUND_STAMPS[2][c % GROUND_STAMPS[2].length];
            color = '#10203d';
          } else {
            ch = GROUND_STAMPS[3][c % GROUND_STAMPS[3].length];
            color = '#081120';
          }

          ctx.fillStyle = color;
          ctx.fillText(ch, c * CELL_W, r * CELL_H);
        }
      }

      animId = requestAnimationFrame(renderMenu);
    };

    renderMenu();
    return () => cancelAnimationFrame(animId);
  }, [screen]);

  // ==========================================
  // РЕНДЕР КАТ-СЦЕНЫ В ИГРЕ (БЕЗ ИНТЕРФЕЙСА)
  // ==========================================
  useEffect(() => {
    if (screen !== 'GAME') return;
    const canvas = gameCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let tick = 0;

    const CELL_W = 13;
    const CELL_H = 18;

    const renderGameCutscene = () => {
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

      ctx.fillStyle = '#010309';
      ctx.fillRect(0, 0, w, h);

      const cols = Math.ceil(w / CELL_W);
      const rows = Math.ceil(h / CELL_H);
      ctx.font = `${CELL_H}px "Fira Code", monospace`;
      ctx.textBaseline = 'top';

      const fireCol = Math.floor(cols / 2);
      const groundRow = Math.floor(rows * 0.72);
      const fireRow = groundRow - 1;

      // Теплый свет костра
      const fireLight = 20 + Math.sin(tick * 0.05) * 2;

      // 1. НЕБО С ТИХИМИ ЗВЕЗДАМИ
      for (let r = 0; r < Math.floor(rows * 0.5); r++) {
        for (let c = 0; c < cols; c++) {
          const seed = (c * 17 + r * 53) % 100;
          if (seed < 3) {
            const tw = Math.sin(tick * 0.03 + c + r) * 0.05;
            ctx.fillStyle = `rgba(160, 200, 255, ${0.1 + tw})`;
            ctx.fillText('.', c * CELL_W, r * CELL_H);
          }
        }
      }

      // 2. ДАЛЕКОЕ КОРОЛЕВСТВО (ШПИЛИ И ВЕРХУШКИ БАШЕН НА ГОРИЗОНТЕ)
      const kingdomRow = groundRow - 11;
      for (let rep = 0; rep < cols; rep += KINGDOM_SPIRES[0].length) {
        KINGDOM_SPIRES.forEach((line, li) => {
          for (let ci = 0; ci < line.length; ci++) {
            const ch = line[ci];
            if (ch === ' ') continue;
            ctx.fillStyle = '#0c172e'; // Таинственный ночной силуэт в тумане
            ctx.fillText(ch, (rep + ci) * CELL_W, (kingdomRow + li) * CELL_H);
          }
        });
      }

      // 3. ХВОЙНЫЙ ЛЕС (БЛИЖЕ К ЛАГЕРЮ)
      for (let c = 1; c < cols - 6; c += 11) {
        const tree = TREE_TEMPLATES[c % 3];
        tree.forEach((tLine, li) => {
          for (let ci = 0; ci < tLine.length; ci++) {
            const ch = tLine[ci];
            if (ch === ' ') continue;
            const dist = Math.abs(c + ci - fireCol);
            ctx.fillStyle = dist < fireLight ? '#192438' : '#080e1b';
            ctx.fillText(ch, (c + ci) * CELL_W, (groundRow - tree.length + li) * CELL_H);
          }
        });
      }

      // 4. МЯГКИЙ РЕЛЬЕФ ЗЕМЛИ ПОД НОГАМИ
      for (let c = 0; c < cols; c++) {
        for (let r = groundRow; r < rows; r++) {
          const depth = r - groundRow;
          const dist = Math.sqrt(Math.pow(c - fireCol, 2) + Math.pow((r - fireRow) * 1.5, 2));

          let ch = '#';
          if (depth === 0) ch = ['=', '~', '^', '-'][c % 4];
          else if (depth === 1) ch = ['%', '*', '#'][c % 3];

          let rCol = 14, gCol = 28, bCol = 60;
          if (dist < fireLight) {
            const p = Math.pow(1 - dist / fireLight, 1.4);
            rCol = Math.min(255, Math.floor(rCol + p * 230));
            gCol = Math.min(200, Math.floor(gCol + p * 110));
            bCol = Math.floor(bCol * (1 - p * 0.8));
          }

          ctx.fillStyle = `rgb(${rCol}, ${gCol}, ${bCol})`;
          ctx.fillText(ch, c * CELL_W, r * CELL_H);
        }
      }

      // 5. МЕДЛЕННО АНИМИРОВАННЫЙ ТЛЕЮЩИЙ КОСТЕР
      const fireFrames = [
        ['  ( )  ', ' ( * ) ', '( ^ * )', '/=====\\'],
        [' ( * ) ', '( ^ )  ', '( * ^ )', '/=====\\'],
        [' ( ^ ) ', '( * ^ )', ' ( * ) ', '/=====\\']
      ];
      const curFrame = fireFrames[Math.floor(tick / 28) % fireFrames.length];
      curFrame.forEach((fLine, li) => {
        for (let ci = 0; ci < fLine.length; ci++) {
          const ch = fLine[ci];
          if (ch === ' ') continue;
          ctx.fillStyle = ch === '*' ? '#fef08a' : (ch === '^' ? '#ff3b00' : '#f97316');
          ctx.shadowColor = '#ea580c';
          ctx.shadowBlur = 10;
          ctx.fillText(ch, (fireCol - 3 + ci) * CELL_W, (fireRow - 3 + li) * CELL_H);
          ctx.shadowBlur = 0;
        }
      });

      // 6. ЧЕТЫРЕ ПЕРСОНАЖА У ОГНЯ (ЧИСТАЯ КАТ-СЦЕНА)
      const party = [
        { lines: ['  O  ', ' /|\\>', '_/ \\_'], cOffset: -12, look: 'right' },
        { lines: [' <O  ', '<|\\  ', '_/ \\_'], cOffset: -6,  look: 'right' },
        { lines: ['  O> ', ' <|/ ', '_/ \\_'], cOffset: 6,   look: 'left' },
        { lines: [' <O> ', ' -|- ', '_/ \\_'], cOffset: 12, look: 'left' }
      ];

      party.forEach((p) => {
        p.lines.forEach((l, li) => {
          for (let ci = 0; ci < l.length; ci++) {
            const ch = l[ci];
            if (ch === ' ') continue;
            const isNearFire = (p.look === 'right' && ci >= l.length - 2) || (p.look === 'left' && ci <= 1);
            ctx.fillStyle = isNearFire ? '#ffaa00' : '#38bdf8';
            ctx.fillText(ch, (fireCol + p.cOffset + ci) * CELL_W, (groundRow - 3 + li) * CELL_H);
          }
        });
      });

      animId = requestAnimationFrame(renderGameCutscene);
    };

    renderGameCutscene();
    return () => cancelAnimationFrame(animId);
  }, [screen]);

  return (
    <div className="bm-viewport">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Fira+Code:wght@700&display=swap');

        .bm-viewport {
          position: relative;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          background: #000;
          user-select: none;
          touch-action: none;
        }

        /* ПЛАВНЫЙ ПЕРЕХОД ЧЕРЕЗ ТЕМНОТУ */
        .fade-overlay {
          position: absolute;
          inset: 0;
          background: #000;
          z-index: 100;
          pointer-events: none;
          transition: opacity 1s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* ПРЕДУПРЕЖДЕНИЕ ПОВОРОТА ЭКРАНА */
        .portrait-lock {
          display: none;
        }
        @media (orientation: portrait) {
          .portrait-lock {
            position: fixed;
            inset: 0;
            background: #02040a;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-family: 'Press Start 2P', monospace;
            color: #00f0ff;
            text-align: center;
            padding: 24px;
            line-height: 1.8;
          }
        }

        /* МЕНЮ */
        .menu-layer {
          position: absolute;
          inset: 0;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding-top: 20px;
        }

        .big-logo {
          max-height: clamp(120px, 38vh, 240px);
          max-width: 90vw;
          object-fit: contain;
          margin-bottom: clamp(15px, 4vh, 35px);
          filter: drop-shadow(0 0 30px rgba(0, 240, 255, 0.4));
        }

        .menu-list {
          width: 100vw;
          display: flex;
          flex-direction: column;
          gap: clamp(4px, 1.2vh, 10px);
        }

        .console-row {
          width: 100vw;
          height: clamp(38px, 8vh, 52px);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Press Start 2P', monospace;
          font-size: clamp(11px, 2.4vh, 15px);
          cursor: pointer;
          color: #94a3b8;
          background: transparent;
          transition: background 0.12s, color 0.12s;
        }

        .console-row.active {
          background: rgba(0, 240, 255, 0.18);
          color: #00f0ff;
          text-shadow: 0 0 12px #00f0ff, 0 0 25px rgba(0, 240, 255, 0.8);
          box-shadow: inset 0 0 20px rgba(0, 240, 255, 0.15);
        }

        .console-row.disabled {
          color: #334155;
          cursor: not-allowed;
        }
      `}</style>

      {/* Оверлей плавного затемнения */}
      <div className="fade-overlay" style={{ opacity: fadeOpacity }} />

      {/* Блокировка поворота */}
      <div className="portrait-lock">
        <div>[ ! ] ПОВЕРНИТЕ ЭКРАН</div>
        <div style={{ fontSize: '10px', marginTop: '16px', color: '#64748b' }}>
          BEGINNING MENTION ТРЕБУЕТ ГОРИЗОНТАЛЬНЫЙ РЕЖИМ
        </div>
      </div>

      {/* ЭКРАН 1: ГЛАВНОЕ МЕНЮ */}
      {screen === 'MENU' && (
        <>
          <canvas ref={menuCanvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />

          <div className="menu-layer">
            <img
              src="/basiclogo.png"
              alt="BeginningMention"
              className="big-logo"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />

            <div className="menu-list">
              <div
                className={`console-row ${selectedIdx === 0 ? 'active' : ''}`}
                onPointerEnter={() => setSelectedIdx(0)}
                onClick={handleStartGame}
              >
                {selectedIdx === 0 ? '> НОВАЯ ЭКСПЕДИЦИЯ' : '  НОВАЯ ЭКСПЕДИЦИЯ'}
              </div>

              <div
                className={`console-row ${!hasSave ? 'disabled' : ''} ${selectedIdx === 1 ? 'active' : ''}`}
                onPointerEnter={() => setSelectedIdx(1)}
                onClick={() => {
                  if (hasSave) alert('Загрузка сохраненной партии...');
                }}
              >
                {selectedIdx === 1 ? '> ЗАГРУЗКИ (LOCKED)' : '  ЗАГРУЗКИ (LOCKED)'}
              </div>

              <div
                className={`console-row ${selectedIdx === 2 ? 'active' : ''}`}
                onPointerEnter={() => setSelectedIdx(2)}
                onClick={() => alert('Настройки...')}
              >
                {selectedIdx === 2 ? '> НАСТРОЙКИ' : '  НАСТРОЙКИ'}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ЭКРАН 2: ЧИСТАЯ КАТ-СЦЕНА (БЕЗ ИНТЕРФЕЙСА) */}
      {screen === 'GAME' && (
        <canvas ref={gameCanvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      )}
    </div>
  );
};
