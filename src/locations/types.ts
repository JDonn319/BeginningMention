// ========================================================
// ТИПЫ СЦЕНАРИЕВ ЛОКАЦИЙ И ВРАГОВ
// ========================================================

export interface EnemyCombatant {
  id: number;
  name: string;
  role: 'BRAWLER' | 'SNIPER' | 'OPPORTUNIST' | 'BOSS';
  hp: number;
  maxHp: number;
  col: number;
  rowOffset: number;
  isDead: boolean;
  color: string;
  artIdle: string[];
  artAiming: string[];
}

export interface LocationScenario {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  musicBassNotes: number[];
  introMarchDurationMs: number;
  getFloorRow: (col: number) => number;
  drawEnvironment: (
    ctx: CanvasRenderingContext2D,
    cellW: number,
    cellH: number,
    tick: number
  ) => void;
  initialEnemies: EnemyCombatant[];
  getEnemyAttackTargetIdx: (
    enemy: EnemyCombatant,
    heroes: { id: string; heroClass: string; curHp: number; isDead: boolean }[]
  ) => number;
}
