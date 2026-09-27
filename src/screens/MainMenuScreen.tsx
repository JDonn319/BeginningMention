import React, { useEffect, useRef, useState } from 'react';

// Чистые пиксельные SVG-иконки для кнопок (не требуют внешних npm-библиотек)
const RetroIcons = {
  Play: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  ),
  Save: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
    </svg>
  ),
  Lock: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
    </svg>
  ),
  Gear: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54A.48.48 0 0 0 13.91 2h-3.82c-.24 0-.44.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.47c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.82c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
    </svg>
  )
};

export const MainMenuScreen: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [logoFailed, setLogoFailed] = useState(false);
  const [hasSave] = useState(() => !!localStorage.getItem('bm_save'));

  // Рендерер живого ночного фона в стиле Effulgence RPG
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let tick = 0;

    // Фиксированный размер символьной ячейки, чтобы картинка никогда не растягивалась
    const CELL_W = 10;
    const CELL_H = 14;

    // Фоновый шум из матрицы
    const bgTags = ['SOCKET', 'RESET', 'SWITCH', 'CRATER', 'NULL', 'MEM_0x', 'SECT'];

    const render = () => {
      tick++;

      // Подгонка канваса под реальные пиксели экрана
      const width = window.innerWidth;
      const height = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.resetTransform();
      ctx.scale(dpr, dpr);

      // Полная заливка глубокой ночью
      ctx.fillStyle = '#02040a';
      ctx.fillRect(0, 0, width, height);

      const cols = Math.ceil(width / CELL_W);
      const rows = Math.ceil(height / CELL_H);

      ctx.font = `${CELL_H}px "Fira Code", monospace`;
      ctx.textBaseline = 'top';

      // Координаты костра (внизу по центру)
      const fireCol = Math.floor(cols / 2);
      const fireRow = rows - 6;

      // Радиус мерцающего света
      const lightRadius = 16 + Math.sin(tick * 0.12) * 2;

      // 1. ЗВЕЗДНОЕ НЕБО И СИМВОЛЬНЫЙ МАТРИЧНЫЙ ФОН
      for (let r = 0; r < rows - 8; r++) {
        for (let c = 0; c < cols; c++) {
          // Псевдослучайные глифы
          const seed = (c * 37 + r * 91) % 100;
          let ch = ' ';
          let baseAlpha = 0.04;

          if (seed < 4) ch = '.';
          else if (seed === 5) ch = '+';
          else if (seed === 6) ch = '^';

          // Слова из референса
          if (r % 7 === 2 && c % 25 === 0) {
            const word = bgTags[(c + r) % bgTags.length];
            for (let w = 0; w < word.length && c + w < cols; w++) {
              ctx.fillStyle = 'rgba(25, 45, 85, 0.12)';
              ctx.fillText(word[w], (c + w) * CELL_W, r * CELL_H);
            }
          }

          if (ch !== ' ') {
            const twinkle = Math.sin(tick * 0.05 + c + r) * 0.03;
            ctx.fillStyle = `rgba(140, 180, 255, ${baseAlpha + twinkle})`;
            ctx.fillText(ch, c * CELL_W, r * CELL_H);
          }
        }
      }

      // ЛУНА В ПРАВОМ ВЕРХНЕМ УГЛУ
      const moonCol = cols - 12;
      const moonRow = 2;
      const moonAscii = ['  .---.  ', ' /     \\ ', '|  (o)  |', ' \\     / ', "  '---'  "];
      ctx.fillStyle = '#bae6fd';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 15;
      moonAscii.forEach((line, li) => {
        ctx.fillText(line, moonCol * CELL_W, (moonRow + li) * CELL_H);
      });
      ctx.shadowBlur = 0;

      // 2. ДАЛЬНИЙ ЛЕС (СИЛУЭТЫ ЕЛЕЙ)
      for (let c = 0; c < cols; c += 6) {
        const treeRow = rows - 13;
        ctx.fillStyle = '#0a1428';
        ctx.fillText('/\\', c * CELL_W, (treeRow) * CELL_H);
        ctx.fillText('/\\/\\', (c - 1) * CELL_W, (treeRow + 1) * CELL_H);
        ctx.fillText(' || ', c * CELL_W, (treeRow + 2) * CELL_H);
      }

      // 3. СИНЕВАТЫЙ РЕЛЬЕФ ЗЕМЛИ И ПОСИМВОЛЬНЫЙ СВЕТ КОСТРА
      for (let c = 0; c < cols; c++) {
        // Рельеф с волнами
        const groundStart = Math.floor(
          rows - 7 + Math.sin(c * 0.15) * 1.5 + Math.cos(c * 0.05) * 1.2
        );

        for (let r = groundStart; r < rows; r++) {
          const depth = r - groundStart;
          let gChar = '#';
          if (depth === 0) gChar = ['~', '^', '=', '.'][c % 4];
          else if (depth === 1) gChar = ['%', '*', 'x'][c % 3];

          // Расстояние до костра для освещения
          const dc = c - fireCol;
          const dr = (r - fireRow) * 1.6;
          const dist = Math.sqrt(dc * dc + dr * dr);

          let red = 18, green = 38, blue = 75;

          if (dist < lightRadius) {
            const factor = Math.pow(1 - dist / lightRadius, 1.6);
            red = Math.min(255, Math.floor(red + factor * 237));
            green = Math.min(220, Math.floor(green + factor * 120));
            blue = Math.floor(blue * (1 - factor * 0.8));
          }

          ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
          ctx.fillText(gChar, c * CELL_W, r * CELL_H);
        }
      }

      // 4. ТРИ ПЕРСОНАЖА ВОКРУГ КОСТРА
      const drawFigure = (lines: string[], atCol: number, atRow: number, lookLeft: boolean) => {
        lines.forEach((l, li) => {
          for (let ci = 0; ci < l.length; ci++) {
            const ch = l[ci];
            if (ch === ' ') continue;
            // Отблеск костра на персонаже
            ctx.fillStyle = (lookLeft ? ci >= l.length - 2 : ci <= 1) ? '#ffb703' : '#60a5fa';
            ctx.fillText(ch, (atCol + ci) * CELL_W, (atRow + li) * CELL_H);
          }
        });
      };

      // Персонаж слева
      drawFigure(['  o  ', ' /|\\>', '_/ \\_'], fireCol - 7, fireRow - 1, true);
      // Персонаж по центру сзади
      drawFigure([' o ', '(|)', '/ \\'], fireCol - 1, fireRow - 3, false);
      // Персонаж справа с посохом
      drawFigure(['<o  |', ' |\\-|', '_/\\ |'], fireCol + 4, fireRow - 1, false);

      // 5. САМ АНИМИРОВАННЫЙ КОСТЕР
      const flames = ['^', '*', 'o', '(', ')'];
      for (let i = 0; i < 5; i++) {
        const fChar = flames[(tick + i) % flames.length];
        const fx = fireCol + (i % 3) - 1;
        const fy = fireRow - Math.floor(i / 3);

        ctx.fillStyle = i > 3 ? '#ffffff' : (i > 1 ? '#ffea00' : '#ff3b00');
        ctx.shadowColor = '#ff3b00';
        ctx.shadowBlur = 12;
        ctx.fillText(fChar, fx * CELL_W, fy * CELL_H);
        ctx.shadowBlur = 0;
      }
      ctx.fillStyle = '#5c2c06';
      ctx.fillText('=====', (fireCol - 2) * CELL_W, (fireRow + 1) * CELL_H);

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="main-menu-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Fira+Code:wght@700&display=swap');

        .main-menu-root {
          position: relative;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          background: #000;
          user-select: none;
        }

        /* Канвас на заднем плане */
        .bg-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
          pointer-events: none;
        }

        /* CRT Сканлайны поверх всего */
        .crt-scanlines {
          position: absolute;
          inset: 0;
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.35) 50%);
          background-size: 100% 3px;
          pointer-events: none;
          z-index: 5;
        }

        /* Главный UI слой: центрирован, оптимизирован под Landscape */
        .ui-layer {
          position: absolute;
          inset: 0;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          /* Учет челки/Dynamic Island в горизонталке */
          padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
        }

        /* Большой логотип по центру */
        .logo-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: clamp(10px, 3vh, 24px);
        }

        .main-logo {
          max-height: clamp(55px, 22vh, 120px);
          max-width: 80vw;
          object-fit: contain;
          filter: drop-shadow(0 0 25px rgba(56, 189, 248, 0.5));
        }

        .fallback-logo {
          font-family: 'Press Start 2P', monospace;
          font-size: clamp(18px, 4.5vh, 32px);
          color: #38bdf8;
          text-shadow: 0 0 10px #0284c7, 0 0 25px #0369a1;
          letter-spacing: 2px;
          text-align: center;
        }

        /* Блок 3 низких и широких кнопок */
        .buttons-group {
          display: flex;
          flex-direction: column;
          gap: clamp(8px, 1.8vh, 14px);
          width: min(420px, 75vw);
        }

        /* Низкая и широкая кнопка */
        .pixel-btn {
          font-family: 'Press Start 2P', monospace;
          font-size: clamp(9px, 2vh, 12px);
          height: clamp(38px, 8.5vh, 48px);
          width: 100%;
          background: rgba(8, 16, 36, 0.85);
          color: #e0f2fe;
          border: 2px solid #00f0ff;
          box-shadow: inset 0 0 8px rgba(0, 240, 255, 0.25), 0 0 12px rgba(0, 240, 255, 0.3);
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          text-transform: uppercase;
          transition: all 0.12s ease;
          -webkit-tap-highlight-color: transparent;
        }

        .pixel-btn:hover:not(:disabled) {
          background: #00f0ff;
          color: #000;
          box-shadow: 0 0 20px #00f0ff;
          transform: scale(1.02);
        }

        .pixel-btn:active:not(:disabled) {
          transform: scale(0.97);
        }

        .pixel-btn:disabled {
          border-color: #334155;
          color: #64748b;
          background: rgba(10, 15, 25, 0.6);
          box-shadow: none;
          cursor: not-allowed;
        }

        /* Плавный переход для иконок */
        .pixel-btn svg {
          flex-shrink: 0;
        }
      `}</style>

      {/* Канвас ночного мира */}
      <canvas ref={canvasRef} className="bg-canvas" />

      {/* Эффект CRT монитора */}
      <div className="crt-scanlines" />

      {/* Честный UI слой */}
      <div className="ui-layer">
        {/* Большой логотип */}
        <div className="logo-wrapper">
          {!logoFailed ? (
            <img
              src="/basiclogo.png"
              alt="BeginningMention"
              className="main-logo"
              onError={() => setLogoFailed(true)}
            />
          ) : (
            <div className="fallback-logo">BEGINNING MENTION</div>
          )}
        </div>

        {/* 3 прямые, широкие и низкие кнопки */}
        <div className="buttons-group">
          <button
            className="pixel-btn"
            onClick={() => alert('Запуск Новой игры...')}
          >
            <RetroIcons.Play />
            <span>Новая игра</span>
          </button>

          <button
            className="pixel-btn"
            disabled={!hasSave}
            title={!hasSave ? 'Нет доступных сохранений' : 'Загрузить игру'}
            onClick={() => alert('Загрузка сохраненной экспедиции...')}
          >
            {!hasSave ? <RetroIcons.Lock /> : <RetroIcons.Save />}
            <span>Загрузки</span>
          </button>

          <button
            className="pixel-btn"
            onClick={() => alert('Открытие настроек...')}
          >
            <RetroIcons.Gear />
            <span>Настройки</span>
          </button>
        </div>
      </div>
    </div>
  );
};
