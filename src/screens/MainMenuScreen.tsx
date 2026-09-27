import React, { useEffect, useRef, useState } from 'react';
import {
  INITIAL_PARTY,
  HARPY_FRAMES,
  CRATER_GROUND_SYMBOLS,
  TREE_TEMPLATES,
  GROUND_STAMPS,
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
  // Экраны: Меню или Битва
  const [currentScreen, setCurrentScreen] = useState<'MENU' | 'BATTLE'>('MENU');
  const [fadeOpacity, setFadeOpacity] = useState<number>(0);

  // Состояние меню
  const [menuSelectedIdx, setMenuSelectedIdx] = useState<number>(0);
  const [hasSave] = useState<boolean>(() => !!localStorage.getItem('bm_save'));

  // Состояние битвы
  const [party, setParty] = useState<BattleHero[]>(INITIAL_PARTY);
  const [activeHeroIdx, setActiveHeroIdx] = useState<number>(0);
  const [bossHp, setBossHp] = useState<number>(910);
  const [bossMaxHp] = useState<number>(1000);
  const [bossPhase, setBossPhase] = useState<'IDLE' | 'ATTACKING'>('IDLE');
  const [turnQueue, setTurnQueue] = useState<string[]>(['Michael', 'Jane', 'Sebastian', 'Demid', 'BOSS']);

  // Анимации ударов и урона
  const [attackLettersT, setAttackLettersT] = useState<number>(-1);
  const [bossAttackT, setBossAttackT] = useState<number>(-1);
  const [isBossHurt, setIsBossHurt] = useState<boolean>(false);
  const [floatingDamages, setFloatingDamages] = useState<FloatingDmg[]>([]);
  const [screenShake, setScreenShake] = useState<number>(0);

  // Выбор способности
  const [selectedSkillIdx, setSelectedSkillIdx] = useState<number>(0);

  const menuCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const battleCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const activeHero = party[activeHeroIdx] || party[0];

  // Переход из меню в бой
  const handleStartBattle = () => {
    setFadeOpacity(1);
    setTimeout(() => {
      setCurrentScreen('BATTLE');
      setTimeout(() => setFadeOpacity(0), 800);
    }, 600);
  };

  // Рельеф кратера
  const getGroundElevation = (worldX: number, baseRow: number) => {
    return Math.floor(
      baseRow +
      Math.sin(worldX * 0.1) * 2.2 +
      Math.cos(worldX * 0.04) * 1.8
    );
  };

  // ----------------------------------------------------
  // ХОД ИГРОКА (АТАКА ВЫБРАННОЙ СПОСОБНОСТЬЮ)
  // ----------------------------------------------------
  const executePlayerAction = (skillIdx: number) => {
    if (attackLettersT >= 0 || bossAttackT >= 0 || turnQueue[0] === 'BOSS') return;

    setSelectedSkillIdx(skillIdx);
    const skill = activeHero.skills[skillIdx];

    // Если способность наносит урон
    if (skill.type === 'ATTACK' || skill.type === 'SPECIAL') {
      const startTime = Date.now();
      const duration = 650;

      const animInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(1, elapsed / duration);
        setAttackLettersT(progress);

        if (progress >= 1) {
          clearInterval(animInterval);
          setAttackLettersT(-1);

          const dmg = (skill.damage || 70) + Math.floor(Math.random() * 25);
          setBossHp((prev) => Math.max(0, prev - dmg));
          setIsBossHurt(true);
          setScreenShake(4);

          // Всплывающий урон
          const newDmg: FloatingDmg = {
            id: Date.now(),
            text: dmg > 100 ? `Critical -${dmg}` : `-${dmg}`,
            x: 74 + (Math.random() - 0.5) * 4,
            y: 18,
            color: dmg > 100 ? '#ff0033' : '#ff3333',
            alpha: 1.0
          };
          setFloatingDamages((prev) => [...prev, newDmg]);

          setTimeout(() => {
            setIsBossHurt(false);
            setScreenShake(0);
            advanceTurnQueue();
          }, 350);
        }
      }, 20);
    } else if (skill.type === 'HEAL') {
      // Лечение союзников
      setParty((prev) =>
        prev.map((h) => ({ ...h, hp: Math.min(h.maxHp, h.hp + 45) }))
      );
      const newHeal: FloatingDmg = {
        id: Date.now(),
        text: '+45 HP',
        x: activeHero.gridX,
        y: 20,
        color: '#22c55e',
        alpha: 1.0
      };
      setFloatingDamages((prev) => [...prev, newHeal]);
      advanceTurnQueue();
    } else {
      // Бафф / сканирование
      advanceTurnQueue();
    }
  };

  // Перемещение героя вперед / назад
  const moveHero = (delta: number) => {
    setParty((prev) =>
      prev.map((h, i) => (i === activeHeroIdx ? { ...h, gridX: Math.max(8, Math.min(52, h.gridX + delta)) } : h))
    );
  };

  // ----------------------------------------------------
  // СИСТЕМА ОЧЕРЕДИ ХОДОВ И ХОД БОССА
  // ----------------------------------------------------
  const advanceTurnQueue = () => {
    const nextQueue = [...turnQueue.slice(1), turnQueue[0]];
    setTurnQueue(nextQueue);

    const nextTurn = nextQueue[0];
    if (nextTurn === 'BOSS') {
      // ЗАПУСК ХОДА БОССА
      setTimeout(() => executeBossTurn(nextQueue), 700);
    } else {
      const nextIdx = party.findIndex((h) => h.name === nextTurn);
      if (nextIdx !== -1) setActiveHeroIdx(nextIdx);
    }
  };

  // Ход Босса (Выпад, атака по отряду, урон)
  const executeBossTurn = (currentQueue: string[]) => {
    setBossPhase('ATTACKING');

    const startTime = Date.now();
    const duration = 700;

    const bossAnim = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      setBossAttackT(progress);

      if (progress >= 1) {
        clearInterval(bossAnim);
        setBossAttackT(-1);
        setBossPhase('IDLE');
        setScreenShake(6);

        // Босс бьет случайного героя
        const targetIdx = Math.floor(Math.random() * party.length);
        const targetHero = party[targetIdx];
        const bossDmg = Math.floor(Math.random() * 35) + 35;

        setParty((prev) =>
          prev.map((h, i) => (i === targetIdx ? { ...h, hp: Math.max(0, h.hp - bossDmg) } : h))
        );

        const newDmg: FloatingDmg = {
          id: Date.now(),
          text: `-${bossDmg}`,
          x: targetHero.gridX + 2,
          y: 22,
          color: '#ef4444',
          alpha: 1.0
        };
        setFloatingDamages((prev) => [...prev, newDmg]);

        setTimeout(() => {
          setScreenShake(0);
          // Переход хода дальше
          const afterBossQueue = [...currentQueue.slice(1), currentQueue[0]];
          setTurnQueue(afterBossQueue);
          const nextIdx = party.findIndex((h) => h.name === afterBossQueue[0]);
          setActiveHeroIdx(nextIdx !== -1 ? nextIdx : 0);
        }, 500);
      }
    }, 20);
  };

  // Анимация всплывающих чисел урона
  useEffect(() => {
    if (floatingDamages.length === 0) return;
    const interval = setInterval(() => {
      setFloatingDamages((prev) =>
        prev
          .map((d) => ({ ...d, y: d.y - 0.35, alpha: d.alpha - 0.03 }))
          .filter((d) => d.alpha > 0)
      );
    }, 30);
    return () => clearInterval(interval);
  }, [floatingDamages]);

  // ====================================================
  // 1. РЕНДЕР ГЛАВНОГО МЕНЮ
  // ====================================================
  useEffect(() => {
    if (currentScreen !== 'MENU') return;
    const canvas = menuCanvasRef.current;
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

      // Виртуальная адаптивная сетка
      const CELL_W = w / 100;
      const CELL_H = h / 42;
      ctx.font = `${Math.floor(CELL_H * 0.95)}px "Fira Code", monospace`;
      ctx.textBaseline = 'top';

      // Звезды
      for (let r = 0; r < 20; r++) {
        for (let c = 0; c < 100; c += 2) {
          if ((c * 23 + r * 67) % 100 < 4) {
            ctx.fillStyle = `rgba(180, 220, 255, ${0.08 + Math.sin(tick * 0.04 + c) * 0.04})`;
            ctx.fillText('.', c * CELL_W, r * CELL_H);
          }
        }
      }

      // Луна
      ['  .---.  ', ' /     \\ ', '|  (o)  |', ' \\     / ', "  '---'  "].forEach((l, i) => {
        ctx.fillStyle = '#e0f2fe';
        ctx.fillText(l, 86 * CELL_W, (3 + i) * CELL_H);
      });

      // Ели
      for (let c = 4; c < 94; c += 16) {
        const tree = TREE_TEMPLATES[c % 2];
        ctx.fillStyle = '#0b192e';
        tree.forEach((line, li) => ctx.fillText(line, c * CELL_W, (21 - tree.length + li) * CELL_H));
      }

      // Земля
      for (let c = 0; c < 100; c++) {
        const gStart = Math.floor(21 + Math.sin(c * 0.1) * 2);
        for (let r = gStart; r < 42; r++) {
          const depth = r - gStart;
          let ch = '#';
          let color = '#081120';
          if (depth === 0) { ch = GROUND_STAMPS[0][c % GROUND_STAMPS[0].length]; color = '#1e3a6a'; }
          else if (depth === 1) { ch = GROUND_STAMPS[1][c % GROUND_STAMPS[1].length]; color = '#172d54'; }
          ctx.fillStyle = color;
          ctx.fillText(ch, c * CELL_W, r * CELL_H);
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [currentScreen]);

  // ====================================================
  // 2. РЕНДЕР БОЕВОЙ СЦЕНЫ (100% АДАПТИВНАЯ СЕТКА)
  // ====================================================
  useEffect(() => {
    if (currentScreen !== 'BATTLE') return;
    const canvas = battleCanvasRef.current;
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

      // Тряска экрана от сильных ударов
      const shakeX = screenShake > 0 ? (Math.random() - 0.5) * screenShake * 2 : 0;
      const shakeY = screenShake > 0 ? (Math.random() - 0.5) * screenShake * 2 : 0;
      ctx.translate(shakeX, shakeY);

      ctx.fillStyle = '#02040b';
      ctx.fillRect(0, 0, w, h);

      // Виртуальная сетка 100 x 42 — Идеально помещается на любом телефоне
      const GRID_COLS = 100;
      const GRID_ROWS = 42;
      const CELL_W = w / GRID_COLS;
      const CELL_H = h / GRID_ROWS;

      ctx.font = `${Math.floor(CELL_H * 0.95)}px "Fira Code", monospace`;
      ctx.textBaseline = 'top';

      const baseGroundRow = 28;
      const bossCol = 68;
      const bossRow = baseGroundRow - 12;

      // 1. СИСТЕМНЫЕ СЛОВА НА ФОНЕ
      const matrixWords = [
        { word: 'RESET', x: 48, y: 7 },
        { word: 'SWITCH', x: 58, y: 11 },
        { word: 'SoCKET', x: 44, y: 17 }
      ];
      matrixWords.forEach((mw) => {
        ctx.fillStyle = 'rgba(25, 45, 95, 0.28)';
        ctx.fillText(mw.word, mw.x * CELL_W, mw.y * CELL_H);
      });

      // 2. ВОЛНИСТАЯ ЗЕМЛЯ КРАТЕРА (y+a*p+G*r+)
      for (let sc = 0; sc < GRID_COLS; sc++) {
        const gRow = getGroundElevation(sc, baseGroundRow);
        for (let r = gRow; r < GRID_ROWS; r++) {
          const depth = r - gRow;
          const lineStr = CRATER_GROUND_SYMBOLS[depth % CRATER_GROUND_SYMBOLS.length];
          const ch = lineStr[sc % lineStr.length];

          let col = '#1e2238';
          if (depth === 0) col = '#4c5270';
          else if (depth === 1) col = '#343854';
          else if (depth < 4) col = '#22253d';

          ctx.fillStyle = col;
          ctx.fillText(ch, sc * CELL_W, r * CELL_H);
        }
      }

      // 3. БОСС ХАРПИЯ (АНИМАЦИЯ ПАРЕНИЯ ИЛИ УДАРА)
      const currentBossModel = bossPhase === 'ATTACKING' ? HARPY_FRAMES.attack : HARPY_FRAMES.idle;
      const bossFloatY = bossPhase === 'IDLE' ? Math.sin(tick * 0.08) * 0.6 : 0;
      const bossHurtDX = isBossHurt ? (Math.random() - 0.5) * 1.5 : 0;

      currentBossModel.forEach((lineObj, li) => {
        for (let ci = 0; ci < lineObj.text.length; ci++) {
          const ch = lineObj.text[ci];
          if (ch === ' ') continue;

          if (li <= 1 && (ch === '0' || ch === '[' || ch === ']')) {
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#ff0033';
            ctx.shadowBlur = 8;
          } else {
            ctx.fillStyle = lineObj.color;
            ctx.shadowColor = lineObj.color;
            ctx.shadowBlur = 3;
          }
          ctx.fillText(ch, (bossCol + ci + bossHurtDX) * CELL_W, (bossRow + li + bossFloatY) * CELL_H);
          ctx.shadowBlur = 0;
        }
      });

      // Искры F P Q L E над головой босса при получении урона
      if (isBossHurt) {
        const sparks = ['F', 'P', 'Q', 'L', 'E', '9', '*'];
        for (let i = 0; i < 14; i++) {
          const sx = bossCol + 6 + (Math.random() - 0.5) * 10;
          const sy = bossRow - 4 + (Math.random() - 0.5) * 4;
          ctx.fillStyle = '#ffea00';
          ctx.fillText(sparks[i % sparks.length], sx * CELL_W, sy * CELL_H);
        }
      }

      // 4. ГЕРОИ НА ПОЛЕ БОЯ
      party.forEach((hero, idx) => {
        const hElevation = getGroundElevation(hero.gridX, baseGroundRow) + hero.rowOffset;
        const isActive = idx === activeHeroIdx && turnQueue[0] !== 'BOSS';

        // Рамка таргета +-- --+ на активном герое
        if (isActive) {
          ctx.fillStyle = '#ff8800';
          ctx.fillText('+--   --+', (hero.gridX - 2) * CELL_W, (hElevation - 4) * CELL_H);
          ctx.fillText('|       |', (hero.gridX - 2) * CELL_W, (hElevation - 3) * CELL_H);
          ctx.fillText('|       |', (hero.gridX - 2) * CELL_W, (hElevation - 2) * CELL_H);
          ctx.fillText('+--   --+', (hero.gridX - 2) * CELL_W, (hElevation - 0) * CELL_H);

          // Имя и HP
          ctx.fillStyle = '#ffffff';
          ctx.fillText(hero.name, (hero.gridX + 7) * CELL_W, (hElevation - 3) * CELL_H);
          ctx.fillStyle = '#22c55e';
          ctx.fillText(`${hero.hp}/${hero.maxHp}`, (hero.gridX + 7) * CELL_W, (hElevation - 2) * CELL_H);
        } else {
          // Имя и HP внизу
          ctx.fillStyle = '#94a3b8';
          ctx.font = `${Math.floor(CELL_H * 0.8)}px "Fira Code", monospace`;
          ctx.fillText(hero.name, (hero.gridX - 1) * CELL_W, (hElevation + 1) * CELL_H);
          ctx.fillStyle = hero.hp < 60 ? '#ef4444' : '#22c55e';
          ctx.fillText(`${hero.hp}/${hero.maxHp}`, (hero.gridX - 1) * CELL_W, (hElevation + 2) * CELL_H);
          ctx.font = `${Math.floor(CELL_H * 0.95)}px "Fira Code", monospace`;
        }

        // Фигура героя
        ctx.fillStyle = hero.color;
        ctx.fillText(hero.charHead, hero.gridX * CELL_W, (hElevation - 3) * CELL_H);
        ctx.fillText(hero.charBody, hero.gridX * CELL_W, (hElevation - 2) * CELL_H);
        ctx.fillText(hero.charLegs, hero.gridX * CELL_W, (hElevation - 1) * CELL_H);
      });

      // 5. АНИМАЦИЯ ПОЛЕТА БУКВ "A T T A C K" ОТ ГЕРОЯ К БОССУ
      if (attackLettersT >= 0) {
        const letters = ['A', 'T', 'T', 'A', 'C', 'K'];
        const startX = activeHero.gridX + 4;
        const startY = getGroundElevation(activeHero.gridX, baseGroundRow) - 2;
        const targetX = bossCol + 6;
        const targetY = bossRow + 4;

        letters.forEach((char, li) => {
          const letterDelay = li * 0.08;
          const letterProgress = Math.max(0, Math.min(1, (attackLettersT - letterDelay) / 0.6));
          if (letterProgress > 0 && letterProgress < 1) {
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

      // 6. АНИМАЦИЯ АТАКИ БОССА (СНАРЯД "<<<<")
      if (bossAttackT >= 0) {
        const startX = bossCol - 2;
        const startY = bossRow + 4;
        const targetX = activeHero.gridX + 2;
        const targetY = getGroundElevation(activeHero.gridX, baseGroundRow) - 2;

        const curX = startX + (targetX - startX) * bossAttackT;
        const curY = startY + (targetY - startY) * bossAttackT;

        ctx.fillStyle = '#ff2233';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 10;
        ctx.fillText('<<<<', curX * CELL_W, curY * CELL_H);
        ctx.shadowBlur = 0;
      }

      // 7. ВСПЛЫВАЮЩИЙ УРОН
      floatingDamages.forEach((fd) => {
        ctx.fillStyle = fd.color;
        ctx.shadowColor = fd.color;
        ctx.shadowBlur = 6;
        ctx.font = `bold ${Math.floor(CELL_H * 1.2)}px "Fira Code", monospace`;
        ctx.fillText(fd.text, fd.x * CELL_W, fd.y * CELL_H);
        ctx.shadowBlur = 0;
        ctx.font = `${Math.floor(CELL_H * 0.95)}px "Fira Code", monospace`;
      });

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [currentScreen, party, activeHeroIdx, bossHp, isBossHurt, attackLettersT, bossAttackT, bossPhase, floatingDamages, screenShake, turnQueue]);

  return (
    <div className="bm-root-viewport">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Fira+Code:wght@400;700&display=swap');

        .bm-root-viewport {
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

        .screen-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
        }

        .crt-scanlines {
          position: absolute;
          inset: 0;
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.35) 50%);
          background-size: 100% 3px;
          pointer-events: none;
          z-index: 5;
        }

        .fade-overlay {
          position: absolute;
          inset: 0;
          background: #000;
          z-index: 100;
          pointer-events: none;
          transition: opacity 0.8s ease;
        }

        /* БЛОКИРОВКА ПОРТРЕТНОГО РЕЖИМА */
        .portrait-blocker {
          display: none;
        }
        @media (orientation: portrait) {
          .portrait-blocker {
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

        /* СТИЛИ ГЛАВНОГО МЕНЮ */
        .menu-layer {
          position: absolute;
          inset: 0;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding-top: 15px;
        }
        .big-logo {
          max-height: clamp(100px, 35vh, 220px);
          max-width: 85vw;
          object-fit: contain;
          margin-bottom: clamp(10px, 3vh, 25px);
          filter: drop-shadow(0 0 25px rgba(0, 240, 255, 0.4));
        }
        .menu-list {
          width: 100vw;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .console-row {
          width: 100vw;
          height: clamp(34px, 7.5vh, 46px);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Press Start 2P', monospace;
          font-size: clamp(10px, 2.2vh, 14px);
          cursor: pointer;
          color: #94a3b8;
          background: transparent;
          transition: background 0.12s, color 0.12s;
        }
        .console-row.active {
          background: rgba(0, 240, 255, 0.18);
          color: #00f0ff;
          text-shadow: 0 0 10px #00f0ff;
          box-shadow: inset 0 0 15px rgba(0, 240, 255, 0.15);
        }
        .console-row.disabled {
          color: #334155;
          cursor: not-allowed;
        }

        /* ИНТЕРФЕЙС БИТВЫ */
        .battle-hud {
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

        .weapon-header {
          font-size: clamp(11px, 2.2vh, 13px);
          color: #22c55e;
          text-shadow: 0 0 5px #22c55e;
          margin-bottom: 4px;
        }

        .action-columns {
          display: flex;
          gap: 20px;
          pointer-events: auto;
        }
        .menu-col {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .menu-action-btn {
          background: transparent;
          border: none;
          color: #e2e8f0;
          font-family: 'Fira Code', monospace;
          font-size: clamp(11px, 2.3vh, 13px);
          text-align: left;
          cursor: pointer;
          padding: 2px 6px;
        }
        .menu-action-btn.active {
          color: #ff9900;
          text-shadow: 0 0 8px #ff9900;
        }
        .menu-action-btn:active {
          background: #ff9900;
          color: #000;
        }

        .crater-title {
          font-size: clamp(12px, 2.5vh, 15px);
          color: #38bdf8;
          text-shadow: 0 0 8px #0284c7;
          letter-spacing: 1px;
        }

        .hud-top-right {
          display: flex;
          flex-direction: column;
          gap: 5px;
          pointer-events: auto;
        }
        .bracket-box-btn {
          background: rgba(10, 20, 40, 0.7);
          border: 1px solid #ff9900;
          color: #ff9900;
          font-family: inherit;
          font-size: 11px;
          padding: 3px 8px;
          cursor: pointer;
        }
        .bracket-box-btn.hack {
          border-color: #22c55e;
          color: #22c55e;
        }

        .hud-bottom {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          width: 100%;
          border-top: 1px solid rgba(56, 189, 248, 0.2);
          padding-top: 5px;
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
          font-size: clamp(11px, 2.2vh, 13px);
        }
        .timeline-chip.active {
          color: #ffaa00;
          border-bottom: 2px solid #ffaa00;
        }
        .timeline-chip.boss {
          color: #ef4444;
          text-shadow: 0 0 8px #ef4444;
        }
        .ping-line {
          font-size: 10px;
          color: #f97316;
        }

        .boss-stats-corner {
          display: flex;
          align-items: center;
          gap: 14px;
          pointer-events: auto;
        }
        .boss-hp-gauge {
          font-size: clamp(12px, 2.5vh, 14px);
          font-weight: bold;
          color: #22c55e;
          text-shadow: 0 0 6px #22c55e;
        }
        .bomb-slot {
          border: 1px dashed #ef4444;
          padding: 3px 6px;
          font-size: 9px;
          color: #ef4444;
          text-align: center;
          cursor: pointer;
        }
      `}</style>

      {/* Затемнение при переходах */}
      <div className="fade-overlay" style={{ opacity: fadeOpacity }} />

      {/* Блокировка поворота */}
      <div className="portrait-blocker">
        <div>[ ! ] ПОВЕРНИТЕ ЭКРАН</div>
        <div style={{ fontSize: '10px', marginTop: '16px', color: '#64748b' }}>
          BEGINNING MENTION ТРЕБУЕТ ГОРИЗОНТАЛЬНЫЙ РЕЖИМ (LANDSCAPE)
        </div>
      </div>

      <div className="crt-scanlines" />

      {/* ================= 1. ГЛАВНОЕ МЕНЮ ================= */}
      {currentScreen === 'MENU' && (
        <>
          <canvas ref={menuCanvasRef} className="screen-canvas" />
          <div className="menu-layer">
            <img
              src="/basiclogo.png"
              alt="BeginningMention"
              className="big-logo"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <div className="menu-list">
              <div
                className={`console-row ${menuSelectedIdx === 0 ? 'active' : ''}`}
                onPointerEnter={() => setMenuSelectedIdx(0)}
                onClick={handleStartBattle}
              >
                {menuSelectedIdx === 0 ? '> НОВАЯ ЭКСПЕДИЦИЯ' : '  НОВАЯ ЭКСПЕДИЦИЯ'}
              </div>
              <div
                className={`console-row ${!hasSave ? 'disabled' : ''} ${menuSelectedIdx === 1 ? 'active' : ''}`}
                onPointerEnter={() => setMenuSelectedIdx(1)}
              >
                {menuSelectedIdx === 1 ? '> ЗАГРУЗКИ (LOCKED)' : '  ЗАГРУЗКИ (LOCKED)'}
              </div>
              <div
                className={`console-row ${menuSelectedIdx === 2 ? 'active' : ''}`}
                onPointerEnter={() => setMenuSelectedIdx(2)}
              >
                {menuSelectedIdx === 2 ? '> НАСТРОЙКИ' : '  НАСТРОЙКИ'}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ================= 2. БОЕВАЯ АРЕНА (HARPY CRATER) ================= */}
      {currentScreen === 'BATTLE' && (
        <>
          <canvas ref={battleCanvasRef} className="screen-canvas" />

          <div className="battle-hud">
            {/* ВЕРХНЯЯ ПАНЕЛЬ */}
            <div className="hud-top">
              <div>
                <div className="weapon-header">
                  {turnQueue[0] === 'BOSS'
                    ? '/// ВНИМАНИЕ: ХОД БОССА (ХАРПИЯ АТАКУЕТ) ///'
                    : `${activeHero.name}   ${activeHero.weapon} | Tab X | INFO [Ctrl_RPM View]--`}
                </div>

                {turnQueue[0] !== 'BOSS' ? (
                  <div className="action-columns">
                    {/* Левый столбец уникальных способностей активного героя */}
                    <div className="menu-col">
                      {activeHero.skills.map((skill, sIdx) => (
                        <button
                          key={skill.id}
                          className={`menu-action-btn ${selectedSkillIdx === sIdx ? 'active' : ''}`}
                          onClick={() => executePlayerAction(sIdx)}
                        >
                          {skill.name}
                        </button>
                      ))}
                    </div>

                    {/* Правый столбец перемещения и пропуска */}
                    <div className="menu-col">
                      <button className="menu-action-btn" onClick={advanceTurnQueue}>
                        &nbsp;&nbsp;&nbsp;&nbsp;Skip Turn
                      </button>
                      <button className="menu-action-btn" onClick={() => moveHero(4)}>
                        &gt; Move Forward
                      </button>
                      <button className="menu-action-btn" onClick={() => moveHero(-4)}>
                        &nbsp;&nbsp;Move Backward
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: '#ef4444', fontSize: '13px', textShadow: '0 0 8px #ff0000' }}>
                    [ХАРПИЯ ГОТОВИТ ВЫПАД...]
                  </div>
                )}
              </div>

              {/* ЦЕНТР: ЛОКАЦИЯ */}
              <div className="crater-title">Harpy Crater (80%)</div>

              {/* ПРАВО: КОНСОЛЬ И ВЗЛОМ */}
              <div className="hud-top-right">
                <button className="bracket-box-btn" onClick={() => setCurrentScreen('MENU')}>
                  +=============+<br />
                  | (Y) Menu    |<br />
                  +=============+
                </button>
                <button
                  className="bracket-box-btn hack"
                  onClick={() => executePlayerAction(selectedSkillIdx)}
                >
                  +=============+<br />
                  | H(Ξ) : HACK |<br />
                  +=============+
                </button>
              </div>
            </div>

            {/* НИЖНЯЯ ПАНЕЛЬ: ОЧЕРЕДЬ ТАЙМЛАЙНА И HP БОССА */}
            <div className="hud-bottom">
              <div className="timeline-wrapper">
                <div className="timeline-chips">
                  {turnQueue.map((turnName, idx) => (
                    <React.Fragment key={idx}>
                      <span
                        className={`timeline-chip ${idx === 0 ? (turnName === 'BOSS' ? 'boss' : 'active') : ''}`}
                      >
                        {turnName === 'BOSS' ? '>[<\\Q/>]<' : `[${turnName}]`}
                      </span>
                      {idx < turnQueue.length - 1 && <span>+</span>}
                    </React.Fragment>
                  ))}
                </div>
                <div className="ping-line">
                  PING: &nbsp; 16 &nbsp;&nbsp; 17 &nbsp;&nbsp; 40 &nbsp;&nbsp; 42 &nbsp;&nbsp; 94 &nbsp;&nbsp; 106 &nbsp;&nbsp; 112
                </div>
              </div>

              {/* HP БОССА И БОМБА */}
              <div className="boss-stats-corner">
                <div className="boss-hp-gauge">
                  {bossHp} / {bossMaxHp}
                </div>
                <div className="bomb-slot" onClick={() => executePlayerAction(3)}>
                  T T T &nbsp; Glyph<br />
                  ||||| &nbsp; Bomb<br />
                  +===+ &nbsp; Del/Ξ
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
