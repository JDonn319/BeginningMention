import React, { useEffect, useState } from 'react';
import { STARTER_HEROES, HeroSkill } from '../templates/asciiModels';

interface Props {
  onSquadConfirmed: (squadIds: string[]) => void;
  onExitToMenu: () => void;
}

export const CharacterSelectScreen: React.FC<Props> = ({ onSquadConfirmed, onExitToMenu }) => {
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [breathFrame, setBreathFrame] = useState<number>(0);
  const [modalSkill, setModalSkill] = useState<HeroSkill | null>(null);

  const hero = STARTER_HEROES[currentIdx];
  const isSelected = selectedIds.includes(hero.id);

  useEffect(() => {
    const timer = setInterval(() => {
      setBreathFrame((prev) => (prev === 0 ? 1 : 0));
    }, 600);
    return () => clearInterval(timer);
  }, []);

  const handleToggleSelect = () => {
    if (isSelected) {
      setSelectedIds(selectedIds.filter((id) => id !== hero.id));
    } else {
      if (selectedIds.length < 4) {
        setSelectedIds([...selectedIds, hero.id]);
      }
    }
  };

  const currentArt = breathFrame === 0 ? hero.artBreath1 : hero.artBreath2;

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#020010', color: '#c8f0ff', fontFamily: "'Press Start 2P', monospace", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', boxSizing: 'border-box', userSelect: 'none' }}>
      
      {/* ВЕРХНЯЯ СТРОКА */}
      <div style={{ width: '100%', maxWidth: '860px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e3a8a', paddingBottom: '8px' }}>
        <div style={{ fontSize: '10px', color: '#00fff2' }}>
          [ НАБОР ОТРЯДА // ВЫБРАНО: {selectedIds.length}/4 ]
        </div>
        <button
          onClick={onExitToMenu}
          style={{ background: 'transparent', border: '1px solid #64748b', color: '#94a3b8', fontFamily: 'inherit', fontSize: '9px', padding: '6px 12px', cursor: 'pointer' }}
        >
          [ ВЫЙТИ В МЕНЮ ]
        </button>
      </div>

      {/* КАРТОЧКА ГЕРОЯ: СВЕРХУ ДЫШАЩИЙ ГЕРОЙ, СНИЗУ СТАТЫ И НАВЫКИ С [i] */}
      <div style={{ width: '100%', maxWidth: '860px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
        <div style={{ width: '100%', maxWidth: '640px', border: '1px solid #00fff2', padding: '14px', background: 'rgba(2, 6, 24, 0.85)', boxShadow: '0 0 15px rgba(0,255,242,0.1)' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ fontSize: '8px', color: '#64748b', marginBottom: '6px' }}>
              ОПЕРАТОР {currentIdx + 1} / {STARTER_HEROES.length}
            </div>
            <pre style={{ margin: 0, fontSize: '18px', lineHeight: 1.15, color: hero.color, textShadow: `0 0 8px ${hero.color}` }}>
              {currentArt.join('\n')}
            </pre>
            <div style={{ fontSize: '12px', color: hero.color, marginTop: '8px', fontWeight: 'bold' }}>
              {hero.name}
            </div>
            <div style={{ fontSize: '9px', color: '#38bdf8', marginTop: '3px' }}>
              КЛАСС: [ {hero.heroClass.toUpperCase()} ]
            </div>
          </div>

          <div style={{ borderTop: '1px dashed #1e3a8a', paddingTop: '10px', display: 'flex', justifyContent: 'space-around', fontSize: '9px', color: '#94a3b8' }}>
            <div>ЗДОРОВЬЕ: <span style={{ color: '#39ff14' }}>{hero.hp} HP</span></div>
            <div>БРОНЯ / ЩИТ: <span style={{ color: '#00fff2' }}>{hero.armor > 0 ? `${hero.armor} SHD` : 'НЕТ'}</span></div>
          </div>

          <div style={{ borderTop: '1px dashed #1e3a8a', marginTop: '10px', paddingTop: '10px' }}>
            <div style={{ fontSize: '8px', color: '#facc15', marginBottom: '8px' }}>
              УНИКАЛЬНЫЕ СПОСОБНОСТИ:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {hero.skills.map((sk, sIdx) => (
                <div key={sIdx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.5)', padding: '6px 10px', border: '1px solid #1e293b' }}>
                  <span style={{ fontSize: '9px', color: '#e2e8f0' }}>
                    • {sk.name}
                  </span>
                  <button
                    onClick={() => setModalSkill(sk)}
                    style={{ background: 'transparent', border: '1px solid #f59e0b', color: '#f59e0b', fontFamily: 'inherit', fontSize: '9px', padding: '4px 8px', cursor: 'pointer' }}
                  >
                    [i]
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={handleToggleSelect}
              style={{
                background: isSelected ? 'rgba(57,255,20,0.15)' : 'transparent',
                border: `2px solid ${isSelected ? '#39ff14' : '#00fff2'}`,
                color: isSelected ? '#39ff14' : '#00fff2',
                fontFamily: 'inherit',
                fontSize: '10px',
                padding: '10px 20px',
                cursor: 'pointer'
              }}
            >
              {isSelected ? '[ ВЫБРАН В ОТРЯД ✓ ]' : '[ ВЫБРАТЬ В ОТРЯД + ]'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px' }}>
          <button
            onClick={() => setCurrentIdx((prev) => (prev > 0 ? prev - 1 : STARTER_HEROES.length - 1))}
            style={{ background: 'transparent', border: '1px solid #00fff2', color: '#00fff2', fontFamily: 'inherit', fontSize: '10px', padding: '8px 16px', cursor: 'pointer' }}
          >
            [ &lt; ПРЕД ]
          </button>
          <button
            onClick={() => setCurrentIdx((prev) => (prev < STARTER_HEROES.length - 1 ? prev + 1 : 0))}
            style={{ background: 'transparent', border: '1px solid #00fff2', color: '#00fff2', fontFamily: 'inherit', fontSize: '10px', padding: '8px 16px', cursor: 'pointer' }}
          >
            [ СЛЕД &gt; ]
          </button>
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: '860px', display: 'flex', justifyContent: 'center', borderTop: '1px solid #1e3a8a', paddingTop: '10px' }}>
        <button
          disabled={selectedIds.length !== 4}
          onClick={() => onSquadConfirmed(selectedIds)}
          style={{
            background: selectedIds.length === 4 ? 'rgba(0,255,242,0.2)' : 'transparent',
            border: `2px solid ${selectedIds.length === 4 ? '#00fff2' : '#334155'}`,
            color: selectedIds.length === 4 ? '#00fff2' : '#475569',
            fontFamily: 'inherit',
            fontSize: '11px',
            padding: '12px 24px',
            cursor: selectedIds.length === 4 ? 'pointer' : 'not-allowed'
          }}
        >
          {selectedIds.length === 4 ? '[ ПОДТВЕРДИТЬ ОТРЯД И ВОЙТИ НА ПЛАНЕТУ ]' : `[ ВЫБЕРИТЕ ЕЩЕ ${4 - selectedIds.length} БОЙЦА ]`}
        </button>
      </div>

      {modalSkill && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ width: '100%', maxWidth: '440px', background: '#020010', border: '2px solid #f59e0b', padding: '18px', boxSizing: 'border-box' }}>
            <div style={{ fontSize: '9px', color: '#f59e0b', borderBottom: '1px solid #f59e0b', paddingBottom: '6px', marginBottom: '10px' }}>
              +-----------------------------------------+<br />
              | СПОСОБНОСТЬ: {modalSkill.name}<br />
              +-----------------------------------------+
            </div>
            <div style={{ fontSize: '10px', color: '#fef08a', lineHeight: 1.6, marginBottom: '16px' }}>
              {modalSkill.desc}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setModalSkill(null)}
                style={{ background: '#f59e0b', border: 'none', color: '#000', fontFamily: 'inherit', fontSize: '9px', padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                [ ЗАКРЫТЬ ]
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
