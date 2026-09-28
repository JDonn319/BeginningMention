import { LocationScenario, EnemyCombatant } from './types';
import { ORC_MODEL } from '../templates/asciiModels';

export const theCaveScenario: LocationScenario = {
  id: 'cave',
  name: 'THE CAVE',
  subtitle: 'СЕКТОР 01 // ПЕЩЕРА',
  description: 'пещера, в которой, по древним сказаниям, обитают орки и великаны.',

  // 8-битная гамма в низком регистре
  musicBassNotes: [130.81, 146.83, 164.81, 174.61, 196.0, 220.0, 246.94],

  introMarchDurationMs: 5000, // 5 секунд марша на входе

  // Неровный рандомно перекошенный рельеф фиолетово-синего пола пещеры
  getFloorRow: (col: number) => {
    return Math.floor(
      24 +
      Math.sin(col * 0.14) * 2.8 +
      Math.cos(col * 0.05) * 1.6 +
      Math.sin(col * 0.3) * 0.9
    );
  },

  // Отрисовка свода пещеры и сталактитов
  drawEnvironment: (ctx, cellW, cellH) => {
    for (let sc = 0; sc < 100; sc += 6) {
      ctx.fillStyle = '#1e1b4b';
      ctx.fillText('V', sc * cellW, 2 * cellH);
      ctx.fillText('|', sc * cellW, 1 * cellH);
    }
  },

  // 5 Орков: 1 спереди, 2 сверху сзади, 2 снизу сзади (объемный клин)
  initialEnemies: [
    {
      id: 0,
      name: 'Орк-Застрельщик',
      role: 'BRAWLER',
      hp: 60,
      maxHp: 60,
      col: 64,
      rowOffset: 0,
      isDead: false,
      color: ORC_MODEL.color,
      art: ORC_MODEL.art
    },
    {
      id: 1,
      name: 'Орк-Снайпер 1',
      role: 'SNIPER',
      hp: 45,
      maxHp: 45,
      col: 76,
      rowOffset: -4,
      isDead: false,
      color: ORC_MODEL.color,
      art: ORC_MODEL.art
    },
    {
      id: 2,
      name: 'Орк-Снайпер 2',
      role: 'SNIPER',
      hp: 45,
      maxHp: 45,
      col: 86,
      rowOffset: -4,
      isDead: false,
      color: ORC_MODEL.color,
      art: ORC_MODEL.art
    },
    {
      id: 3,
      name: 'Орк-Мародер 1',
      role: 'OPPORTUNIST',
      hp: 50,
      maxHp: 50,
      col: 76,
      rowOffset: 4,
      isDead: false,
      color: ORC_MODEL.color,
      art: ORC_MODEL.art
    },
    {
      id: 4,
      name: 'Орк-Мародер 2',
      role: 'OPPORTUNIST',
      hp: 50,
      maxHp: 50,
      col: 86,
      rowOffset: 4,
      isDead: false,
      color: ORC_MODEL.color,
      art: ORC_MODEL.art
    }
  ] as EnemyCombatant[],

  // Умная логика выбора цели орками:
  getEnemyAttackTargetIdx: (enemy, heroes) => {
    const aliveIndices = heroes
      .map((h, i) => (h.isDead ? -1 : i))
      .filter((i) => i !== -1);

    if (aliveIndices.length === 0) return 0;

    // 1. Бросающий орк впереди бьет танка
    if (enemy.role === 'BRAWLER') {
      const tankIdx = heroes.findIndex((h) => !h.isDead && h.heroClass === 'Tank');
      return tankIdx !== -1 ? tankIdx : aliveIndices[0];
    }
    // 2. Снайперы сверху выцеливают уязвимых стрелков (Attack)
    else if (enemy.role === 'SNIPER') {
      const attackIdx = heroes.findIndex((h) => !h.isDead && h.heroClass === 'Attack');
      return attackIdx !== -1 ? attackIdx : aliveIndices[0];
    }
    // 3. Мародеры снизу добивают самого раненого
    else {
      let lowestIdx = aliveIndices[0];
      let lowestHp = heroes[lowestIdx].curHp;
      aliveIndices.forEach((idx) => {
        if (heroes[idx].curHp < lowestHp) {
          lowestHp = heroes[idx].curHp;
          lowestIdx = idx;
        }
      });
      return lowestIdx;
    }
  }
};
