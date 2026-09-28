import React, { useState } from 'react';
import { MainMenuScreen } from '../screens/MainMenuScreen';
import { CharacterSelectScreen } from '../screens/CharacterSelectScreen';
import { PlanetMapScreen } from '../screens/PlanetMapScreen';
import { CaveBattleScreen } from '../screens/CaveBattleScreen';

export const App: React.FC = () => {
  const [screen, setScreen] = useState<'MENU' | 'CHAR_SELECT' | 'GLOBE' | 'CAVE_BATTLE'>('MENU');
  const [fadeOpacity, setFadeOpacity] = useState<number>(0);
  const [squadIds, setSquadIds] = useState<string[]>(['josef', 'michael', 'kyle', 'artemis']);

  const transitionTo = (nextScreen: 'MENU' | 'CHAR_SELECT' | 'GLOBE' | 'CAVE_BATTLE') => {
    setFadeOpacity(1);
    setTimeout(() => {
      setScreen(nextScreen);
      setTimeout(() => {
        setFadeOpacity(0);
      }, 300);
    }, 500);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

        .portrait-lock {
          display: none;
        }
        @media (orientation: portrait) {
          .portrait-lock {
            position: fixed; inset: 0; background: #020010; z-index: 99999;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            font-family: 'Press Start 2P', monospace; color: #00fff2; text-align: center; padding: 24px;
          }
        }

        .fade-overlay {
          position: fixed; inset: 0; background: #000; z-index: 9999; pointer-events: none;
          transition: opacity 0.5s ease;
        }
      `}</style>

      {/* Оверлей блокировки без рамок */}
      <div className="portrait-lock">
        <div style={{ fontSize: '13px', color: '#00fff2', marginBottom: '16px' }}>
          ПОВЕРНИТЕ УСТРОЙСТВО
        </div>
        <div style={{ fontSize: '9px', color: '#64748b', lineHeight: 1.8 }}>
          ДЕРЖИТЕ ТЕЛЕФОН ГОРИЗОНТАЛЬНО
        </div>
      </div>

      <div className="fade-overlay" style={{ opacity: fadeOpacity }} />

      {screen === 'MENU' && (
        <MainMenuScreen onStartNewGame={() => transitionTo('CHAR_SELECT')} />
      )}

      {screen === 'CHAR_SELECT' && (
        <CharacterSelectScreen
          onSquadConfirmed={(ids) => {
            setSquadIds(ids);
            transitionTo('GLOBE');
          }}
          onExitToMenu={() => transitionTo('MENU')}
        />
      )}

      {screen === 'GLOBE' && (
        <PlanetMapScreen
          onEnterCave={() => transitionTo('CAVE_BATTLE')}
          onBackToMenuConfirmed={() => transitionTo('MENU')}
        />
      )}

      {screen === 'CAVE_BATTLE' && (
        <CaveBattleScreen
          selectedSquadIds={squadIds}
          onVictory={() => {
            alert('ПЕЩЕРА ЗАЧИЩЕНА ОТ ОРКОВ!');
            transitionTo('GLOBE');
          }}
          onDefeat={() => {
            alert('ОТРЯД ПОГИБ В ПЕЩЕРЕ...');
            transitionTo('GLOBE');
          }}
        />
      )}
    </>
  );
};
