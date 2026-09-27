import React, { useEffect, useRef, useState } from 'react';

// Разрешение символьной сетки (Колонки x Строки)
const COLS = 95;
const ROWS = 45;

export const MainMenuScreen: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedBtn, setSelectedBtn] = useState<number>(0);
  const [hasSave] = useState<boolean>(() => !!localStorage.getItem('bm_save'));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let tick = 0;

    // Генерация статичного фонового шума из матричных слов и глифов (как в Effulgence RPG)
    const bgWords = ['SOCKET', 'RESET', 'SWITCH', 'CRATER', 'NULL', 'MEM_0x', 'SECT', 'VOID'];
    const bgGrid: { char: string; baseAlpha: number }[][] = [];
    for (let y = 0; y < ROWS; y++) {
      bgGrid[y] = [];
      for (let x = 0; x < COLS; x++) {
        const rand = Math.random();
        let char = ' ';
        let baseAlpha = 0.05 + Math.random() * 0.08;

        if (rand < 0.12) {
          char = ['.', ':', '+', 'x', '-', '~', '^', '`'][Math.floor(Math.random() * 8)];
        } else if (rand < 0.14) {
          char = ['0', '1', 'F', 'A', '8'][Math.floor(Math.random() * 5)];
        }
        bgGrid[y][x] = { char, baseAlpha };
      }
    }

    // Впечатываем системные слова в фон
    for (let i = 0; i < 18; i++) {
      const word = bgWords[Math.floor(Math.random() * bgWords.length)];
      const wx = Math.floor(Math.random() * (COLS - word.length - 2));
      const wy = Math.floor(Math.random() * (ROWS - 15));
      for (let c = 0; c < word.length; c++) {
        bgGrid[wy][wx + c] = { char: word[c], baseAlpha: 0.12 };
      }
    }

    // Искры костра
    const sparks: { x: number; y: number; vx: number; vy: number; life: number }[] = [];

    // Главный цикл рендеринга символьного буфера
    const render = () => {
      tick++;

      // Подгоняем размер под экран без искажения пропорций
      const dpr = window.devicePixelRatio || 1;
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }
      ctx.resetTransform();
      ctx.scale(dpr, dpr);

      ctx.fillStyle = '#01030a';
      ctx.fillRect(0, 0, width, height);

      const cellW = width / COLS;
      const cellH = height / ROWS;
      const fontSize = Math.floor(cellH * 1.05);
      ctx.font = `${fontSize}px "Fira Code", monospace`;
      ctx.textBaseline = 'top';

      // Позиция костра (в координатах сетки)
      const fireX = Math.floor(COLS / 2);
      const fireY = ROWS - 12;

      // Источник света (пульсирует как пламя)
      const lightRadius = 18 + Math.sin(tick * 0.15) * 2 + Math.cos(tick * 0.08) * 1.5;

      // Спавн искр
      if (tick % 3 === 0) {
        sparks.push({
          x: fireX + (Math.random() - 0.5) * 3,
          y: fireY - 1,
          vx: (Math.random() - 0.5) * 0.3,
          vy: -0.2 - Math.random() * 0.3,
          life: 1.0
        });
      }

      // 1. РЕНДЕР ФОНА И ОСВЕЩЕНИЯ КАЖДОЙ КЛЕТКИ
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const cell = bgGrid[y][x];
          let char = cell.char;
          
          // Расчет расстояния до костра для поклеточного света
          const dx = x - fireX;
          const dy = (y - fireY) * 1.8; // Коррекция пропорций по вертикали
          const dist = Math.sqrt(dx * dx + dy * dy);

          let r = 20, g = 50, b = 110; // Базовый глубокий сине-черный ночной тон
          let alpha = cell.baseAlpha;

          // Динамический теплый свет
          if (dist < lightRadius) {
            const intensity = Math.pow(1 - dist / lightRadius, 1.8);
            r = Math.min(255, Math.floor(r + intensity * 235));
            g = Math.min(200, Math.floor(g + intensity * 110));
            b = Math.floor(b * (1 - intensity * 0.8));
            alpha = Math.min(1, alpha + intensity * 0.7);
          }

          // Мерцание звезд вверху
          if (y < 12 && char !== ' ') {
            alpha += Math.sin(tick * 0.05 + x * 0.3 + y) * 0.08;
          }

          if (char !== ' ') {
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${Math.max(0, alpha)})`;
            ctx.fillText(char, x * cellW, y * cellH);
          }
        }
      }

      // 2. РЕЛЬЕФ КРАТЕРА / ЗЕМЛИ (многослойная символьная топография)
      for (let x = 0; x < COLS; x++) {
        const groundHeight = Math.floor(
          Math.sin(x * 0.08) * 2.5 + Math.cos(x * 0.2) * 1.5 + (ROWS - 10)
        );

        for (let y = groundHeight; y < ROWS; y++) {
          const depth = y - groundHeight;
          let groundChar = '#';
          if (depth === 0) groundChar = ['~', '^', '=', '.'][Math.abs(x) % 4];
          else if (depth === 1) groundChar = ['%', '*', 'x'][Math.abs(x + y) % 3];
          else if (depth === 2) groundChar = ['#', 'G', '8'][Math.abs(x * 2) % 3];

          const dx = x - fireX;
          const dy = (y - fireY) * 1.8;
          const dist = Math.sqrt(dx * dx + dy * dy);

          let gr = 15, gg = 38, gb = 85;
          if (dist < lightRadius) {
            const intensity = Math.pow(1 - dist / lightRadius, 1.5);
            gr = Math.min(255, Math.floor(gr + intensity * 240));
            gg = Math.min(200, Math.floor(gg + intensity * 100));
            gb = Math.floor(gb * (1 - intensity * 0.9));
          }

          ctx.fillStyle = `rgb(${gr}, ${gg}, ${gb})`;
          ctx.fillText(groundChar, x * cellW, y * cellH);
        }
      }

      // 3. АНИМИРОВАННЫЙ КОСТЕР (символьные языки пламени)
      const fireChars = ['^', '*', 'o', '(', ')', '/', '\\'];
      for (let i = 0; i < 7; i++) {
        const fx = fireX + (i % 3) - 1;
        const fy = fireY - Math.floor(i / 3);
        const fChar = fireChars[(tick + i) % fireChars.length];
        
        ctx.fillStyle = i > 4 ? '#ffffff' : (i > 2 ? '#ffea00' : '#ff4400');
        ctx.shadowColor = '#ff2200';
        ctx.shadowBlur = 10;
        ctx.fillText(fChar, fx * cellW, fy * cellH);
        ctx.shadowBlur = 0;
      }
      ctx.fillStyle = '#653205';
      ctx.fillText('=====', (fireX - 2) * cellW, (fireY + 1) * cellH);

      // Искры
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.life -= 0.02;
        if (s.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        ctx.fillStyle = `rgba(255, ${Math.floor(s.life * 200)}, 0, ${s.life})`;
        ctx.fillText('`', s.x * cellW, s.y * cellH);
      }

      // 4. ТРИ ПЕРСОНАЖА У ОГНЯ (ASCII фигуры с отблесками)
      const drawAsciiEntity = (lines: string[], gridX: number, gridY: number, colorSide: 'left' | 'right') => {
        lines.forEach((line, lineIdx) => {
          for (let cIdx = 0; cIdx < line.length; cIdx++) {
            const ch = line[cIdx];
            if (ch === ' ') continue;
            
            // Теплый контур со стороны костра, холодный с внешней
            if (colorSide === 'left') {
              ctx.fillStyle = cIdx >= line.length - 2 ? '#ffb703' : '#38bdf8';
            } else {
              ctx.fillStyle = cIdx <= 1 ? '#ffb703' : '#c084fc';
            }
            ctx.fillText(ch, (gridX + cIdx) * cellW, (gridY + lineIdx) * cellH);
          }
        });
      };

      // Персонаж 1 (слева от костра)
      drawAsciiEntity(['  o  ', ' /|\\>', '_/ \\_'], fireX - 8, fireY - 1, 'left');

      // Персонаж 2 (справа от костра с посохом)
      drawAsciiEntity(['<o  |', ' |\\-|', '_/\\ |'], fireX + 5, fireY - 1, 'right');

      // Персонаж 3 (сзади чуть выше)
      drawAsciiEntity(['  o  ', ' (|) ', ' / \\ '], fireX - 2, fireY - 4, 'left');

      // 5. ТЕРМИНАЛЬНЫЙ UI (Прямо поверх матрицы, рамки из ASCII)
      const renderTerminalWindow = (
        title: string,
        lines: string[],
        startX: number,
        startY: number,
        w: number
      ) => {
        // Рамка
        ctx.fillStyle = '#00f0ff';
        const topBar = '+' + `[ ${title} ]`.padEnd(w - 2, '-') + '+';
        const botBar = '+' + '-'.repeat(w - 2) + '+';
        ctx.fillText(topBar, startX * cellW, startY * cellH);

        for (let i = 0; i < lines.length; i++) {
          const cy = startY + 1 + i;
          ctx.fillStyle = '#00f0ff';
          ctx.fillText('|', startX * cellW, cy * cellH);
          ctx.fillText('|', (startX + w - 1) * cellW, cy * cellH);

          // Содержимое
          ctx.fillStyle = lines[i].includes('>') ? '#ffee00' : (lines[i].includes('[X]') ? '#475569' : '#ffffff');
          ctx.fillText(lines[i], (startX + 2) * cellW, cy * cellH);
        }
        ctx.fillStyle = '#00f0ff';
        ctx.fillText(botBar, startX * cellW, (startY + lines.length + 1) * cellH);
      };

      // Верхний заголовок игры
      const titleLines = [
        '  ____  ______ _____ _____ _   _ _   _ _____ _   _  _____  ',
        ' |  _ \\|  ____/ ____|_   _| \\ | | \\ | |_   _| \\ | |/ ____| ',
        ' | |_) | |__ | |  __  | | |  \\| |  \\| | | | |  \\| | |  __  ',
        ' |  _ <|  __|| | |_ | | | | . ` | . ` | | | | . ` | | |_ | ',
        ' | |_) | |___| |__| |_| |_| |\\  | |\\  |_| |_| |\\  | |__| | ',
        ' |____/|______\\_____|_____|_| \\_|_| \\_|_____|_| \\_|\\_____| '
      ];
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 12;
      const titleStartX = Math.floor((COLS - 58) / 2);
      titleLines.forEach((tl, idx) => {
        ctx.fillText(tl, titleStartX * cellW, (2 + idx) * cellH);
      });
      ctx.shadowBlur = 0;

      // Меню опций (низкие и широкие кнопки)
      const menuWidth = 44;
      const menuX = Math.floor((COLS - menuWidth) / 2);
      const menuY = 10;
      const menuItems = [
        selectedBtn === 0 ? ' > [ 1 ] НОВАЯ ЭКСПЕДИЦИЯ <' : '   [ 1 ] НОВАЯ ЭКСПЕДИЦИЯ  ',
        selectedBtn === 1
          ? ' > [ 2 ] ПРОДОЛЖИТЬ ЗАПИСЬ <'
          : (hasSave ? '   [ 2 ] ПРОДОЛЖИТЬ ЗАПИСЬ  ' : '   [X] НЕТ СОХРАНЕНИЙ (LOCKED)'),
        selectedBtn === 2 ? ' > [ 3 ] СИСТЕМНЫЕ НАСТРОЙКИ <' : '   [ 3 ] СИСТЕМНЫЕ НАСТРОЙКИ'
      ];
      renderTerminalWindow('TERMINAL_EXEC v1.09', menuItems, menuX, menuY, menuWidth);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [selectedBtn, hasSave]);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#000', overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@700&display=swap');
        
        /* CRT полосы */
        .scanlines {
          position: absolute;
          inset: 0;
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.4) 50%);
          background-size: 100% 3px;
          pointer-events: none;
          z-index: 50;
        }

        /* Тач-зоны для мобильного горизонтального экрана */
        .touch-nav {
          position: absolute;
          bottom: 12px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 20px;
          z-index: 60;
        }

        .touch-btn {
          background: rgba(8, 20, 45, 0.7);
          border: 1px solid #00f0ff;
          color: #00f0ff;
          font-family: 'Fira Code', monospace;
          font-size: 14px;
          font-weight: bold;
          padding: 12px 28px;
          border-radius: 2px;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(0, 240, 255, 0.3);
        }
        .touch-btn:active {
          background: #00f0ff;
          color: #000;
        }
      `}</style>

      {/* Сканирующие полосы CRT монитора */}
      <div className="scanlines" />

      {/* Символьный холст */}
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

      {/* Сенсорные кнопки снизу для пальцев на iPhone */}
      <div className="touch-nav">
        <button
          className="touch-btn"
          onClick={() => setSelectedBtn((prev) => (prev > 0 ? prev - 1 : 2))}
        >
          ▲ ВВЕРХ
        </button>
        <button
          className="touch-btn"
          onClick={() => {
            if (selectedBtn === 0) alert('Запуск протокола экспедиции...');
            else if (selectedBtn === 1) {
              if (hasSave) alert('Загрузка...');
            } else alert('Настройки терминала...');
          }}
        >
          [ ENTER ]
        </button>
        <button
          className="touch-btn"
          onClick={() => setSelectedBtn((prev) => (prev < 2 ? prev + 1 : 0))}
        >
          ▼ ВНИЗ
        </button>
      </div>
    </div>
  );
};
