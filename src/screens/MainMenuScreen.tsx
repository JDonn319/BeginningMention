import React, { useEffect, useRef, useState } from 'react';
import {
  HERO_MODELS,
  GOBLIN_MODEL,
  BUSH_MODEL,
  TREE_TEMPLATES,
  KINGDOM_SPIRES,
  GROUND_STAMPS
} from '../templates/asciiModels';

// Состояния интерактивной кат-сцены
type CutscenePhase =
  | 'WAIT_START'       // Ждет тапа "Tap to start"
  | 'CAMP_PEACE'       // Спокойно сидят 3-4 сек
  | 'METRIS_ALERT'     // Метрис встает, красный "!", подсказка кликнуть
  | 'DIALOG'           // Диалог с кнопкой "Далее"
  | 'CRUMBLING'        // Буквы текста физически осыпаются вниз
  | 'WALKING'          // Все встают и идут вправо к кустам (3-4 сек)
  | 'BUSH_SHAKING'     // Кусты дрожат, красный "!" над кустами
  | 'HERO_APPROACH'    // Метрис делает шаг к кустам
  | 'GOBLIN_AMBUSH'    // Гоблин выпрыгивает + 2 сзади
  | 'HEROES_RETREAT';  // Герои отступают на шаг назад, стоп-кадр перед боем

interface CrumbleParticle {
  char: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
}

export const MainMenuScreen: React.FC = () => {
  const [screen, setScreen] = useState<'MENU' | 'GAME'>('MENU');
  const [fadeOpacity, setFadeOpacity] = useState<number>(0);
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [hasSave] = useState<boolean>(() => !!localStorage.getItem('bm_save'));

  // Состояние сюжета
  const [phase, setPhase] = useState<CutscenePhase>('WAIT_START');
  const [dialogText, setDialogText] = useState<string>('');
  const [crumbleParticles, setCrumbleParticles] = useState<CrumbleParticle[]>([]);

  // Смещение при ходьбе всего отряда вправо
  const [partyWalkX, setPartyWalkX] = useState<number>(0);

  const menuCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Плавный переход из меню в игру
  const handleStartGame = () => {
    setFadeOpacity(1);
    setTimeout(() => {
      setScreen('GAME');
      setTimeout(() => {
        setFadeOpacity(0);
      }, 1200);
    }, 800);
  };

  // Таймер кат-сцены после нажатия "Tap to start"
  useEffect(() => {
    if (phase === 'CAMP_PEACE') {
      const timer = setTimeout(() => {
        setPhase('METRIS_ALERT');
      }, 3500); // 3.5 секунды сидят у костра
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // Запуск ходьбы героев к кустам
  useEffect(() => {
    if (phase === 'WALKING') {
      const start = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - start;
        const progress = Math.min(1, elapsed / 3500);
        setPartyWalkX(Math.floor(progress * 18)); // смещение вправо

        if (progress >= 1) {
          clearInterval(interval);
          setPhase('BUSH_SHAKING');
        }
      }, 50);
      return () => clearInterval(interval);
    }
  }, [phase]);

  // Засада гоблинов
  useEffect(() => {
    if (phase === 'HERO_APPROACH') {
      const timer = setTimeout(() => {
        setPhase('GOBLIN_AMBUSH');
        setTimeout(() => {
          setPhase('HEROES_RETREAT');
        }, 1200);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // Обработка кнопки "Далее" — буквы текста осыпаются
  const handleNextDialog = () => {
    if (!dialogText) return;

    // Генерируем осыпающиеся буквы
    const particles: CrumbleParticle[] = [];
    const text = dialogText;
    const startX = window.innerWidth * 0.1;
    const startY = window.innerHeight * 0.78;

    for (let i = 0; i < text.length; i++) {
      particles.push({
        char: text[i],
        x: startX + i * 14,
        y: startY,
        vx: (Math.random() - 0.5) * 3,
        vy: Math.random() * -2,
        alpha: 1
      });
    }

    setCrumbleParticles(particles);
    setDialogText('');
    setPhase('CRUMBLING');

    setTimeout(() => {
      setCrumbleParticles([]);
      setPhase('WALKING');
    }, 1500);
  };

  // ==========================================
  // 1. РЕНДЕР ГЛАВНОГО МЕНЮ
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

      // Небо и звезды
      for (let r = 0; r < Math.floor(rows * 0.5); r++) {
        for (let c = 0; c < cols; c++) {
          if ((c * 23 + r * 67) % 100 < 4) {
            const tw = Math.sin(tick * 0.04 + c + r) * 0.04;
            ctx.fillStyle = `rgba(180, 220, 255, ${0.08 + tw})`;
            ctx.fillText('.', c * CELL_W, r * CELL_H);
          }
        }
      }

      // Луна
      const moonCol = cols - 14;
      const moon = ['  .---.  ', ' /     \\ ', '|  (o)  |', ' \\     / ', "  '---'  "];
      ctx.fillStyle = '#e0f2fe';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 15;
      moon.forEach((l, i) => ctx.fillText(l, moonCol * CELL_W, (3 + i) * CELL_H));
      ctx.shadowBlur = 0;

      // Дальние ели
      const horizonRow = Math.floor(rows * 0.48);
      for (let c = 2; c < cols - 8; c += 14) {
        const tree = TREE_TEMPLATES[c % 3];
        ctx.fillStyle = '#0b192e';
        tree.forEach((line, li) => {
          ctx.fillText(line, c * CELL_W, (horizonRow - tree.length + li) * CELL_H);
        });
      }

      // Сглаженный рельеф
      for (let c = 0; c < cols; c++) {
        const groundStart = Math.floor(rows * 0.5 + Math.sin(c * 0.12) * 1.5 + Math.cos(c * 0.04) * 2);
        for (let r = groundStart; r < rows; r++) {
          const depth = r - groundStart;
          let ch = '#';
          let color = '#081120';
          if (depth === 0) { ch = GROUND_STAMPS[0][c % GROUND_STAMPS[0].length]; color = '#1e3a6a'; }
          else if (depth === 1) { ch = GROUND_STAMPS[1][c % GROUND_STAMPS[1].length]; color = '#172d54'; }
          else if (depth < 4) { ch = GROUND_STAMPS[2][c % GROUND_STAMPS[2].length]; color = '#10203d'; }
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
  // 2. РЕНДЕР КАТ-СЦЕНЫ В ИГРЕ
  // ==========================================
  useEffect(() => {
    if (screen !== 'GAME') return;
    const canvas = gameCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let tick = 0;

    const CELL_W = 12;
    const CELL_H = 16;

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

      ctx.fillStyle = '#010309';
      ctx.fillRect(0, 0, w, h);

      const cols = Math.ceil(w / CELL_W);
      const rows = Math.ceil(h / CELL_H);
      ctx.font = `${CELL_H}px "Fira Code", monospace`;
      ctx.textBaseline = 'top';

      const groundRow = Math.floor(rows * 0.72);
      const fireCol = Math.floor(cols * 0.38); // Костер слева по центру
      const fireRow = groundRow - 1;

      // 1. ДАЛЕКИЙ ЗАМОК НА ГОРИЗОНТЕ
      const kingdomRow = groundRow - 12;
      for (let rep = 0; rep < cols; rep += KINGDOM_SPIRES[0].length) {
        KINGDOM_SPIRES.forEach((line, li) => {
          for (let ci = 0; ci < line.length; ci++) {
            const ch = line[ci];
            if (ch === ' ') continue;
            ctx.fillStyle = '#0c172e';
            ctx.fillText(ch, (rep + ci) * CELL_W, (kingdomRow + li) * CELL_H);
          }
        });
      }

      // 2. ЕЛИ И ЛЕС
      for (let c = 2; c < cols - 6; c += 11) {
        const tree = TREE_TEMPLATES[c % 3];
        tree.forEach((tLine, li) => {
          for (let ci = 0; ci < tLine.length; ci++) {
            const ch = tLine[ci];
            if (ch === ' ') continue;
            ctx.fillStyle = '#0d1a2d';
            ctx.fillText(ch, (c + ci) * CELL_W, (groundRow - tree.length + li) * CELL_H);
          }
        });
      }

      // 3. ЗЕМЛЯ
      const fireLight = 18 + Math.sin(tick * 0.08) * 2;
      for (let c = 0; c < cols; c++) {
        for (let r = groundRow; r < rows; r++) {
          const depth = r - groundRow;
          const dist = Math.sqrt(Math.pow(c - fireCol, 2) + Math.pow((r - fireRow) * 1.5, 2));

          let ch = '#';
          if (depth === 0) ch = ['=', '~', '^', '-'][c % 4];
          else if (depth === 1) ch = ['%', '*', '#'][c % 3];

          let rCol = 14, gCol = 28, bCol = 60;
          if (dist < fireLight && phase !== 'WALKING' && phase !== 'GOBLIN_AMBUSH') {
            const p = Math.pow(1 - dist / fireLight, 1.4);
            rCol = Math.min(255, Math.floor(rCol + p * 230));
            gCol = Math.min(200, Math.floor(gCol + p * 110));
            bCol = Math.floor(bCol * (1 - p * 0.8));
          }

          ctx.fillStyle = `rgb(${rCol}, ${gCol}, ${bCol})`;
          ctx.fillText(ch, c * CELL_W, r * CELL_H);
        }
      }

      // 4. ДЕТАЛИЗИРОВАННЫЙ БЫСТРЫЙ КОСТЕР
      const flames = [
        ['   ( )   ', '  ( * )  ', ' ( ^ * ) ', ' /=====\\ '],
        ['  ( * )  ', ' ( ^ * ) ', '  ( ^ )  ', ' /=====\\ '],
        ['  ( ^ )  ', ' ( * ^ ) ', '  ( * )  ', ' /=====\\ '],
        [' ( * ^ ) ', '  ( * )  ', ' ( ^ * ) ', ' /=====\\ ']
      ];
      const fireF = flames[Math.floor(tick / 8) % flames.length];
      fireF.forEach((fLine, li) => {
        for (let ci = 0; ci < fLine.length; ci++) {
          const ch = fLine[ci];
          if (ch === ' ') continue;
          ctx.fillStyle = ch === '*' ? '#fef08a' : (ch === '^' ? '#ff3b00' : '#f97316');
          ctx.shadowColor = '#ea580c';
          ctx.shadowBlur = 8;
          ctx.fillText(ch, (fireCol - 4 + ci) * CELL_W, (fireRow - 3 + li) * CELL_H);
          ctx.shadowBlur = 0;
        }
      });

      // 5. КУСТЫ СПРАВА
      const bushCol = cols - 16;
      const isShaking = phase === 'BUSH_SHAKING' || phase === 'HERO_APPROACH';
      const shakeOffset = isShaking ? Math.sin(tick * 0.4) * 0.5 : 0;

      BUSH_MODEL.forEach((bLine, li) => {
        for (let ci = 0; ci < bLine.length; ci++) {
          const ch = bLine[ci];
          if (ch === ' ') continue;
          ctx.fillStyle = '#166534';
          ctx.fillText(ch, (bushCol + ci + shakeOffset) * CELL_W, (groundRow - BUSH_MODEL.length + li) * CELL_H);
        }
      });

      // Восклицательный знак над кустами
      if (phase === 'BUSH_SHAKING') {
        const blink = Math.sin(tick * 0.1) > 0;
        if (blink) {
          ctx.fillStyle = '#ff2222';
          ctx.shadowColor = '#ff0000';
          ctx.shadowBlur = 12;
          ctx.fillText('[ ! ]', (bushCol + 2) * CELL_W, (groundRow - 6) * CELL_H);
          ctx.shadowBlur = 0;
        }
      }

      // 6. ГОБЛИНЫ (ПОЯВЛЯЮТСЯ ПРИ АМБУШЕ)
      if (phase === 'GOBLIN_AMBUSH' || phase === 'HEROES_RETREAT') {
        const gModel = phase === 'GOBLIN_AMBUSH' ? GOBLIN_MODEL.jump : GOBLIN_MODEL.idle;

        // Главный прыгнувший гоблин
        gModel.forEach((line, li) => {
          ctx.fillStyle = GOBLIN_MODEL.color;
          ctx.shadowColor = GOBLIN_MODEL.glow;
          ctx.shadowBlur = 8;
          ctx.fillText(line, (bushCol - 7) * CELL_W, (groundRow - gModel.length + li) * CELL_H);
        });

        // 2 гоблина сзади
        GOBLIN_MODEL.idle.forEach((line, li) => {
          ctx.fillStyle = '#4d7c0f';
          ctx.shadowBlur = 0;
          ctx.fillText(line, (bushCol + 4) * CELL_W, (groundRow - GOBLIN_MODEL.idle.length + li) * CELL_H);
          ctx.fillText(line, (bushCol + 9) * CELL_W, (groundRow - GOBLIN_MODEL.idle.length + li) * CELL_H);
        });
        ctx.shadowBlur = 0;
      }

      // 7. ЧЕТЫРЕ ГЕРОЯ (Opal, Huggie, Justin, Metris)
      const heroesList = [
        { key: 'Opal', baseCol: fireCol - 12, walkOffset: -12 },
        { key: 'Huggie', baseCol: fireCol - 7, walkOffset: -8 },
        { key: 'Justin', baseCol: fireCol + 6, walkOffset: -4 },
        { key: 'Metris', baseCol: fireCol + 11, walkOffset: 0 }
      ];

      const poseIdx = Math.floor(tick / 60) % 2;
      const breatheIdx = Math.floor(tick / 20) % 2;
      const walkStepIdx = Math.floor(tick / 10) % 2;
      const retreatX = phase === 'HEROES_RETREAT' ? -4 : 0;

      heroesList.forEach((h) => {
        const hero = HERO_MODELS[h.key];
        let sprite: string[];
        let curCol = h.baseCol;
        let isStanding = false;

        if (phase === 'WAIT_START' || phase === 'CAMP_PEACE') {
          sprite = hero.sitting[poseIdx];
        } else if (phase === 'METRIS_ALERT' || phase === 'DIALOG' || phase === 'CRUMBLING') {
          if (h.key === 'Metris') {
            sprite = hero.standingBreathe[breatheIdx];
            isStanding = true;
          } else {
            sprite = hero.sitting[poseIdx];
          }
        } else if (phase === 'WALKING') {
          sprite = hero.walking[walkStepIdx];
          curCol = fireCol + h.walkOffset + partyWalkX;
          isStanding = true;
        } else if (phase === 'BUSH_SHAKING' || phase === 'HERO_APPROACH' || phase === 'GOBLIN_AMBUSH' || phase === 'HEROES_RETREAT') {
          sprite = hero.standingBreathe[breatheIdx];
          curCol = fireCol + h.walkOffset + partyWalkX + retreatX;
          if (h.key === 'Metris' && phase === 'HERO_APPROACH') {
            curCol += 4;
          }
          isStanding = true;
        } else {
          sprite = hero.standingBreathe[breatheIdx];
        }

        const renderRow = groundRow - sprite.length;

        sprite.forEach((line, li) => {
          for (let ci = 0; ci < line.length; ci++) {
            const ch = line[ci];
            if (ch === ' ') continue;
            ctx.fillStyle = hero.color;
            ctx.shadowColor = hero.glow;
            ctx.shadowBlur = 4;
            ctx.fillText(ch, (curCol + ci) * CELL_W, (renderRow + li) * CELL_H);
          }
        });
        ctx.shadowBlur = 0;

        // ВОСКЛИЦАТЕЛЬНЫЙ ЗНАК НАД МЕТРИСОМ
        if (h.key === 'Metris' && phase === 'METRIS_ALERT') {
          const redBlink = Math.sin(tick * 0.08) > -0.2;
          if (redBlink) {
            ctx.fillStyle = '#ff2222';
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 12;
            ctx.fillText('[ ! ]', (curCol + 1) * CELL_W, (renderRow - 2) * CELL_H);
            ctx.shadowBlur = 0;
          }
        }
      });

      // 8. ОСЫПАЮЩИЕСЯ БУКВЫ ДИАЛОГА
      if (crumbleParticles.length > 0) {
        crumbleParticles.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.25;
          p.alpha -= 0.015;

          if (p.alpha > 0) {
            ctx.fillStyle = `rgba(34, 197, 94, ${p.alpha})`;
            ctx.shadowColor = '#22c55e';
            ctx.shadowBlur = 6;
            ctx.fillText(p.char, p.x, p.y);
          }
        });
        ctx.shadowBlur = 0;
      }

      animId = requestAnimationFrame(renderGame);
    };

    renderGame();
    return () => cancelAnimationFrame(animId);
  }, [screen, phase, partyWalkX, crumbleParticles]);

  // Клик по экрану в кат-сцене
  const handleGameCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (phase === 'WAIT_START') {
      setPhase('CAMP_PEACE');
      return;
    }

    if (phase === 'METRIS_ALERT') {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const targetX = window.innerWidth * 0.48;

      if (Math.abs(clickX - targetX) < 140) {
        setPhase('DIALOG');
        setDialogText('Metris: Я что-то слышал… надо проверить кусты');
      }
      return;
    }

    if (phase === 'BUSH_SHAKING') {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const targetBushX = window.innerWidth * 0.85;

      if (Math.abs(clickX - targetBushX) < 180) {
        setPhase('HERO_APPROACH');
      }
    }
  };

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

        .fade-overlay {
          position: absolute;
          inset: 0;
          background: #000;
          z-index: 100;
          pointer-events: none;
          transition: opacity 1s cubic-bezier(0.4, 0, 0.2, 1);
        }

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

        /* ПОДСКАЗКА СНИЗУ */
        .bottom-hint {
          position: absolute;
          bottom: 24px;
          width: 100%;
          text-align: center;
          font-family: 'Press Start 2P', monospace;
          font-size: 12px;
          color: #00f0ff;
          text-shadow: 0 0 8px #00f0ff;
          pointer-events: none;
          z-index: 30;
          animation: pulseHint 1.8s infinite alternate;
        }
        @keyframes pulseHint {
          0% { opacity: 0.3; }
          100% { opacity: 1; }
        }

        /* ДИАЛОГ С КНОПКОЙ ДАЛЕЕ */
        .dialog-layer {
          position: absolute;
          bottom: 24px;
          left: 5%;
          right: 5%;
          z-index: 40;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(2, 6, 18, 0.85);
          border: 1px dashed #22c55e;
          box-shadow: 0 0 15px rgba(34, 197, 94, 0.2);
          padding: 14px 24px;
        }
        .dialog-content {
          font-family: 'Fira Code', monospace;
          font-size: 15px;
          color: #4ade80;
          text-shadow: 0 0 8px #22c55e;
        }
        .dialog-next-btn {
          font-family: 'Press Start 2P', monospace;
          font-size: 10px;
          background: transparent;
          border: 1px solid #22c55e;
          color: #22c55e;
          padding: 8px 16px;
          cursor: pointer;
          box-shadow: 0 0 8px rgba(34, 197, 94, 0.3);
          transition: all 0.15s;
        }
        .dialog-next-btn:active {
          background: #22c55e;
          color: #000;
        }

        /* БАННЕР ТРЕВОГИ */
        .alert-banner {
          position: absolute;
          top: 20px;
          width: 100%;
          text-align: center;
          font-family: 'Press Start 2P', monospace;
          font-size: 14px;
          color: #ff3333;
          text-shadow: 0 0 12px #ff0000;
          z-index: 50;
        }
      `}</style>

      {/* Затемнение */}
      <div className="fade-overlay" style={{ opacity: fadeOpacity }} />

      {/* Поворот экрана */}
      <div className="portrait-lock">
        <div>[ ! ] ПОВЕРНИТЕ ЭКРАН</div>
        <div style={{ fontSize: '10px', marginTop: '16px', color: '#64748b' }}>
          BEGINNING MENTION ТРЕБУЕТ ГОРИЗОНТАЛЬНЫЙ РЕЖИМ
        </div>
      </div>

      {/* ЭКРАН МЕНЮ */}
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
              >
                {selectedIdx === 1 ? '> ЗАГРУЗКИ (LOCKED)' : '  ЗАГРУЗКИ (LOCKED)'}
              </div>
              <div
                className={`console-row ${selectedIdx === 2 ? 'active' : ''}`}
                onPointerEnter={() => setSelectedIdx(2)}
              >
                {selectedIdx === 2 ? '> НАСТРОЙКИ' : '  НАСТРОЙКИ'}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ИГРОВАЯ КАТ-СЦЕНА */}
      {screen === 'GAME' && (
        <>
          <canvas
            ref={gameCanvasRef}
            onClick={handleGameCanvasClick}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'pointer' }}
          />

          {/* 1. НАДПИСЬ ТАПА НА СТАРТЕ */}
          {phase === 'WAIT_START' && (
            <div className="bottom-hint">&gt;&gt; TAP TO START &lt;&lt;</div>
          )}

          {/* 2. ПОДСКАЗКА КЛИКНУТЬ НА МЕТРИСА */}
          {phase === 'METRIS_ALERT' && (
            <div className="bottom-hint" style={{ color: '#22c55e', textShadow: '0 0 10px #22c55e' }}>
              Кликни на Метриса, чтобы узнать что случилось
            </div>
          )}

          {/* 3. ПОДСКАЗКА КЛИКНУТЬ НА КУСТЫ */}
          {phase === 'BUSH_SHAKING' && (
            <div className="bottom-hint" style={{ color: '#eab308', textShadow: '0 0 10px #eab308' }}>
              Кликни на подозрительные кусты
            </div>
          )}

          {/* 4. ТРЕВОЖНЫЙ БАННЕР */}
          {(phase === 'GOBLIN_AMBUSH' || phase === 'HEROES_RETREAT') && (
            <div className="alert-banner">
              [ ! ] ВНИМАНИЕ: ЗАСАДА ГОБЛИНОВ-МАРОДЕРОВ [ ! ]
            </div>
          )}

          {/* 5. ОКНО ДИАЛОГА С КНОПКОЙ ДАЛЕЕ */}
          {phase === 'DIALOG' && (
            <div className="dialog-layer">
              <div className="dialog-content">{dialogText}</div>
              <button className="dialog-next-btn" onClick={handleNextDialog}>
                ДАЛЕЕ &gt;&gt;
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
