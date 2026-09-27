import React, { useEffect, useRef, useState } from 'react';

// ==========================================
// ШАБЛОНЫ ОКРУЖЕНИЯ (TEMPLATES)
// ==========================================

// 3 типа хвойных деревьев
const TREE_TEMPLATES = [
  // Тип 1: Высокая густая ель
  [
    '   /\\   ',
    '  /**\\  ',
    ' /****\\ ',
    '/******\\',
    '  ||||  '
  ],
  // Тип 2: Широкая вековая сосна
  [
    '    /\\    ',
    '   //\\\\   ',
    '  ///\\\\\\  ',
    ' ////\\\\\\\\ ',
    '    ||    '
  ],
  // Тип 3: Редкая / терминальная сосна
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
  // Состояния экранов и переходов
  const [screen, setScreen] = useState<'MENU' | 'GAME'>('MENU');
  const [fadeOpacity, setFadeOpacity] = useState<number>(0);
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [hasSave] = useState<boolean>(() => !!localStorage.getItem('bm_save'));

  // Лог консоли в игре
  const [gameLogs, setGameLogs] = useState<string[]>([
    'ПРИВАЛ 04 // СЕКТОР ХАРПИИ',
    'ОТРЯД В БЕЗОПАСНОСТИ У ОГНЯ. ВЫБЕРИТЕ ДЕЙСТВИЕ.'
  ]);

  const menuCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // ------------------------------------------
  // ПЛАВНЫЙ ПЕРЕХОД: МЕНЮ -> ЧЕРНЫЙ ЭКРАН -> ИГРА
  // ------------------------------------------
  const handleStartGame = () => {
    setFadeOpacity(1); // Плавное затемнение
    setTimeout(() => {
      setScreen('GAME'); // Переключаем сцену в полной темноте
      setTimeout(() => {
        setFadeOpacity(0); // Плавное проявление игры
      }, 1400); // 1.4 секунды темноты
    }, 900);
  };

  // ==========================================
  // РЕНДЕР ФОНА МЕНЮ (Рельеф до 50%, без костра)
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

      // 1. НЕБО, МАТРИЧНЫЙ ШУМ И ЗВЕЗДЫ
      for (let r = 0; r < Math.floor(rows * 0.5); r++) {
        for (let c = 0; c < cols; c++) {
          const seed = (c * 23 + r * 67) % 100;
          if (seed < 4) {
            const tw = Math.sin(tick * 0.04 + c + r) * 0.04;
            ctx.fillStyle = `rgba(180, 220, 255, ${0.08 + tw})`;
            ctx.fillText('.', c * CELL_W, r * CELL_H);
          } else if (seed === 5) {
            ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
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

      // 2. ЛЕС ИЗ ШАБЛОНОВ НА ГОРИЗОНТЕ (50% экрана)
      const horizonRow = Math.floor(rows * 0.48);
      for (let c = 2; c < cols - 8; c += 14) {
        const treeTemplate = TREE_TEMPLATES[(c % 3)];
        ctx.fillStyle = '#0f2240';
        treeTemplate.forEach((line, li) => {
          ctx.fillText(line, c * CELL_W, (horizonRow - treeTemplate.length + li) * CELL_H);
        });
      }

      // 3. РЕЛЬЕФ ЗЕМЛИ ДО 50% ЭКРАНА (Многослойный, синеватый)
      for (let c = 0; c < cols; c++) {
        const groundStart = Math.floor(
          rows * 0.5 + Math.sin(c * 0.12) * 1.5 + Math.cos(c * 0.04) * 2
        );

        for (let r = groundStart; r < rows; r++) {
          const depth = r - groundStart;
          let ch = '#';
          let color = '#1e3a8a';

          if (depth === 0) {
            ch = GROUND_STAMPS[0][c % GROUND_STAMPS[0].length];
            color = '#38bdf8';
          } else if (depth === 1) {
            ch = GROUND_STAMPS[1][c % GROUND_STAMPS[1].length];
            color = '#2563eb';
          } else if (depth < 4) {
            ch = GROUND_STAMPS[2][c % GROUND_STAMPS[2].length];
            color = '#1d4ed8';
          } else {
            ch = GROUND_STAMPS[3][c % GROUND_STAMPS[3].length];
            color = '#0f172a';
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
  // РЕНДЕР ИГРЫ (Приближенная сцена: 4 персонажа, костер, HUD)
  // ==========================================
  useEffect(() => {
    if (screen !== 'GAME') return;
    const canvas = gameCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let tick = 0;

    // В игре масштаб увеличен (камера ближе)
    const CELL_W = 14;
    const CELL_H = 20;

    const renderGame = () => {
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

      ctx.fillStyle = '#02050e';
      ctx.fillRect(0, 0, w, h);

      const cols = Math.ceil(w / CELL_W);
      const rows = Math.ceil(h / CELL_H);
      ctx.font = `${CELL_H}px "Fira Code", monospace`;
      ctx.textBaseline = 'top';

      const fireCol = Math.floor(cols / 2);
      const groundRow = Math.floor(rows * 0.68);
      const fireRow = groundRow - 1;

      // Источник света (медленно колеблется)
      const fireLight = 18 + Math.sin(tick * 0.05) * 2;

      // 1. ДЕТАЛИЗИРОВАННЫЙ ЛЕС НА ЗАДНЕМ ПЛАНЕ (Из шаблонов елей)
      for (let c = 1; c < cols - 6; c += 10) {
        const tree = TREE_TEMPLATES[c % 3];
        tree.forEach((tLine, li) => {
          for (let ci = 0; ci < tLine.length; ci++) {
            const ch = tLine[ci];
            if (ch === ' ') continue;
            const dist = Math.abs(c + ci - fireCol);
            ctx.fillStyle = dist < fireLight ? '#1e293b' : '#090d16';
            ctx.fillText(ch, (c + ci) * CELL_W, (groundRow - tree.length + li) * CELL_H);
          }
        });
      }

      // 2. СЛОИ ЗЕМЛИ ПОД НОГАМИ (Крупный рельеф)
      for (let c = 0; c < cols; c++) {
        for (let r = groundRow; r < rows; r++) {
          const depth = r - groundRow;
          const dist = Math.sqrt(Math.pow(c - fireCol, 2) + Math.pow((r - fireRow) * 1.5, 2));

          let ch = '#';
          if (depth === 0) ch = ['=', '~', '^', '-'][c % 4];
          else if (depth === 1) ch = ['%', '*', '#'][c % 3];

          let rCol = 15, gCol = 35, bCol = 80;
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

      // 3. МЕДЛЕННО АНИМИРОВАННЫЙ КОСТЕР
      const fireFrames = [
        ['  ( )  ', ' ( * ) ', '( ^ * )', '/=====\\'],
        [' ( * ) ', '( ^ )  ', '( * ^ )', '/=====\\'],
        [' ( ^ ) ', '( * ^ )', ' ( * ) ', '/=====\\']
      ];
      const curFrame = fireFrames[Math.floor(tick / 24) % fireFrames.length]; // Медленный шаг анимации
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

      // 4. ЧЕТЫРЕ ПЕРСОНАЖА У ОГНЯ (Jane, Michael, Sparrow, Sebastian)
      const party = [
        { name: 'Michael', lines: ['  O  ', ' /|\\>', '_/ \\_'], cOffset: -12, look: 'right' },
        { name: 'Jane',    lines: [' <O  ', '<|\\  ', '_/ \\_'], cOffset: -6,  look: 'right' },
        { name: 'Sparrow', lines: ['  O> ', ' <|/ ', '_/ \\_'], cOffset: 6,   look: 'left' },
        { name: 'Sebastian', lines: [' <O> ', ' -|- ', '_/ \\_'], cOffset: 12, look: 'left' }
      ];

      party.forEach((p) => {
        p.lines.forEach((l, li) => {
          for (let ci = 0; ci < l.length; ci++) {
            const ch = l[ci];
            if (ch === ' ') continue;
            // Подсветка от костра
            const isNearFire = (p.look === 'right' && ci >= l.length - 2) || (p.look === 'left' && ci <= 1);
            ctx.fillStyle = isNearFire ? '#ffaa00' : '#38bdf8';
            ctx.fillText(ch, (fireCol + p.cOffset + ci) * CELL_W, (groundRow - 3 + li) * CELL_H);
          }
        });
      });

      animId = requestAnimationFrame(renderGame);
    };

    renderGame();
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

        /* ЗАТЕМНЕНИЕ ЭКРАНА (ПЛАВНЫЙ ПЕРЕХОД) */
        .fade-overlay {
          position: absolute;
          inset: 0;
          background: #000;
          z-index: 100;
          pointer-events: none;
          transition: opacity 1s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* ПРЕДУПРЕЖДЕНИЕ ПОВОРОТА ЭКРАНА ДЛЯ МОБИЛОК */
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

        /* ---------------- МЕНЮ ---------------- */
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

        /* ЛОГОТИП УВЕЛИЧЕН В 2 РАЗА */
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

        /* ПОЛОСА ВЫБОРА НА ВЕСЬ ЭКРАН (КОНСОЛЬНЫЙ СТИЛЬ) */
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

        /* ---------------- ИГРОВОЙ ИНТЕРФЕЙС (EFFULGENCE STYLE) ---------------- */
        .game-hud {
          position: absolute;
          inset: 0;
          z-index: 20;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 12px 18px;
          pointer-events: none;
          font-family: 'Fira Code', monospace;
        }

        .hud-interactive {
          pointer-events: auto;
        }

        .top-terminal-bar {
          display: flex;
          justify-content: space-between;
          color: #00f0ff;
          font-size: 13px;
          border-bottom: 1px dashed rgba(0, 240, 255, 0.3);
          padding-bottom: 6px;
          text-shadow: 0 0 6px #00f0ff;
        }

        .hud-button {
          background: transparent;
          border: none;
          color: #00f0ff;
          font-family: inherit;
          font-size: 13px;
          cursor: pointer;
          padding: 2px 8px;
        }
        .hud-button:active {
          background: #00f0ff;
          color: #000;
        }

        /* ТЕРМИНАЛЬНАЯ ПАНЕЛЬ ДЕЙСТВИЙ */
        .actions-panel {
          align-self: center;
          background: rgba(4, 10, 25, 0.85);
          border: 1px solid #00f0ff;
          box-shadow: 0 0 15px rgba(0, 240, 255, 0.2);
          padding: 8px 16px;
          display: flex;
          gap: 20px;
          margin-bottom: 8px;
        }

        .action-cmd {
          background: transparent;
          border: none;
          color: #fff;
          font-family: 'Fira Code', monospace;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.1s;
        }
        .action-cmd:active {
          color: #00f0ff;
          text-shadow: 0 0 8px #00f0ff;
        }

        /* НИЖНЯЯ ПАНЕЛЬ ОТРЯДА (СТАТУС ИЗ РЕФЕРЕНСА) */
        .party-bar {
          display: flex;
          justify-content: space-between;
          background: rgba(2, 6, 18, 0.95);
          border-top: 1px solid #1e293b;
          padding: 8px 14px;
          font-size: 12px;
          color: #94a3b8;
        }
        .party-member {
          display: flex;
          gap: 6px;
        }
        .party-member.active {
          color: #ffaa00;
          text-shadow: 0 0 8px #ffaa00;
        }

        .log-line {
          font-size: 11px;
          color: #4ade80;
          text-shadow: 0 0 5px #22c55e;
          text-align: center;
          margin-bottom: 6px;
        }
      `}</style>

      {/* Оверлей плавного перехода в черное */}
      <div className="fade-overlay" style={{ opacity: fadeOpacity }} />

      {/* Предупреждение о повороте экрана */}
      <div className="portrait-lock">
        <div>[ ! ] ПОВЕРНИТЕ ЭКРАН</div>
        <div style={{ fontSize: '10px', marginTop: '16px', color: '#64748b' }}>
          BEGINNING MENTION ТРЕБУЕТ ГОРИЗОНТАЛЬНЫЙ РЕЖИМ
        </div>
      </div>

      {/* ================= РЕЖИМ 1: ГЛАВНОЕ МЕНЮ ================= */}
      {screen === 'MENU' && (
        <>
          <canvas ref={menuCanvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />

          <div className="menu-layer">
            {/* Увеличенный в 2 раза логотип */}
            <img
              src="/basiclogo.png"
              alt="BeginningMention"
              className="big-logo"
              onError={(e) => {
                // Запасной заголовок, если файл еще не добавлен
                e.currentTarget.style.display = 'none';
              }}
            />

            {/* Консольные кнопки с подсветкой полосой на весь экран */}
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
                onClick={() => alert('Настройки терминала...')}
              >
                {selectedIdx === 2 ? '> НАСТРОЙКИ' : '  НАСТРОЙКИ'}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ================= РЕЖИМ 2: СЦЕНА ПРИВАЛА В ИГРЕ ================= */}
      {screen === 'GAME' && (
        <>
          <canvas ref={gameCanvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />

          {/* HUD В СТИЛЕ EFFULGENCE RPG */}
          <div className="game-hud">
            {/* Верхний статус */}
            <div className="top-terminal-bar hud-interactive">
              <span>BeginningMention // Sector: Harpy Crater (Camp)</span>
              <button
                className="hud-button"
                onClick={() => setGameLogs(prev => ['[CONSOLE] Взлом подсистемы невозможен.', ...prev].slice(0, 3))}
              >
                [Y] Console
              </button>
            </div>

            {/* Центральные контекстные действия привала */}
            <div style={{ alignSelf: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className="log-line">{gameLogs[0]}</div>

              <div className="actions-panel hud-interactive">
                <button
                  className="action-cmd"
                  onClick={() => setGameLogs(prev => ['Отряд отдыхает у пламени. Очки здоровья восстановлены.', ...prev].slice(0, 3))}
                >
                  &gt;&gt; [ ОТДЫХАТЬ ]
                </button>
                <button
                  className="action-cmd"
                  onClick={() => setGameLogs(prev => ['Jane: "Сканеры фиксируют активность Харпии неподалеку."', ...prev].slice(0, 3))}
                >
                  &gt;&gt; [ ДИАЛОГ ]
                </button>
                <button
                  className="action-cmd"
                  onClick={() => setGameLogs(prev => ['Плазменные гранаты x5, Кольцо щита x1.', ...prev].slice(0, 3))}
                >
                  &gt;&gt; [ ИНВЕНТАРЬ ]
                </button>
                <button
                  className="action-cmd"
                  onClick={() => alert('Разведка кратера в разработке...')}
                >
                  &gt;&gt; [ РАЗВЕДКА ]
                </button>
              </div>
            </div>

            {/* Нижняя панель состояния отряда (как на видео) */}
            <div className="party-bar hud-interactive">
              <div className="party-member active">
                <span>[Michael]</span>
                <span>210/210</span>
              </div>
              <div className="party-member">
                <span>[Jane]</span>
                <span>140/140</span>
              </div>
              <div className="party-member">
                <span>[Sparrow]</span>
                <span>180/180</span>
              </div>
              <div className="party-member">
                <span>[Sebastian]</span>
                <span>120/120</span>
              </div>
              <div style={{ color: '#22c55e' }}>
                PARTY HP: 1000/1000
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
