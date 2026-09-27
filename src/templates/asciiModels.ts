// ========================================================
// БИБЛИОТЕКА МОДЕЛЕЙ И ДАННЫХ (BEGINNING MENTION)
// ========================================================

export interface HeroSkill {
  id: string;
  name: string;
  description: string;
  type: 'ATTACK' | 'BUFF' | 'HEAL' | 'WALL';
  cooldownMax: number;
}

export interface BattleHero {
  id: string;
  name: string;
  title: string;
  role: string;
  hp: number;
  maxHp: number;
  color: string;
  glow: string;
  nodeIndex: number;
  isDead: boolean;
  hasTaunt: boolean;
  tauntTimer: number;
  skills: HeroSkill[];
  cooldowns: Record<string, number>;
  weaponType: 'BLASTER' | 'ROCKET' | 'LOG' | 'RUNES' | 'SPEAR';
}

export const HEROES_CONFIG: BattleHero[] = [
  {
    id: 'josef',
    name: 'Josef',
    title: 'Void Gunner',
    role: 'Attack / Range DPS',
    hp: 120,
    maxHp: 120,
    color: '#c084fc',
    glow: '#a855f7',
    nodeIndex: 0,
    isDead: false,
    hasTaunt: false,
    tauntTimer: 0,
    weaponType: 'BLASTER',
    cooldowns: { blaster: 0, rocket: 0 },
    skills: [
      { id: 'blaster', name: '>>> Бластер', description: 'Точный огонь. Голова: 20 крит, Тело: 11-15, Ноги: 6-10', type: 'ATTACK', cooldownMax: 0 },
      { id: 'rocket', name: '    Ракетница', description: 'Массивный взрывной залп. Урон по площади 28-36. КД: 4', type: 'ATTACK', cooldownMax: 4 }
    ]
  },
  {
    id: 'michael',
    name: 'Michael',
    title: 'Aegis Sentinel',
    role: 'Heavy Tank',
    hp: 240,
    maxHp: 240,
    color: '#3b82f6',
    glow: '#60a5fa',
    nodeIndex: 2,
    isDead: false,
    hasTaunt: false,
    tauntTimer: 0,
    weaponType: 'LOG',
    cooldowns: { log: 0, wall: 0 },
    skills: [
      { id: 'log', name: '>>> Бросок бревна', description: 'Крутящееся бревно. Голова: 26-29, Тело/Ноги: 8-14', type: 'ATTACK', cooldownMax: 0 },
      { id: 'wall', name: '    Стена-Щит', description: 'Возводит барьер на 1 ход. Дает провокацию босса на 2 хода. КД: 2', type: 'WALL', cooldownMax: 2 }
    ]
  },
  {
    id: 'kyle',
    name: 'Kyle',
    title: 'Rune Weaver',
    role: 'Support / Healer',
    hp: 135,
    maxHp: 135,
    color: '#22c55e',
    glow: '#4ade80',
    nodeIndex: 1,
    isDead: false,
    hasTaunt: false,
    tauntTimer: 0,
    weaponType: 'RUNES',
    cooldowns: { runes: 0, silence: 0, revive: 0 },
    skills: [
      { id: 'runes', name: '>>> Атака рунами', description: '2-3 парящие руны. 5-8 урона за штуку', type: 'ATTACK', cooldownMax: 0 },
      { id: 'silence', name: '    Запрет чар', description: 'Блокирует боссу все особые навыки на 1 ход. КД: 3', type: 'ATTACK', cooldownMax: 3 },
      { id: 'revive', name: '    Восстановление', description: 'Лечит 40% HP живому (КД: 3) или воскрешает павшего (КД: 6)', type: 'HEAL', cooldownMax: 3 }
    ]
  },
  {
    id: 'artemis',
    name: 'Artemis',
    title: 'Horizon Lancer',
    role: 'Sniper / Lancer',
    hp: 130,
    maxHp: 130,
    color: '#f97316',
    glow: '#fb923c',
    nodeIndex: 3,
    isDead: false,
    hasTaunt: false,
    tauntTimer: 0,
    weaponType: 'SPEAR',
    cooldowns: { spear: 0, bomb: 0 },
    skills: [
      { id: 'spear', name: '>>> Бросок копья', description: 'Урон растет от дистанции! От 4 в упор до 38 издали', type: 'ATTACK', cooldownMax: 0 },
      { id: 'bomb', name: '    Огненная бомба', description: 'Взрыв + горение: 10-12 урона 2 хода босса. КД: 3', type: 'ATTACK', cooldownMax: 3 }
    ]
  }
];

// Спрайты оружия в руках
export const WEAPON_RENDER: Record<string, string[]> = {
  BLASTER: [' o ', '/|\\-', 'L L'],
  ROCKET:  [' o ', '/|#==', 'L L'],
  LOG:     [' o ', '/|#||', 'L L'],
  RUNES:   [' o ', '/|\\*', 'L L'],
  SPEAR:   [' o ', '/|\\--', 'L L']
};

// 4 способности босса для сводки (Dossier)
export const BOSS_DOSSIER = {
  name: 'Харпия Кратера (Harpy-0X)',
  type: 'Летающий титан Бездны',
  description: 'Древний биомеханический страж периметра кратера. Оснащен реактивными соплами, рунными крыльями и плазменным ядром.',
  skills: [
    { name: 'Когти Бездны', desc: 'Стремительное пике на одного героя. 20-28 физ. урона.' },
    { name: 'Вопль Искажения', desc: 'Ударная волна по всему отряду на 12-16 урона.' },
    { name: 'Плазменный луч ядра', desc: 'Прожигающий луч высокой мощности на 35-45 урона.' },
    { name: 'Щит Эфира', desc: 'Покрывает корпус барьером поглощения урона на 100 HP.' }
  ]
};

// Модель летающего босса с раскрытыми крыльями
export const FLYING_HARPY_FRAMES = {
  wingsUp: [
    '    \\  /\\..==/\\  /     ',
    '     \\ |  0  0  | /      ',
    '  ====*============*==== ',
    '   ==*##############*==  ',
    '     *==============*    ',
    '       GG ==== GG        ',
    '       \\\\ ||  || //      ',
    '        (((    )))       ',
    '        LLL    LLL       '
  ],
  wingsDown: [
    '       /\\..==/\\          ',
    '       |  0  0  |        ',
    '  // =*============*= \\\\ ',
    ' // =*##############*= \\\\',
    '     *==============*    ',
    '     \\\\  GG    GG  //    ',
    '      \\\\ ||    || //     ',
    '        (((    )))       ',
    '        LLL    LLL       '
  ]
};

export const CRATER_GROUND_SYMBOLS = [
  'y+a*p+G*r+y*a*p+G+r+y*a*p+G*r+y*a*p+G+r+y*a*p+G*r+y*a*p+G+r+y*a*p+G*r+y*a*p+G+r+',
  'G+r+gx+p+  y+a   r+  p+G+r+   +a   G+    p+    y  t   Cr   +p   G+r+a  +p+        ',
  '+a+p+       G+r+a  +p+        y+   p+    +a+p+  y+a*p+G+r+  +a+p y+a*p+G*r+y*a*p+G'
];

export const TREE_TEMPLATES = [
  ['   /\\   ', '  /**\\  ', ' /****\\ ', '/******\\', '  ||||  '],
  ['    /\\    ', '   //\\\\   ', '  ///\\\\\\  ', ' ////\\\\\\\\ ', '    ||    ']
];

export const GROUND_STAMPS = [
  '~^~..~~~=~=~..~~~^~...~~~~=~~~..~~~^~..~~~=~=~',
  '#%##%#%%##%%###%%%##%#%%%###%%##%%####%%#%##%#'
];
