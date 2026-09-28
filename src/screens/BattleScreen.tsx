import React, { useEffect, useRef, useState } from 'react';
import { STARTER_HEROES, StarterHero } from '../templates/asciiModels';
import { LocationScenario, EnemyCombatant } from '../locations/types';

interface Props {
  scenario: LocationScenario;
  selectedSquadIds: string[];
  onVictory: () => void;
  onDefeat: () => void;
}

interface FloatingDmg {
  id: number;
  text: string;
  x: number;
  y: number;
  col: string;
}

export const BattleScreen: React.FC<Props> = ({
  scenario,
  selectedSquadIds,
  onVictory,
  onDefeat
}) => {
  const [scenePhase, setScenePhase] = useState<'MARCHING' | 'BATTLE'>('MARCHING');
  const [marchProgress, setMarchProgress] = useState<number>(0);

  // 4 выбранных героя
  const [party, setParty] = useState<(StarterHero & { curHp: number; maxHp: number; ammo: number; isDead: boolean; hasShield: boolean })[]>(() =>
    selectedSquadIds.slice(0, 4).map((id) => {
      const h = STARTER_HEROES.find((s) => s.id === id) || STARTER_HEROES[0];
      return { ...h, curHp: h.hp, maxHp: h.hp, ammo: h.maxAmmo, isDead: false, hasShield: false };
    })
  );

  // Враги из сценария
  const [enemies, setEnemies] = useState<EnemyCombatant[]>(() =>
    scenario.initialEnemies.map((e) => ({ ...e }))
  );

  const [activeHeroIdx, setActiveHeroIdx] = useState<number>(0);
  const [selectedSkillIdx, setSelectedSkillIdx] = useState<number>(0);
  const [showSkillInfo, setShowSkillInfo] = useState<boolean>(false);

  // Прицеливание
  const [aimPos, setAimPos] = useState<{ x: number; y: number }>({ x: 50, y: 22 });
  const [selectedAllyTargetIdx, setSelectedAllyTargetIdx] = useState<number>(0);

  // Неоновый посимвольный VFX игрока
  const [activeVfx, setActiveVfx] = useState<{
    trajectory: 'LINE' | 'PARABOLA' | 'NONE';
    color: string;
    char: string;
    progress: number;
    startX: number;
    startY: number;
    targetX: number;
    targetY: number;
  } | null>(null);

  // Прицеливание орка и полет копья
  const [aimingEnemyId, setAimingEnemyId] = useState<number | null>(null);
  const [enemySpearVfx, setEnemySpearVfx] = useState<{
    progress: number;
    startX: number;
    startY: number;
    targetX: number;
    targetY: number;
  } | null>(null);

  const [floatingDamages, setFloatingDamages] = useState<FloatingDmg[]>([]);
  const [screenShake, setScreenShake] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const activeHero = party[activeHeroIdx];
  const activeSkill = activeHero.skills[selectedSkillIdx];

  // Расположение героев на грунте (2 ряда)
  const heroLayout = [
    { col: 14, rowOffset: -2 }, // Верхний ряд (дальний)
    { col: 22, rowOffset: -2 },
    { col: 18, rowOffset: 2 },  // Нижний ряд (ближний)
    { col: 26, rowOffset: 2 }
  ];

  // 8-битная музыка
  useEffect(() => {
    let isCancelled = false;
    let noteIdx = 0;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const playChiptuneBeat = () => {
        if (isCancelled || !audioCtxRef.current) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'square';
        osc.frequency.value = scenario.musicBassNotes[noteIdx % scenario.musicBassNotes.length];
        noteIdx++;

        gain.gain.setValueAtTime(0.035, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.16);

        setTimeout(playChiptuneBeat, 220);
      };

      playChiptuneBeat();
    } catch {
      // Игнорируем блокировку
    }

    return () => {
      isCancelled = true;
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, [scenario]);

  // Вводный марш
  useEffect(() => {
    const startT = Date.now();
    const duration = scenario.introMarchDurationMs;

    const interval = setInterval(() => {
      const p = Math.min(1, (Date.now() - startT) / duration);
      setMarchProgress(p);

      if (p >= 1) {
        clearInterval(interval);
        setScenePhase('BATTLE');
      }
    }, 30);

    return () => clearInterval(interval);
  }, [scenario]);

  // --------------------------------------------------------------------------
  // АТАКА / ПРИМЕНЕНИЕ НАВЫКА
  // --------------------------------------------------------------------------
  const handleAction = () => {
    if (activeVfx || scenePhase !== 'BATTLE' || aimingEnemyId !== null) return;

    // 1. МАССОВЫЙ ОТХИЛ ВСЕЙ КОМАНДЫ (ДЕМИД / КАЙЛ)
    if (activeSkill.category === 'HEAL_ALL') {
      const healPercent = 0.4;
      setParty((prev) =>
        prev.map((h) => {
          const healVal = Math.floor(h.maxHp * healPercent);
          return {
            ...h,
            isDead: false,
            curHp: Math.min(h.maxHp, h.curHp + healVal)
          };
        })
      );

      // Всплывающие крестики над всеми живыми
      party.forEach((h, i) => {
        const pos = heroLayout[i];
        const hY = scenario.getFloorRow(pos.col) + pos.rowOffset;
        addFloating(pos.col, hY - 3, `+${Math.floor(h.maxHp * healPercent)} HP`, '#39ff14');
      });

      advanceTurn();
      return;
    }

    // 2. ВОЗВЕДЕНИЕ СТЕНЫ (МИШЕЛЬ)
    if (activeSkill.category === 'WALL') {
      setParty((prev) =>
        prev.map((h, i) => (i === selectedAllyTargetIdx ? { ...h, hasShield: true } : h))
      );
      const targetPos = heroLayout[selectedAllyTargetIdx];
      const hY = scenario.getFloorRow(targetPos.col) + targetPos.rowOffset;
      addFloating(targetPos.col, hY - 3, '[ЩИТ +45]', '#38bdf8');
      advanceTurn();
      return;
    }

    // 3. БОЕВЫЕ СПОСОБНОСТИ
    if (activeHero.ammo <= 0) {
      setParty((prev) =>
        prev.map((h, i) => (i === activeHeroIdx ? { ...h, ammo: h.maxAmmo } : h))
      );
      addFloating(heroLayout[activeHeroIdx].col, scenario.getFloorRow(heroLayout[activeHeroIdx].col) - 4, '[ПЕРЕЗАРЯДКА]', '#00fff2');
      advanceTurn();
      return;
    }

    setParty((prev) =>
      prev.map((h, i) => (i === activeHeroIdx ? { ...h, ammo: Math.max(0, h.ammo - activeSkill.ammoCost) } : h))
    );

    const startPos = heroLayout[activeHeroIdx];
    const sX = startPos.col + 4;
    const sY = scenario.getFloorRow(startPos.col) + startPos.rowOffset - 1;

    // Спецэффекты только из символов
    let vfxChar = '==>>*';
    if (activeSkill.category === 'AOE') vfxChar = '(@@@)';
    else if (activeHero.id === 'michael') vfxChar = '[|||||]';
    else if (activeHero.id === 'artemis') vfxChar = '<<==>>==+';

    setActiveVfx({
      trajectory: activeSkill.trajectory,
      color: activeSkill.category === 'AOE' ? '#c084fc' : (activeHero.id === 'michael' ? '#d97706' : '#00fff2'),
      char: vfxChar,
      progress: 0,
      startX: sX,
      startY: sY,
      targetX: aimPos.x,
      targetY: aimPos.y
    });

    const startT = Date.now();
    const duration = activeSkill.trajectory === 'LINE' ? 300 : 600;

    const vfxInterval = setInterval(() => {
      const p = Math.min(1, (Date.now() - startT) / duration);
      setActiveVfx((prev) => (prev ? { ...prev, progress: p } : null));

      if (p >= 1) {
        clearInterval(vfxInterval);
        setActiveVfx(null);

        if (activeSkill.category === 'AOE') {
          // Урон ВСЕМ оркам в зоне взрыва
          let hitCount = 0;
          setEnemies((prev) =>
            prev.map((orc) => {
              const oY = scenario.getFloorRow(orc.col) + orc.rowOffset;
              const dist = Math.hypot(orc.col - aimPos.x, oY - aimPos.y);

              if (!orc.isDead && dist <= 12) {
                hitCount++;
                const aoeDmg = Math.floor(Math.random() * 6) + 28;
                addFloating(orc.col, oY - 3, `ВЗРЫВ -${aoeDmg}`, '#ff0055');
                const newHp = Math.max(0, orc.hp - aoeDmg);
                return { ...orc, hp: newHp, isDead: newHp === 0 };
              }
              return orc;
            })
          );
          if (hitCount > 0) triggerShake(5);
        } else {
          let hitEnemy = enemies.find(
            (e) => !e.isDead && Math.hypot(e.col - aimPos.x, (scenario.getFloorRow(e.col) + e.rowOffset) - aimPos.y) < 7
          );
          if (!hitEnemy) hitEnemy = enemies.find((e) => !e.isDead);

          if (hitEnemy) {
            const oY = scenario.getFloorRow(hitEnemy.col) + hitEnemy.rowOffset;
            const isHead = Math.abs(aimPos.y - (oY - 2)) < 1.6;
            let dmg = isHead ? 20 : Math.floor(Math.random() * 5) + 11;
            if (activeHero.id === 'michael') dmg = isHead ? 28 : 12;

            setEnemies((prev) =>
              prev.map((e) => {
                if (e.id === hitEnemy!.id) {
                  const newHp = Math.max(0, e.hp - dmg);
                  return { ...e, hp: newHp, isDead: newHp === 0 };
                }
                return e;
              })
            );

            triggerShake(isHead ? 5 : 2);
            addFloating(
              hitEnemy.col,
              oY - 3,
              isHead ? `КРИТ -${dmg}` : `-${dmg}`,
              isHead ? '#ff0033' : '#ffaa00'
            );
          }
        }

        setTimeout(advanceTurn, 300);
      }
    }, 20);
  };

  const addFloating = (x: number, y: number, text: string, col: string) => {
    setFloatingDamages((prev) => [...prev, { id: Math.random(), text, x, y, col }]);
  };

  // Тряска экрана со строгим автосбросом через 200 мс
  const triggerShake = (val: number) => {
    setScreenShake(val);
    setTimeout(() => {
      setScreenShake(0);
    }, 200);
  };

  const advanceTurn = () => {
    setScreenShake(0);
    const aliveEnemies = enemies.filter((e) => !e.isDead);
    if (aliveEnemies.length === 0) {
      onVictory();
      return;
    }

    const nextHeroIdx = (activeHeroIdx + 1) % party.length;
    if (nextHeroIdx === 0) {
      // ХОД ОРКОВ
      setTimeout(executeOrcsTurnWithSpears, 500);
    } else {
      setActiveHeroIdx(nextHeroIdx);
      setSelectedSkillIdx(0);
      setShowSkillInfo(false);
    }
  };

  // --------------------------------------------------------------------------
  // ОРКИ АНИМИРОВАННО ЦЕЛЯТСЯ РУКОЙ И БРОСАЮТ КОПЬЯ <<--->
  // --------------------------------------------------------------------------
  const executeOrcsTurnWithSpears = () => {
    const aliveEnemies = enemies.filter((e) => !e.isDead);
    const aliveHeroes = party.filter((h) => !h.isDead);

    if (aliveHeroes.length === 0) {
      onDefeat();
      return;
    }

    let delay = 0;

    aliveEnemies.forEach((orc) => {
      // 1. Орк поднимает руку ooO с копьем вверх
      setTimeout(() => {
        setAimingEnemyId(orc.id);
      }, delay);

      // 2. Бросок копья <<--->
      setTimeout(() => {
        const targetHeroIdx = scenario.getEnemyAttackTargetIdx(orc, party);
        const targetPos = heroLayout[targetHeroIdx];
        const targetHero = party[targetHeroIdx];

        const oY = scenario.getFloorRow(orc.col) + orc.rowOffset;
        const tY = scenario.getFloorRow(targetPos.col) + targetPos.rowOffset;

        const throwStart = Date.now();
        const duration = 480;

        const spearInterval = setInterval(() => {
          const p = Math.min(1, (Date.now() - throwStart) / duration);
          setEnemySpearVfx({
            progress: p,
            startX: orc.col,
            startY: oY - 2,
            targetX: targetPos.col,
            targetY: tY - 1
          });

          if (p >= 1) {
            clearInterval(spearInterval);
            setEnemySpearVfx(null);
            setAimingEnemyId(null);

            if (targetHero.hasShield) {
              setParty((prev) =>
                prev.map((h, i) => (i === targetHeroIdx ? { ...h, hasShield: false } : h))
              );
              addFloating(targetPos.col, tY - 2, '[БЛОК ЩИТОМ]', '#38bdf8');
            } else {
              const spearDmg = Math.floor(Math.random() * 5) + 12;
              setParty((prev) =>
                prev.map((h, i) =>
                  i === targetHeroIdx
                    ? { ...h, curHp: Math.max(0, h.curHp - spearDmg), isDead: h.curHp - spearDmg <= 0 }
                    : h
                )
              );
              triggerShake(4);
              addFloating(targetPos.col, tY - 2, `-${spearDmg}`, '#ef4444');
            }
          }
        }, 20);
      }, delay + 600);

      delay += 1250;
    });

    setTimeout(() => {
      setActiveHeroIdx(0);
      setSelectedSkillIdx(0);
      setShowSkillInfo(false);
    }, delay + 200);
  };

  const handlePointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const gridX = (px / rect.width) * 75;
    const gridY = (py / rect.height) * 32;

    if (activeSkill.category === 'WALL') {
      let closestAlly = 0;
      let closestDist = 999;
      heroLayout.forEach((pos, i) => {
        const d = Math.hypot(pos.col - gridX, (scenario.getFloorRow(pos.col) + pos.rowOffset) - gridY);
        if (d < closestDist) {
          closestDist = d;
          closestAlly = i;
        }
      });
      setSelectedAllyTargetIdx(closestAlly);
    } else {
      if (gridX > 35) {
        setAimPos({ x: gridX, y: gridY });
      }
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setFloatingDamages((prev) =>
        prev.map((d) => ({ ...d, y: d.y - 0.3 })).filter((d) => d.y > 3)
      );
    }, 35);
    return () => clearInterval(interval);
  }, []);

  // --------------------------------------------------------------------------
  // РЕНДЕР КАНВАСА: ГЕРОИ И ОРКИ СТОЯТ СТРОГО НА ЗЕМЛЕ
  // --------------------------------------------------------------------------
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

      const sx = screenShake > 0 ? (Math.random() - 0.5) * screenShake * 2 : 0;
      const sy = screenShake > 0 ? (Math.random() - 0.5) * screenShake * 2 : 0;
      ctx.translate(sx, sy);

      ctx.fillStyle = '#020314';
      ctx.fillRect(0, 0, w, h);

      const GRID_COLS = 75;
      const GRID_ROWS = 32;
      const CELL_W = w / GRID_COLS;
      const CELL_H = h / GRID_ROWS;

      ctx.font = `${Math.floor(CELL_H * 0.95)}px monospace`;
      ctx.textBaseline = 'top';

      const floorScrollOffset = scenePhase === 'MARCHING' ? tick * 0.4 : marchProgress * 100;

      // 1. Окружение
      scenario.drawEnvironment(ctx, CELL_W, CELL_H, tick);

      // 2. Сине-фиолетовый рельеф земли (начинается с 22 строки)
      for (let sc = 0; sc < GRID_COLS; sc++) {
        const floorY = scenario.getFloorRow(sc + Math.floor(floorScrollOffset));
        for (let r = floorY; r < GRID_ROWS; r++) {
          const depth = r - floorY;
          ctx.fillStyle = depth === 0 ? '#7c3aed' : (depth === 1 ? '#5b21b6' : '#2e1065');
          const symbols = ['~', '#', '%', 'x', '='];
          ctx.fillText(symbols[(sc + r) % symbols.length], sc * CELL_W, r * CELL_H);
        }
      }

      // 3. Отряд героев — ПОДОШВЫ L L СТОЯТ СТРОГО НА УРОВНЕ ЗЕМЛИ!
      party.forEach((hero, idx) => {
        const pos = heroLayout[idx];
        const floorY = scenario.getFloorRow(pos.col) + pos.rowOffset;
        const isActive = idx === activeHeroIdx && scenePhase === 'BATTLE' && aimingEnemyId === null;
        const isWallTarget = activeSkill.category === 'WALL' && selectedAllyTargetIdx === idx;

        const walkFrame = Math.floor(tick / 8) % 2 === 0 ? hero.artBreath1 : hero.artBreath2;

        // Рамка активного хода
        if (isActive) {
          ctx.fillStyle = '#00fff2';
          ctx.fillText('+-- --+', (pos.col - 2) * CELL_W, (floorY - 4) * CELL_H);
          ctx.fillText(`| ${hero.name} |`, (pos.col - 2) * CELL_W, (floorY - 3) * CELL_H);
        }

        if (isWallTarget) {
          ctx.fillStyle = '#39ff14';
          ctx.fillText('[ ЦЕЛЬ ]', (pos.col - 1) * CELL_W, (floorY - 4.5) * CELL_H);
        }

        if (hero.hasShield) {
          ctx.fillStyle = '#38bdf8';
          ctx.fillText('|===|', (pos.col + 3) * CELL_W, (floorY - 1) * CELL_H);
        }

        // Фигура героя: последняя строка (L L) рисуется ровно на строке floorY
        ctx.fillStyle = hero.color;
        ctx.shadowColor = hero.color;
        ctx.shadowBlur = 8;
        walkFrame.forEach((line, li) => {
          ctx.fillText(line, pos.col * CELL_W, (floorY - walkFrame.length + 1 + li) * CELL_H);
        });
        ctx.shadowBlur = 0;

        // HP
        ctx.fillStyle = '#22c55e';
        ctx.fillText(`${hero.curHp}/${hero.hp}`, pos.col * CELL_W, (floorY + 1.2) * CELL_H);
      });

      // 4. Орки — НОГИ II II СТОЯТ СТРОГО НА УРОВНЕ ЗЕМЛИ!
      const enemySpawnShiftX = scenePhase === 'MARCHING' ? (1 - marchProgress) * 40 : 0;

      enemies.forEach((orc) => {
        if (orc.isDead) return;
        const floorY = scenario.getFloorRow(orc.col) + orc.rowOffset;
        const renderCol = orc.col + enemySpawnShiftX;
        const isAiming = aimingEnemyId === orc.id;

        // Подсветка целей в зоне взрыва
        if (activeSkill.category === 'AOE' && Math.hypot(orc.col - aimPos.x, floorY - aimPos.y) <= 12) {
          ctx.fillStyle = '#ff0055';
          ctx.fillText('[!ЦЕЛЬ!]', (renderCol - 1) * CELL_W, (floorY - 5) * CELL_H);
        }

        ctx.fillStyle = orc.color;
        const currentArt = isAiming ? orc.artAiming : orc.artIdle;
        // Последняя строка (II II) рисуется ровно на строке floorY
        currentArt.forEach((line, li) => {
          ctx.fillText(line, renderCol * CELL_W, (floorY - currentArt.length + 1 + li) * CELL_H);
        });

        ctx.fillStyle = '#ef4444';
        ctx.fillText(`${orc.hp}/${orc.maxHp}`, renderCol * CELL_W, (floorY + 1.2) * CELL_H);
      });

      // 5. Траектория игрока a t t a c k (НЕ МИГАЕТ, ЧИСТАЯ КРИВАЯ)
      if (scenePhase === 'BATTLE' && !activeVfx && aimingEnemyId === null && (activeSkill.category === 'ATTACK' || activeSkill.category === 'AOE')) {
        const startPos = heroLayout[activeHeroIdx];
        const sX = startPos.col + 4;
        const sY = scenario.getFloorRow(startPos.col) + startPos.rowOffset - 1;

        const steps = 14;
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const curX = sX + (aimPos.x - sX) * t;
          let curY = sY + (aimPos.y - sY) * t;

          if (activeSkill.trajectory === 'PARABOLA') {
            curY -= Math.sin(t * Math.PI) * 7;
          }

          const letters = ['a', 't', 't', 'a', 'c', 'k'];
          ctx.fillStyle = '#ffffff';
          ctx.fillText(letters[i % letters.length], curX * CELL_W, curY * CELL_H);
        }

        ctx.fillStyle = '#00fff2';
        ctx.fillText('[+]', (aimPos.x - 1) * CELL_W, aimPos.y * CELL_H);

        if (activeSkill.category === 'AOE') {
          ctx.fillStyle = '#c084fc';
          ctx.fillText('(==== ЗОНА ВЗРЫВА ====)', (aimPos.x - 11) * CELL_W, (aimPos.y + 2) * CELL_H);
        }
      }

      // 6. Полет копья орка <<---> со свечением
      if (enemySpearVfx) {
        const curX = enemySpearVfx.startX + (enemySpearVfx.targetX - enemySpearVfx.startX) * enemySpearVfx.progress;
        const curY = enemySpearVfx.startY + (enemySpearVfx.targetY - enemySpearVfx.startY) * enemySpearVfx.progress;

        ctx.fillStyle = '#ff3b00';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 12;
        ctx.fillText('<<--->', curX * CELL_W, curY * CELL_H);
        ctx.shadowBlur = 0;
      }

      // 7. Неоновые спецэффекты игрока (ТОЛЬКО ИЗ СИМВОЛОВ)
      if (activeVfx) {
        let curX = activeVfx.startX + (activeVfx.targetX - activeVfx.startX) * activeVfx.progress;
        let curY = activeVfx.startY + (activeVfx.targetY - activeVfx.startY) * activeVfx.progress;

        if (activeVfx.trajectory === 'PARABOLA') {
          curY -= Math.sin(activeVfx.progress * Math.PI) * 7;
        }

        ctx.fillStyle = activeVfx.color;
        ctx.shadowColor = activeVfx.color;
        ctx.shadowBlur = 14;

        if (activeVfx.trajectory === 'LINE') {
          // Неоновый лазер из символов
          for (let step = 0; step < 10; step++) {
            const lx = activeVfx.startX + (activeVfx.targetX - activeVfx.startX) * (step / 10);
            const ly = activeVfx.startY + (activeVfx.targetY - activeVfx.startY) * (step / 10);
            ctx.fillText('=>', lx * CELL_W, ly * CELL_H);
          }
        } else {
          ctx.fillText(activeVfx.char, curX * CELL_W, curY * CELL_H);
        }
        ctx.shadowBlur = 0;
      }

      // 8. Всплывающий урон
      floatingDamages.forEach((fd) => {
        ctx.fillStyle = fd.col;
        ctx.fillText(fd.text, fd.x * CELL_W, fd.y * CELL_H);
      });

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [party, enemies, activeHeroIdx, scenePhase, marchProgress, aimPos, activeVfx, floatingDamages, screenShake, scenario, selectedSkillIdx, activeSkill, selectedAllyTargetIdx, aimingEnemyId, enemySpearVfx]);

  const isEnemyAttacking = aimingEnemyId !== null || enemySpearVfx !== null;

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#020314', overflow: 'hidden', fontFamily: "'Press Start 2P', monospace" }}>
      <canvas
        ref={canvasRef}
        onPointerMove={handlePointer}
        onPointerDown={handlePointer}
        style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
      />

      {/* ВЕРХ СЛЕВА: ИНТЕРФЕЙС АТАКИ И СПОСОБНОСТЕЙ (СКРЫВАЕТСЯ ВО ВРЕМЯ АТАКИ ОРКОВ!) */}
      {scenePhase === 'BATTLE' && !isEnemyAttacking && (
        <div style={{ position: 'absolute', top: 12, left: 16, zIndex: 10, pointerEvents: 'auto' }}>
          <div style={{ fontSize: '10px', color: activeHero.color, marginBottom: '6px' }}>
            {activeHero.name} // {activeHero.weaponName} [ПАТРОНЫ: {activeHero.ammo}/{activeHero.maxAmmo}]
          </div>

          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <pre style={{ margin: 0, fontSize: '9px', lineHeight: 1.1, color: '#38bdf8' }}>
              {activeHero.largeWeaponAscii.join('\n')}
            </pre>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {activeHero.skills.map((sk, idx) => (
                <div key={sk.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={() => { setSelectedSkillIdx(idx); setShowSkillInfo(false); }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: selectedSkillIdx === idx ? '#00fff2' : '#94a3b8',
                      fontFamily: 'inherit',
                      fontSize: '8px',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    {selectedSkillIdx === idx ? `>>> ${sk.name}` : `    ${sk.name}`}
                  </button>

                  <button
                    onClick={() => setShowSkillInfo((prev) => !prev)}
                    style={{ background: 'transparent', border: '1px solid #f59e0b', color: '#f59e0b', fontFamily: 'inherit', fontSize: '7px', padding: '2px 4px', cursor: 'pointer' }}
                  >
                    [i]
                  </button>
                </div>
              ))}

              {showSkillInfo && (
                <div style={{ background: 'rgba(2, 6, 24, 0.95)', border: '1px solid #f59e0b', padding: '6px 8px', fontSize: '7px', color: '#fef08a', maxWidth: '240px', lineHeight: 1.5 }}>
                  {activeSkill.desc}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* СТАТУС ВРАЖЕСКОГО ХОДА ВМЕСТО ИНТЕРФЕЙСА */}
      {isEnemyAttacking && (
        <div style={{ position: 'absolute', top: 16, left: 20, zIndex: 10, color: '#ff2233', fontSize: '10px', textShadow: '0 0 8px #ff0000' }}>
          [ ХОД ВРАГА // ОРКИ ЦЕЛЯТСЯ И КИДАЮТ КОПЬЯ ]
        </div>
      )}

      {/* НИЖНЯЯ ПАНЕЛЬ С ОЧЕРЕДЬЮ И КНОПКОЙ (СКРЫВАЕТСЯ ВО ВРЕМЯ ХОДА ВРАГА!) */}
      {scenePhase === 'BATTLE' && !isEnemyAttacking && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(2,3,20,0.95)', borderTop: '1px solid #1e1b4b', padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
          <div style={{ fontSize: '8px', color: '#94a3b8' }}>
            ОЧЕРЕДЬ: <span style={{ color: activeHero.color }}>{activeHero.name}</span> —&gt; <span>Michael</span> —&gt; <span style={{ color: '#84cc16' }}>Орки (Копья)</span> —&gt; <span>Kyle</span> —&gt; <span>Artemis</span>
          </div>

          <button
            onClick={handleAction}
            style={{
              background: activeSkill.category === 'HEAL_ALL' ? 'rgba(57,255,20,0.2)' : (activeSkill.category === 'WALL' ? 'rgba(56,189,248,0.2)' : 'rgba(255,0,85,0.2)'),
              border: `2px solid ${activeSkill.category === 'HEAL_ALL' ? '#39ff14' : (activeSkill.category === 'WALL' ? '#38bdf8' : '#ff0055')}`,
              color: activeSkill.category === 'HEAL_ALL' ? '#39ff14' : (activeSkill.category === 'WALL' ? '#38bdf8' : '#ff0055'),
              fontFamily: 'inherit',
              fontSize: '10px',
              padding: '8px 20px',
              cursor: 'pointer'
            }}
          >
            {activeSkill.category === 'HEAL_ALL' ? '[ ВЫЛЕЧИТЬ ОТРЯД ]' : (activeSkill.category === 'WALL' ? '[ ПОСТРОИТЬ ]' : '[ ATTACK ]')}
          </button>
        </div>
      )}
    </div>
  );
};
