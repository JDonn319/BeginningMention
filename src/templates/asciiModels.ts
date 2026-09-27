// ========================================================
// БИБЛИОТЕКА МОДЕЛЕЙ И НАВЫКОВ (BEGINNING MENTION)
// ========================================================

export interface HeroSkill {
  id: string;
  name: string;
  type: 'ATTACK' | 'BUFF' | 'HEAL' | 'SPECIAL';
  damage?: number;
  cost?: number;
}

export interface BattleHero {
  id: string;
  name: string;
  weapon: string;
  hp: number;
  maxHp: number;
  color: string;
  gridX: number;
  rowOffset: number;
  charHead: string;
  charBody: string;
  charLegs: string;
  skills: HeroSkill[];
}

export const INITIAL_PARTY: BattleHero[] = [
  {
    id: 'michael',
    name: 'Michael',
    weapon: 'Plasma Grenades 3/5',
    hp: 210,
    maxHp: 210,
    color: '#ff9900',
    gridX: 16,
    rowOffset: 0,
    charHead: ' o ',
    charBody: '<#>',
    charLegs: '/ \\',
    skills: [
      { id: 'throw', name: '>>> Throw', type: 'ATTACK', damage: 95 },
      { id: 'multi', name: '    Multi-Target Calc', type: 'BUFF' },
      { id: 'shot',  name: '    Unique: Shot', type: 'ATTACK', damage: 70 },
      { id: 'shield', name: '    Shield Burst (7)', type: 'SPECIAL', damage: 130 }
    ]
  },
  {
    id: 'jane',
    name: 'Jane',
    weapon: 'Pulse SMG 12/20',
    hp: 140,
    maxHp: 140,
    color: '#ff7700',
    gridX: 25,
    rowOffset: 3,
    charHead: ' o ',
    charBody: '<#\\',
    charLegs: '/ \\',
    skills: [
      { id: 'smg', name: '>>> Pulse SMG', type: 'ATTACK', damage: 80 },
      { id: 'heal', name: '    Heal Matrix', type: 'HEAL' },
      { id: 'overload', name: '    Overload Arc', type: 'ATTACK', damage: 90 },
      { id: 'shield', name: '    Shield Burst (5)', type: 'SPECIAL', damage: 110 }
    ]
  },
  {
    id: 'sebastian',
    name: 'Sebastian',
    weapon: 'Short Blaster (6/7)',
    hp: 120,
    maxHp: 130,
    color: '#c084fc',
    gridX: 34,
    rowOffset: -2,
    charHead: ' e ',
    charBody: '|%\\',
    charLegs: '/> ',
    skills: [
      { id: 'blaster', name: '>>> Short Blaster', type: 'ATTACK', damage: 75 },
      { id: 'aim', name: '    Aim (+40%)', type: 'BUFF' },
      { id: 'impulse', name: '    Impulse Wave', type: 'ATTACK', damage: 85 },
      { id: 'burst', name: '    Shield Burst (6)', type: 'SPECIAL', damage: 115 }
    ]
  },
  {
    id: 'demid',
    name: 'Demid',
    weapon: 'Heavy Railgun 1/1',
    hp: 55,
    maxHp: 140,
    color: '#f97316',
    gridX: 43,
    rowOffset: 2,
    charHead: ' p ',
    charBody: '/@\\',
    charLegs: 'LL ',
    skills: [
      { id: 'railgun', name: '>>> Heavy Railgun', type: 'ATTACK', damage: 150 },
      { id: 'scan', name: '    Weakpoint Scan', type: 'BUFF' },
      { id: 'pierce', name: '    Armor Pierce', type: 'ATTACK', damage: 105 },
      { id: 'burst', name: '    Core Discharge', type: 'SPECIAL', damage: 140 }
    ]
  }
];

// Кадры анимации босса (Харпии): 1 - Парение, 2 - Ударный выпад
export const HARPY_FRAMES = {
  idle: [
    { text: '       /\\..==/\\       ..::*  ', color: '#ff2233' },
    { text: '       |  0  0  |    .::::*  ', color: '#ff2233' },
    { text: '     *============*  ::..:   ', color: '#ffaa00' },
    { text: '    *##############* ::..    ', color: '#ffcc00' },
    { text: '   *################* :.. /| ', color: '#ffaa00' },
    { text: '    *==============*  :  //  ', color: '#ff9900' },
    { text: '      *==========*      //   ', color: '#ff7700' },
    { text: '   \\\\\\  GG     GG  /// //    ', color: '#ff5500' },
    { text: '    \\\\\\ ||     || /// //     ', color: '#3b82f6' },
    { text: '       (((     )))   //      ', color: '#2563eb' },
    { text: '       LLL     LLL  //       ', color: '#1d4ed8' },
    { text: '       ###     ### //        ', color: '#1e40af' }
  ],
  attack: [
    { text: '      <<< /\\..==/\\ >>>       ', color: '#ff0033' },
    { text: '      <<< | [0][0] | >>>     ', color: '#ffffff' },
    { text: '    ===*============*===     ', color: '#ff3b00' },
    { text: '   ===*##############*===    ', color: '#ff8800' },
    { text: '  ===*################*=== /|', color: '#ffaa00' },
    { text: '      *==============*   //  ', color: '#ff7700' },
    { text: '    >>  GG ==== GG  <<  //   ', color: '#ff3300' },
    { text: '       \\\\ ||  || //    //    ', color: '#2563eb' },
    { text: '        (((    )))    //     ', color: '#1d4ed8' },
    { text: '        LLL    LLL   //      ', color: '#1e40af' }
  ]
};

// Рельефные символы кратера
export const CRATER_GROUND_SYMBOLS = [
  'y+a*p+G*r+y*a*p+G+r+y*a*p+G*r+y*a*p+G+r+y*a*p+G*r+y*a*p+G+r+y*a*p+G*r+y*a*p+G+r+',
  'G+r+gx+p+  y+a   r+  p+G+r+   +a   G+    p+    y  t   Cr   +p   G+r+a  +p+        ',
  '+a+p+       G+r+a  +p+        y+   p+    +a+p+  y+a*p+G+r+  +a+p y+a*p+G*r+y*a*p+G',
  'r+y+a*p+G*  p+G+r  y+a*p+G*   a+p  y+a*p  +G+  r+y*a*p+G+r  y+a*p +a+p+  G+r+gx+p+'
];

export const TREE_TEMPLATES = [
  ['   /\\   ', '  /**\\  ', ' /****\\ ', '/******\\', '  ||||  '],
  ['    /\\    ', '   //\\\\   ', '  ///\\\\\\  ', ' ////\\\\\\\\ ', '    ||    ']
];

export const GROUND_STAMPS = [
  '~^~..~~~=~=~..~~~^~...~~~~=~~~..~~~^~..~~~=~=~',
  '#%##%#%%##%%###%%%##%#%%%###%%##%%####%%#%##%#'
];
