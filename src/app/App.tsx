import React, { useState } from 'react';
import { MainMenuScreen } from '../screens/MainMenuScreen';
import { OperatorSelectScreen } from '../screens/OperatorSelectScreen';
import { PlanetMapScreen } from '../screens/PlanetMapScreen';
import { BattleScreen } from '../screens/BattleScreen';
import { PLANET_LEVELS } from '../templates/asciiModels';

export const App: React.FC = () => {
  const [screen, setScreen] = useState<'MENU' | 'OPERATORS' | 'MAP' | 'BATTLE'>('MENU');
  const [selectedOpIds, setSelectedOpIds] = useState<string[]>(['josef', 'michael', 'kyle', 'artemis']);
  const [unlockedOpIds, setUnlockedOpIds] = useState<string[]>([]);
  const [currentLevelId, setCurrentLevelId] = useState<number>(0);
  const [completedNodeIds, setCompletedNodeIds] = useState<number[]>([]);
  const [unlockedNodeIds, setUnlockedNodeIds] = useState<number[]>([0]);

  const handleBattleEnd = (won: boolean) => {
    if (won) {
      if (!completedNodeIds.includes(currentLevelId)) {
        setCompletedNodeIds([...completedNodeIds, currentLevelId]);
      }
      // Открываем следующий уровень и нового героя при победе
      const lvl = PLANET_LEVELS[currentLevelId];
      lvl.links.forEach((linkId) => {
        if (!unlockedNodeIds.includes(linkId)) {
          setUnlockedNodeIds((prev) => [...prev, linkId]);
        }
      });

      // Открытие персонажа за сектор
      const unlockReward: Record<number, string> = { 0: 'demid', 1: 'nyx', 2: 'orion', 3: 'vera' };
      if (unlockReward[currentLevelId] && !unlockedOpIds.includes(unlockReward[currentLevelId])) {
        setUnlockedOpIds([...unlockedOpIds, unlockReward[currentLevelId]]);
      }
    }
    setScreen('MAP');
  };

  return (
    <>
      {screen === 'MENU' && (
        <MainMenuScreen onStartGame={() => setScreen('OPERATORS')} />
      )}

      {screen === 'OPERATORS' && (
        <OperatorSelectScreen
          selectedIds={selectedOpIds}
          unlockedIds={unlockedOpIds}
          onConfirm={(ids) => {
            setSelectedOpIds(ids);
            setScreen('MAP');
          }}
          onBack={() => setScreen('MENU')}
        />
      )}

      {screen === 'MAP' && (
        <PlanetMapScreen
          completedNodeIds={completedNodeIds}
          unlockedNodeIds={unlockedNodeIds}
          onSelectNode={(lvlId) => {
            setCurrentLevelId(lvlId);
            setScreen('BATTLE');
          }}
          onOpenSquad={() => setScreen('OPERATORS')}
          onBackToMenu={() => setScreen('MENU')}
        />
      )}

      {screen === 'BATTLE' && (
        <BattleScreen
          level={PLANET_LEVELS[currentLevelId]}
          selectedOperatorIds={selectedOpIds}
          onBattleEnd={handleBattleEnd}
        />
      )}
    </>
  );
};
