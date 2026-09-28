import React, { useEffect, useRef, useState } from 'react';
import { ALL_OPERATORS, LevelBiome, Operator, HeroSkill } from '../templates/asciiModels';

interface Props {
  level: LevelBiome;
  selectedOperatorIds: string[];
  onBattleEnd: (won: boolean) => void;
}

export const BattleScreen: React.FC<Props> = ({ level, selectedOperatorIds, onBattleEnd }) => {
  const [party, setParty] = useState<(Operator & { curHp: number; shield: number; isDead: boolean })[]>(() => {
    const list = selectedOperatorIds.map((id) => {
      const op = ALL_OPERATORS.find((o) => o.id === id) || ALL_OPERATORS[0];
      return { ...op, curHp: op.hp, shield: 0, isDead: false };
    });
    // Сортировка по PING: самый быстрый начинает первым
    return list.sort((a, b) => a.ping - b.ping);
  });

  const [bossHp, setBossHp] = useState<number>(level.boss.hp);
  const [bossMaxHp] = useState<number>(level.boss.hp);

  // Очередь ходов: начинается с самого быстрого героя!
  const [turnOrder, setTurnOrder] = useState<string[]>(() => [
    ...selectedOperatorIds,
    'BOSS'
  ]);

  const [selectedSkillIdx, setSelectedSkillIdx] = useState<number>(0);
  const [inspectedSkill, setInspectedSkill] = useState<HeroSkill | null>(null);

  // Спецэффекты
  const [activeVfx, setActiveVfx] = useState<{ type: string; progress: number } | null>(null);
  const [screenShake, setScreenShake] = useState<number>(0);
  const [combatLog, setCombatLog] = useState<string>(`ВЫСАДКА: [ ${level.name} ]`);
  const [floatingText, setFloatingText] = useState<{ text: string; x: number; y: number; col: string } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bossTurnRunningRef = useRef<boolean>(false);

  const currentTurnUnitId = turnOrder[0];
  const activeHero = party.find((p) => p.id === currentTurnUnitId);

  // ----------------------------------------------------
  // ГАРАНТИРОВАННЫЙ ХОД БОССА БЕЗ ЗАВИСАНИЙ
  // ----------------------------------------------------
  useEffect(() => {
    if (turnOrder[0] === 'BOSS' && !bossTurnRunningRef.current && bossHp > 0) {
      bossTurnRunningRef.current = true;
      const timer = setTimeout(() => {
        executeBossTurn(turnOrder);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [turnOrder, bossHp]);

  // Ход игрока
  const executePlayerSkill = (skill: HeroSkill) => {
    if (activeVfx || currentTurnUnitId === 'BOSS') return;

    setActiveVfx({ type: skill.vfx, progress: 0 });
    const startT = Date.now();
    const duration = 500;

    const vfxInterval = setInterval(() => {
      const p = Math.min(1, (Date.now() - startT) / duration);
      setActiveVfx({ type: skill.vfx, progress: p });

      if (p >= 1) {
        clearInterval(vfxInterval);
        setActiveVfx(null);

        if (skill.type === 'dmg') {
          const dmg = skill.value + Math.floor(Math.random() * 8);
          setBossHp((prev) => Math.max(0, prev - dmg));
          setScreenShake(5);
          setFloatingText({ text: `-${dmg}`, x: 74, y: 14, col: '#ff0055' });
        } else if (skill.type === 'shield') {
          setParty((prev) => prev.map((p) => ({ ...p, shield: p.shield + skill.value })));
          setFloatingText({ text: `+${skill.value} ЩИТ`, x: 25, y: 22, col: '#00fff2' });
        } else if (skill.type === 'heal' || skill.type === 'revive') {
          setParty((prev) =>
            prev.map((p) => ({
              ...p,
              isDead: false,
              curHp: Math.min(p.hp, p.curHp + skill.value)
            }))
          );
          setFloatingText({ text: `+${skill.value} HP`, x: 25, y: 22, col: '#39ff14' });
        }

        setTimeout(() => {
          setScreenShake(0);
          advanceTurnQueue();
        }, 300);
      }
    }, 20);
  };

  const advanceTurnQueue = () => {
    const nextQueue = [...turnOrder.slice(1), turnOrder[0]];
    setTurnOrder(nextQueue);
  };

  // Ход Босса
  const executeBossTurn = (queue: string[]) => {
    const aliveHeroes = party.filter((p) => !p.isDead);
    if (aliveHeroes.length === 0) {
      onBattleEnd(false);
      return;
    }

    const target = [...aliveHeroes].sort((a, b) => a.curHp - b.curHp)[0];
    const skill = level.boss.skills[Math.floor(Math.random() * level.boss.skills.length)];

    setCombatLog(`${level.boss.name} ПРИМЕНЯЕТ: [ ${skill.name} ]`);
    setScreenShake(7);

    setTimeout(() => {
      setParty((prev) =>
        prev.map((hero) => {
          if (skill.aoe || hero.id === target.id) {
            let dmg = skill.dmg;
            if (hero.shield > 0) {
              const abs = Math.min(hero.shield, dmg);
              hero.shield -= abs;
              dmg -= abs;
            }
            const newHp = Math.max(0, hero.curHp - dmg);
            return { ...hero, curHp: newHp, isDead: newHp === 0 };
          }
          return hero;
        })
      );

      setFloatingText({ text: `-${skill.dmg}`, x: 26, y: 24, col: '#ff2233' });

      setTimeout(() => {
        setScreenShake(0);
        bossTurnRunningRef.current = false;
        const afterBoss = [...queue.slice(1), 'BOSS'];
        setTurnOrder(afterBoss);
      }, 400);
    }, 550);
  };

  useEffect(() => {
    if (bossHp <= 0) {
      setTimeout(() => onBattleEnd(true), 600);
    }
  }, [bossHp, onBattleEnd]);

  // ----------------------------------------------------
  // 3D-ОКЕАН, ПЛОТ И ЖУТКИЙ КРАКЕН
  // ----------------------------------------------------
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

      ctx.fillStyle = '#020010';
      ctx.fillRect(0, 0, w, h);

      const CELL_W = w / 100;
      const CELL_H = h / 42;
      ctx.font = `${Math.floor(CELL_H * 0.95)}px monospace`;
      ctx.textBaseline = 'top';

      const groundBaseY = 27;

      // 1. НАСТОЯЩИЙ 3D ОКЕАН С ПЕРСПЕКТИВОЙ
      if (level.biomeType === 'RAFT') {
        // Перспективные слои волн от горизонта к камере
        for (let row = 20; row < 42; row++) {
          const depth = (row - 20) / 22; // 0 у горизонта, 1 у камеры
          const waveSpeed = tick * (0.05 + depth * 0.05);
          const colorIntensity = Math.floor(100 + depth * 155);
          ctx.fillStyle = `rgba(0, ${colorIntensity}, 255, ${0.25 + depth * 0.75})`;

          let waveRowStr = '';
          for (let col = 0; col < 100; col += 4) {
            const waveY = Math.sin(col * 0.15 + waveSpeed - depth * 4);
            if (waveY > 0.4) waveRowStr += ' ~~~';
            else if (waveY < -0.4) waveRowStr += ' ===';
            else waveRowStr += '  ..';
          }
          ctx.fillText(waveRowStr, 0, row * CELL_H);
        }

        // 2. ДЕРЕВЯННЫЙ ПЛОТ С ФИЗИКОЙ ВОЛН (КАЧКА ВВЕРХ-ВНИЗ И КРЕН)
        const raftDip = Math.sin(tick * 0.08) * 2.2;
        const raftY = groundBaseY + raftDip;

        ctx.fillStyle = '#92400e';
        ctx.fillText('  /===========================================\\  ', 6 * CELL_W, (raftY - 1) * CELL_H);
        ctx.fillStyle = '#b45309';
        ctx.fillText(' |  [#]=====[#]=====[#]=====[#]=====[#]=====[#] | ', 6 * CELL_W, raftY * CELL_H);
        ctx.fillStyle = '#78350f';
        ctx.fillText(' |  ###     ###     ###     ###     ###     ### | ', 6 * CELL_W, (raftY + 1) * CELL_H);
        ctx.fillText('  \\===========================================/  ', 6 * CELL_W, (raftY + 2) * CELL_H);

        // Пена вокруг плота
        ctx.fillStyle = '#38bdf8';
        ctx.fillText('~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~', 5 * CELL_W, (raftY + 2.5) * CELL_H);

        // 3. ОТРИСОВКА ГЕРОЕВ — СТРОГО НА НАСТИЛЕ ПЛОТА!
        // Нижний ряд (левее и ниже), верхний ряд (правее и выше). Никакого зависания в воздухе!
        const raftHeroSlots = [
          { x: 12, deckY: raftY - 2 },   // Josef (ряд 1)
          { x: 26, deckY: raftY - 2.8 }, // Kyle (ряд 2)
          { x: 18, deckY: raftY - 1.6 }, // Michael (ряд 1)
          { x: 32, deckY: raftY - 2.5 }  // Artemis (ряд 2)
        ];

        party.forEach((hero, i) => {
          const slot = raftHeroSlots[i] || { x: 14 + i * 8, deckY: raftY - 2 };
          const isActive = hero.id === currentTurnUnitId;

          if (isActive) {
            ctx.fillStyle = '#00fff2';
            ctx.fillText('+-- --+', (slot.x - 2) * CELL_W, (slot.deckY - 3) * CELL_H);
            ctx.fillText(`| ${hero.name} |`, (slot.x - 2) * CELL_W, (slot.deckY - 2) * CELL_H);
          }

          ctx.fillStyle = hero.color;
          hero.weaponArt.forEach((line, li) => {
            ctx.fillText(line, slot.x * CELL_W, (slot.deckY - 1 + li) * CELL_H);
          });

          if (hero.shield > 0) {
            ctx.fillStyle = '#00fff2';
            ctx.fillText(`[S:${hero.shield}]`, slot.x * CELL_W, (slot.deckY - 4) * CELL_H);
          }

          ctx.fillStyle = hero.curHp < 40 ? '#ef4444' : '#22c55e';
          ctx.fillText(`${hero.curHp}/${hero.hp}`, slot.x * CELL_W, (slot.deckY + 2.5) * CELL_H);
        });

      } else {
        // Обычные горы/кратер
        for (let x = 0; x < 100; x++) {
          ctx.fillStyle = '#334155';
          ctx.fillText('y+a*p+G*r', x * CELL_W, (groundBaseY + Math.sin(x * 0.1) * 2) * CELL_H);
        }
      }

      // 4. ЖУТКИЙ ГЛУБИННЫЙ КРАКЕН (БЕЗ КОШАЧЬЕЙ МОРДЫ)
      if (level.biomeType === 'RAFT') {
        const bX = 58;
        const bY = 7 + Math.sin(tick * 0.07) * 1.5;

        // Полоса здоровья
        ctx.fillStyle = '#ff2233';
        const hpLen = Math.floor((bossHp / bossMaxHp) * 28);
        ctx.fillText(`[${'='.repeat(hpLen)}${'-'.repeat(28 - hpLen)}] ${bossHp}/${bossMaxHp} HP`, bX * CELL_W, (bY - 2) * CELL_H);

        // Шевелящиеся щупальца по бокам кракена (живая синусоида)
        const tWave1 = Math.sin(tick * 0.1) * 2;
        const tWave2 = Math.cos(tick * 0.1) * 2;

        ctx.fillStyle = '#00fff2';
        ctx.shadowColor = '#00fff2';
        ctx.shadowBlur = 8;

        // Левое щупальце
        ctx.fillText(`  ((~))      `, (bX - 10 + tWave1) * CELL_W, (bY + 3) * CELL_H);
        ctx.fillText(`   \\~\\       `, (bX - 8 + tWave1) * CELL_W, (bY + 5) * CELL_H);
        ctx.fillText(`  ((~))      `, (bX - 10 + tWave1) * CELL_W, (bY + 7) * CELL_H);

        // Правое щупальце
        ctx.fillText(`      ((~))  `, (bX + 32 + tWave2) * CELL_W, (bY + 3) * CELL_H);
        ctx.fillText(`       /~/   `, (bX + 30 + tWave2) * CELL_W, (bY + 5) * CELL_H);
        ctx.fillText(`      ((~))  `, (bX + 32 + tWave2) * CELL_W, (bY + 7) * CELL_H);

        // Тело Левиафана
        const krakenMantle = [
          { text: '          .:: ЛЕВИАФАН ::.          ', col: '#38bdf8' },
          { text: '        /####################\\       ', col: '#0284c7' },
          { text: '       |  [o]   (O)    (O)   [o]  |      ', col: '#ff0055' }, // Глаза Бездны
          { text: '       |     \\▼▼▼▼▼▼▼▼▼▼▼/        |      ', col: '#ffffff' }, // Пасть
          { text: '        \\      ~~~~~~~~~~        /       ', col: '#0369a1' },
          { text: '       ((( ~~~~~~~~~~~~~~~~~~~~ )))      ', col: '#00fff2' },
          { text: '      ((((  КРАКЕН ГЛУБИН БЕЗДНЫ  ))))    ', col: '#0c4a6e' }
        ];

        krakenMantle.forEach((line, li) => {
          ctx.fillStyle = line.col;
          ctx.fillText(line.text, bX * CELL_W, (bY + li) * CELL_H);
        });
        ctx.shadowBlur = 0;
      }

      // 5. СПЕЦЭФФЕКТЫ (VFX)
      if (activeVfx) {
        const tX = 70;
        const tY = 14;
        if (activeVfx.type === 'laser') {
          ctx.strokeStyle = '#c084fc';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(18 * CELL_W, 25 * CELL_H);
          ctx.lineTo(tX * CELL_W, tY * CELL_H);
          ctx.stroke();
        } else if (activeVfx.type === 'rocket') {
          const curX = 18 + (tX - 18) * activeVfx.progress;
          ctx.fillStyle = '#ff2200';
          ctx.fillText('===> (РАКЕТА)', curX * CELL_W, tY * CELL_H);
        } else if (activeVfx.type === 'log') {
          const curX = 20 + (tX - 20) * activeVfx.progress;
          ctx.fillStyle = '#b45309';
          ctx.fillText('[||||]', curX * CELL_W, (25 - Math.sin(activeVfx.progress * Math.PI) * 7) * CELL_H);
        } else if (activeVfx.type === 'runes') {
          ctx.fillStyle = '#39ff14';
          ctx.fillText('⊕ Ω Ж', (20 + (tX - 20) * activeVfx.progress) * CELL_W, tY * CELL_H);
        } else if (activeVfx.type === 'spear') {
          ctx.fillStyle = '#ffffff';
          ctx.fillText('------->+', (20 + (tX - 20) * activeVfx.progress) * CELL_W, tY * CELL_H);
        } else if (activeVfx.type === 'heal') {
          ctx.fillStyle = '#22c55e';
          ctx.fillText('++♥ [ЛЕЧЕНИЕ] ♥++', (16 + activeVfx.progress * 6) * CELL_W, (22 - activeVfx.progress * 4) * CELL_H);
        }
      }

      // 6. ВСПЛЫВАЮЩИЙ УРОН
      if (floatingText) {
        ctx.fillStyle = floatingText.col;
        ctx.fillText(floatingText.text, floatingText.x * CELL_W, floatingText.y * CELL_H);
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [party, bossHp, bossMaxHp, level, currentTurnUnitId, activeVfx, screenShake, floatingText]);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#020010', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

      {/* ВЕРХНЯЯ СТРОКА */}
      <div style={{ position: 'absolute', top: 10, left: 14, right: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'none' }}>
        <div style={{ background: 'rgba(2,0,20,0.85)', border: '1px solid #00fff2', padding: '6px 12px', pointerEvents: 'auto' }}>
          <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '9px', color: '#00fff2' }}>
            [ {level.name} // {level.sub} ]
          </span>
        </div>

        <div style={{ color: '#22c55e', fontSize: '11px', background: 'rgba(2,0,20,0.75)', padding: '4px 8px', border: '1px solid #1e293b' }}>
          {combatLog}
        </div>
      </div>

      {/* ПАНЕЛЬ СПОСОБНОСТЕЙ */}
      {currentTurnUnitId !== 'BOSS' && activeHero && (
        <div style={{ position: 'absolute', top: 50, left: 14, background: 'rgba(2,0,20,0.9)', border: '1px solid #1e293b', padding: '8px 12px', zIndex: 10 }}>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '8px', color: activeHero.color, marginBottom: '6px' }}>
            ХОД: {activeHero.name} // {activeHero.role}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {activeHero.skills.map((sk, idx) => (
              <div key={sk.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  onClick={() => setSelectedSkillIdx(idx)}
                  style={{
                    background: selectedSkillIdx === idx ? 'rgba(0,255,242,0.2)' : 'transparent',
                    border: `1px solid ${selectedSkillIdx === idx ? '#00fff2' : '#334155'}`,
                    color: selectedSkillIdx === idx ? '#00fff2' : '#94a3b8',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    padding: '4px 8px',
                    cursor: 'pointer'
                  }}
                >
                  [ {sk.name} ]
                </button>

                <button
                  onClick={() => setInspectedSkill(inspectedSkill?.id === sk.id ? null : sk)}
                  style={{
                    background: 'transparent',
                    border: '1px solid #f59e0b',
                    color: '#f59e0b',
                    fontFamily: 'monospace',
                    fontSize: '10px',
                    padding: '3px 6px',
                    cursor: 'pointer'
                  }}
                >
                  [i]
                </button>
              </div>
            ))}
          </div>

          {inspectedSkill && (
            <div style={{ marginTop: '8px', padding: '6px', border: '1px dashed #f59e0b', fontSize: '10px', color: '#fef08a', maxWidth: '240px' }}>
              {inspectedSkill.desc}
            </div>
          )}
        </div>
      )}

      {/* ТАЙМЛАЙН И [ АТАКА ] */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(2,0,20,0.95)', borderTop: '1px solid #1e293b', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#94a3b8' }}>
          <span style={{ color: '#00fff2' }}>ОЧЕРЕДЬ:</span>
          {turnOrder.slice(0, 5).map((uId, i) => (
            <React.Fragment key={i}>
              <span style={{ color: uId === 'BOSS' ? '#ff2233' : '#38bdf8', fontWeight: i === 0 ? 'bold' : 'normal' }}>
                [ {uId === 'BOSS' ? level.boss.name : party.find((p) => p.id === uId)?.name} ]
              </span>
              {i < 4 && <span>—&gt;</span>}
            </React.Fragment>
          ))}
        </div>

        {currentTurnUnitId !== 'BOSS' && activeHero && (
          <button
            onClick={() => executePlayerSkill(activeHero.skills[selectedSkillIdx])}
            style={{
              background: 'rgba(255,0,85,0.2)',
              border: '2px solid #ff0055',
              color: '#ff0055',
              fontFamily: "'Press Start 2P', monospace",
              fontSize: '11px',
              padding: '10px 22px',
              cursor: 'pointer'
            }}
          >
            [ АТАКА ]
          </button>
        )}
      </div>
    </div>
  );
};
