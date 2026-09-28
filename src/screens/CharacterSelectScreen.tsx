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
    }, 550);
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
    <div style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      background: '#020010',
      color: '#c8f0ff',
      fontFamily: "'Press Start 2P', monospace",
      display: 'flex',
      flexDirection: 'column',
      padding: '10px 16px',
      boxSizing: 'border-box',
      overflow: 'hidden',
      userSelect: 'none'
    }}>
      
      {/* ВЕРХНИЙ БАР */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e3a8a', paddingBottom: '6px', flexShrink: 0 }}>
        <div style={{ fontSize: '10px', color: '#00fff2' }}>
          [ ФОРМИРОВАНИЕ ОТРЯДА // ВЫБРАНО: {selectedIds.length}/4 ]
        </div>
        <button
          onClick={onExitToMenu}
          style={{ background: 'transparent', border: '1px solid #64748b', color: '#94a3b8', fontFamily: 'inherit', fontSize: '9px', padding: '6px 12px', cursor: 'pointer' }}
        >
          [ ВЫЙТИ В МЕНЮ ]
        </button>
      </div>

      {/* ГОРИЗОНТАЛЬНЫЙ СПЛИТ ПОД ЭКРАН ТЕЛЕФОНА */}
      <div style={{ flex: 1, display: 'flex', gap: '16px', marginTop: '10px', minHeight: 0 }}>
        
        {/* ЛЕВАЯ КОЛОНКА (45%): ПЕРСОНАЖ, КЛАСС, НАВИГАЦИЯ, КНОПКА ВЫБОРА */}
        <div style={{
          flex: '0 0 42%',
          border: '1px solid #00fff2',
          background: 'rgba(2, 6, 24, 0.85)',
          padding: '10px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ fontSize: '8px', color: '#64748b' }}>
            ОПЕРАТОР {currentIdx + 1} / {STARTER_HEROES.length}
          </div>

          {/* ПРЯМАЯ ФИГУРА ИЗ СИМВОЛОВ (СТРОГО ПО ОСИ) */}
          <pre style={{
            margin: '6px 0',
            fontSize: '18px',
            lineHeight: 1.15,
            color: hero.color,
            textShadow: `0 0 8px ${hero.color}`,
            textAlign: 'center'
          }}>
            {currentArt.join('\n')}
          </pre>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: hero.color, fontWeight: 'bold' }}>
              {hero.name}
            </div>
            <div style={{ fontSize: '8px', color: '#38bdf8', marginTop: '3px' }}>
              КЛАСС: [ {hero.heroClass.toUpperCase()} ]
            </div>
          </div>

          {/* НАВИГАЦИЯ ПРЕД / СЛЕД */}
          <div style={{ display: 'flex', gap: '12px', width: '100%', justifyContent: 'center' }}>
            <button
              onClick={() => setCurrentIdx((prev) => (prev > 0 ? prev - 1 : STARTER_HEROES.length - 1))}
              style={{ background: 'transparent', border: '1px solid #00fff2', color: '#00fff2', fontFamily: 'inherit', fontSize: '9px', padding: '6px 12px', cursor: 'pointer' }}
            >
              [ &lt; ]
            </button>
            <button
              onClick={handleToggleSelect}
              style={{
                background: isSelected ? 'rgba(57,255,20,0.15)' : 'transparent',
                border: `1px solid ${isSelected ? '#39ff14' : '#00fff2'}`,
                color: isSelected ? '#39ff14' : '#00fff2',
                fontFamily: 'inherit',
                fontSize: '9px',
                padding: '6px 10px',
                cursor: 'pointer'
              }}
            >
              {isSelected ? '[ В ОТРЯДЕ ✓ ]' : '[ В ОТРЯД + ]'}
            </button>
            <button
              onClick={() => setCurrentIdx((prev) => (prev < STARTER_HEROES.length - 1 ? prev + 1 : 0))}
              style={{ background: 'transparent', border: '1px solid #00fff2', color: '#00fff2', fontFamily: 'inherit', fontSize: '9px', padding: '6px 12px', cursor: 'pointer' }}
            >
              [ &gt; ]
            </button>
          </div>
        </div>

        {/* ПРАВАЯ КОЛОНКА (55%): СТАТИСТИКА, СПОСОБНОСТИ С [i], И КНОПКА СТАРТА */}
        <div style={{
          flex: 1,
          border: '1px solid #1e3a8a',
          background: 'rgba(2, 6, 24, 0.85)',
          padding: '10px 14px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            {/* СТАТИСТИКА */}
            <div style={{ fontSize: '8px', color: '#38bdf8', borderBottom: '1px dashed #1e3a8a', paddingBottom: '4px', marginBottom: '8px' }}>
              ХАРАКТЕРИСТИКИ:
            </div>
            <div style={{ display: 'flex', gap: '20px', fontSize: '9px', color: '#94a3b8', marginBottom: '12px' }}>
              <div>HP: <span style={{ color: '#39ff14' }}>{hero.hp}</span></div>
              <div>БРОНЯ: <span style={{ color: '#00fff2' }}>{hero.armor > 0 ? `${hero.armor}` : 'НЕТ'}</span></div>
            </div>

            {/* СПОСОБНОСТИ С [i] */}
            <div style={{ fontSize: '8px', color: '#facc15', borderBottom: '1px dashed #1e3a8a', paddingBottom: '4px', marginBottom: '8px' }}>
              СПОСОБНОСТИ:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {hero.skills.map((sk, sIdx) => (
                <div key={sIdx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.5)', padding: '6px 8px', border: '1px solid #1e293b' }}>
                  <span style={{ fontSize: '8px', color: '#e2e8f0' }}>
                    • {sk.name}
                  </span>
                  <button
                    onClick={() => setModalSkill(sk)}
                    style={{ background: 'transparent', border: '1px solid #f59e0b', color: '#f59e0b', fontFamily: 'inherit', fontSize: '8px', padding: '3px 6px', cursor: 'pointer' }}
                  >
                    [i]
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ВСЕГДА ВИДИМАЯ КНОПКА СТАРТА */}
          <div style={{ borderTop: '1px solid #1e3a8a', paddingTop: '8px' }}>
            <button
              disabled={selectedIds.length !== 4}
              onClick={() => onSquadConfirmed(selectedIds)}
              style={{
                width: '100%',
                background: selectedIds.length === 4 ? 'rgba(0,255,242,0.2)' : 'transparent',
                border: `2px solid ${selectedIds.length === 4 ? '#00fff2' : '#334155'}`,
                color: selectedIds.length === 4 ? '#00fff2' : '#475569',
                fontFamily: 'inherit',
                fontSize: '10px',
                padding: '12px 10px',
                cursor: selectedIds.length === 4 ? 'pointer' : 'not-allowed',
                textAlign: 'center'
              }}
            >
              {selectedIds.length === 4 ? '[ НАЧАТЬ ЭКСПЕДИЦИЮ > ]' : `[ ВЫБЕРИТЕ ЕЩЕ ${4 - selectedIds.length} ]`}
            </button>
          </div>
        </div>
      </div>

      {/* ОКНО ИЗ СИМВОЛОВ ПРИ НАЖАТИИ [i] */}
      {modalSkill && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ width: '100%', maxWidth: '440px', background: '#020010', border: '2px solid #f59e0b', padding: '18px', boxSizing: 'border-box' }}>
            <div style={{ fontSize: '9px', color: '#f59e0b', borderBottom: '1px solid #f59e0b', paddingBottom: '6px', marginBottom: '10px' }}>
              +-----------------------------------------+<br />
              | СПОСОБНОСТЬ: {modalSkill.name}<br />
              +-----------------------------------------+
            </div>
            <div style={{ fontSize: '9px', color: '#fef08a', lineHeight: 1.6, marginBottom: '16px' }}>
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
