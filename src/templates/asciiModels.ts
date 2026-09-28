// ========================================================
// МОДЕЛИ: КРУПНЫЕ ГЕРОИ И ОРКИ (БЕЗ КОЛЕН, НОГИ СРАЗУ L L)
// ========================================================

export interface HeroSkill {
  id: string;
  name: string;
  desc: string;
  category: 'ATTACK' | 'AOE' | 'HEAL' | 'WALL';
  trajectory: 'LINE' | 'PARABOLA' | 'NONE';
  ammoCost: number;
}

export interface StarterHero {
  id: string;
  name: string;
  heroClass: 'Attack' | 'Tank' | 'Support' | 'Healer';
  hp: number;
  armor: number;
  color: string;
  weaponName: string;
  maxAmmo: number;
  largeWeaponAscii: string[];
  artBreath1: string[];
  artBreath2: string[];
  skills: [HeroSkill, HeroSkill];
}

export const STARTER_HEROES: StarterHero[] = [
  {
    id: 'josef',
    name: 'Josef',
    heroClass: 'Attack',
    hp: 120,
    armor: 0,
    color: '#c084fc',
    weaponName: 'Small Blaster (8/8)',
    maxAmmo: 8,
    largeWeaponAscii: [
      ' +=====\\____________/====+ ',
      ' | [=]   PLASMA CORE  (o)|=>',
      ' +=====/~~~~~~~~~~~~\\====+ '
    ],
    artBreath1: [
      '   (o)   ',
      '  /|#|\\=-',
      '   L L   '
    ],
    artBreath2: [
      '   (o)   ',
      '  (|#|)=-',
      '   L L   '
    ],
    skills: [
      { id: 'impulse', name: 'Impulse (basic)', desc: 'Прямой лазерный импульс. Голова: 20 крит, Тело: 11-15, Ноги: 6-10.', category: 'ATTACK', trajectory: 'LINE', ammoCost: 1 },
      { id: 'loaded', name: 'Loaded Blast', desc: 'Навесная фиолетовая бомба с радиусом поражения. Наносит 28-34 урона по всем оркам в радиусе взрыва!', category: 'AOE', trajectory: 'PARABOLA', ammoCost: 2 }
    ]
  },
  {
    id: 'michael',
    name: 'Michael',
    heroClass: 'Tank',
    hp: 240,
    armor: 45,
    color: '#3b82f6',
    weaponName: 'Heavy Oak Log (∞)',
    maxAmmo: 99,
    largeWeaponAscii: [
      ' /=========================\\ ',
      '|[###] [###] [###] [###] [###]|',
      ' \\=========================/ '
    ],
    artBreath1: [
      '   [o]   ',
      ' =/|#|\\= ',
      '   L L   '
    ],
    artBreath2: [
      '   [o]   ',
      ' =(|#|)= ',
      '   L L   '
    ],
    skills: [
      { id: 'log', name: 'Бросок Бревна', desc: 'Вращающееся по высокой дуге бревно. Голова: 26-29 урона, Тело: 8-14 урона.', category: 'ATTACK', trajectory: 'PARABOLA', ammoCost: 0 },
      { id: 'wall', name: 'Стена-Щит', desc: 'Возводит деревянный щит перед выбранным союзником на 1 ход.', category: 'WALL', trajectory: 'NONE', ammoCost: 0 }
    ]
  },
  {
    id: 'kyle',
    name: 'Kyle',
    heroClass: 'Support',
    hp: 135,
    armor: 15,
    color: '#22c55e',
    weaponName: 'Rune Catalyst (∞)',
    maxAmmo: 99,
    largeWeaponAscii: [
      '      .---.      ',
      '  /\\ (  Ж  ) /\\  ',
      ' <==> \\___/ <==> '
    ],
    artBreath1: [
      '   (o)   ',
      ' */|#|\\  ',
      '   L L   '
    ],
    artBreath2: [
      '   (o)   ',
      ' *(#|#)  ',
      '   L L   '
    ],
    skills: [
      { id: 'runes', name: 'Атака Рунами', desc: 'Веер из 3 парящих рун. Наносит 18-24 урона цели.', category: 'ATTACK', trajectory: 'PARABOLA', ammoCost: 0 },
      { id: 'silence', name: 'Запрет Чар', desc: 'Блокирует метание камней у выбранного орка на 1 ход.', category: 'ATTACK', trajectory: 'LINE', ammoCost: 0 }
    ]
  },
  {
    id: 'demid',
    name: 'Demid',
    heroClass: 'Healer',
    hp: 140,
    armor: 10,
    color: '#80ed99',
    weaponName: 'Nano-Injector (4/4)',
    maxAmmo: 4,
    largeWeaponAscii: [
      ' [+]===|>>>>>>>>====|--> ',
      '       |## MED-KIT #|    '
    ],
    artBreath1: [
      '   (p)   ',
      '  /|E|\\+ ',
      '   L L   '
    ],
    artBreath2: [
      '   (p)   ',
      '  (|E|)+ ',
      '   L L   '
    ],
    skills: [
      { id: 'heal', name: 'Инъекция Жизни', desc: 'Восстанавливает 40% HP выбранному союзнику (клик по союзнику).', category: 'HEAL', trajectory: 'NONE', ammoCost: 1 },
      { id: 'revive', name: 'Реанимация', desc: 'Воскрешает павшего союзника или лечит на 50% HP.', category: 'HEAL', trajectory: 'NONE', ammoCost: 2 }
    ]
  },
  {
    id: 'artemis',
    name: 'Artemis',
    heroClass: 'Attack',
    hp: 130,
    armor: 5,
    color: '#f97316',
    weaponName: 'Sniper Spear (5/5)',
    maxAmmo: 5,
    largeWeaponAscii: [
      ' <===========================>==+ ',
      '             |||||                '
    ],
    artBreath1: [
      '   (o)   ',
      '  /|#|\\--',
      '   L L   '
    ],
    artBreath2: [
      '   (o)   ',
      '  (|#|)--',
      '   L L   '
    ],
    skills: [
      { id: 'spear', name: 'Бросок Копья', desc: 'Урон растет от дистанции: от 6 в упор до 38 с задней линии.', category: 'ATTACK', trajectory: 'LINE', ammoCost: 1 },
      { id: 'bomb', name: 'Огненная Бомба', desc: 'Зажигательная бомба навесом. Взрыв по площади и горение на 2 хода.', category: 'AOE', trajectory: 'PARABOLA', ammoCost: 1 }
    ]
  },
  {
    id: 'orion',
    name: 'Orion',
    heroClass: 'Tank',
    hp: 220,
    armor: 30,
    color: '#ffd60a',
    weaponName: 'Solar Greatsword (∞)',
    maxAmmo: 99,
    largeWeaponAscii: [
      '       /\\       ',
      ' =====<##>===== ',
      '       ||       '
    ],
    artBreath1: [
      '   (+)   ',
      '  /|O|\\* ',
      '   L L   '
    ],
    artBreath2: [
      '   (+)   ',
      '  (|O|)* ',
      '   L L   '
    ],
    skills: [
      { id: 'smite', name: 'Солнечный Разрез', desc: 'Плазменный выпад меча на 26 урона.', category: 'ATTACK', trajectory: 'LINE', ammoCost: 0 },
      { id: 'aegis', name: 'Аура Солнца', desc: 'Принимает удары по отряду на себя.', category: 'WALL', trajectory: 'NONE', ammoCost: 0 }
    ]
  }
];

// МОДЕЛИ ОРКА: ПОКОЙ И ПРИЦЕЛИВАНИЕ С КАМНЕМ
export const ORC_MODEL = {
  color: '#84cc16',
  artIdle: [
    '   O   ',
    ' -{#}- ',
    '  I I  '
  ],
  artAiming: [
    '  (O)  ', // Поднял камень над головой
    ' \\{#}/ ',
    '  I I  '
  ]
};

// 14 НОД ПЛАНЕТЫ
export interface PlanetNode {
  id: number;
  name: string;
  lat: number;
  lon: number;
  links: number[];
  continent: string;
  isUnlocked: boolean;
}

export const PLANET_14_NODES: PlanetNode[] = [
  { id: 0,  name: 'Пещера',     lat: 15,  lon: -25, links: [1, 2],    continent: 'Скалистый Хребет', isUnlocked: true },
  { id: 1,  name: 'Сектор 02',  lat: 28,  lon: -10, links: [0, 2],    continent: 'Скалистый Хребет', isUnlocked: false },
  { id: 2,  name: 'Сектор 03',  lat: -5,  lon: -30, links: [0, 3],    continent: 'Скалистый Хребет', isUnlocked: false },
  { id: 3,  name: 'Сектор 04',  lat: 38,  lon: 45,  links: [4, 5],    continent: 'Астральные Низины', isUnlocked: false },
  { id: 4,  name: 'Сектор 05',  lat: 18,  lon: 60,  links: [3, 5],    continent: 'Астральные Низины', isUnlocked: false },
  { id: 5,  name: 'Сектор 06',  lat: -12, lon: 50,  links: [6],       continent: 'Астральные Низины', isUnlocked: false },
  { id: 6,  name: 'Сектор 07',  lat: -30, lon: 95,  links: [7, 8],    continent: 'Вулканический Пояс', isUnlocked: false },
  { id: 7,  name: 'Сектор 08',  lat: -10, lon: 120, links: [6, 8],    continent: 'Вулканический Пояс', isUnlocked: false },
  { id: 8,  name: 'Сектор 09',  lat: 10,  lon: 110, links: [9],       continent: 'Вулканический Пояс', isUnlocked: false },
  { id: 9,  name: 'Сектор 10',  lat: 52,  lon: 170, links: [10],      continent: 'Замерзшая Пустошь', isUnlocked: false },
  { id: 10, name: 'Сектор 11',  lat: 30,  lon: -150,links: [11],      continent: 'Замерзшая Пустошь', isUnlocked: false },
  { id: 11, name: 'Сектор 12',  lat: -20, lon: -140,links: [12],      continent: 'Замерзшая Пустошь', isUnlocked: false },
  { id: 12, name: 'Сектор 13',  lat: -40, lon: -70, links: [13],      continent: 'Цифровое Ядро', isUnlocked: false },
  { id: 13, name: 'Сектор 14',  lat: 0,   lon: 0,   links: [],        continent: 'Цифровое Ядро', isUnlocked: false }
];

export const TREE_TEMPLATES = [
  ['   /\\   ', '  /**\\  ', ' /****\\ ', '/******\\', '  ||||  '],
  ['    /\\    ', '   //\\\\   ', '  ///\\\\\\  ', ' ////\\\\\\\\ ', '    ||    ']
];

export const GROUND_STAMPS = [
  '~^~..~~~=~=~..~~~^~...~~~~=~~~..~~~^~..~~~=~=~',
  '#%##%#%%##%%###%%%##%#%%%###%%##%%####%%#%##%#'
];
