import { LocationScenario, EnemyCombatant } from './types';
import { ORC_MODEL } from '../templates/asciiModels';

export const theCaveScenario: LocationScenario = {
  id: 'cave',
  name: 'THE CAVE',
  subtitle: 'СЕКТОР 01 // ПЕЩЕРА',
  description: 'пещера, в которой, по древним сказаниям, обитают орки и великаны.',

  musicBassNotes: [130.81, 146.83, 164.81, 174.61, 196.0, 220.0, 246.94],
  introMarchDurationMs: 4000,

  // Пол пещеры с 22 строки (герои и орки стоят прямо на нем)
  getFloorRow: (col: number) => {
    return Math.floor(22 + Math.sin(col * 0.14) * 1.5 + Math.cos(col * 0.06) * 1.0);
  },

  drawEnvironment: (ctx, cellW, cellH) => {
    for (let sc = 0; sc < 75; sc += 6) {
      ctx.fillStyle = '#1e1b4b';
      ctx.fillText('V', sc * cellW, 2 * cellH);
      ctx.fillText('|', sc * cellW, 1 * cellH);
    }
  },

  // 5 Орков: 1 впереди, по 2 сверху и снизу сзади
  initialEnemies: [
    {
      id: 0,
      name: 'Орк-Застрельщик',
      role: 'BRAWLER',
      hp: 55,
      maxHp: 55,
      col: 48,
      rowOffset: 0,
      isDead: false,
      color: ORC_MODEL.color,
      artIdle: ORC_MODEL.artIdle,
      artAiming: ORC_MODEL.artAiming
    },
    {
      id: 1,
      name: 'Орк-Снайпер 1',
      role: 'SNIPER',
      hp: 40,
      maxHp: 40,
      col: 58,
      rowOffset: -3,
      isDead: false,
      color: ORC_MODEL.color,
      artIdle: ORC_MODEL.artIdle,
      artAiming: ORC_MODEL.artAiming
    },
    {
      id: 2,
      name: 'Орк-Снайпер 2',
      role: 'SNIPER',
      hp: 40,
      maxHp: 40,
      col: 66,
      rowOffset: -3,
      isDead: false,
      color: ORC_MODEL.color,
      artIdle: ORC_MODEL.artIdle,
      artAiming: ORC_MODEL.artAiming
    },
    {
      id: 3,
      name: 'Орк-Мародер 1',
      role: 'OPPORTUNIST',
      hp: 45,
      maxHp: 45,
      col: 58,
      rowOffset: 3,
      isDead: false,
      color: ORC_MODEL.color,
      artIdle: ORC_MODEL.artIdle,
      artAiming: ORC_MODEL.artAiming
    },
    {
      id: 4,
      name: 'Орк-Мародер 2',
      role: 'OPPORTUNIST',
      hp: 45,
      maxHp: 45,
      col: 66,
      rowOffset: 3,
      isDead: false,
      color: ORC_MODEL.color,
      artIdle: ORC_MODEL.artIdle,
      artAiming: ORC_MODEL.artAiming
    }
  ] as EnemyCombatant[],

  // Умная логика выбора цели
  getEnemyAttackTargetIdx: (enemy, heroes) => {
    const aliveIndices = heroes.map((h, i) => (h.isDead ? -1 : i)).filter((i) => i !== -1);
    if (aliveIndices.length === 0) return 0;

    if (enemy.role === 'BRAWLER') {
      const tankIdx = heroes.findIndex((h) => !h.isDead && h.heroClass === 'Tank');
      return tankIdx !== -1 ? tankIdx : aliveIndices[0];
    } else if (enemy.role === 'SNIPER') {
      const dpsIdx = heroes.findIndex((h) => !h.isDead && h.heroClass === 'Attack');
      return dpsIdx !== -1 ? dpsIdx : aliveIndices[0];
    } else {
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
