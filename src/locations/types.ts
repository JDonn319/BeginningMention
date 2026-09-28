// ========================================================
// КОНТРАКТ СЦЕНАРИЯ ЛОКАЦИИ (LOCATION SCENARIO INTERFACE)
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
  art: string[];
}

export interface LocationScenario {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  
  // Музыкальный лад (ноты баса для 8-битного синтезатора)
  musicBassNotes: number[];

  // Длительность марша на входе (в миллисекундах)
  introMarchDurationMs: number;

  // Функция высоты пола для создания неровного рельефа
  getFloorRow: (col: number) => number;

  // Отрисовка уникального окружения (потолок, сталактиты, скалы)
  drawEnvironment: (
    ctx: CanvasRenderingContext2D,
    cellW: number,
    cellH: number,
    tick: number
  ) => void;

  // Начальный состав и расстановка врагов
  initialEnemies: EnemyCombatant[];

  // Тактическая логика атаки врагов
  getEnemyAttackTargetIdx: (
    enemy: EnemyCombatant,
    heroes: { id: string; heroClass: string; curHp: number; isDead: boolean }[]
  ) => number;
}
