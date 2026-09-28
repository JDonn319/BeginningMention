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

  // 4 выбранных героя (гарантированно содержат curHp и maxHp)
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

  // Прицеливание: позиция курсора на поле
  const [aimPos, setAimPos] = useState<{ x: number; y: number }>({ x: 50, y: 20 });
  const [selectedAllyTargetIdx, setSelectedAllyTargetIdx] = useState<number>(0);

  // Анимация полета снаряда игрока
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

  // Прицеливание и атака врага
  const [aimingEnemyId, setAimingEnemyId] = useState<number | null>(null);
  const [enemyLaserTarget, setEnemyLaserTarget] = useState<{ x: number; y: number } | null>(null);
  const [enemyRockVfx, setEnemyRockVfx] = useState<{
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

  // Позиции героев на рельефе (2 ряда: верхний x: 14-22, нижний x: 18-26)
  const heroLayout = [
    { col: 14, rowOffset: -2 }, // Верхний ряд
    { col: 22, rowOffset: -2 },
    { col: 18, rowOffset: 2 },  // Нижний ряд (ближе)
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
      // Игнорируем блокировку автоплея до первого взаимодействия
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

    // 1. НАВЫК ЛЕЧЕНИЯ (ДЕМИД / КАЙЛ) — КЛИК ПО СОЮЗНИКУ
    if (activeSkill.category === 'HEAL') {
      const targetAlly = party[selectedAllyTargetIdx];
      const healVal = Math.floor(targetAlly.maxHp * 0.4);

      setParty((prev) =>
        prev.map((h, i) =>
          i === selectedAllyTargetIdx
            ? { ...h, isDead: false, curHp: Math.min(h.maxHp, h.curHp + healVal) }
            : h
        )
      );

      const targetPos = heroLayout[selectedAllyTargetIdx];
      addFloating(targetPos.col, scenario.getFloorRow(targetPos.col) + targetPos.rowOffset - 3, `+${healVal} HP`, '#39ff14');
      advanceTurn();
      return;
    }

    // 2. ВОЗВЕДЕНИЕ СТЕНЫ (МИШЕЛЬ) — СТАВИТ ЩИТ СОЮЗНИКУ
    if (activeSkill.category === 'WALL') {
      setParty((prev) =>
        prev.map((h, i) => (i === selectedAllyTargetIdx ? { ...h, hasShield: true } : h))
      );
      const targetPos = heroLayout[selectedAllyTargetIdx];
      addFloating(targetPos.col, scenario.getFloorRow(targetPos.col) + targetPos.rowOffset - 3, '[ЩИТ +45]', '#38bdf8');
      advanceTurn();
      return;
    }

    // 3. БОЕВЫЕ НАВЫКИ (АТАКА / АОЕ)
    if (activeHero.ammo <= 0) {
      setParty((prev) =>
        prev.map((h, i) => (i === activeHeroIdx ? { ...h, ammo: h.maxAmmo } : h))
      );
      addFloating(heroLayout[activeHeroIdx].col, scenario.getFloorRow(heroLayout[activeHeroIdx].col) - 4, '[ПЕРЕЗАРЯДКА]', '#00fff2');
      advanceTurn();
      return;
    }

    // Списание патронов
    setParty((prev) =>
      prev.map((h, i) => (i === activeHeroIdx ? { ...h, ammo: Math.max(0, h.ammo - activeSkill.ammoCost) } : h))
    );

    const startPos = heroLayout[activeHeroIdx];
    const sX = startPos.col + 4;
    const sY = scenario.getFloorRow(startPos.col) + startPos.rowOffset - 1;

    setActiveVfx({
      trajectory: activeSkill.trajectory,
      color: activeSkill.category === 'AOE' ? '#c084fc' : (activeHero.id === 'michael' ? '#d97706' : '#00fff2'),
      char: activeSkill.category === 'AOE' ? '●' : (activeHero.id === 'michael' ? '[|||]' : '==>'),
      progress: 0,
      startX: sX,
      startY: sY,
      targetX: aimPos.x,
      targetY: aimPos.y
    });

    const startT = Date.now();
    const duration = activeSkill.trajectory === 'LINE' ? 320 : 650;

    const vfxInterval = setInterval(() => {
      const p = Math.min(1, (Date.now() - startT) / duration);
      setActiveVfx((prev) => (prev ? { ...prev, progress: p } : null));

      if (p >= 1) {
        clearInterval(vfxInterval);
        setActiveVfx(null);

        // Расчет урона
        if (activeSkill.category === 'AOE') {
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
          setScreenShake(hitCount > 0 ? 6 : 2);
        } else {
          let hitEnemy = enemies.find(
            (e) => !e.isDead && Math.hypot(e.col - aimPos.x, (scenario.getFloorRow(e.col) + e.rowOffset) - aimPos.y) < 7
          );
          if (!hitEnemy) hitEnemy = enemies.find((e) => !e.isDead);

          if (hitEnemy) {
            const isHead = Math.abs(aimPos.y - (scenario.getFloorRow(hitEnemy.col) + hitEnemy.rowOffset - 2)) < 1.6;
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

            setScreenShake(isHead ? 5 : 2);
            addFloating(
              hitEnemy.col,
              scenario.getFloorRow(hitEnemy.col) + hitEnemy.rowOffset - 3,
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

  const advanceTurn = () => {
    setScreenShake(0);
    const aliveEnemies = enemies.filter((e) => !e.isDead);
    if (aliveEnemies.length === 0) {
      onVictory();
      return;
    }

    const nextHeroIdx = (activeHeroIdx + 1) % party.length;
    if (nextHeroIdx === 0) {
      // ХОД ОРКОВ С ВИЗУАЛЬНЫМ ПРИЦЕЛИВАНИЕМ
      setTimeout(executeOrcsTurnWithAiming, 600);
    } else {
      setActiveHeroIdx(nextHeroIdx);
      setSelectedSkillIdx(0);
      setShowSkillInfo(false);
    }
  };

  // ОРКИ ВИЗУАЛЬНО ЦЕЛЯТСЯ И КИДАЮТ КАМНИ ПО ДУГЕ
  const executeOrcsTurnWithAiming = () => {
    const aliveEnemies = enemies.filter((e) => !e.isDead);
    const aliveHeroes = party.filter((h) => !h.isDead);

    if (aliveHeroes.length === 0) {
      onDefeat();
      return;
    }

    let delay = 0;

    aliveEnemies.forEach((orc) => {
      setTimeout(() => {
        setAimingEnemyId(orc.id);
        const targetHeroIdx = scenario.getEnemyAttackTargetIdx(orc, party);
        const targetPos = heroLayout[targetHeroIdx];
        setEnemyLaserTarget({ x: targetPos.col, y: scenario.getFloorRow(targetPos.col) + targetPos.rowOffset - 1 });
      }, delay);

      setTimeout(() => {
        const targetHeroIdx = scenario.getEnemyAttackTargetIdx(orc, party);
        const targetPos = heroLayout[targetHeroIdx];
        const targetHero = party[targetHeroIdx];

        const oY = scenario.getFloorRow(orc.col) + orc.rowOffset - 2;
        const tY = scenario.getFloorRow(targetPos.col) + targetPos.rowOffset - 1;

        const throwStart = Date.now();
        const duration = 500;

        const rockInterval = setInterval(() => {
          const p = Math.min(1, (Date.now() - throwStart) / duration);
          setEnemyRockVfx({
            progress: p,
            startX: orc.col,
            startY: oY,
            targetX: targetPos.col,
            targetY: tY
          });

          if (p >= 1) {
            clearInterval(rockInterval);
            setEnemyRockVfx(null);
            setAimingEnemyId(null);
            setEnemyLaserTarget(null);

            if (targetHero.hasShield) {
              setParty((prev) =>
                prev.map((h, i) => (i === targetHeroIdx ? { ...h, hasShield: false } : h))
              );
              addFloating(targetPos.col, tY - 2, '[БЛОК ЩИТОМ]', '#38bdf8');
            } else {
              const rockDmg = Math.floor(Math.random() * 5) + 12;
              setParty((prev) =>
                prev.map((h, i) =>
                  i === targetHeroIdx
                    ? { ...h, curHp: Math.max(0, h.curHp - rockDmg), isDead: h.curHp - rockDmg <= 0 }
                    : h
                )
              );
              setScreenShake(4);
              addFloating(targetPos.col, tY - 2, `-${rockDmg}`, '#ef4444');
            }
          }
        }, 20);
      }, delay + 650);

      delay += 1350;
    });

    setTimeout(() => {
      setActiveHeroIdx(0);
      setSelectedSkillIdx(0);
      setShowSkillInfo(false);
    }, delay + 300);
  };

  // Перемещение пальца: прицеливание
  const handlePointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const gridX = (px / rect.width) * 75;
    const gridY = (py / rect.height) * 32;

    if (activeSkill.category === 'HEAL' || activeSkill.category === 'WALL') {
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
      if (gridX > 36) {
        setAimPos({ x: gridX, y: gridY });
      }
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setFloatingDamages((prev) =>
        prev.map((d) => ({ ...d, y: d.y - 0.3 })).filter((d) => d.y > 4)
      );
    }, 35);
    return () => clearInterval(interval);
  }, []);

  // --------------------------------------------------------------------------
  // РЕНДЕР КАНВАСА (СЕТКА 75x32, ЧЕСТНАЯ ПОСАДКА НА ЗЕМЛЮ)
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

      // 2. Фиолетовый рельеф земли (начинается с 20 строки)
      for (let sc = 0; sc < GRID_COLS; sc++) {
        const floorY = scenario.getFloorRow(sc + Math.floor(floorScrollOffset));
        for (let r = floorY; r < GRID_ROWS; r++) {
          const depth = r - floorY;
          ctx.fillStyle = depth === 0 ? '#7c3aed' : (depth === 1 ? '#5b21b6' : '#2e1065');
          const symbols = ['~', '#', '%', 'x', '='];
          ctx.fillText(symbols[(sc + r) % symbols.length], sc * CELL_W, r * CELL_H);
        }
      }

      // 3. Отряд героев (2 ряда, жестко стоят ногами L L на грунте)
      party.forEach((hero, idx) => {
        const pos = heroLayout[idx];
        const hFloorY = scenario.getFloorRow(pos.col) + pos.rowOffset;
        const isActive = idx === activeHeroIdx && scenePhase === 'BATTLE';
        const isTargetedByHeal = (activeSkill.category === 'HEAL' || activeSkill.category === 'WALL') && selectedAllyTargetIdx === idx;

        const walkFrame = Math.floor(tick / 8) % 2 === 0 ? hero.artBreath1 : hero.artBreath2;

        if (isActive) {
          ctx.fillStyle = '#00fff2';
          ctx.fillText('+-- --+', (pos.col - 2) * CELL_W, (hFloorY - 4) * CELL_H);
          ctx.fillText(`| ${hero.name} |`, (pos.col - 2) * CELL_W, (hFloorY - 3) * CELL_H);
        }

        if (isTargetedByHeal) {
          ctx.fillStyle = '#39ff14';
          ctx.fillText('[ ЦЕЛЬ ]', (pos.col - 1) * CELL_W, (hFloorY - 4.5) * CELL_H);
        }

        if (hero.hasShield) {
          ctx.fillStyle = '#38bdf8';
          ctx.fillText('|===|', (pos.col + 3) * CELL_W, (hFloorY - 2) * CELL_H);
        }

        // Фигура героя
        ctx.fillStyle = hero.color;
        ctx.shadowColor = hero.color;
        ctx.shadowBlur = 6;
        walkFrame.forEach((line, li) => {
          ctx.fillText(line, pos.col * CELL_W, (hFloorY - 3 + li) * CELL_H);
        });
        ctx.shadowBlur = 0;

        // HP
        ctx.fillStyle = '#22c55e';
        ctx.fillText(`${hero.curHp}/${hero.maxHp}`, pos.col * CELL_W, (hFloorY + 1) * CELL_H);
      });

      // 4. Орки (крупные, стоят ногами I I на грунте)
      const enemySpawnShiftX = scenePhase === 'MARCHING' ? (1 - marchProgress) * 40 : 0;

      enemies.forEach((orc) => {
        if (orc.isDead) return;
        const oFloorY = scenario.getFloorRow(orc.col) + orc.rowOffset;
        const renderCol = orc.col + enemySpawnShiftX;
        const isAiming = aimingEnemyId === orc.id;

        if (activeSkill.category === 'AOE' && Math.hypot(orc.col - aimPos.x, oFloorY - aimPos.y) <= 12) {
          ctx.fillStyle = '#ff0055';
          ctx.fillText('[!ЦЕЛЬ!]', (renderCol - 1) * CELL_W, (oFloorY - 4.5) * CELL_H);
        }

        ctx.fillStyle = orc.color;
        const currentArt = isAiming ? orc.artAiming : orc.artIdle;
        currentArt.forEach((line, li) => {
          ctx.fillText(line, renderCol * CELL_W, (oFloorY - 3 + li) * CELL_H);
        });

        ctx.fillStyle = '#ef4444';
        ctx.fillText(`${orc.hp}/${orc.maxHp}`, renderCol * CELL_W, (oFloorY + 1) * CELL_H);
      });

      // 5. Траектория прицеливания игрока
      if (scenePhase === 'BATTLE' && !activeVfx && (activeSkill.category === 'ATTACK' || activeSkill.category === 'AOE')) {
        const startPos = heroLayout[activeHeroIdx];
        const sX = startPos.col + 4;
        const sY = scenario.getFloorRow(startPos.col) + startPos.rowOffset - 2;

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
          ctx.fillStyle = '#ff0055';
          ctx.fillText('(==== РАДИУС ВЗРЫВА ====)', (aimPos.x - 12) * CELL_W, (aimPos.y + 2) * CELL_H);
        }
      }

      // 6. Красная дуга прицеливания Орка
      if (enemyLaserTarget !== null && aimingEnemyId !== null) {
        const orc = enemies.find((e) => e.id === aimingEnemyId);
        if (orc) {
          const oYPos = scenario.getFloorRow(orc.col) + orc.rowOffset - 2;
          for (let i = 0; i <= 10; i++) {
            const t = i / 10;
            const rx = orc.col + (enemyLaserTarget.x - orc.col) * t;
            const ry = oYPos + (enemyLaserTarget.y - oYPos) * t - Math.sin(t * Math.PI) * 6;
            ctx.fillStyle = '#ff0033';
            ctx.fillText('!', rx * CELL_W, ry * CELL_H);
          }
        }
      }

      // 7. Полет камня орка
      if (enemyRockVfx) {
        const curX = enemyRockVfx.startX + (enemyRockVfx.targetX - enemyRockVfx.startX) * enemyRockVfx.progress;
        const curY = enemyRockVfx.startY + (enemyRockVfx.targetY - enemyRockVfx.startY) * enemyRockVfx.progress - Math.sin(enemyRockVfx.progress * Math.PI) * 7;
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('(ВАЛУН)', curX * CELL_W, curY * CELL_H);
      }

      // 8. Спецэффекты полета снарядов игрока
      if (activeVfx) {
        let curX = activeVfx.startX + (activeVfx.targetX - activeVfx.startX) * activeVfx.progress;
        let curY = activeVfx.startY + (activeVfx.targetY - activeVfx.startY) * activeVfx.progress;

        if (activeVfx.trajectory === 'PARABOLA') {
          curY -= Math.sin(activeVfx.progress * Math.PI) * 7;
        }

        ctx.fillStyle = activeVfx.color;
        ctx.shadowColor = activeVfx.color;
        ctx.shadowBlur = 10;

        if (activeVfx.trajectory === 'LINE') {
          ctx.strokeStyle = activeVfx.color;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(activeVfx.startX * CELL_W, activeVfx.startY * CELL_H);
          ctx.lineTo(activeVfx.targetX * CELL_W, activeVfx.targetY * CELL_H);
          ctx.stroke();
        } else {
          ctx.fillText(activeVfx.char, curX * CELL_W, curY * CELL_H);
        }
        ctx.shadowBlur = 0;
      }

      // 9. Всплывающий урон
      floatingDamages.forEach((fd) => {
        ctx.fillStyle = fd.col;
        ctx.fillText(fd.text, fd.x * CELL_W, fd.y * CELL_H);
      });

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [party, enemies, activeHeroIdx, scenePhase, marchProgress, aimPos, activeVfx, floatingDamages, screenShake, scenario, selectedSkillIdx, activeSkill, selectedAllyTargetIdx, aimingEnemyId, enemyLaserTarget, enemyRockVfx]);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#020314', overflow: 'hidden', fontFamily: "'Press Start 2P', monospace" }}>
      <canvas
        ref={canvasRef}
        onPointerMove={handlePointer}
        onPointerDown={handlePointer}
        style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
      />

      {/* ВЕРХ СЛЕВА: АКТИВНЫЙ ГЕРОЙ, ОРУЖИЕ И НАВЫКИ */}
      {scenePhase === 'BATTLE' && (
        <div style={{ position: 'absolute', top: 12, left: 16, zIndex: 10, pointerEvents: 'auto' }}>
          <div style={{ fontSize: '10px', color: activeHero.color, marginBottom: '6px' }}>
            {activeHero.name} // {activeHero.weaponName} [ПАТРОНЫ: {activeHero.ammo}/{activeHero.maxAmmo}]
          </div>

          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            {/* Большое ASCII-оружие */}
            <pre style={{ margin: 0, fontSize: '9px', lineHeight: 1.1, color: '#38bdf8' }}>
              {activeHero.largeWeaponAscii.join('\n')}
            </pre>

            {/* Способности с >>> и кнопкой [i] */}
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

              {/* Выезжающая справка [i] */}
              {showSkillInfo && (
                <div style={{ background: 'rgba(2, 6, 24, 0.95)', border: '1px solid #f59e0b', padding: '6px 8px', fontSize: '7px', color: '#fef08a', maxWidth: '240px', lineHeight: 1.5 }}>
                  {activeSkill.desc}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* НИЖНЯЯ ПАНЕЛЬ С ОЧЕРЕДЬЮ И ДИНАМИЧЕСКОЙ КНОПКОЙ */}
      {scenePhase === 'BATTLE' && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(2,3,20,0.95)', borderTop: '1px solid #1e1b4b', padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
          <div style={{ fontSize: '8px', color: '#94a3b8' }}>
            ОЧЕРЕДЬ: <span style={{ color: activeHero.color }}>{activeHero.name}</span> —&gt; <span>Michael</span> —&gt; <span style={{ color: '#84cc16' }}>Орки (Камни)</span> —&gt; <span>Kyle</span> —&gt; <span>Artemis</span>
          </div>

          <button
            onClick={handleAction}
            style={{
              background: activeSkill.category === 'HEAL' ? 'rgba(57,255,20,0.2)' : (activeSkill.category === 'WALL' ? 'rgba(56,189,248,0.2)' : 'rgba(255,0,85,0.2)'),
              border: `2px solid ${activeSkill.category === 'HEAL' ? '#39ff14' : (activeSkill.category === 'WALL' ? '#38bdf8' : '#ff0055')}`,
              color: activeSkill.category === 'HEAL' ? '#39ff14' : (activeSkill.category === 'WALL' ? '#38bdf8' : '#ff0055'),
              fontFamily: 'inherit',
              fontSize: '10px',
              padding: '8px 20px',
              cursor: 'pointer'
            }}
          >
            {activeSkill.category === 'HEAL' ? '[ ПРИМЕНИТЬ ]' : (activeSkill.category === 'WALL' ? '[ ПОСТРОИТЬ ]' : '[ ATTACK ]')}
          </button>
        </div>
      )}
    </div>
  );
};
