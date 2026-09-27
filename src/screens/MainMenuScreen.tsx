import React, { useEffect, useRef, useState } from 'react';
import {
  HEROES_CONFIG,
  WEAPON_RENDER,
  FLYING_HARPY_FRAMES,
  BOSS_DOSSIER,
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

// 8 тактических узлов арены (2 ряда по 4 колонки)
const BATTLE_NODES = [
  // Задний ряд (выше, дальше от босса)
  { id: 0, x: 14, yOffset: -2 },
  { id: 1, x: 22, yOffset: -2 },
  { id: 2, x: 30, yOffset: -2 },
  { id: 3, x: 38, yOffset: -2 },
  // Передний ряд (ниже, ближе к боссу)
  { id: 4, x: 18, yOffset: 2 },
  { id: 5, x: 26, yOffset: 2 },
  { id: 6, x: 34, yOffset: 2 },
  { id: 7, x: 42, yOffset: 2 }
];

export const MainMenuScreen: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<'MENU' | 'BATTLE'>('MENU');
  const [fadeOpacity, setFadeOpacity] = useState<number>(0);

  // Меню
  const [menuSelectedIdx, setMenuSelectedIdx] = useState<number>(0);
  const [hasSave] = useState<boolean>(() => !!localStorage.getItem('bm_save'));

  // Боевой отряд
  const [party, setParty] = useState<BattleHero[]>(HEROES_CONFIG);
  const [activeHeroId, setActiveHeroId] = useState<string>('josef');
  const [selectedSkillIdx, setSelectedSkillIdx] = useState<number>(0);

  // Босс
  const [bossHp, setBossHp] = useState<number>(850);
  const [bossMaxHp] = useState<number>(1000);
  const [bossBurnTimer, setBossBurnTimer] = useState<number>(0);
  const [bossSilenced, setBossSilenced] = useState<boolean>(false);
  const [showBossDossier, setShowBossDossier] = useState<boolean>(false);
  const [lastBossClickTime, setLastBossClickTime] = useState<number>(0);

  // Стены-щиты на арене
  const [walls, setWalls] = useState<{ nodeIdx: number; duration: number }[]>([]);

  // Режим выбора действий
  const [actionMode, setActionMode] = useState<'ATTACK' | 'MOVE' | 'BUILD' | 'HEAL_SELECT'>('ATTACK');
  const [selectedMoveNode, setSelectedMoveNode] = useState<number | null>(null);
  const [selectedHealTargetId, setSelectedHealTargetId] = useState<string | null>(null);

  // Прицеливание джойстиком
  const [aimZone, setAimZone] = useState<'HEAD' | 'BODY' | 'LEGS'>('BODY');
  const [aimOffsetX, setAimOffsetX] = useState<number>(0);

  // Таймлайн очередности ходов (умная CTB-система)
  const [timeline, setTimeline] = useState<string[]>(['josef', 'michael', 'BOSS', 'kyle', 'artemis', 'BOSS']);

  // Анимации и визуал
  const [attackLettersT, setAttackLettersT] = useState<number>(-1);
  const [bossLaserTargetX, setBossLaserTargetX] = useState<number | null>(null);
  const [floatingDamages, setFloatingDamages] = useState<FloatingDmg[]>([]);
  const [screenShake, setScreenShake] = useState<number>(0);
  const [combatLog, setCombatLog] = useState<string>('БОЙ НАЧАТ // ВЫБЕРИТЕ ДЕЙСТВИЕ');

  const menuCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const battleCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const currentHero = party.find((h) => h.id === activeHeroId) || party[0];

  // --------------------------------------------------------------------------
  // ПЕРЕХОД ИЗ МЕНЮ
  // --------------------------------------------------------------------------
  const handleStartBattle = () => {
    setFadeOpacity(1);
    setTimeout(() => {
      setCurrentScreen('BATTLE');
      setTimeout(() => setFadeOpacity(0), 800);
    }, 600);
  };

  // Рельеф
  const getElevation = (worldX: number, baseRow: number) => {
    return Math.floor(baseRow + Math.sin(worldX * 0.1) * 2.2 + Math.cos(worldX * 0.04) * 1.8);
  };

  // Проверка пассивной провокации танка Мишеля
  useEffect(() => {
    const allyInDanger = party.some((h) => h.id !== 'michael' && !h.isDead && h.hp < h.maxHp * 0.5);
    const michael = party.find((h) => h.id === 'michael');
    if (!michael || michael.isDead) return;

    if (allyInDanger && michael.hp >= michael.maxHp * 0.3) {
      if (!michael.hasTaunt) {
        setParty((prev) =>
          prev.map((h) => (h.id === 'michael' ? { ...h, hasTaunt: true, tauntTimer: 2 } : h))
        );
        addFloatingText(BATTLE_NODES[michael.nodeIndex].x, 18, '[TAUNT GAINED]', '#3b82f6');
      }
    } else if (michael.hp < michael.maxHp * 0.3 && michael.hasTaunt) {
      // Теряет провокацию при критическом здоровье
      setParty((prev) =>
        prev.map((h) => (h.id === 'michael' ? { ...h, hasTaunt: false, tauntTimer: 0 } : h))
      );
    }
  }, [party]);

  const addFloatingText = (x: number, y: number, text: string, color: string) => {
    setFloatingDamages((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), text, x, y, color, alpha: 1.0 }
    ]);
  };

  // --------------------------------------------------------------------------
  // ВЫБОР СПОСОБНОСТЕЙ
  // --------------------------------------------------------------------------
  const handleSkillSelect = (idx: number) => {
    setSelectedSkillIdx(idx);
    const skill = currentHero.skills[idx];

    if (skill.type === 'WALL') {
      setActionMode('BUILD');
      setSelectedMoveNode(null);
    } else if (skill.type === 'HEAL') {
      setActionMode('HEAL_SELECT');
      setSelectedHealTargetId(party[0].id);
    } else {
      setActionMode('ATTACK');
    }
  };

  // --------------------------------------------------------------------------
  // ГЛАВНАЯ ДИНАМИЧЕСКАЯ КНОПКА (ATTACK / BUILD / USE / ACCEPT)
  // --------------------------------------------------------------------------
  const handleMainActionButton = () => {
    if (attackLettersT >= 0 || bossLaserTargetX !== null || timeline[0] === 'BOSS') return;

    if (actionMode === 'BUILD') {
      // Установка стены перед выбранным героем
      const heroNode = BATTLE_NODES[currentHero.nodeIndex];
      setWalls((prev) => [...prev, { nodeIdx: currentHero.nodeIndex, duration: 1 }]);
      setCombatLog(`${currentHero.name} возводит защитный барьер!`);
      addFloatingText(heroNode.x, 22, '[WALL BUILT]', '#3b82f6');

      // Мишель получает провокацию на 2 хода
      setParty((prev) =>
        prev.map((h) => (h.id === 'michael' ? { ...h, hasTaunt: true, tauntTimer: 2 } : h))
      );

      endPlayerTurn(25);
      setActionMode('ATTACK');
      return;
    }

    if (actionMode === 'MOVE') {
      if (selectedMoveNode === null) return;
      // Перемещение
      setParty((prev) =>
        prev.map((h) => (h.id === currentHero.id ? { ...h, nodeIndex: selectedMoveNode } : h))
      );
      setCombatLog(`${currentHero.name} перемещается на новую позицию.`);
      endPlayerTurn(15);
      setActionMode('ATTACK');
      setSelectedMoveNode(null);
      return;
    }

    if (actionMode === 'HEAL_SELECT') {
      if (!selectedHealTargetId) return;
      const target = party.find((h) => h.id === selectedHealTargetId);
      if (!target) return;

      const healAmount = Math.floor(target.maxHp * 0.4);
      setParty((prev) =>
        prev.map((h) => {
          if (h.id === target.id) {
            return {
              ...h,
              isDead: false,
              hp: Math.min(h.maxHp, h.hp + healAmount)
            };
          }
          return h;
        })
      );

      const tNode = BATTLE_NODES[target.nodeIndex];
      addFloatingText(tNode.x, 20, `+${healAmount} HP`, '#22c55e');
      setCombatLog(`${currentHero.name} восстанавливает силы ${target.name}!`);

      endPlayerTurn(30);
      setActionMode('ATTACK');
      return;
    }

    // РЕЖИМ АТАКИ: ТРАЕКТОРИЯ "A T T A C K"
    const skill = currentHero.skills[selectedSkillIdx];
    const heroNode = BATTLE_NODES[currentHero.nodeIndex];
    const distance = 74 - heroNode.x;

    let baseDmg = 12;
    let isCrit = false;

    // Расчет урона по правилам героев
    if (currentHero.id === 'josef') {
      if (skill.id === 'blaster') {
        if (aimZone === 'HEAD') { baseDmg = 20; isCrit = true; }
        else if (aimZone === 'BODY') baseDmg = Math.floor(Math.random() * 5) + 11;
        else baseDmg = Math.floor(Math.random() * 5) + 6;
      } else {
        baseDmg = Math.floor(Math.random() * 9) + 28; // Ракета
      }
    } else if (currentHero.id === 'michael') {
      if (aimZone === 'HEAD') { baseDmg = Math.floor(Math.random() * 4) + 26; isCrit = true; }
      else baseDmg = Math.floor(Math.random() * 7) + 8;
    } else if (currentHero.id === 'kyle') {
      if (skill.id === 'runes') {
        baseDmg = (Math.floor(Math.random() * 4) + 5) * (Math.random() > 0.5 ? 3 : 2);
      } else if (skill.id === 'silence') {
        setBossSilenced(true);
        addFloatingText(74, 16, '[SILENCED!]', '#eab308');
        baseDmg = 5;
      }
    } else if (currentHero.id === 'artemis') {
      if (skill.id === 'spear') {
        // Урон от дистанции (4 до 38)
        baseDmg = Math.max(4, Math.min(38, Math.floor(distance * 0.65)));
      } else if (skill.id === 'bomb') {
        baseDmg = 18;
        setBossBurnTimer(2);
        addFloatingText(74, 18, '[BURN: 2 TURNS]', '#ef4444');
      }
    }

    // Запуск визуальной траектории
    const startT = Date.now();
    const duration = 600;

    const anim = setInterval(() => {
      const p = Math.min(1, (Date.now() - startT) / duration);
      setAttackLettersT(p);

      if (p >= 1) {
        clearInterval(anim);
        setAttackLettersT(-1);

        setBossHp((prev) => Math.max(0, prev - baseDmg));
        setScreenShake(isCrit ? 5 : 2);
        addFloatingText(74, aimZone === 'HEAD' ? 14 : 20, isCrit ? `CRIT -${baseDmg}` : `-${baseDmg}`, isCrit ? '#ff0033' : '#ffaa00');

        endPlayerTurn(20);
      }
    }, 20);
  };

  // Попытка сбежать
  const handleFlee = () => {
    if (Math.random() < 0.35) {
      alert('ОТРЯДУ УДАЛОСЬ ВЫРВАТЬСЯ ИЗ КРАТЕРА!');
      setCurrentScreen('MENU');
    } else {
      setCombatLog('ПОБЕГ ПРОВАЛЕН! ВЕСЬ ОТРЯД ОШЕЛУМЛЕН!');
      setScreenShake(4);
      // Пропуск всех ходов героев — ход передается боссу
      setTimeline(['BOSS', 'BOSS', 'josef', 'michael', 'kyle', 'artemis']);
      setTimeout(() => triggerBossAI(['BOSS', 'josef', 'michael', 'kyle', 'artemis']), 600);
    }
  };

  // --------------------------------------------------------------------------
  // УМНАЯ СИСТЕМА ИНИЦИАТИВЫ И ХОД БОССА
  // --------------------------------------------------------------------------
  const endPlayerTurn = (actionDelay: number) => {
    setScreenShake(0);

    // Сдвиг по таймлайну с задержкой от стоимости действия
    const newTimeline = [...timeline.slice(1)];
    const insertIdx = Math.min(newTimeline.length, Math.floor(actionDelay / 10));
    newTimeline.splice(insertIdx, 0, currentHero.id);

    // Тик кулдаунов текущего героя
    if (currentHero.id === 'michael' && currentHero.hasTaunt) {
      const nextTaunt = currentHero.tauntTimer - 1;
      setParty((prev) =>
        prev.map((h) => (h.id === 'michael' ? { ...h, tauntTimer: nextTaunt, hasTaunt: nextTaunt > 0 } : h))
      );
    }

    setTimeline(newTimeline);

    const nextTurnUnit = newTimeline[0];
    if (nextTurnUnit === 'BOSS') {
      setTimeout(() => triggerBossAI(newTimeline), 800);
    } else {
      setActiveHeroId(nextTurnUnit);
      setActionMode('ATTACK');
    }
  };

  // Умный ИИ Босса
  const triggerBossAI = (currentTimeline: string[]) => {
    // Пассивный урон от горения
    if (bossBurnTimer > 0) {
      const burnDmg = Math.floor(Math.random() * 3) + 10;
      setBossHp((prev) => Math.max(0, prev - burnDmg));
      addFloatingText(74, 15, `BURN -${burnDmg}`, '#ef4444');
      setBossBurnTimer((prev) => prev - 1);
    }

    // 1. Поиск цели по логике (приоритет провокации, затем добивание раненых)
    const aliveHeroes = party.filter((h) => !h.isDead);
    if (aliveHeroes.length === 0) {
      alert('ОТРЯД ПОГИБ В КРАТЕРЕ...');
      setCurrentScreen('MENU');
      return;
    }

    let target = aliveHeroes.find((h) => h.hasTaunt);
    if (!target) {
      // ИИ ищет героя с наименьшим здоровьем
      target = [...aliveHeroes].sort((a, b) => a.hp - b.hp)[0];
    }

    // Проверка стены перед целью
    const wallOnTarget = walls.find((w) => w.nodeIdx === target!.nodeIndex);

    // Выбор способности босса
    const bossSkillName = bossSilenced ? 'Удар когтями (Базовый)' : 'Плазменный луч ядра';
    setCombatLog(`ХАРПИЯ ПРИМЕНЯЕТ: [ ${bossSkillName.toUpperCase()} ] -> ${target.name}`);

    // Прицеливание босса (лазерный луч на цель)
    const targetNode = BATTLE_NODES[target.nodeIndex];
    setBossLaserTargetX(targetNode.x);

    setTimeout(() => {
      setBossLaserTargetX(null);

      if (wallOnTarget) {
        // Удар поглощен стеной!
        setWalls((prev) => prev.filter((w) => w !== wallOnTarget));
        addFloatingText(targetNode.x, 20, '[BLOCKED BY WALL]', '#3b82f6');
        setScreenShake(3);
      } else {
        // Нанесение урона конкретной цели
        const bossDmg = bossSilenced ? 18 : Math.floor(Math.random() * 10) + 28;
        setParty((prev) =>
          prev.map((h) => {
            if (h.id === target!.id) {
              const newHp = Math.max(0, h.hp - bossDmg);
              return { ...h, hp: newHp, isDead: newHp === 0 };
            }
            return h;
          })
        );
        addFloatingText(targetNode.x, 22, `-${bossDmg}`, '#ef4444');
        setScreenShake(6);
      }

      setBossSilenced(false);

      // Завершение хода босса
      const afterBossTimeline = [...currentTimeline.slice(1), 'BOSS'];
      setTimeline(afterBossTimeline);
      setActiveHeroId(afterBossTimeline[0]);
    }, 850);
  };

  // Двойной клик на босса для открытия сводки (Dossier)
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Область босса (справа на экране)
    if (clickX > window.innerWidth * 0.65 && clickY < window.innerHeight * 0.6) {
      const now = Date.now();
      if (now - lastBossClickTime < 350) {
        setShowBossDossier(true);
      }
      setLastBossClickTime(now);
    }
  };

  // Анимация всплывающих чисел
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

  // ==========================================================================
  // РЕНДЕР КАНВАСА БИТВЫ
  // ==========================================================================
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

      // Тряска экрана
      const sx = screenShake > 0 ? (Math.random() - 0.5) * screenShake * 2 : 0;
      const sy = screenShake > 0 ? (Math.random() - 0.5) * screenShake * 2 : 0;
      ctx.translate(sx, sy);

      ctx.fillStyle = '#02040b';
      ctx.fillRect(0, 0, w, h);

      // Виртуальная адаптивная сетка 100 x 42
      const GRID_COLS = 100;
      const GRID_ROWS = 42;
      const CELL_W = w / GRID_COLS;
      const CELL_H = h / GRID_ROWS;

      ctx.font = `${Math.floor(CELL_H * 0.95)}px "Fira Code", monospace`;
      ctx.textBaseline = 'top';

      const baseGroundRow = 28;
      const bossCol = 70;
      // Плавное синусоидальное парение летающего босса
      const bossFloatY = Math.sin(tick * 0.08) * 1.5;
      const bossRow = baseGroundRow - 15 + bossFloatY;

      // 1. СИСТЕМНЫЕ СЛОВА
      ['SOCKET', 'RESET', 'SWITCH'].forEach((word, i) => {
        ctx.fillStyle = 'rgba(30, 50, 100, 0.25)';
        ctx.fillText(word, (46 + i * 8) * CELL_W, (10 + i * 4) * CELL_H);
      });

      // 2. РЕЛЬЕФ КРАТЕРА
      for (let sc = 0; sc < GRID_COLS; sc++) {
        const gRow = getElevation(sc, baseGroundRow);
        for (let r = gRow; r < GRID_ROWS; r++) {
          const depth = r - gRow;
          const lineStr = CRATER_GROUND_SYMBOLS[depth % CRATER_GROUND_SYMBOLS.length];
          const ch = lineStr[sc % lineStr.length];
          ctx.fillStyle = depth === 0 ? '#4c5270' : (depth === 1 ? '#343854' : '#1e2238');
          ctx.fillText(ch, sc * CELL_W, r * CELL_H);
        }
      }

      // 3. ТАКТИЧЕСКИЕ ТОЧКИ ПЕРЕМЕЩЕНИЯ (ПРИ РЕЖИМЕ MOVE / BUILD)
      if (actionMode === 'MOVE' || actionMode === 'BUILD') {
        BATTLE_NODES.forEach((node) => {
          const occ = party.find((h) => h.nodeIndex === node.id && !h.isDead);
          const isSelected = selectedMoveNode === node.id;
          const nElev = getElevation(node.x, baseGroundRow) + node.yOffset;

          let slotColor = '#ffffff'; // свободное место
          if (occ) slotColor = '#ef4444'; // занято
          if (isSelected) slotColor = '#22c55e'; // выбрано

          ctx.fillStyle = slotColor;
          ctx.fillText(occ ? '[X]' : '[ ]', node.x * CELL_W, nElev * CELL_H);
        });
      }

      // 4. СТЕНЫ-ЩИТЫ МИШЕЛЯ
      walls.forEach((wall) => {
        const wNode = BATTLE_NODES[wall.nodeIdx];
        const wElev = getElevation(wNode.x, baseGroundRow) + wNode.yOffset;
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#0284c7';
        ctx.shadowBlur = 8;
        ctx.fillText('|===|', (wNode.x + 3) * CELL_W, (wElev - 2) * CELL_H);
        ctx.fillText('|===|', (wNode.x + 3) * CELL_W, (wElev - 1) * CELL_H);
        ctx.shadowBlur = 0;
      });

      // 5. ЛЕТАЮЩИЙ БОСС ХАРПИЯ
      const wingFrames = Math.floor(tick / 12) % 2 === 0 ? FLYING_HARPY_FRAMES.wingsUp : FLYING_HARPY_FRAMES.wingsDown;

      // Шкала HP прямо над боссом
      const hpWidth = 24;
      const filledHp = Math.floor((bossHp / bossMaxHp) * hpWidth);
      ctx.fillStyle = '#ff0033';
      ctx.fillText(`[${'='.repeat(filledHp)}${'-'.repeat(hpWidth - filledHp)}] ${bossHp}/${bossMaxHp}`, (bossCol - 2) * CELL_W, (bossRow - 2) * CELL_H);

      // Иконка горения над боссом
      if (bossBurnTimer > 0) {
        ctx.fillStyle = '#ef4444';
        ctx.fillText('[B]', (bossCol + 23) * CELL_W, (bossRow - 2) * CELL_H);
      }

      wingFrames.forEach((line, li) => {
        for (let ci = 0; ci < line.length; ci++) {
          const ch = line[ci];
          if (ch === ' ') continue;
          ctx.fillStyle = (li <= 1 && ch === '0') ? '#ffffff' : (li <= 1 ? '#ff2233' : (li < 5 ? '#ffaa00' : '#2563eb'));
          ctx.fillText(ch, (bossCol + ci) * CELL_W, (bossRow + li) * CELL_H);
        }
      });

      // 6. ГЕРОИ (ДЫХАНИЕ, ОРУЖИЕ В РУКАХ, ТАРГЕТ-РАМКА)
      party.forEach((hero) => {
        const node = BATTLE_NODES[hero.nodeIndex];
        const hElev = getElevation(node.x, baseGroundRow) + node.yOffset;
        const isActive = hero.id === activeHeroId && timeline[0] !== 'BOSS';

        // Дыхание корпуса (ноги стоят, верх покачивается)
        const breathY = Math.sin(tick * 0.1 + node.id) * 0.4;

        if (hero.isDead) {
          ctx.fillStyle = '#475569';
          ctx.fillText('_x_ (Труп)', node.x * CELL_W, hElev * CELL_H);
          return;
        }

        // Индикатор провокации [T] над танком
        if (hero.hasTaunt) {
          ctx.fillStyle = '#22c55e';
          ctx.fillText('[T]', (node.x + 1) * CELL_W, (hElev - 5 + breathY) * CELL_H);
        }

        // Рамка активного хода
        if (isActive) {
          ctx.fillStyle = '#ff8800';
          ctx.fillText('+--   --+', (node.x - 2) * CELL_W, (hElev - 4) * CELL_H);
          ctx.fillText('|       |', (node.x - 2) * CELL_W, (hElev - 3) * CELL_H);
          ctx.fillText('+--   --+', (node.x - 2) * CELL_W, (hElev - 0) * CELL_H);
          ctx.fillStyle = '#22c55e';
          ctx.fillText(`${hero.hp}/${hero.maxHp}`, (node.x + 6) * CELL_W, (hElev - 2) * CELL_H);
        } else {
          ctx.fillStyle = hero.hp < 40 ? '#ef4444' : '#94a3b8';
          ctx.font = `${Math.floor(CELL_H * 0.75)}px "Fira Code", monospace`;
          ctx.fillText(`${hero.hp}/${hero.maxHp}`, node.x * CELL_W, (hElev + 1) * CELL_H);
          ctx.font = `${Math.floor(CELL_H * 0.95)}px "Fira Code", monospace`;
        }

        // Спрайт героя с оружием
        const weaponSprite = WEAPON_RENDER[hero.weaponType] || WEAPON_RENDER.BLASTER;
        ctx.fillStyle = hero.color;
        ctx.fillText(weaponSprite[0], node.x * CELL_W, (hElev - 3 + breathY) * CELL_H);
        ctx.fillText(weaponSprite[1], node.x * CELL_W, (hElev - 2 + breathY) * CELL_H);
        ctx.fillText(weaponSprite[2], node.x * CELL_W, (hElev - 1) * CELL_H);
      });

      // 7. ДИНАМИЧЕСКАЯ ТРАЕКТОРИЯ "A T T A C K"
      if (actionMode === 'ATTACK' && timeline[0] !== 'BOSS') {
        const startX = BATTLE_NODES[currentHero.nodeIndex].x + 4;
        const startY = getElevation(startX, baseGroundRow) - 2;
        const targetX = bossCol + 6 + aimOffsetX;
        const targetY = bossRow + (aimZone === 'HEAD' ? 2 : (aimZone === 'BODY' ? 6 : 10));

        const animLetters = ['A', 'T', 'T', 'A', 'C', 'K'];
        animLetters.forEach((char, li) => {
          const shift = (tick * 0.05 + li * 0.16) % 1;
          const lx = startX + (targetX - startX) * shift;
          const ly = startY + (targetY - startY) * shift - Math.sin(shift * Math.PI) * 3;
          ctx.fillStyle = '#ff2233';
          ctx.fillText(char, lx * CELL_W, ly * CELL_H);
        });
      }

      // 8. ПРИЦЕЛЬНЫЙ ЛУЧ БОССА
      if (bossLaserTargetX !== null) {
        ctx.strokeStyle = '#ff0033';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bossCol * CELL_W, (bossRow + 4) * CELL_H);
        ctx.lineTo(bossLaserTargetX * CELL_W, (baseGroundRow - 2) * CELL_H);
        ctx.stroke();
      }

      // 9. ВСПЛЫВАЮЩИЕ ЧИСЛА УРОНА
      floatingDamages.forEach((fd) => {
        ctx.fillStyle = fd.color;
        ctx.font = `bold ${Math.floor(CELL_H * 1.15)}px "Fira Code", monospace`;
        ctx.fillText(fd.text, fd.x * CELL_W, fd.y * CELL_H);
        ctx.font = `${Math.floor(CELL_H * 0.95)}px "Fira Code", monospace`;
      });

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [currentScreen, party, activeHeroId, bossHp, bossBurnTimer, walls, actionMode, selectedMoveNode, aimZone, aimOffsetX, timeline, floatingDamages, screenShake, bossLaserTargetX]);

  // Рендер меню
  useEffect(() => {
    if (currentScreen !== 'MENU') return;
    const canvas = menuCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const renderMenu = () => {
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
      ctx.font = `${Math.floor(CELL_H * 0.95)}px "Fira Code", monospace`;

      ['  .---.  ', ' /     \\ ', '|  (o)  |', ' \\     / ', "  '---'  "].forEach((l, i) => {
        ctx.fillStyle = '#e0f2fe';
        ctx.fillText(l, 86 * CELL_W, (3 + i) * CELL_H);
      });

      for (let c = 4; c < 94; c += 16) {
        const tree = TREE_TEMPLATES[c % 2];
        ctx.fillStyle = '#0b192e';
        tree.forEach((line, li) => ctx.fillText(line, c * CELL_W, (21 - tree.length + li) * CELL_H));
      }

      for (let c = 0; c < 100; c++) {
        const gStart = Math.floor(21 + Math.sin(c * 0.1) * 2);
        for (let r = gStart; r < 42; r++) {
          const depth = r - gStart;
          ctx.fillStyle = depth === 0 ? '#1e3a6a' : '#081120';
          ctx.fillText(GROUND_STAMPS[0][c % GROUND_STAMPS[0].length], c * CELL_W, r * CELL_H);
        }
      }
      animId = requestAnimationFrame(renderMenu);
    };
    renderMenu();
    return () => cancelAnimationFrame(animId);
  }, [currentScreen]);

  return (
    <div className="bm-viewport">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Fira+Code:wght@400;700&display=swap');

        .bm-viewport {
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

        .screen-canvas { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 1; }
        .crt-lines { position: absolute; inset: 0; background: linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,0.3) 50%); background-size: 100% 3px; pointer-events: none; z-index: 5; }
        .fade-screen { position: absolute; inset: 0; background: #000; z-index: 100; pointer-events: none; transition: opacity 0.6s ease; }

        @media (orientation: portrait) {
          .portrait-warning {
            position: fixed; inset: 0; background: #02040a; z-index: 9999;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            font-family: 'Press Start 2P', monospace; color: #00f0ff; text-align: center; padding: 24px; line-height: 1.8;
          }
        }
        @media (orientation: landscape) { .portrait-warning { display: none; } }

        /* ИНТЕРФЕЙС БИТВЫ */
        .hud-top {
          position: absolute; top: 8px; left: 14px; right: 14px; z-index: 10;
          display: flex; justify-content: space-between; align-items: flex-start; pointer-events: none;
        }
        .header-title { font-size: clamp(10px, 2vh, 12px); color: #22c55e; margin-bottom: 4px; }
        .hud-interactive { pointer-events: auto; }

        .abilities-columns { display: flex; gap: 24px; background: rgba(3, 7, 18, 0.85); border: 1px solid #1e293b; padding: 6px 12px; }
        .col-title { font-size: 11px; color: #38bdf8; border-bottom: 1px dashed #38bdf8; margin-bottom: 4px; font-weight: bold; }
        
        .skill-btn {
          background: transparent; border: none; color: #cbd5e1; font-family: inherit; font-size: 12px;
          text-align: left; cursor: pointer; padding: 2px 4px; display: block;
        }
        .skill-btn.active { color: #ff9900; text-shadow: 0 0 6px #ff9900; font-weight: bold; }

        /* ПЛАВАЮЩЕЕ ОПИСАНИЕ НАВЫКА */
        .skill-tooltip {
          position: absolute; top: 115px; left: 14px; z-index: 10; max-width: 320px;
          background: rgba(4, 12, 30, 0.95); border: 1px solid #38bdf8; padding: 6px 10px; font-size: 11px; color: #7dd3fc;
        }

        /* ДЖОЙСТИК ПРИЦЕЛИВАНИЯ */
        .aim-joystick {
          position: absolute; bottom: 65px; left: 16px; z-index: 15;
          display: flex; flex-direction: column; align-items: center; gap: 4px;
          background: rgba(3, 7, 18, 0.8); border: 1px solid #ff3333; padding: 6px;
        }
        .joy-row { display: flex; gap: 6px; }
        .joy-btn {
          background: #111827; border: 1px solid #ff5555; color: #ff5555; font-size: 12px;
          width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer;
        }
        .joy-btn:active { background: #ff3333; color: #000; }
        .zone-indicator { font-size: 9px; color: #fca5a5; margin-top: 2px; text-transform: uppercase; }

        /* НИЖНЯЯ ПАНЕЛЬ */
        .hud-bottom {
          position: absolute; bottom: 0; left: 0; right: 0; z-index: 10;
          background: rgba(2, 6, 18, 0.92); border-top: 1px solid #1e293b;
          padding: 8px 16px; display: flex; justify-content: space-between; align-items: center;
        }
        .timeline-stream { font-size: 12px; color: #94a3b8; display: flex; align-items: center; gap: 8px; }
        .t-chip { padding: 2px 6px; border-radius: 2px; }
        .t-chip.active { color: #00f0ff; text-shadow: 0 0 8px #00f0ff; font-weight: bold; border-bottom: 2px solid #00f0ff; }
        .t-chip.boss { color: #ef4444; text-shadow: 0 0 6px #ef4444; font-weight: bold; }

        /* ДИНАМИЧЕСКАЯ ГЛАВНАЯ КНОПКА (ATTACK / BUILD / USE / ACCEPT) */
        .main-action-btn {
          font-family: 'Press Start 2P', monospace; font-size: 13px;
          padding: 12px 24px; border: 2px solid #ff0055; background: rgba(255, 0, 85, 0.15);
          color: #ff0055; cursor: pointer; text-shadow: 0 0 8px #ff0055; box-shadow: 0 0 15px rgba(255, 0, 85, 0.3);
          transition: all 0.15s;
        }
        .main-action-btn.build { border-color: #3b82f6; color: #3b82f6; text-shadow: 0 0 8px #3b82f6; background: rgba(59, 130, 246, 0.15); }
        .main-action-btn.use { border-color: #22c55e; color: #22c55e; text-shadow: 0 0 8px #22c55e; background: rgba(34, 197, 94, 0.15); }
        .main-action-btn.accept { border-color: #eab308; color: #eab308; text-shadow: 0 0 8px #eab308; background: rgba(234, 179, 8, 0.15); }

        /* ОКНО СВОДКИ БОССА */
        .dossier-modal {
          position: fixed; inset: 10% 15%; background: rgba(2, 6, 20, 0.98); border: 2px solid #ff0055;
          z-index: 100; padding: 18px; display: flex; flex-direction: column; justify-content: space-between;
          box-shadow: 0 0 30px rgba(255, 0, 85, 0.5);
        }
      `}</style>

      <div className="fade-screen" style={{ opacity: fadeOpacity }} />

      <div className="portrait-warning">
        <div>[ ! ] ПОВЕРНИТЕ УСТРОЙСТВО</div>
        <div style={{ fontSize: '10px', marginTop: '14px', color: '#64748b' }}>
          БИТВА ТРЕБУЕТ ГОРИЗОНТАЛЬНЫЙ ЭКРАН (LANDSCAPE)
        </div>
      </div>

      <div className="crt-lines" />

      {/* ================= 1. ГЛАВНОЕ МЕНЮ ================= */}
      {currentScreen === 'MENU' && (
        <>
          <canvas ref={menuCanvasRef} className="screen-canvas" />
          <div style={{ position: 'absolute', inset: 0, z-index: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/basiclogo.png" alt="BeginningMention" style={{ maxHeight: '180px', marginBottom: '20px' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            <div style={{ width: '100vw', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div
                style={{ width: '100%', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#00f0ff', background: menuSelectedIdx === 0 ? 'rgba(0,240,255,0.18)' : 'transparent', fontFamily: 'Press Start 2P', fontSize: '12px' }}
                onPointerEnter={() => setMenuSelectedIdx(0)}
                onClick={handleStartBattle}
              >
                {menuSelectedIdx === 0 ? '> НОВАЯ ЭКСПЕДИЦИЯ' : '  НОВАЯ ЭКСПЕДИЦИЯ'}
              </div>
              <div
                style={{ width: '100%', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'not-allowed', color: '#475569', fontFamily: 'Press Start 2P', fontSize: '12px' }}
              >
                ЗАГРУЗКИ (LOCKED)
              </div>
            </div>
          </div>
        </>
      )}

      {/* ================= 2. БОЕВАЯ АРЕНА ================= */}
      {currentScreen === 'BATTLE' && (
        <>
          <canvas ref={battleCanvasRef} className="screen-canvas" onClick={handleCanvasClick} />

          {/* ВЕРХНЕЕ МЕНЮ: ABILITIES & MOVES */}
          <div className="hud-top">
            <div className="hud-interactive">
              <div className="header-title">
                {currentHero.name} // {currentHero.title} ({currentHero.role})
              </div>

              <div className="abilities-columns">
                {/* 1. Столбец способностей (Abilities) */}
                <div>
                  <div className="col-title">Abilities</div>
                  {currentHero.skills.map((skill, sIdx) => (
                    <button
                      key={skill.id}
                      className={`skill-btn ${selectedSkillIdx === sIdx && actionMode !== 'MOVE' ? 'active' : ''}`}
                      onClick={() => handleSkillSelect(sIdx)}
                    >
                      {skill.name}
                    </button>
                  ))}
                </div>

                {/* 2. Столбец движения (Moves) */}
                <div>
                  <div className="col-title">Moves</div>
                  <button
                    className={`skill-btn ${actionMode === 'MOVE' ? 'active' : ''}`}
                    onClick={() => { setActionMode('MOVE'); setSelectedMoveNode(null); }}
                  >
                    &gt; Move (Позиция)
                  </button>
                  <button className="skill-btn" onClick={handleFlee}>
                    &gt; Flee (Побег)
                  </button>
                </div>
              </div>
            </div>

            {/* Консольный лог по центру */}
            <div style={{ color: '#22c55e', fontSize: '11px', background: 'rgba(2,6,18,0.7)', padding: '4px 8px', border: '1px solid #1e293b' }}>
              {combatLog}
            </div>

            {/* Правый верх: Кнопка меню */}
            <div className="hud-interactive">
              <button
                style={{ background: 'transparent', border: '1px solid #38bdf8', color: '#38bdf8', padding: '4px 8px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '11px' }}
                onClick={() => setCurrentScreen('MENU')}
              >
                [ МЕНЮ ]
              </button>
            </div>
          </div>

          {/* КОМПАКТНОЕ ОПИСАНИЕ ВЫБРАННОГО НАВЫКА */}
          {actionMode !== 'MOVE' && (
            <div className="skill-tooltip">
              {currentHero.skills[selectedSkillIdx]?.description}
            </div>
          )}

          {/* МИНИ-ДЖОЙСТИК ПРИЦЕЛИВАНИЯ (ДЛЯ АТАК) */}
          {actionMode === 'ATTACK' && timeline[0] !== 'BOSS' && (
            <div className="aim-joystick hud-interactive">
              <button className="joy-btn" onClick={() => setAimZone('HEAD')}>▲</button>
              <div className="joy-row">
                <button className="joy-btn" onClick={() => setAimOffsetX((prev) => Math.max(-10, prev - 2))}>◄</button>
                <button className="joy-btn" onClick={() => setAimZone('BODY')}>●</button>
                <button className="joy-btn" onClick={() => setAimOffsetX((prev) => Math.min(10, prev + 2))}>►</button>
              </div>
              <button className="joy-btn" onClick={() => setAimZone('LEGS')}>▼</button>
              <div className="zone-indicator">ЗОНА: {aimZone}</div>
            </div>
          )}

          {/* НИЖНЯЯ ПАНЕЛЬ С УМНЫМ ТАЙМЛАЙНОМ И ДИНАМИЧЕСКОЙ КНОПКОЙ */}
          <div className="hud-bottom">
            <div className="timeline-stream">
              <span style={{ color: '#64748b', fontSize: '10px' }}>ИНИЦИАТИВА:</span>
              {timeline.slice(0, 6).map((unitId, i) => (
                <React.Fragment key={i}>
                  <span className={`t-chip ${i === 0 ? 'active' : ''} ${unitId === 'BOSS' ? 'boss' : ''}`}>
                    {unitId === 'BOSS' ? 'ХАРПИЯ' : party.find((h) => h.id === unitId)?.name}
                  </span>
                  {i < 5 && <span>—&gt;</span>}
                </React.Fragment>
              ))}
            </div>

            {/* ГЛАВНАЯ КНОПКА ДЕЙСТВИЯ */}
            <div className="hud-interactive">
              <button
                className={`main-action-btn ${actionMode.toLowerCase()}`}
                onClick={handleMainActionButton}
              >
                {actionMode === 'BUILD' ? 'BUILD' : (actionMode === 'USE' || actionMode === 'HEAL_SELECT' ? 'USE' : (actionMode === 'MOVE' ? 'ACCEPT' : 'ATTACK'))}
              </button>
            </div>
          </div>

          {/* СВОДКА БОССА (DOSSIER) ПРИ ДВОЙНОМ ТАПЕ */}
          {showBossDossier && (
            <div className="dossier-modal hud-interactive">
              <div>
                <div style={{ color: '#ff0055', fontSize: '16px', fontWeight: 'bold', borderBottom: '1px solid #ff0055', paddingBottom: '6px' }}>
                  {BOSS_DOSSIER.name} // {BOSS_DOSSIER.type}
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', margin: '10px 0' }}>
                  {BOSS_DOSSIER.description}
                </div>
                <div style={{ color: '#38bdf8', fontSize: '13px', margin: '8px 0', fontWeight: 'bold' }}>
                  АРСЕНАЛ БОССА:
                </div>
                {BOSS_DOSSIER.skills.map((s, idx) => (
                  <div key={idx} style={{ fontSize: '11px', marginBottom: '6px' }}>
                    <span style={{ color: '#ffaa00' }}>{s.name}:</span> <span style={{ color: '#cbd5e1' }}>{s.desc}</span>
                  </div>
                ))}
              </div>
              <button
                style={{ background: '#ff0055', color: '#000', border: 'none', padding: '8px 16px', fontFamily: 'inherit', fontWeight: 'bold', cursor: 'pointer', alignSelf: 'flex-end' }}
                onClick={() => setShowBossDossier(false)}
              >
                [ ЗАКРЫТЬ ДОСЬЕ ]
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
