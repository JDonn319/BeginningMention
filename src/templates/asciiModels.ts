// ========================================================
// БИБЛИОТЕКА МОДЕЛЕЙ И VFX (BEGINNING MENTION)
// ========================================================

export interface HeroSkill {
  id: string;
  name: string;
  desc: string;
  type: 'ATTACK' | 'BUFF' | 'HEAL' | 'WALL';
  weaponAnim: 'BLASTER' | 'ROCKET' | 'LOG' | 'RUNES' | 'SPEAR';
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
  currentX: number; // Для плавной интерполяции бега
  currentY: number;
  isDead: boolean;
  hasTaunt: boolean;
  tauntTimer: number;
  skills: HeroSkill[];
  weaponType: 'BLASTER' | 'ROCKET' | 'LOG' | 'RUNES' | 'SPEAR';
}

export const HEROES_CONFIG: BattleHero[] = [
  {
    id: 'josef',
    name: 'Josef',
    title: 'Void Gunner',
    role: 'Range DPS',
    hp: 120,
    maxHp: 120,
    color: '#c084fc',
    glow: '#a855f7',
    nodeIndex: 0,
    currentX: 14,
    currentY: 26,
    isDead: false,
    hasTaunt: false,
    tauntTimer: 0,
    weaponType: 'BLASTER',
    skills: [
      { id: 'blaster', name: '>>> Бластер', desc: 'Лазерный луч. Голова: 20 крит, Тело: 11-15, Ноги: 6-10', type: 'ATTACK', weaponAnim: 'BLASTER' },
      { id: 'rocket',  name: '    Ракетница', desc: 'Залп ракетой с взрывной волной. Урон 28-36', type: 'ATTACK', weaponAnim: 'ROCKET' }
    ]
  },
  {
    id: 'michael',
    name: 'Michael',
    title: 'Aegis Sentinel',
    role: 'Heavy Tank (2x HP)',
    hp: 240,
    maxHp: 240,
    color: '#3b82f6',
    glow: '#60a5fa',
    nodeIndex: 2,
    currentX: 30,
    currentY: 26,
    isDead: false,
    hasTaunt: false,
    tauntTimer: 0,
    weaponType: 'LOG',
    skills: [
      { id: 'log',  name: '>>> Бросок бревна', desc: 'Вращающееся бревно. Голова: 26-29, Тело: 8-14', type: 'ATTACK', weaponAnim: 'LOG' },
      { id: 'wall', name: '    Стена-Щит', desc: 'Возводит барьер на 1 ход. Дает провокацию на 2 хода', type: 'WALL', weaponAnim: 'LOG' }
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
    currentX: 22,
    currentY: 26,
    isDead: false,
    hasTaunt: false,
    tauntTimer: 0,
    weaponType: 'RUNES',
    skills: [
      { id: 'runes',   name: '>>> Атака рунами', desc: 'Веер из 2-3 древних рун (по 5-8 урона каждая)', type: 'ATTACK', weaponAnim: 'RUNES' },
      { id: 'silence', name: '    Запрет чар', desc: 'Блокирует боссу особые навыки на 1 ход', type: 'ATTACK', weaponAnim: 'RUNES' },
      { id: 'revive',  name: '    Восстановление', desc: 'Лечит 40% HP союзнику или воскрешает павшего', type: 'HEAL', weaponAnim: 'RUNES' }
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
    currentX: 38,
    currentY: 26,
    isDead: false,
    hasTaunt: false,
    tauntTimer: 0,
    weaponType: 'SPEAR',
    skills: [
      { id: 'spear', name: '>>> Бросок копья', desc: 'Урон масштабируется от дистанции (от 4 до 38!)', type: 'ATTACK', weaponAnim: 'SPEAR' },
      { id: 'bomb',  name: '    Огненная бомба', desc: 'Взрыв + горение босса 10-12 урона на 2 хода', type: 'ATTACK', weaponAnim: 'SPEAR' }
    ]
  }
];

export const WEAPON_RENDER: Record<string, string[]> = {
  BLASTER: [' o ', '/|\\-', 'L L'],
  ROCKET:  [' o ', '/|#==', 'L L'],
  LOG:     [' o ', '/|#||', 'L L'],
  RUNES:   [' o ', '/|\\*', 'L L'],
  SPEAR:   [' o ', '/|\\--', 'L L']
};

// ВЕЛИКИЙ БОСС: ХАРПИЯ КРАТЕРА (АНИМИРОВАННЫЕ КРЫЛЬЯ И НЕОНОВЫЙ КОРПУС)
export const EPIC_HARPY_WINGS_UP = [
  { text: '         /\\..==/\\             .::*  ', color: '#ff2233' },
  { text: '        |  0  0  |           .::::* ', color: '#ffffff' },
  { text: '      \\*============*/      ::..:   ', color: '#ffaa00' },
  { text: '    \\\\*##############*//   ::..  /| ', color: '#ffcc00' },
  { text: '   \\\\\\*##############*///   :.. //  ', color: '#ffaa00' },
  { text: '     \\*==============*/     :  //   ', color: '#ff8800' },
  { text: '       GG ==== GG             //    ', color: '#ff5500' },
  { text: '       \\\\ ||  || //          //     ', color: '#3b82f6' },
  { text: '        (((    )))          //      ', color: '#2563eb' },
  { text: '        LLL    LLL         //       ', color: '#1d4ed8' }
];

export const EPIC_HARPY_WINGS_DOWN = [
  { text: '         /\\..==/\\                   ', color: '#ff2233' },
  { text: '        |  0  0  |                  ', color: '#ffffff' },
  { text: '    // =*============*= \\\\    ..::* ', color: '#ffaa00' },
  { text: '   // =*##############*= \\\\  .::::* ', color: '#ffcc00' },
  { text: '  /// =*##############*= \\\\\\  :.. /|', color: '#ffaa00' },
  { text: '     \\*==============*/       :  // ', color: '#ff8800' },
  { text: '     \\\\  GG    GG  //           //  ', color: '#ff5500' },
  { text: '      \\\\ ||    || //           //   ', color: '#3b82f6' },
  { text: '        (((    )))            //    ', color: '#2563eb' },
  { text: '        LLL    LLL           //     ', color: '#1d4ed8' }
];

export const BOSS_DOSSIER = {
  name: 'Харпия Кратера [Harpy-0X]',
  type: 'Летающий титан Бездны',
  desc: 'Древний страж кратера. Парит на антигравитационных рунах, оснащен фазовым щитом и плазменным ядром.',
  skills: [
    { name: 'Когти Бездны', desc: 'Пикирующий удар когтями. 18-26 урона.' },
    { name: 'Вопль Искажения', desc: 'Ударная волна по всему отряду. 12-16 урона всем.' },
    { name: 'Плазменный луч ядра', desc: 'Фокусированный луч высокой мощности. 32-42 урона.' },
    { name: 'Фазовый щит', desc: 'Поглощает 80 единиц входящего урона.' }
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
