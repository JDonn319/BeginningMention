import React, { useEffect, useRef, useState } from 'react';
import {
  INITIAL_PARTY,
  HARPY_CRATER_BOSS,
  CRATER_GROUND_SYMBOLS,
  BattleHero
} from '../templates/asciiModels';

interface FloatingDmg {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
}

export const MainMenuScreen: React.FC = () => {
  // Боевое состояние
  const [party, setParty] = useState<BattleHero[]>(INITIAL_PARTY);
  const [activeHeroIdx, setActiveHeroIdx] = useState<number>(0);
  const [bossHp, setBossHp] = useState<number>(910);
  const [bossMaxHp] = useState<number>(1000);

  // Анимация траектории "A T T A C K"
  const [attackLettersT, setAttackLettersT] = useState<number>(-1);
  const [isBossHurt, setIsBossHurt] = useState<boolean>(false);
  const [floatingDamages, setFloatingDamages] = useState<FloatingDmg[]>([]);

  // Меню выбора действия
  const [actionCol, setActionCol] = useState<'LEFT' | 'RIGHT'>('LEFT');
  const [actionRow, setActionRow] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const activeHero = party[activeHeroIdx];

  // Смещение ландшафта (кратера)
  const getGroundElevation = (worldX: number, baseRow: number) => {
    return Math.floor(
      baseRow +
      Math.sin(worldX * 0.12) * 2.2 +
      Math.cos(worldX * 0.05) * 1.8
    );
  };

  // Запуск атаки "A T T A C K"
  const triggerAttack = () => {
    if (attackLettersT >= 0) return; // уже анимируется

    const startTime = Date.now();
    const duration = 750;

    const animInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      setAttackLettersT(progress);

      if (progress >= 1) {
        clearInterval(animInterval);
        setAttackLettersT(-1);

        // Удар по боссу
        const dmg = Math.floor(Math.random() * 40) + 70;
        setBossHp((prev) => Math.max(0, prev - dmg));
        setIsBossHurt(true);

        // Вылетающие цифры урона
        const newDmg: FloatingDmg = {
          id: Date.now(),
          text: dmg > 95 ? `Critical -${dmg}` : `-${dmg}`,
          x: 75 + (Math.random() - 0.5) * 4,
          y: 28,
          color: dmg > 95 ? '#ff0033' : '#ff3333',
          alpha: 1.0
        };
        setFloatingDamages((prev) => [...prev, newDmg]);

        setTimeout(() => {
          setIsBossHurt(false);
          // Переход хода к следующему герою
          setActiveHeroIdx((prev) => (prev + 1) % party.length);
        }, 350);
      }
    }, 20);
  };

  // Анимация всплывающего урона
  useEffect(() => {
    if (floatingDamages.length === 0) return;
    const interval = setInterval(() => {
      setFloatingDamages((prev) =>
        prev
          .map((d) => ({ ...d, y: d.y - 0.4, alpha: d.alpha - 0.03 }))
          .filter((d) => d.alpha > 0)
      );
    }, 30);
    return () => clearInterval(interval);
  }, [floatingDamages]);

  // Главный цикл рендера боевой сцены
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

      // Фон: глубочайший черный космос
      ctx.fillStyle = '#02040b';
      ctx.fillRect(0, 0, w, h);

      // Фиксированный размер сетки
      const CELL_W = 10;
      const CELL_H = 14;
      const cols = Math.ceil(w / CELL_W);
      const rows = Math.ceil(h / CELL_H);

      ctx.font = `${CELL_H}px "Fira Code", monospace`;
      ctx.textBaseline = 'top';

      const baseGroundRow = Math.floor(rows * 0.70);
      const bossCol = cols - 28;
      const bossRow = baseGroundRow - 12;

      // 1. ФОНОВЫЕ СИСТЕМНЫЕ СЛОВА (RESET, SWITCH, SoCKET)
      const matrixWords = [
        { word: 'RESET', x: Math.floor(cols * 0.5), y: 8 },
        { word: 'SWITCH', x: Math.floor(cols * 0.58), y: 12 },
        { word: 'SoCKET', x: Math.floor(cols * 0.45), y: 19 }
      ];
      matrixWords.forEach((mw) => {
        ctx.fillStyle = 'rgba(25, 45, 95, 0.28)';
        ctx.fillText(mw.word, mw.x * CELL_W, mw.y * CELL_H);
      });

      // Мелкие мерцающие точки на фоне
      for (let r = 0; r < baseGroundRow; r += 2) {
        for (let c = 0; c < cols; c += 3) {
          if ((c * 17 + r * 31) % 100 < 5) {
            ctx.fillStyle = 'rgba(30, 60, 130, 0.15)';
            ctx.fillText('.', c * CELL_W, r * CELL_H);
          }
        }
      }

      // 2. ВОЛНИСТЫЙ РЕЛЬЕФ КРАТЕРА ИЗ БУКВ (y+a*p+G*r+)
      for (let sc = 0; sc < cols; sc++) {
        const gRow = getGroundElevation(sc, baseGroundRow);
        for (let r = gRow; r < rows; r++) {
          const depth = r - gRow;
          const lineStr = CRATER_GROUND_SYMBOLS[depth % CRATER_GROUND_SYMBOLS.length];
          const ch = lineStr[sc % lineStr.length];

          // Фиолетово-синяя палитра с подсветкой гребней
          let col = '#1e2238';
          if (depth === 0) col = '#4c5270';
          else if (depth === 1) col = '#343854';
          else if (depth < 4) col = '#22253d';

          ctx.fillStyle = col;
          ctx.fillText(ch, sc * CELL_W, r * CELL_H);
        }
      }

      // 3. БОСС ХАРПИЯ (HARPY CRATER)
      const bossShakeX = isBossHurt ? (Math.random() - 0.5) * 0.8 : 0;
      HARPY_CRATER_BOSS.forEach((lineObj, li) => {
        for (let ci = 0; ci < lineObj.text.length; ci++) {
          const ch = lineObj.text[ci];
          if (ch === ' ') continue;

          // Подсветка глаз 0 0 белым
          if (li === 1 && (ch === '0')) {
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 6;
          } else {
            ctx.fillStyle = lineObj.color;
            ctx.shadowColor = lineObj.color;
            ctx.shadowBlur = 4;
          }
          ctx.fillText(ch, (bossCol + ci + bossShakeX) * CELL_W, (bossRow + li) * CELL_H);
          ctx.shadowBlur = 0;
        }
      });

      // Искры F P Q L E над головой босса при получении урона
      if (isBossHurt) {
        const sparks = ['F', 'P', 'Q', 'L', 'E', '9', '*'];
        for (let i = 0; i < 12; i++) {
          const sx = bossCol + 6 + (Math.random() - 0.5) * 8;
          const sy = bossRow - 4 + (Math.random() - 0.5) * 4;
          ctx.fillStyle = '#ffea00';
          ctx.fillText(sparks[i % sparks.length], sx * CELL_W, sy * CELL_H);
        }
      }

      // 4. ГЕРОИ НА ПОЛЕ БОЯ
      party.forEach((hero, idx) => {
        const hElevation = getGroundElevation(hero.worldX, baseGroundRow) + hero.worldYOffset;
        const isActive = idx === activeHeroIdx;

        // Если герой активен — рисуем рамку таргета как в референсе
        if (isActive) {
          ctx.fillStyle = '#ff8800';
          ctx.shadowColor = '#ff8800';
          ctx.shadowBlur = 5;

          // Углы рамки
          ctx.fillText('+--   --+', (hero.worldX - 2) * CELL_W, (hElevation - 4) * CELL_H);
          ctx.fillText('|       |', (hero.worldX - 2) * CELL_W, (hElevation - 3) * CELL_H);
          ctx.fillText('|       |', (hero.worldX - 2) * CELL_W, (hElevation - 2) * CELL_H);
          ctx.fillText('+--   --+', (hero.worldX - 2) * CELL_W, (hElevation - 0) * CELL_H);

          // Имя и HP рядом
          ctx.fillStyle = '#ffffff';
          ctx.fillText(hero.name, (hero.worldX + 7) * CELL_W, (hElevation - 3) * CELL_H);
          ctx.fillStyle = '#22c55e';
          ctx.fillText(`${hero.hp}/${hero.maxHp}`, (hero.worldX + 7) * CELL_W, (hElevation - 2) * CELL_H);
          ctx.shadowBlur = 0;
        } else {
          // Имя и HP неактивных героев внизу
          ctx.fillStyle = '#94a3b8';
          ctx.font = `${CELL_H * 0.85}px "Fira Code", monospace`;
          ctx.fillText(hero.name, (hero.worldX - 1) * CELL_W, (hElevation + 1) * CELL_H);
          ctx.fillStyle = hero.hp < 60 ? '#ef4444' : '#22c55e';
          ctx.fillText(`${hero.hp}/${hero.maxHp}`, (hero.worldX - 1) * CELL_W, (hElevation + 2) * CELL_H);
          ctx.font = `${CELL_H}px "Fira Code", monospace`;
        }

        // Фигурка героя
        ctx.fillStyle = hero.color;
        ctx.shadowColor = hero.color;
        ctx.shadowBlur = 3;
        ctx.fillText(hero.charHead, hero.worldX * CELL_W, (hElevation - 3) * CELL_H);
        ctx.fillText(hero.charBody, hero.worldX * CELL_W, (hElevation - 2) * CELL_H);
        ctx.fillText(hero.charLegs, hero.worldX * CELL_W, (hElevation - 1) * CELL_H);
        ctx.shadowBlur = 0;
      });

      // 5. ПОЛЕТ НАДПИСИ "A  T  T  A  C  K" К БОССУ
      if (attackLettersT >= 0) {
        const letters = ['A', 'T', 'T', 'A', 'C', 'K'];
        const startX = activeHero.worldX + 4;
        const startY = getGroundElevation(activeHero.worldX, baseGroundRow) - 2;
        const targetX = bossCol + 4;
        const targetY = bossRow + 4;

        letters.forEach((char, li) => {
          const letterDelay = li * 0.08;
          const letterProgress = Math.max(0, Math.min(1, (attackLettersT - letterDelay) / 0.6));
          if (letterProgress > 0 && letterProgress < 1) {
            // Параболическая траектория
            const curX = startX + (targetX - startX) * letterProgress;
            const curY = startY + (targetY - startY) * letterProgress - Math.sin(letterProgress * Math.PI) * 4;

            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 8;
            ctx.fillText(char, curX * CELL_W, curY * CELL_H);
            ctx.shadowBlur = 0;
          }
        });
      }

      // 6. ВСПЛЫВАЮЩИЙ УРОН
      floatingDamages.forEach((fd) => {
        ctx.fillStyle = fd.color;
        ctx.shadowColor = fd.color;
        ctx.shadowBlur = 8;
        ctx.font = `bold ${CELL_H * 1.2}px "Fira Code", monospace`;
        ctx.fillText(fd.text, fd.x * CELL_W, fd.y * CELL_H);
        ctx.shadowBlur = 0;
        ctx.font = `${CELL_H}px "Fira Code", monospace`;
      });

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [party, activeHeroIdx, bossHp, isBossHurt, attackLettersT, floatingDamages]);

  return (
    <div className="battle-viewport">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;700&display=swap');

        .battle-viewport {
          position: relative;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          background: #02040b;
          font-family: 'Fira Code', monospace;
          color: #fff;
          user-select: none;
          touch-action: none;
        }

        /* КАНВАС БОЕВОЙ СЦЕНЫ */
        .battle-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
        }

        /* CRT СКАНЛАЙНЫ */
        .crt-scanlines {
          position: absolute;
          inset: 0;
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.35) 50%);
          background-size: 100% 3px;
          pointer-events: none;
          z-index: 5;
        }

        /* СЛОЙ UI ВЕРХА И НИЗА */
        .ui-hud-layer {
          position: absolute;
          inset: 0;
          z-index: 10;
          pointer-events: none;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 8px 14px;
        }

        .hud-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          width: 100%;
        }

        /* ЛЕВАЯ ВЕРХНЯЯ ЧАСТЬ: ДАННЫЕ ОРУЖИЯ И МЕНЮ СПОСОБНОСТЕЙ */
        .weapon-header {
          font-size: 13px;
          color: #22c55e;
          text-shadow: 0 0 5px #22c55e;
          margin-bottom: 6px;
        }

        .action-columns {
          display: flex;
          gap: 28px;
          pointer-events: auto;
        }

        .menu-col {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .menu-action-btn {
          background: transparent;
          border: none;
          color: #e2e8f0;
          font-family: 'Fira Code', monospace;
          font-size: 13px;
          text-align: left;
          cursor: pointer;
          padding: 2px 6px;
          transition: all 0.1s;
        }

        .menu-action-btn.active {
          color: #ff9900;
          text-shadow: 0 0 8px #ff9900;
        }

        .menu-action-btn:active {
          background: #ff9900;
          color: #000;
        }

        /* ЦЕНТР: НАЗВАНИЕ ЛОКАЦИИ */
        .crater-title {
          font-size: 14px;
          color: #38bdf8;
          text-shadow: 0 0 8px #0284c7;
          letter-spacing: 1px;
        }

        /* ПРАВЫЙ ВЕРХ: КНОПКИ CONSOLE И HACK */
        .hud-top-right {
          display: flex;
          flex-direction: column;
          gap: 6px;
          pointer-events: auto;
        }

        .bracket-box-btn {
          background: rgba(10, 20, 40, 0.7);
          border: 1px solid #ff9900;
          color: #ff9900;
          font-family: inherit;
          font-size: 12px;
          font-weight: bold;
          padding: 4px 10px;
          cursor: pointer;
          box-shadow: 0 0 8px rgba(255, 153, 0, 0.3);
        }

        .bracket-box-btn.hack {
          border-color: #22c55e;
          color: #22c55e;
          box-shadow: 0 0 8px rgba(34, 197, 94, 0.3);
        }

        /* НИЖНЯЯ ПАНЕЛЬ: ТАЙМЛАЙН ОЧЕРЕДИ ХОДОВ И HP БОССА */
        .hud-bottom {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          width: 100%;
          border-top: 1px solid rgba(56, 189, 248, 0.2);
          padding-top: 6px;
          background: rgba(2, 6, 18, 0.85);
        }

        .timeline-wrapper {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .timeline-chips {
          display: flex;
          gap: 8px;
          font-size: 13px;
        }

        .timeline-chip {
          padding: 2px 4px;
        }

        .timeline-chip.active {
          color: #ffaa00;
          text-shadow: 0 0 8px #ffaa00;
          border-bottom: 2px solid #ffaa00;
        }

        .timeline-chip.boss {
          color: #ef4444;
          text-shadow: 0 0 8px #ef4444;
        }

        .ping-line {
          font-size: 11px;
          color: #f97316;
        }

        /* ПРАВЫЙ НИЖНИЙ УГОЛ: HP БОССА И БОМБА */
        .boss-stats-corner {
          display: flex;
          align-items: center;
          gap: 16px;
          pointer-events: auto;
        }

        .boss-hp-gauge {
          font-size: 14px;
          font-weight: bold;
          color: #22c55e;
          text-shadow: 0 0 8px #22c55e;
        }

        .bomb-slot {
          border: 1px dashed #ef4444;
          padding: 4px 8px;
          font-size: 10px;
          color: #ef4444;
          text-align: center;
          line-height: 1.2;
          cursor: pointer;
        }
      `}</style>

      {/* Сканирующие линии CRT */}
      <div className="crt-scanlines" />

      {/* Канвас рендера сцены */}
      <canvas ref={canvasRef} className="battle-canvas" />

      {/* ИНТЕРФЕЙС EFFULGENCE RPG */}
      <div className="ui-hud-layer">
        {/* ВЕРХНЯЯ ЧАСТЬ */}
        <div className="hud-top">
          {/* ЛЕВО: ОРУЖИЕ И МЕНЮ СПОСОБНОСТЕЙ */}
          <div>
            <div className="weapon-header">
              {activeHero.name} &nbsp; {activeHero.weapon} &nbsp; | Tab X | INFO [Ctrl_RPM View]--
            </div>

            <div className="action-columns">
              {/* Левый столбец команд */}
              <div className="menu-col">
                <button
                  className={`menu-action-btn ${actionCol === 'LEFT' && actionRow === 0 ? 'active' : ''}`}
                  onClick={() => {
                    setActionCol('LEFT');
                    setActionRow(0);
                    triggerAttack();
                  }}
                >
                  &gt;&gt;&gt; Throw
                </button>
                <button
                  className={`menu-action-btn ${actionCol === 'LEFT' && actionRow === 1 ? 'active' : ''}`}
                  onClick={() => {
                    setActionCol('LEFT');
                    setActionRow(1);
                    triggerAttack();
                  }}
                >
                  &nbsp;&nbsp;&nbsp;&nbsp;Multi-Target Calc
                </button>
                <button
                  className={`menu-action-btn ${actionCol === 'LEFT' && actionRow === 2 ? 'active' : ''}`}
                  onClick={() => {
                    setActionCol('LEFT');
                    setActionRow(2);
                    triggerAttack();
                  }}
                >
                  &nbsp;&nbsp;&nbsp;&nbsp;Unique: Shot
                </button>
                <button
                  className={`menu-action-btn ${actionCol === 'LEFT' && actionRow === 3 ? 'active' : ''}`}
                  onClick={() => {
                    setActionCol('LEFT');
                    setActionRow(3);
                    triggerAttack();
                  }}
                >
                  &nbsp;&nbsp;&nbsp;&nbsp;Shield Burst (7)
                </button>
              </div>

              {/* Правый столбец команд */}
              <div className="menu-col">
                <button
                  className={`menu-action-btn ${actionCol === 'RIGHT' && actionRow === 0 ? 'active' : ''}`}
                  onClick={() => {
                    setActionCol('RIGHT');
                    setActionRow(0);
                    setActiveHeroIdx((prev) => (prev + 1) % party.length);
                  }}
                >
                  &nbsp;&nbsp;&nbsp;&nbsp;Skip Turn
                </button>
                <button
                  className={`menu-action-btn ${actionCol === 'RIGHT' && actionRow === 1 ? 'active' : ''}`}
                  onClick={() => {
                    setActionCol('RIGHT');
                    setActionRow(1);
                    setParty((prev) =>
                      prev.map((h, i) => (i === activeHeroIdx ? { ...h, worldX: h.worldX + 4 } : h))
                    );
                  }}
                >
                  &gt; Move Forward
                </button>
                <button
                  className={`menu-action-btn ${actionCol === 'RIGHT' && actionRow === 2 ? 'active' : ''}`}
                  onClick={() => {
                    setActionCol('RIGHT');
                    setActionRow(2);
                    setParty((prev) =>
                      prev.map((h, i) => (i === activeHeroIdx ? { ...h, worldX: h.worldX - 4 } : h))
                    );
                  }}
                >
                  &nbsp;&nbsp;Move Backward
                </button>
              </div>
            </div>
          </div>

          {/* ЦЕНТР: НАЗВАНИЕ БОССА / ЛОКАЦИИ */}
          <div className="crater-title">
            Harpy Crater (80%)
          </div>

          {/* ПРАВО: КОНСОЛЬ И ХАК */}
          <div className="hud-top-right">
            <button className="bracket-box-btn" onClick={() => alert('[CONSOLE] Доступ к терминалу открыт.')}>
              +=============+<br />
              | (Y) Console |<br />
              +=============+
            </button>
            <button className="bracket-box-btn hack" onClick={() => triggerAttack()}>
              +=============+<br />
              | H(Ξ) : HACK |<br />
              +=============+
            </button>
          </div>
        </div>

        {/* НИЖНЯЯ ЧАСТЬ: ОЧЕРЕДЬ ТАЙМЛАЙНА И ЗДОРОВЬЕ БОССА */}
        <div className="hud-bottom">
          <div className="timeline-wrapper">
            <div className="timeline-chips">
              <span className={`timeline-chip ${activeHeroIdx === 0 ? 'active' : ''}`}>[Michael]</span>
              <span>+</span>
              <span className={`timeline-chip ${activeHeroIdx === 1 ? 'active' : ''}`}>[Jane]</span>
              <span>+</span>
              <span className={`timeline-chip ${activeHeroIdx === 2 ? 'active' : ''}`}>[Sebastian]</span>
              <span>+</span>
              <span className={`timeline-chip ${activeHeroIdx === 3 ? 'active' : ''}`}>[Demid]</span>
              <span>[Sparrow]</span>
              <span className="timeline-chip boss">&gt;[&lt;\Q/&gt;]&lt;</span>
            </div>
            <div className="ping-line">
              PING: &nbsp; 16 &nbsp;&nbsp; 17 &nbsp;&nbsp; 40 &nbsp;&nbsp; 42 &nbsp;&nbsp; 94 &nbsp;&nbsp; 106 &nbsp;&nbsp; 112
            </div>
          </div>

          {/* ЗДОРОВЬЕ БОССА И СЛОТ БОМБЫ */}
          <div className="boss-stats-corner">
            <div className="boss-hp-gauge">
              {bossHp} / {bossMaxHp}
            </div>
            <div className="bomb-slot" onClick={() => triggerAttack()}>
              T T T &nbsp; Glyph<br />
              ||||| &nbsp; Bomb<br />
              +===+ &nbsp; Del/Ξ
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
