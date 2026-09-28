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
  // Состояния: Вводный марш (5 сек) или Битва
  const [scenePhase, setScenePhase] = useState<'MARCHING' | 'BATTLE'>('MARCHING');
  const [marchProgress, setMarchProgress] = useState<number>(0);

  // 4 выбранных героя игрока
  const [party, setParty] = useState<(StarterHero & { curHp: number; ammo: number; isDead: boolean })[]>(() =>
    selectedSquadIds.slice(0, 4).map((id) => {
      const h = STARTER_HEROES.find((s) => s.id === id) || STARTER_HEROES[0];
      return { ...h, curHp: h.hp, ammo: h.maxAmmo, isDead: false };
    })
  );

  // Враги берутся из сценария локации
  const [enemies, setEnemies] = useState<EnemyCombatant[]>(() =>
    scenario.initialEnemies.map((e) => ({ ...e }))
  );

  const [activeHeroIdx, setActiveHeroIdx] = useState<number>(0);
  const [selectedSkillIdx, setSelectedSkillIdx] = useState<number>(0);
  const [showSkillInfo, setShowSkillInfo] = useState<boolean>(false);

  // Пальцевый прицел по правой половине экрана
  const [aimPos, setAimPos] = useState<{ x: number; y: number }>({ x: 74, y: 24 });
  const [activeVfx, setActiveVfx] = useState<{ type: string; progress: number; targetX: number; targetY: number } | null>(null);

  const [floatingDamages, setFloatingDamages] = useState<FloatingDmg[]>([]);
  const [screenShake, setScreenShake] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const activeHero = party[activeHeroIdx];

  // --------------------------------------------------------------------------
  // ПРОЦЕДУРНЫЙ 8-БИТНЫЙ СИНТЕЗАТОР (ИЗ НОТ СЦЕНАРИЯ)
  // --------------------------------------------------------------------------
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

        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.18);

        setTimeout(playChiptuneBeat, 220);
      };

      playChiptuneBeat();
    } catch {
      // Игнорируем автоплей блокировку браузера до первого тапа
    }

    return () => {
      isCancelled = true;
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, [scenario]);

  // Марш отряда при входе в локацию
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
  // АТАКА ГЕРОЯ ПО ТРАЕКТОРИИ ПАЛЬЦА
  // --------------------------------------------------------------------------
  const handleAttack = () => {
    if (activeVfx || scenePhase !== 'BATTLE') return;

    // Перезарядка при 0 патронов
    if (activeHero.ammo <= 0) {
      setParty((prev) =>
        prev.map((h, i) => (i === activeHeroIdx ? { ...h, ammo: h.maxAmmo } : h))
      );
      addFloating(activeHero.id === 'josef' ? 14 : 22, 22, '[ПЕРЕЗАРЯДКА]', '#00fff2');
      advanceTurn();
      return;
    }

    const skill = activeHero.skills[selectedSkillIdx];

    setParty((prev) =>
      prev.map((h, i) => (i === activeHeroIdx ? { ...h, ammo: Math.max(0, h.ammo - skill.ammoCost) } : h))
    );

    setActiveVfx({
      type: skill.type,
      progress: 0,
      targetX: aimPos.x,
      targetY: aimPos.y
    });

    const startT = Date.now();
    const duration = skill.type === 'laser' ? 350 : 600;

    const vfxInterval = setInterval(() => {
      const p = Math.min(1, (Date.now() - startT) / duration);
      setActiveVfx((prev) => (prev ? { ...prev, progress: p } : null));

      if (p >= 1) {
        clearInterval(vfxInterval);
        setActiveVfx(null);

        // Поиск врага в радиусе прицела
        let hitEnemy = enemies.find(
          (e) => !e.isDead && Math.hypot(e.col - aimPos.x, (scenario.getFloorRow(e.col) + e.rowOffset) - aimPos.y) < 7
        );

        if (!hitEnemy) {
          hitEnemy = enemies.find((e) => !e.isDead);
        }

        if (hitEnemy) {
          const isHeadshot = Math.abs(aimPos.y - (scenario.getFloorRow(hitEnemy.col) + hitEnemy.rowOffset - 3)) < 1.8;
          let dmg = 12;

          if (activeHero.id === 'josef') {
            if (skill.id === 'impulse') {
              dmg = isHeadshot ? 20 : Math.floor(Math.random() * 5) + 11;
            } else {
              dmg = Math.floor(Math.random() * 7) + 28;
            }
          } else {
            dmg = Math.floor(Math.random() * 8) + 16;
          }

          setEnemies((prev) =>
            prev.map((e) => {
              if (e.id === hitEnemy!.id) {
                const newHp = Math.max(0, e.hp - dmg);
                return { ...e, hp: newHp, isDead: newHp === 0 };
              }
              return e;
            })
          );

          setScreenShake(isHeadshot ? 5 : 2);
          addFloating(
            hitEnemy.col,
            scenario.getFloorRow(hitEnemy.col) + hitEnemy.rowOffset - 3,
            isHeadshot ? `КРИТ -${dmg}` : `-${dmg}`,
            isHeadshot ? '#ff0033' : '#ffaa00'
          );
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
      // ХОД ВРАГОВ ПО ИХ СЦЕНАРНОЙ ЛОГИКЕ
      setTimeout(executeEnemiesTurn, 600);
    } else {
      setActiveHeroIdx(nextHeroIdx);
      setSelectedSkillIdx(0);
      setShowSkillInfo(false);
    }
  };

  const executeEnemiesTurn = () => {
    const aliveEnemies = enemies.filter((e) => !e.isDead);
    const aliveHeroes = party.filter((h) => !h.isDead);

    if (aliveHeroes.length === 0) {
      onDefeat();
      return;
    }

    aliveEnemies.forEach((enemy, idx) => {
      setTimeout(() => {
        const targetHeroIdx = scenario.getEnemyAttackTargetIdx(enemy, party);
        const targetHero = party[targetHeroIdx] || aliveHeroes[0];

        const dmg = Math.floor(Math.random() * 6) + 10;
        setParty((prev) =>
          prev.map((h) => {
            if (h.id === targetHero.id) {
              const newHp = Math.max(0, h.curHp - dmg);
              return { ...h, curHp: newHp, isDead: newHp === 0 };
            }
            return h;
          })
        );

        setScreenShake(3);
        addFloating(20, 24, `УДАР -${dmg}`, '#ef4444');
      }, idx * 300);
    });

    setTimeout(() => {
      setActiveHeroIdx(0);
      setSelectedSkillIdx(0);
      setShowSkillInfo(false);
    }, aliveEnemies.length * 300 + 400);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const gridX = (px / rect.width) * 100;
    const gridY = (py / rect.height) * 42;

    if (gridX > 46) {
      setAimPos({ x: gridX, y: gridY });
    }
  };

  // Анимация всплывающих чисел
  useEffect(() => {
    const interval = setInterval(() => {
      setFloatingDamages((prev) =>
        prev
          .map((d) => ({ ...d, y: d.y - 0.35 }))
          .filter((d) => d.y > 5)
      );
    }, 35);
    return () => clearInterval(interval);
  }, []);

  // --------------------------------------------------------------------------
  // РЕНДЕР КАНВАСА БОЯ
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

      const CELL_W = w / 100;
      const CELL_H = h / 42;
      ctx.font = `${Math.floor(CELL_H * 0.95)}px monospace`;
      ctx.textBaseline = 'top';

      const floorScrollOffset = scenePhase === 'MARCHING' ? tick * 0.4 : marchProgress * 100;

      // 1. Окружение локации из сценария
      scenario.drawEnvironment(ctx, CELL_W, CELL_H, tick);

      // 2. Рельеф пола
      for (let sc = 0; sc < 100; sc++) {
        const floorY = scenario.getFloorRow(sc + Math.floor(floorScrollOffset));
        for (let r = floorY; r < 42; r++) {
          const depth = r - floorY;
          ctx.fillStyle = depth === 0 ? '#7c3aed' : (depth === 1 ? '#5b21b6' : '#2e1065');
          const symbols = ['~', '#', '%', 'x', '='];
          const ch = symbols[(sc + r) % symbols.length];
          ctx.fillText(ch, sc * CELL_W, r * CELL_H);
        }
      }

      // 3. Отряд игроков в 2 ряда (верхний чуть впереди, нижний чуть дальше)
      const heroPositions = [
        { col: 18, rowOffset: -2 },
        { col: 26, rowOffset: -2 },
        { col: 14, rowOffset: 2 },
        { col: 22, rowOffset: 2 }
      ];

      party.forEach((hero, idx) => {
        const pos = heroPositions[idx];
        const hFloorY = scenario.getFloorRow(pos.col) + pos.rowOffset;
        const isActive = idx === activeHeroIdx && scenePhase === 'BATTLE';

        const walkFrame = Math.floor(tick / 8) % 2 === 0 ? hero.artBreath1 : hero.artBreath2;

        if (isActive) {
          ctx.fillStyle = '#00fff2';
          ctx.fillText('+-- --+', (pos.col - 2) * CELL_W, (hFloorY - 4) * CELL_H);
          ctx.fillText(`| ${hero.name} |`, (pos.col - 2) * CELL_W, (hFloorY - 3) * CELL_H);
        }

        ctx.fillStyle = hero.color;
        ctx.shadowColor = hero.color;
        ctx.shadowBlur = 6;
        walkFrame.forEach((line, li) => {
          ctx.fillText(line, pos.col * CELL_W, (hFloorY - 2 + li) * CELL_H);
        });
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#22c55e';
        ctx.fillText(`${hero.curHp}/${hero.hp}`, pos.col * CELL_W, (hFloorY + 2) * CELL_H);
      });

      // 4. Отрисовка врагов из сценария
      const enemySpawnShiftX = scenePhase === 'MARCHING' ? (1 - marchProgress) * 45 : 0;

      enemies.forEach((enemy) => {
        if (enemy.isDead) return;
        const eFloorY = scenario.getFloorRow(enemy.col) + enemy.rowOffset;
        const renderCol = enemy.col + enemySpawnShiftX;

        ctx.fillStyle = enemy.color;
        enemy.art.forEach((line, li) => {
          ctx.fillText(line, renderCol * CELL_W, (eFloorY - 2 + li) * CELL_H);
        });

        ctx.fillStyle = '#ef4444';
        ctx.fillText(`${enemy.hp}/${enemy.maxHp}`, renderCol * CELL_W, (eFloorY + 2) * CELL_H);
      });

      // 5. Траектория белых букв "a t t a c k"
      if (scenePhase === 'BATTLE' && !activeVfx) {
        const startHeroPos = heroPositions[activeHeroIdx];
        const startX = startHeroPos.col + 4;
        const startY = scenario.getFloorRow(startHeroPos.col) + startHeroPos.rowOffset - 1;

        const letters = ['a', 't', 't', 'a', 'c', 'k'];
        letters.forEach((char, i) => {
          const shift = (tick * 0.06 + i * 0.16) % 1;
          const curX = startX + (aimPos.x - startX) * shift;
          const curY = startY + (aimPos.y - startY) * shift;

          ctx.fillStyle = '#ffffff';
          ctx.fillText(char, curX * CELL_W, curY * CELL_H);
        });

        ctx.fillStyle = '#00fff2';
        ctx.fillText('[+]', (aimPos.x - 1) * CELL_W, aimPos.y * CELL_H);
      }

      // 6. Спецэффекты
      if (activeVfx) {
        const startHeroPos = heroPositions[activeHeroIdx];
        const sX = startHeroPos.col + 4;
        const sY = scenario.getFloorRow(startHeroPos.col) + startHeroPos.rowOffset - 1;

        if (activeVfx.type === 'laser') {
          ctx.strokeStyle = '#c084fc';
          ctx.shadowColor = '#c084fc';
          ctx.shadowBlur = 10;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(sX * CELL_W, sY * CELL_H);
          ctx.lineTo(activeVfx.targetX * CELL_W, activeVfx.targetY * CELL_H);
          ctx.stroke();
          ctx.shadowBlur = 0;
        } else if (activeVfx.type === 'bomb') {
          const curX = sX + (activeVfx.targetX - sX) * activeVfx.progress;
          const curY = sY + (activeVfx.targetY - sY) * activeVfx.progress - Math.sin(activeVfx.progress * Math.PI) * 7;
          ctx.fillStyle = '#c084fc';
          ctx.fillText('(●)', curX * CELL_W, curY * CELL_H);
        }
      }

      // 7. Всплывающий урон
      floatingDamages.forEach((fd) => {
        ctx.fillStyle = fd.col;
        ctx.fillText(fd.text, fd.x * CELL_W, fd.y * CELL_H);
      });

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [party, enemies, activeHeroIdx, scenePhase, marchProgress, aimPos, activeVfx, floatingDamages, screenShake, scenario]);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#020314', overflow: 'hidden', fontFamily: "'Press Start 2P', monospace" }}>
      <canvas
        ref={canvasRef}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerMove}
        style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
      />

      {/* ВЕРХНИЙ HUD АКТИВНОГО ГЕРОЯ С БОЛЬШИМ ASCII-ОРУЖИЕМ */}
      {scenePhase === 'BATTLE' && (
        <div style={{ position: 'absolute', top: 12, left: 16, zIndex: 10, pointerEvents: 'auto' }}>
          <div style={{ fontSize: '11px', color: activeHero.color }}>
            {activeHero.name} // {activeHero.weaponName} [ПАТРОНЫ: {activeHero.ammo}/{activeHero.maxAmmo}]
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginTop: '8px' }}>
            {/* Большое ASCII-оружие */}
            <pre style={{ margin: 0, fontSize: '10px', lineHeight: 1.1, color: '#38bdf8', textShadow: '0 0 8px #0284c7' }}>
              {activeHero.largeWeaponAscii.join('\n')}
            </pre>

            {/* Навыки с кнопкой [i] */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {activeHero.skills.map((sk, idx) => (
                <div key={sk.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={() => { setSelectedSkillIdx(idx); setShowSkillInfo(false); }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: selectedSkillIdx === idx ? '#00fff2' : '#94a3b8',
                      fontFamily: 'inherit',
                      fontSize: '9px',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    {selectedSkillIdx === idx ? `>>> ${sk.name}` : `    ${sk.name}`}
                  </button>

                  <button
                    onClick={() => setShowSkillInfo((prev) => !prev)}
                    style={{ background: 'transparent', border: '1px solid #f59e0b', color: '#f59e0b', fontFamily: 'inherit', fontSize: '8px', padding: '2px 4px', cursor: 'pointer' }}
                  >
                    [i]
                  </button>
                </div>
              ))}

              {/* Выезжающая справка [i] */}
              {showSkillInfo && (
                <div style={{ background: 'rgba(2, 6, 24, 0.95)', border: '1px solid #f59e0b', padding: '6px 10px', fontSize: '8px', color: '#fef08a', maxWidth: '260px', lineHeight: 1.5 }}>
                  {activeHero.skills[selectedSkillIdx].desc}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* НИЖНЯЯ ПАНЕЛЬ ТАЙМЛАЙНА И КНОПКА [ ATTACK ] */}
      {scenePhase === 'BATTLE' && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(2,3,20,0.95)', borderTop: '1px solid #1e1b4b', padding: '10px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
          <div style={{ fontSize: '9px', color: '#94a3b8' }}>
            ОЧЕРЕДЬ: <span style={{ color: activeHero.color }}>{activeHero.name}</span> —&gt; <span>Michael</span> —&gt; <span style={{ color: '#84cc16' }}>{enemies[0]?.name || 'Враг'}</span> —&gt; <span>Kyle</span> —&gt; <span>Artemis</span>
          </div>

          <button
            onClick={handleAttack}
            style={{
              background: 'rgba(255,0,85,0.2)',
              border: '2px solid #ff0055',
              color: '#ff0055',
              fontFamily: 'inherit',
              fontSize: '11px',
              padding: '10px 24px',
              cursor: 'pointer'
            }}
          >
            [ ATTACK ]
          </button>
        </div>
      )}
    </div>
  );
};
