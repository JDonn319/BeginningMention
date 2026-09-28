import React, { useState } from 'react';

interface Props {
  onStartGame: () => void;
}

export const MainMenuScreen: React.FC<Props> = ({ onStartGame }) => {
  const [selectedIdx, setSelectedIdx] = useState<number>(0);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#020010', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <img
        src="/basiclogo.png"
        alt="BeginningMention"
        style={{ maxHeight: '180px', marginBottom: '24px', filter: 'drop-shadow(0 0 25px rgba(0,255,242,0.4))' }}
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />

      <div style={{ width: '100vw', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div
          onClick={onStartGame}
          onPointerEnter={() => setSelectedIdx(0)}
          style={{
            width: '100%',
            height: '42px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '12px',
            color: '#00fff2',
            background: selectedIdx === 0 ? 'rgba(0,255,242,0.18)' : 'transparent',
            boxShadow: selectedIdx === 0 ? 'inset 0 0 15px rgba(0,255,242,0.15)' : 'none'
          }}
        >
          {selectedIdx === 0 ? '> НОВАЯ ЭКСПЕДИЦИЯ' : '  НОВАЯ ЭКСПЕДИЦИЯ'}
        </div>

        <div
          style={{
            width: '100%',
            height: '42px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'not-allowed',
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '12px',
            color: '#475569'
          }}
        >
          ЗАГРУЗКИ (LOCKED)
        </div>
      </div>
    </div>
  );
};
