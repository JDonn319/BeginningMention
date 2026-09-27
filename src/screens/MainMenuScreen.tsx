import React, { useEffect, useRef, useState } from 'react';
import {
  HERO_MODELS,
  MINI_HERO_SPRITES,
  GOBLIN_MODEL,
  BUSH_MODEL,
  TREE_TEMPLATES,
  KINGDOM_SPIRES,
  GROUND_STAMPS
} from '../templates/asciiModels';

type CutscenePhase =
  | 'WAIT_START'
  | 'CAMP_PEACE'
  | 'METRIS_ALERT'
  | 'DIALOG'
  | 'CRUMBLING'
  | 'WALKING'
  | 'BUSH_SHAKING'
  | 'HERO_APPROACH'
  | 'GOBLIN_LEAP'
  | 'HEROES_RETREAT';

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

  const [phase, setPhase] = useState<CutscenePhase>('WAIT_START');
  const [dialogText, setDialogText] = useState<string>('');
  const [crumbleParticles, setCrumbleParticles] = useState<CrumbleParticle[]>([]);

  // Плавный скролл, ход и скачок гоблина
  const [cameraX, setCameraX] = useState<number>(0);
  const [partyWalkDist, setPartyWalkDist] = useState<number>(0);
  const [goblinLeapT, setGoblinLeapT] = useState<number>(0);

  // Плавное отдаление камеры (Zoom)
  const [currentZoom, setCurrentZoom] = useState<number>(1.0);

  const menuCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Функция рельефа для идеальной посадки деревьев и земли
  const getGroundElevation = (worldX: number, baseRow: number) => {
    return Math.floor(
      baseRow +
      Math.sin(worldX * 0.09) * 2.8 +
      Math.cos(worldX * 0.04) * 2.2 +
      Math.sin(worldX * 0.22) * 1.0
    );
  };

  const handleStartGame = () => {
    setFadeOpacity(1);
    setTimeout(() => {
      setScreen('GAME');
      setTimeout(() => setFadeOpacity(0), 1200);
    }, 800);
  };

  useEffect(() => {
    if (phase === 'CAMP_PEACE') {
      const t = setTimeout(() => setPhase('METRIS_ALERT'), 3500);
      return () => clearTimeout(t);
    }
  }, [phase]);

  // Ходьба отряда и синхронный сдвиг камеры
  useEffect(() => {
    if (phase === 'WALKING') {
      const start = Date.now();
      const duration = 3800;
      const interval = setInterval(() => {
        const p = Math.min(1, (Date.now() - start) / duration);
        setCameraX(p * 32);
        setPartyWalkDist(p * 36);

        if (p >= 1) {
          clearInterval(interval);
          setPhase('BUSH_SHAKING');
        }
      }, 30);
      return () => clearInterval(interval);
    }
  }, [phase]);

  // Прыжок гоблина из кустов с сохранением дистанции арены
  useEffect(() => {
    if (phase === 'HERO_APPROACH') {
      const t1 = setTimeout(() => {
        setPhase('GOBLIN_LEAP');
        const jumpStart = Date.now();
        const jInterval = setInterval(() => {
          const jp = Math.min(1, (Date.now() - jumpStart) / 600);
          setGoblinLeapT(jp);
          if (jp >= 1) {
            clearInterval(jInterval);
            setTimeout(() => setPhase('HEROES_RETREAT'), 400);
          }
        }, 20);
      }, 700);
      return () => clearTimeout(t1);
    }
  }, [phase]);

  // Осыпание диалога
  const handleNextDialog = () => {
    if (!dialogText) return;
    const particles: CrumbleParticle[] = [];
    const text = dialogText;
    const startX = window.innerWidth * 0.12;
    const startY = window.innerHeight * 0.75;

    for (let i = 0; i < text.length; i++) {
      particles.push({
        char: text[i],
        x: startX + i * 14,
        y: startY,
        vx: (Math.random() - 0.5) * 3,
        vy: -Math.random() * 2,
        alpha: 1
      });
    }

    setCrumbleParticles(particles);
    setDialogText('');
    setPhase('CRUMBLING');
    setTimeout(() => {
      setCrumbleParticles([]);
      setPhase('WALKING');
    }, 1300);
  };

  // ==========================================
  // РЕНДЕР МЕНЮ С ТОЧНОЙ ПОСАДКОЙ ДЕРЕВЬЕВ НА ЗЕМЛЮ
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

      const cols = Math.ceil(w / CELL_W);
      const rows = Math.ceil(h / CELL_H);
      ctx.font = `${CELL_H}px "Fira Code", monospace`;
      ctx.textBaseline = 'top';

      // Небо
      for (let r = 0; r < Math.floor(rows * 0.5); r++) {
        for (let c = 0; c < cols; c++) {
          if ((c * 23 + r * 67) % 100 < 4) {
            ctx.fillStyle = `rgba(180, 220, 255, ${0.08 + Math.sin(tick * 0.04 + c) * 0.04})`;
            ctx.fillText('.', c * CELL_W, r * CELL_H);
          }
        }
      }

      // Луна
      const moonCol = cols - 14;
      ctx.fillStyle = '#e0f2fe';
      ['  .---.  ', ' /     \\ ', '|  (o)  |', ' \\     / ', "  '---'  "].forEach((l, i) =>
        ctx.fillText(l, moonCol * CELL_W, (3 + i) * CELL_H)
      );

      // Ели привязаны к РЕЛЬЕФУ (не висят в воздухе!)
      const baseMenuGround = Math.floor(rows * 0.5);
      for (let c = 2; c < cols - 8; c += 14) {
        const treeElevation = getGroundElevation(c, baseMenuGround);
        const tree = TREE_TEMPLATES[c % 3];
        ctx.fillStyle = '#0b192e';
        tree.forEach((line, li) => {
          ctx.fillText(line, c * CELL_W, (treeElevation - tree.length + li) * CELL_H);
        });
      }

      // Рельефная земля
      for (let c = 0; c < cols; c++) {
        const gStart = getGroundElevation(c, baseMenuGround);
        for (let r = gStart; r < rows; r++) {
          const depth = r - gStart;
          let ch = '#';
          let color = '#081120';
          if (depth === 0) { ch = GROUND_STAMPS[0][c % GROUND_STAMPS[0].length]; color = '#1e3a6a'; }
          else if (depth === 1) { ch = GROUND_STAMPS[1][c % GROUND_STAMPS[1].length]; color = '#172d54'; }
          else if (depth < 4) { ch = GROUND_STAMPS[2][c % GROUND_STAMPS[2].length]; color = '#10203d'; }
          ctx.fillStyle = color;
          ctx.fillText(ch, c * CELL_W, r * CELL_H);
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [screen]);

  // ==========================================
  // РЕНДЕР КАТ-СЦЕНЫ (С ПЛАВНЫМ ZOOM OUT И 2 РЯДАМИ)
  // ==========================================
  useEffect(() => {
    if (screen !== 'GAME') return;
    const canvas = gameCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let tick = 0;

    // Плавная анимация зума
    const targetZoom = (phase === 'WAIT_START' || phase === 'CAMP_PEACE' || phase === 'METRIS_ALERT') ? 1.0 : 0.65;

    const render = () => {
      tick++;

      // Интерполяция масштаба (отдаление при клике на Метриса)
      setCurrentZoom((prev) => prev + (targetZoom - prev) * 0.04);

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

      // Динамический размер ячейки от Zoom
      const CELL_W = 12 * currentZoom;
      const CELL_H = 16 * currentZoom;

      const cols = Math.ceil(w / CELL_W);
      const rows = Math.ceil(h / CELL_H);
      ctx.font = `${Math.floor(CELL_H)}px "Fira Code", monospace`;
      ctx.textBaseline = 'top';

      const baseGroundRow = Math.floor(rows * 0.72);
      const fireWorldX = 28;
      const fireScreenX = fireWorldX - cameraX;
      const fireElevation = getGroundElevation(fireWorldX, baseGroundRow);

      // 1. ДАЛЕКИЙ ЗАМОК
      for (let rep = -10; rep < cols + 50; rep += KINGDOM_SPIRES[0].length) {
        KINGDOM_SPIRES.forEach((line, li) => {
          for (let ci = 0; ci < line.length; ci++) {
            const ch = line[ci];
            if (ch === ' ') continue;
            ctx.fillStyle = '#0c172e';
            ctx.fillText(ch, (rep + ci - cameraX * 0.25) * CELL_W, (baseGroundRow - 14 + li) * CELL_H);
          }
        });
      }

      // 2. ЕЛИ В ИГРЕ — ИДЕАЛЬНО СТОЯТ НА РЕЛЬЕФЕ
      for (let wc = 0; wc < 140; wc += 11) {
        const sc = wc - cameraX;
        if (sc < -15 || sc > cols + 15) continue;
        const groundY = getGroundElevation(wc, baseGroundRow);
        const tree = TREE_TEMPLATES[wc % 3];
        tree.forEach((tLine, li) => {
          for (let ci = 0; ci < tLine.length; ci++) {
            const ch = tLine[ci];
            if (ch === ' ') continue;
            ctx.fillStyle = '#0d1a2d';
            ctx.fillText(ch, (sc + ci) * CELL_W, (groundY - tree.length + li) * CELL_H);
          }
        });
      }

      // 3. ЗЕМЛЯ И СВЕТ КОСТРА
      const fireLightRadius = 18 + Math.sin(tick * 0.08) * 2;
      for (let sc = 0; sc < cols; sc++) {
        const wc = sc + cameraX;
        const gRow = getGroundElevation(wc, baseGroundRow);

        for (let r = gRow; r < rows; r++) {
          const depth = r - gRow;
          const distToFire = Math.sqrt(Math.pow(wc - fireWorldX, 2) + Math.pow((r - fireElevation) * 1.5, 2));

          let ch = '#';
          if (depth === 0) ch = ['=', '~', '^', '-'][Math.abs(Math.floor(wc)) % 4];
          else if (depth === 1) ch = ['%', '*', '#'][Math.abs(Math.floor(wc)) % 3];

          let rCol = 14, gCol = 28, bCol = 60;
          if (distToFire < fireLightRadius) {
            const p = Math.pow(1 - distToFire / fireLightRadius, 1.4);
            rCol = Math.min(255, Math.floor(rCol + p * 230));
            gCol = Math.min(200, Math.floor(gCol + p * 110));
            bCol = Math.floor(bCol * (1 - p * 0.8));
          }

          ctx.fillStyle = `rgb(${rCol}, ${gCol}, ${bCol})`;
          ctx.fillText(ch, sc * CELL_W, r * CELL_H);
        }
      }

      // 4. КОСТЕР
      if (fireScreenX > -10 && fireScreenX < cols + 10) {
        const flames = [
          ['   ( )   ', '  ( * )  ', ' ( ^ * ) ', ' /=====\\ '],
          ['  ( * )  ', ' ( ^ * ) ', '  ( ^ )  ', ' /=====\\ '],
          ['  ( ^ )  ', ' ( * ^ ) ', '  ( * )  ', ' /=====\\ ']
        ];
        const fireF = flames[Math.floor(tick / 6) % flames.length];
        fireF.forEach((fLine, li) => {
          for (let ci = 0; ci < fLine.length; ci++) {
            const ch = fLine[ci];
            if (ch === ' ') continue;
            ctx.fillStyle = ch === '*' ? '#fef08a' : (ch === '^' ? '#ff3b00' : '#f97316');
            ctx.fillText(ch, (fireScreenX - 4 + ci) * CELL_W, (fireElevation - 3 + li) * CELL_H);
          }
        });
      }

      // 5. ТЕМНЫЕ НОЧНЫЕ КУСТЫ СПРАВА
      const bushWorldX = 85;
      const bushScreenX = bushWorldX - cameraX;
      const bushElevation = getGroundElevation(bushWorldX, baseGroundRow);
      const isBushShake = phase === 'BUSH_SHAKING' || phase === 'HERO_APPROACH';
      const shakeDX = isBushShake ? Math.sin(tick * 0.5) * 0.6 : 0;

      BUSH_MODEL.forEach((bLine, li) => {
        for (let ci = 0; ci < bLine.length; ci++) {
          const ch = bLine[ci];
          if (ch === ' ') continue;
          // Ночной цвет кустов
          ctx.fillStyle = '#091b14';
          ctx.fillText(ch, (bushScreenX + ci + shakeDX) * CELL_W, (bushElevation - BUSH_MODEL.length + li) * CELL_H);
        }
      });

      // Восклицательный знак над кустами
      if (phase === 'BUSH_SHAKING' && Math.sin(tick * 0.12) > 0) {
        ctx.fillStyle = '#ff2222';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 8;
        ctx.fillText('[ ! ]', (bushScreenX + 3) * CELL_W, (bushElevation - 5) * CELL_H);
        ctx.shadowBlur = 0;
      }

      // 6. ГОБЛИНЫ (<o>, /#\, l l + МЕЧ) С ДИСТАНЦИЕЙ АРЕНЫ
      if (phase === 'GOBLIN_LEAP' || phase === 'HEROES_RETREAT') {
        // Дистанция: гоблин приземляется на X = 68, оставляя свободное место до отряда
        let gobWorldX: number;
        let gobAltitude = 0;
        let gobSprite = GOBLIN_MODEL.idle;

        if (phase === 'GOBLIN_LEAP') {
          gobWorldX = bushWorldX - goblinLeapT * 17;
          gobAltitude = Math.sin(goblinLeapT * Math.PI) * 4;
          gobSprite = goblinLeapT < 0.85 ? GOBLIN_MODEL.leap : GOBLIN_MODEL.idle;
        } else {
          gobWorldX = bushWorldX - 17;
          gobSprite = GOBLIN_MODEL.idle;
        }

        const gobScreenX = gobWorldX - cameraX;
        const gobElevation = getGroundElevation(gobWorldX, baseGroundRow);

        // Главный гоблин с мечом
        gobSprite.forEach((line, li) => {
          for (let ci = 0; ci < line.length; ci++) {
            const ch = line[ci];
            if (ch === ' ') continue;
            ctx.fillStyle = (ch === '-' || ch === '/') ? GOBLIN_MODEL.swordColor : GOBLIN_MODEL.color;
            ctx.fillText(ch, (gobScreenX + ci) * CELL_W, (gobElevation - gobSprite.length - gobAltitude + li) * CELL_H);
          }
        });

        // 2 гоблина сзади в резерве
        if (phase === 'HEROES_RETREAT') {
          const g2Elevation = getGroundElevation(bushWorldX + 6, baseGroundRow);
          GOBLIN_MODEL.idle.forEach((line, li) => {
            ctx.fillStyle = '#4d7c0f';
            ctx.fillText(line, (bushScreenX + 6) * CELL_W, (g2Elevation - GOBLIN_MODEL.idle.length + li) * CELL_H);
            ctx.fillText(line, (bushScreenX + 12) * CELL_W, (g2Elevation - 1 - GOBLIN_MODEL.idle.length + li) * CELL_H);
          });
        }
      }

      // 7. СТРОЙ ГЕРОЕВ: 2 РЯДА (2 СВЕРХУ, 2 СНИЗУ С ДИСТАНЦИЕЙ)
      // До диалога сидят у огня. После диалога встают в строй:
      // ВЕРХНИЙ РЯД: Opal (сзади-сверху), Justin (впереди-сверху)
      // НИЖНИЙ РЯД: Huggie (сзади-снизу), Metris (впереди-снизу)
      const formation = [
        { key: 'Opal',   colOffset: -10, rowOffset: -4, campCol: fireWorldX - 12 },
        { key: 'Justin', colOffset: -3,  rowOffset: -4, campCol: fireWorldX + 6  },
        { key: 'Huggie', colOffset: -10, rowOffset: 0,  campCol: fireWorldX - 7  },
        { key: 'Metris', colOffset: -3,  rowOffset: 0,  campCol: fireWorldX + 11 }
      ];

      const isTactical = phase === 'WALKING' || phase === 'BUSH_SHAKING' || phase === 'HERO_APPROACH' || phase === 'GOBLIN_LEAP' || phase === 'HEROES_RETREAT';
      const walkStep = Math.floor(tick / 6) % 2;

      formation.forEach((f) => {
        const hero = HERO_MODELS[f.key];
        let wX: number;
        let groundY: number;
        let sprite: string[];

        if (!isTactical) {
          // У костра: детальные модели
          wX = f.campCol;
          groundY = getGroundElevation(wX, baseGroundRow);
          sprite = (phase === 'METRIS_ALERT' || phase === 'DIALOG' || phase === 'CRUMBLING') && f.key === 'Metris'
            ? hero.standingBreathe[Math.floor(tick / 18) % 2]
            : hero.sitting[Math.floor(tick / 50) % 2];
        } else {
          // В тактическом строю: 2 ряда, упрощенные модели
          const retreat = phase === 'HEROES_RETREAT' ? -5 : 0;
          wX = fireWorldX + partyWalkDist + f.colOffset + retreat;
          groundY = getGroundElevation(wX, baseGroundRow) + f.rowOffset;

          const mini = MINI_HERO_SPRITES[f.key];
          sprite = phase === 'WALKING' ? mini.walk[walkStep] : mini.idle;
        }

        const sX = wX - cameraX;
        sprite.forEach((line, li) => {
          for (let ci = 0; ci < line.length; ci++) {
            const ch = line[ci];
            if (ch === ' ') continue;
            ctx.fillStyle = hero.color;
            ctx.fillText(ch, (sX + ci) * CELL_W, (groundY - sprite.length + li) * CELL_H);
          }
        });

        // Восклицательный знак над Метрисом
        if (f.key === 'Metris' && phase === 'METRIS_ALERT' && Math.sin(tick * 0.1) > -0.2) {
          ctx.fillStyle = '#ff2222';
          ctx.shadowColor = '#ff0000';
          ctx.shadowBlur = 8;
          ctx.fillText('[ ! ]', (sX + 1) * CELL_W, (groundY - sprite.length - 2) * CELL_H);
          ctx.shadowBlur = 0;
        }
      });

      // 8. ОСЫПАЮЩИЕСЯ БУКВЫ
      if (crumbleParticles.length > 0) {
        crumbleParticles.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.28;
          p.alpha -= 0.016;

          if (p.alpha > 0) {
            ctx.fillStyle = `rgba(34, 197, 94, ${p.alpha})`;
            ctx.font = '12px "Press Start 2P", monospace';
            ctx.fillText(p.char, p.x, p.y);
          }
        });
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [screen, phase, cameraX, partyWalkDist, goblinLeapT, crumbleParticles, currentZoom]);

  // Тапы
  const handleGameClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (phase === 'WAIT_START') {
      setPhase('CAMP_PEACE');
      return;
    }
    if (phase === 'METRIS_ALERT') {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      if (Math.abs(clickX - window.innerWidth * 0.58) < 140) {
        setPhase('DIALOG');
        setDialogText('Metris: Я что-то слышал... надо проверить кусты');
      }
      return;
    }
    if (phase === 'BUSH_SHAKING') {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      if (Math.abs(clickX - window.innerWidth * 0.65) < 160) {
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

        .bottom-hint {
          position: absolute;
          bottom: 24px;
          width: 100%;
          text-align: center;
          font-family: 'Press Start 2P', monospace;
          font-size: 11px;
          color: #00f0ff;
          text-shadow: 0 0 8px #00f0ff;
          pointer-events: none;
          z-index: 30;
          animation: pulse 1.8s infinite alternate;
        }
        @keyframes pulse {
          0% { opacity: 0.3; }
          100% { opacity: 1; }
        }

        /* ЧИСТЫЙ ПИКСЕЛЬНЫЙ ДИАЛОГ */
        .pixel-dialog-wrapper {
          position: absolute;
          bottom: 40px;
          left: 8%;
          right: 8%;
          z-index: 40;
          display: flex;
          align-items: center;
          justify-content: space-between;
          pointer-events: auto;
        }
        .pixel-speech {
          font-family: 'Press Start 2P', monospace;
          font-size: 12px;
          color: #4ade80;
          text-shadow: 0 0 10px #22c55e, 0 0 20px rgba(34, 197, 94, 0.6);
          line-height: 1.6;
        }
        .pixel-next {
          font-family: 'Press Start 2P', monospace;
          font-size: 11px;
          color: #facc15;
          text-shadow: 0 0 8px #eab308;
          cursor: pointer;
          margin-left: 20px;
          white-space: nowrap;
          animation: pulse 1s infinite alternate;
        }

        .alert-banner {
          position: absolute;
          top: 20px;
          width: 100%;
          text-align: center;
          font-family: 'Press Start 2P', monospace;
          font-size: 13px;
          color: #ff3333;
          text-shadow: 0 0 12px #ff0000;
          z-index: 50;
        }
      `}</style>

      <div className="fade-overlay" style={{ opacity: fadeOpacity }} />

      <div className="portrait-lock">
        <div>[ ! ] ПОВЕРНИТЕ ЭКРАН</div>
        <div style={{ fontSize: '10px', marginTop: '16px', color: '#64748b' }}>
          BEGINNING MENTION ТРЕБУЕТ ГОРИЗОНТАЛЬНЫЙ РЕЖИМ
        </div>
      </div>

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

      {screen === 'GAME' && (
        <>
          <canvas
            ref={gameCanvasRef}
            onClick={handleGameClick}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'pointer' }}
          />

          {phase === 'WAIT_START' && (
            <div className="bottom-hint">&gt;&gt; TAP TO START &lt;&lt;</div>
          )}

          {phase === 'METRIS_ALERT' && (
            <div className="bottom-hint" style={{ color: '#22c55e', textShadow: '0 0 10px #22c55e' }}>
              Кликни на Метриса, чтобы узнать что случилось
            </div>
          )}

          {phase === 'BUSH_SHAKING' && (
            <div className="bottom-hint" style={{ color: '#eab308', textShadow: '0 0 10px #eab308' }}>
              Кликни на подозрительные кусты
            </div>
          )}

          {(phase === 'GOBLIN_LEAP' || phase === 'HEROES_RETREAT') && (
            <div className="alert-banner">
              [ ! ] ВНИМАНИЕ: ЗАСАДА ГОБЛИНОВ-МАРОДЕРОВ [ ! ]
            </div>
          )}

          {phase === 'DIALOG' && (
            <div className="pixel-dialog-wrapper">
              <div className="pixel-speech">{dialogText}</div>
              <div className="pixel-next" onClick={handleNextDialog}>
                [ ДАЛЕЕ &gt;&gt; ]
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
