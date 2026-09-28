import React, { useEffect, useRef, useState } from 'react';
import { STARTER_HEROES, ORC_MODEL, StarterHero } from '../templates/asciiModels';

interface Props {
  selectedSquadIds: string[];
  onVictory: () => void;
  onDefeat: () => void;
}

interface OrcEnemy {
  id: number;
  role: 'BRAWLER' | 'SNIPER' | 'OPPORTUNIST';
  hp: number;
  maxHp: number;
  col: number;
  rowOffset: number;
  isDead: boolean;
}

interface FloatingDmg {
  id: number;
  text: string;
  x: number;
  y: number;
  col: string;
  alpha: number;
}

export const CaveBattleScreen: React.FC<Props> = ({ selectedSquadIds, onVictory, onDefeat }) => {
  // Состояние сцены: 'MARCHING' (5 сек вход) или 'BATTLE'
  const [sceneState, setSceneState] = useState<'MARCHING' | 'BATTLE'>('MARCHING');
  const [marchProgress, setMarchProgress] = useState<number>(0);

  // Боевой отряд игроков (4 выбранных бойца)
  const [party, setParty] = useState<(StarterHero & { curHp: number; ammo: number; isDead: boolean })[]>(() =>
    selectedSquadIds.slice(0, 4).map((id) => {
      const h = STARTER_HEROES.find((s) => s.id === id) || STARTER_HEROES[0];
      return { ...h, curHp: h.hp, ammo: h.maxAmmo, isDead: false };
    })
  );

  // 5 Орков (1 спереди, 2 сверху сзади, 2 снизу сзади)
  const [orcs, setOrcs] = useState<OrcEnemy[]>([
    { id: 0, role: 'BRAWLER',     hp: 60, maxHp: 60, col: 64, rowOffset: 0,  isDead: false }, // Передний
    { id: 1, role: 'SNIPER',      hp: 45, maxHp: 45, col: 76, rowOffset: -4, isDead: false }, // Задний верх 1
    { id: 2, role: 'SNIPER',      hp: 45, maxHp: 45, col: 86, rowOffset: -4, isDead: false }, // Задний верх 2
    { id: 3, role: 'OPPORTUNIST', hp: 50, maxHp: 50, col: 76, rowOffset: 4,  isDead: false }, // Задний низ 1
    { id: 4, role: 'OPPORTUNIST', hp: 50, maxHp: 50, col: 86, rowOffset: 4,  isDead: false }  // Задний низ 2
  ]);

  const [activeHeroIdx, setActiveHeroIdx] = useState<number>(0);
  const [selectedSkillIdx, setSelectedSkillIdx] = useState<number>(0);
  const [showSkillInfo, setShowSkillInfo] = useState<boolean>(false);

  // Прицеливание пальцем по правой половине экрана
  const [touchAimPos, setTouchAimPos] = useState<{ x: number; y: number }>({ x: 74, y: 24 });
  const [activeVfx, setActiveVfx] = useState<{ type: string; progress: number; targetX: number; targetY: number } | null>(null);

  // Всплывающие числа урона и лог
  const [floatingDamages, setFloatingDamages] = useState<FloatingDmg[]>([]);
  const [screenShake, setScreenShake] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const activeHero = party[activeHeroIdx];

  // --------------------------------------------------------------------------
  // ПРОЦЕДУРНАЯ 8-БИТНАЯ МУЗЫКА (WEB AUDIO API CHIPTUNE)
  // --------------------------------------------------------------------------
  useEffect(() => {
    let isCancelled = false;
    const notes = [130.81, 146.83, 164.81, 174.61, 196.0, 220.0, 246.94]; // Ноты басовой гаммы
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
        osc.frequency.value = notes[noteIdx % notes.length];
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
      // Игнорируем автоплей блокировку до первого клика
    }

    return () => {
      isCancelled = true;
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  // 5 секунд марша отряда при входе в пещеру
  useEffect(() => {
    const startT = Date.now();
    const duration = 5000;

    const interval = setInterval(() => {
      const p = Math.min(1, (Date.now() - startT) / duration);
      setMarchProgress(p);

      if (p >= 1) {
        clearInterval(interval);
        setSceneState('BATTLE');
      }
    }, 30);

    return () => clearInterval(interval);
  }, []);

  // Неровный рандомно перекошенный рельеф пещеры (фиолетовый пол)
  const getCaveFloorRow = (col: number) => {
    return Math.floor(24 + Math.sin(col * 0.14) * 2.8 + Math.cos(col * 0.05) * 1.6 + Math.sin(col * 0.3) * 0.9);
  };

  // --------------------------------------------------------------------------
  // АТАКА ГЕРОЯ ПО ТРАЕКТОРИИ ПАЛЬЦА
  // --------------------------------------------------------------------------
  const handleAttack = () => {
    if (activeVfx || sceneState !== 'BATTLE') return;

    // Проверка патронов
    if (activeHero.ammo <= 0) {
      // 1 ход тратится на перезарядку
      setParty((prev) =>
        prev.map((h, i) => (i === activeHeroIdx ? { ...h, ammo: h.maxAmmo } : h))
      );
      addFloating(activeHero.id === 'josef' ? 14 : 22, 22, '[ПЕРЕЗАРЯДКА]', '#00fff2');
      advanceTurn();
      return;
    }

    const skill = activeHero.skills[selectedSkillIdx];

    // Тратим патроны
    setParty((prev) =>
      prev.map((h, i) => (i === activeHeroIdx ? { ...h, ammo: Math.max(0, h.ammo - skill.ammoCost) } : h))
    );

    // Запуск VFX (прямой лазер или баллистическая бомба)
    setActiveVfx({
      type: skill.type,
      progress: 0,
      targetX: touchAimPos.x,
      targetY: touchAimPos.y
    });

    const startT = Date.now();
    const duration = skill.type === 'laser' ? 350 : 600;

    const vfxInterval = setInterval(() => {
      const p = Math.min(1, (Date.now() - startT) / duration);
      setActiveVfx((prev) => (prev ? { ...prev, progress: p } : null));

      if (p >= 1) {
        clearInterval(vfxInterval);
        setActiveVfx(null);

        // Поиск орка в области прицела
        let hitOrc = orcs.find((orc) => !orc.isDead && Math.hypot(orc.col - touchAimPos.x, (getCaveFloorRow(orc.col) + orc.rowOffset) - touchAimPos.y) < 7);

        if (!hitOrc) {
          // Если кликнули мимо — урон наносится ближайшему живому
          hitOrc = orcs.find((o) => !o.isDead);
        }

        if (hitOrc) {
          const isHeadshot = Math.abs(touchAimPos.y - (getCaveFloorRow(hitOrc.col) + hitOrc.rowOffset - 3)) < 1.8;
          let dmg = 12;

          if (activeHero.id === 'josef') {
            if (skill.id === 'impulse') {
              dmg = isHeadshot ? 20 : Math.floor(Math.random() * 5) + 11;
            } else {
              dmg = Math.floor(Math.random() * 7) + 28; // Loaded blast бомба
            }
          } else {
            dmg = Math.floor(Math.random() * 8) + 16;
          }

          setOrcs((prev) =>
            prev.map((o) => {
              if (o.id === hitOrc!.id) {
                const newHp = Math.max(0, o.hp - dmg);
                return { ...o, hp: newHp, isDead: newHp === 0 };
              }
              return o;
            })
          );

          setScreenShake(isHeadshot ? 5 : 2);
          addFloating(hitOrc.col, getCaveFloorRow(hitOrc.col) + hitOrc.rowOffset - 3, isHeadshot ? `КРИТ -${dmg}` : `-${dmg}`, isHeadshot ? '#ff0033' : '#ffaa00');
        }

        setTimeout(advanceTurn, 300);
      }
    }, 20);
  };

  const addFloating = (x: number, y: number, text: string, col: string) => {
    setFloatingDamages((prev) => [
      ...prev,
      { id: Math.random(), text, x, y, col, alpha: 1.0 }
    ]);
  };

  // Переход хода
  const advanceTurn = () => {
    setScreenShake(0);
    const aliveOrcs = orcs.filter((o) => !o.isDead);
    if (aliveOrcs.length === 0) {
      onVictory();
      return;
    }

    const nextHeroIdx = (activeHeroIdx + 1) % party.length;
    if (nextHeroIdx === 0) {
      // ХОД ОРКОВ
      setTimeout(executeOrcsTurn, 600);
    } else {
      setActiveHeroIdx(nextHeroIdx);
      setSelectedSkillIdx(0);
    }
  };

  // --------------------------------------------------------------------------
  // УМНАЯ ЛОГИКА АТАКИ ОРКОВ (КИДАЮТСЯ КАМНЯМИ)
  // --------------------------------------------------------------------------
  const executeOrcsTurn = () => {
    const aliveOrcs = orcs.filter((o) => !o.isDead);
    const aliveHeroes = party.filter((h) => !h.isDead);

    if (aliveHeroes.length === 0) {
      onDefeat();
      return;
    }

    aliveOrcs.forEach((orc, idx) => {
      setTimeout(() => {
        let targetHero = aliveHeroes[0];

        // 1. Бросающий орк впереди бьет танка или переднего
        if (orc.role === 'BRAWLER') {
          targetHero = aliveHeroes.find((h) => h.heroClass === 'Tank') || aliveHeroes[0];
        }
        // 2. Снайперы сзади сверху выцеливают уязвимых дамагеров (Attack)
        else if (orc.role === 'SNIPER') {
          targetHero = aliveHeroes.find((h) => h.heroClass === 'Attack') || aliveHeroes[0];
        }
        // 3. Оппортунисты сзади снизу бросают в самого раненого
        else {
          targetHero = [...aliveHeroes].sort((a, b) => a.curHp - b.curHp)[0];
        }

        const rockDmg = Math.floor(Math.random() * 6) + 10;
        setParty((prev) =>
          prev.map((h) => {
            if (h.id === targetHero.id) {
              const newHp = Math.max(0, h.curHp - rockDmg);
              return { ...h, curHp: newHp, isDead: newHp === 0 };
            }
            return h;
          })
        );

        setScreenShake(3);
        addFloating(20, 24, `КАМЕНЬ -${rockDmg}`, '#ef4444');
      }, idx * 300);
    });

    setTimeout(() => {
      setActiveHeroIdx(0);
      setSelectedSkillIdx(0);
    }, aliveOrcs.length * 300 + 400);
  };

  // Обработка касания для прицеливания (только в правой части экрана)
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const gridX = (px / rect.width) * 100;
    const gridY = (py / rect.height) * 42;

    // Разрешаем целиться только в правой половине (зона врагов)
    if (gridX > 48) {
      setTouchAimPos({ x: gridX, y: gridY });
    }
  };

  // Анимация всплывающего урона
  useEffect(() => {
    const interval = setInterval(() => {
      setFloatingDamages((prev) =>
        prev
          .map((d) => ({ ...d, y: d.y - 0.35, alpha: d.alpha - 0.04 }))
          .filter((d) => d.alpha > 0)
      );
    }, 30);
    return () => clearInterval(interval);
  }, []);

  // --------------------------------------------------------------------------
  // РЕНДЕР КАНВАСА ПЕЩЕРЫ
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

      // Тряска экрана
      const sx = screenShake > 0 ? (Math.random() - 0.5) * screenShake * 2 : 0;
      const sy = screenShake > 0 ? (Math.random() - 0.5) * screenShake * 2 : 0;
      ctx.translate(sx, sy);

      // Темно-синий фон пещеры
      ctx.fillStyle = '#020314';
      ctx.fillRect(0, 0, w, h);

      const CELL_W = w / 100;
      const CELL_H = h / 42;
      ctx.font = `${Math.floor(CELL_H * 0.95)}px monospace`;
      ctx.textBaseline = 'top';

      // Скролл пола во время марша (иллюзия движения вглубь)
      const floorScrollOffset = sceneState === 'MARCHING' ? tick * 0.4 : marchProgress * 100;

      // 1. НЕБО/СВОД ПЕЩЕРЫ СО СТАЛАКТИТАМИ
      for (let sc = 0; sc < 100; sc += 6) {
        ctx.fillStyle = '#1e1b4b';
        ctx.fillText('V', sc * CELL_W, 2 * CELL_H);
        ctx.fillText('|', sc * CELL_W, 1 * CELL_H);
      }

      // 2. СИНЕ-ФИОЛЕТОВЫЙ НЕГЛАДКИЙ ПОЛ ПЕЩЕРЫ
      const groundBaseRow = 24;
      for (let sc = 0; sc < 100; sc++) {
        const floorY = getCaveFloorRow(sc + Math.floor(floorScrollOffset));
        for (let r = floorY; r < 42; r++) {
          const depth = r - floorY;
          ctx.fillStyle = depth === 0 ? '#7c3aed' : (depth === 1 ? '#5b21b6' : '#2e1065');
          const symbols = ['~', '#', '%', 'x', '='];
          const ch = symbols[(sc + r) % symbols.length];
          ctx.fillText(ch, sc * CELL_W, r * CELL_H);
        }
      }

      // 3. ОТРИСОВКА ГЕРОЕВ (2 РЯДА: ВЕРХНИЙ ВПЕРЕДИ, НИЖНИЙ ЧУТЬ ДАЛЬШЕ)
      // Герои светятся и перебирают ногами без колен
      const heroPositions = [
        { col: 18, rowOffset: -2 }, // Верхний ряд (чуть впереди)
        { col: 26, rowOffset: -2 },
        { col: 14, rowOffset: 2 },  // Нижний ряд (чуть дальше)
        { col: 22, rowOffset: 2 }
      ];

      party.forEach((hero, idx) => {
        const pos = heroPositions[idx];
        const hFloorY = getCaveFloorRow(pos.col) + pos.rowOffset;
        const isActive = idx === activeHeroIdx && sceneState === 'BATTLE';

        // Анимация перебирания ногами
        const walkFrame = Math.floor(tick / 8) % 2 === 0 ? hero.artBreath1 : hero.artBreath2;

        // Рамка активного хода
        if (isActive) {
          ctx.fillStyle = '#00fff2';
          ctx.fillText('+-- --+', (pos.col - 2) * CELL_W, (hFloorY - 4) * CELL_H);
          ctx.fillText(`| ${hero.name} |`, (pos.col - 2) * CELL_W, (hFloorY - 3) * CELL_H);
        }

        // Фигура героя со свечением
        ctx.fillStyle = hero.color;
        ctx.shadowColor = hero.color;
        ctx.shadowBlur = 6;
        walkFrame.forEach((line, li) => {
          ctx.fillText(line, pos.col * CELL_W, (hFloorY - 2 + li) * CELL_H);
        });
        ctx.shadowBlur = 0;

        // HP
        ctx.fillStyle = '#22c55e';
        ctx.fillText(`${hero.curHp}/${hero.hp}`, pos.col * CELL_W, (hFloorY + 2) * CELL_H);
      });

      // 4. ОТРИСОВКА 5 ОРКОВ (ПОЯВЛЯЮТСЯ СПРАВА, СТРОЙ КЛИНОМ С ДИСТАНЦИЕЙ)
      // 1 впереди, по 2 сверху и снизу сзади
      const orcSpawnShiftX = sceneState === 'MARCHING' ? (1 - marchProgress) * 45 : 0;

      orcs.forEach((orc) => {
        if (orc.isDead) return;
        const oFloorY = getCaveFloorRow(orc.col) + orc.rowOffset;
        const renderCol = orc.col + orcSpawnShiftX;

        ctx.fillStyle = ORC_MODEL.color;
        ORC_MODEL.art.forEach((line, li) => {
          ctx.fillText(line, renderCol * CELL_W, (oFloorY - 2 + li) * CELL_H);
        });

        // HP орка
        ctx.fillStyle = '#ef4444';
        ctx.fillText(`${orc.hp}/${orc.maxHp}`, renderCol * CELL_W, (oFloorY + 2) * CELL_H);
      });

      // 5. ТРАЕКТОРИЯ ИЗ БЕЛЫХ БУКВ "A T T A C K" ПО ПАЛЬЦУ
      if (sceneState === 'BATTLE' && !activeVfx) {
        const startHeroPos = heroPositions[activeHeroIdx];
        const startX = startHeroPos.col + 4;
        const startY = getCaveFloorRow(startHeroPos.col) + startHeroPos.rowOffset - 1;

        const letters = ['a', 't', 't', 'a', 'c', 'k'];
        letters.forEach((char, i) => {
          const shift = (tick * 0.06 + i * 0.16) % 1;
          const curX = startX + (touchAimPos.x - startX) * shift;
          const curY = startY + (touchAimPos.y - startY) * shift;

          ctx.fillStyle = '#ffffff';
          ctx.fillText(char, curX * CELL_W, curY * CELL_H);
        });

        // Прицельный крестик в точке пальца
        ctx.fillStyle = '#00fff2';
        ctx.fillText('[+]', (touchAimPos.x - 1) * CELL_W, touchAimPos.y * CELL_H);
      }

      // 6. ВИЗУАЛЬНЫЕ ЭФФЕКТЫ (ЛАЗЕР / БОМБА С ФИЗИКОЙ)
      if (activeVfx) {
        const startHeroPos = heroPositions[activeHeroIdx];
        const sX = startHeroPos.col + 4;
        const sY = getCaveFloorRow(startHeroPos.col) + startHeroPos.rowOffset - 1;

        if (activeVfx.type === 'laser') {
          // Быстрый фиолетовый лазер по прямой
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
          // Круглая фиолетовая бомба с параболической физикой
          const curX = sX + (activeVfx.targetX - sX) * activeVfx.progress;
          const curY = sY + (activeVfx.targetY - sY) * activeVfx.progress - Math.sin(activeVfx.progress * Math.PI) * 7;
          ctx.fillStyle = '#c084fc';
          ctx.shadowColor = '#a855f7';
          ctx.shadowBlur = 8;
          ctx.fillText('(●)', curX * CELL_W, curY * CELL_H);
          ctx.shadowBlur = 0;
        }
      }

      // 7. ВСПЛЫВАЮЩИЙ УРОН
      floatingDamages.forEach((fd) => {
        ctx.fillStyle = fd.col;
        ctx.fillText(fd.text, fd.x * CELL_W, fd.y * CELL_H);
      });

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [party, orcs, activeHeroIdx, sceneState, marchProgress, touchAimPos, activeVfx, floatingDamages, screenShake]);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#020314', overflow: 'hidden', fontFamily: "'Press Start 2P', monospace" }}>
      <canvas
        ref={canvasRef}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerMove}
        style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
      />

      {/* ВЕРХ СЛЕВА: ИМЯ ГЕРОЯ, ОРУЖИЕ, БОЛЬШОЙ ASCII-БЛАСТЕР И НАВЫКИ */}
      {sceneState === 'BATTLE' && (
        <div style={{ position: 'absolute', top: 12, left: 16, zIndex: 10, pointerEvents: 'auto' }}>
          {/* Строка с именем и оружием */}
          <div style={{ fontSize: '11px', color: activeHero.color }}>
            {activeHero.name} // {activeHero.weaponName} [ПАТРОНЫ: {activeHero.ammo}/{activeHero.maxAmmo}]
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginTop: '8px' }}>
            {/* Большой синий ASCII-бластер */}
            <pre style={{ margin: 0, fontSize: '10px', lineHeight: 1.1, color: '#38bdf8', textShadow: '0 0 8px #0284c7' }}>
              {activeHero.largeWeaponAscii.join('\n')}
            </pre>

            {/* Столбик способностей с >>> и кнопкой [i] */}
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

              {/* Выезжающее описание из кнопки [i] */}
              {showSkillInfo && (
                <div style={{ background: 'rgba(2, 6, 24, 0.95)', border: '1px solid #f59e0b', padding: '6px 10px', fontSize: '8px', color: '#fef08a', maxWidth: '260px', lineHeight: 1.5 }}>
                  {activeHero.skills[selectedSkillIdx].desc}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* НИЖНЯЯ ПАНЕЛЬ С РАСХОДОВКОЙ И КНОПКОЙ [ ATTACK ] */}
      {sceneState === 'BATTLE' && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(2,3,20,0.95)', borderTop: '1px solid #1e1b4b', padding: '10px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
          {/* Расходовка ходов */}
          <div style={{ fontSize: '9px', color: '#94a3b8' }}>
            ОЧЕРЕДЬ: <span style={{ color: activeHero.color }}>{activeHero.name}</span> —&gt; <span>Michael</span> —&gt; <span style={{ color: '#84cc16' }}>Орки (Камни)</span> —&gt; <span>Kyle</span> —&gt; <span>Artemis</span>
          </div>

          {/* Кнопка атаки справа внизу */}
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
