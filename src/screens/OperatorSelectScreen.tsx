import React, { useState } from 'react';
import { ALL_OPERATORS } from '../templates/asciiModels';

interface Props {
  selectedIds: string[];
  unlockedIds: string[];
  onConfirm: (ids: string[]) => void;
  onBack: () => void;
}

export const OperatorSelectScreen: React.FC<Props> = ({ selectedIds, unlockedIds, onConfirm, onBack }) => {
  const [currentSelected, setCurrentSelected] = useState<string[]>(selectedIds.length === 4 ? selectedIds : ['josef', 'michael', 'kyle', 'artemis']);

  const toggleOperator = (id: string, isUnlocked: boolean) => {
    if (!isUnlocked) return;
    if (currentSelected.includes(id)) {
      if (currentSelected.length > 1) {
        setCurrentSelected(currentSelected.filter((x) => x !== id));
      }
    } else {
      if (currentSelected.length < 4) {
        setCurrentSelected([...currentSelected, id]);
      }
    }
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#020010', color: '#fff', display: 'flex', flexDirection: 'column', padding: '12px 18px', boxSizing: 'border-box', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '8px' }}>
        <div>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '11px', color: '#00fff2' }}>
            [ ВЫБОР ОТРЯДА // ДЕСАНТ ]
          </div>
          <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
            ВЫБРАНО: {currentSelected.length} / 4 ОПЕРАТОРОВ (ТОЛЬКО 4 СТАРТОВЫХ ОТКРЫТЫ СРАЗУ)
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onBack}
            style={{ background: 'transparent', border: '1px solid #64748b', color: '#94a3b8', fontFamily: "'Press Start 2P', monospace", fontSize: '9px', padding: '8px 14px', cursor: 'pointer' }}
          >
            [ В МЕНЮ ]
          </button>
          <button
            disabled={currentSelected.length !== 4}
            onClick={() => onConfirm(currentSelected)}
            style={{
              background: currentSelected.length === 4 ? 'rgba(0,255,242,0.15)' : 'transparent',
              border: `1px solid ${currentSelected.length === 4 ? '#00fff2' : '#334155'}`,
              color: currentSelected.length === 4 ? '#00fff2' : '#475569',
              fontFamily: "'Press Start 2P', monospace",
              fontSize: '9px',
              padding: '8px 16px',
              cursor: currentSelected.length === 4 ? 'pointer' : 'not-allowed'
            }}
          >
            [ ПОДТВЕРДИТЬ И ВЫЙТИ НА ОРБИТУ ]
          </button>
        </div>
      </div>

      {/* СЕТКА ПЕРСОНАЖЕЙ */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginTop: '12px', overflowY: 'auto' }}>
        {ALL_OPERATORS.map((op) => {
          const isUnlocked = op.unlockedByDefault || unlockedIds.includes(op.id);
          const isSelected = currentSelected.includes(op.id);

          return (
            <div
              key={op.id}
              onClick={() => toggleOperator(op.id, isUnlocked)}
              style={{
                border: `1px solid ${isSelected ? op.color : isUnlocked ? 'rgba(255,255,255,0.15)' : '#1e1e2f'}`,
                background: isSelected ? 'rgba(255,255,255,0.06)' : 'rgba(5, 5, 20, 0.75)',
                padding: '10px',
                cursor: isUnlocked ? 'pointer' : 'not-allowed',
                opacity: isUnlocked ? 1 : 0.4,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: isSelected ? `0 0 12px ${op.color}44` : 'none'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '10px', color: isUnlocked ? op.color : '#64748b' }}>
                    {op.name}
                  </span>
                  <span style={{ fontSize: '11px', color: isSelected ? '#39ff14' : '#64748b' }}>
                    {isSelected ? '[ В ОТРЯДЕ ]' : isUnlocked ? '[ ДОСТУПЕН ]' : '[ ЗАБЛОКИРОВАН ]'}
                  </span>
                </div>

                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                  {op.role} // HP: {op.hp} // PING: {op.ping}
                </div>

                <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '4px' }}>
                  ОРУЖИЕ: {op.weaponName}
                </div>

                <pre style={{ margin: '8px 0', fontFamily: 'monospace', fontSize: '13px', color: op.color, lineHeight: 1.1 }}>
                  {op.weaponArt.join('\n')}
                </pre>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: '#e2e8f0', borderTop: '1px dashed #334155', paddingTop: '4px' }}>
                  НАВЫКИ:
                </div>
                {op.skills.map((sk) => (
                  <div key={sk.id} style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                    • {sk.name}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
