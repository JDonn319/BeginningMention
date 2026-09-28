// ========================================================
// БИБЛИОТЕКА МОДЕЛЕЙ, ОРУЖИЯ, ОРКОВ И ПЛАНЕТЫ
// ========================================================

export interface HeroSkill {
  id: string;
  name: string;
  desc: string;
  type: 'laser' | 'bomb' | 'log' | 'shield' | 'runes' | 'spear';
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

// 6 СТАРТОВЫХ ПЕРСОНАЖЕЙ (БЕЗ КОЛЕН, НОГИ СРАЗУ L L)
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
      '  +=====\\____________/====+  ',
      '  | [=]   PLASMA CORE  (o)|==>',
      '  +=====/~~~~~~~~~~~~\\====+  ',
      '        |||        |||       '
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
      { id: 'impulse', name: 'Impulse (basic)', desc: 'Быстрый лазерный луч по прямой траектории. 10-15 урона. Голова: 20 крит.', type: 'laser', ammoCost: 1 },
      { id: 'loaded', name: 'Loaded Blast', desc: 'Фиолетовая круглая бомба по навесной траектории. 28-34 урона с взрывной волной.', type: 'bomb', ammoCost: 2 }
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
      '  /=========================\\  ',
      ' | [###] [###] [###] [###] [###]| ',
      '  \\=========================/  '
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
      { id: 'log', name: 'Бросок Бревна', desc: 'Вращающееся дубовое бревно. Голова: 26-29 урона, тело: 8-14 урона.', type: 'log', ammoCost: 0 },
      { id: 'wall', name: 'Стена-Щит', desc: 'Возводит барьер перед союзником на 1 ход. Провоцирует врагов на 2 хода.', type: 'shield', ammoCost: 0 }
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
      '       .---.       ',
      '   /\\ (  Ж  ) /\\   ',
      '  <==> \\___/ <==>  ',
      '   \\/   |||   \\/   '
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
      { id: 'runes', name: 'Атака Рунами', desc: 'Выпускает 2-3 парящие руны эфира. 5-8 урона каждая.', type: 'runes', ammoCost: 0 },
      { id: 'silence', name: 'Запрет Чар', desc: 'Запрещает выбранному врагу кидать камни на 1 ход.', type: 'shield', ammoCost: 0 }
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
      '  [+]===|>>>>>>>>====|--> ',
      '        |## MED-KIT #|    '
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
      { id: 'heal', name: 'Инъекция Жизни', desc: 'Восстанавливает 40% HP выбранному бойцу.', type: 'shield', ammoCost: 1 },
      { id: 'revive', name: 'Реанимация', desc: 'Воскрешает павшего союзника с 40% HP.', type: 'shield', ammoCost: 2 }
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
      '  <======================================>==+ ',
      '                     |||||                    '
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
      { id: 'spear', name: 'Бросок Копья', desc: 'Урон растет от дистанции: от 4 в упор до 38 из заднего ряда.', type: 'spear', ammoCost: 1 },
      { id: 'bomb', name: 'Огненная Бомба', desc: 'Взрыв по площади + эффект горения на 10-12 урона на 2 хода.', type: 'bomb', ammoCost: 1 }
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
      '        /\\        ',
      '       /##\\       ',
      '  ====<####>====  ',
      '       \\##/       ',
      '        ||        '
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
      { id: 'smite', name: 'Солнечный Разрез', desc: 'Тяжелый удар клинком света на 26 урона.', type: 'laser', ammoCost: 0 },
      { id: 'aegis', name: 'Аура Солнца', desc: 'Принимает 40% урона команды на себя.', type: 'shield', ammoCost: 0 }
    ]
  }
];

// МОДЕЛЬ ОРКА: ГОЛОВА "O", ТЕЛО "{#}", РУКИ/НОГИ "I  I"
export const ORC_MODEL = {
  art: [
    '   O   ',
    ' -{#}- ',
    '  I I  '
  ],
  color: '#84cc16'
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
  { id: 1,  name: 'Утес Костей',lat: 28,  lon: -10, links: [0, 2],    continent: 'Скалистый Хребет', isUnlocked: false },
  { id: 2,  name: 'Врата Бездны',lat: -5, lon: -30, links: [0, 3],    continent: 'Скалистый Хребет', isUnlocked: false },
  { id: 3,  name: 'Руины Эфира',lat: 38,  lon: 45,  links: [4, 5],    continent: 'Астральные Низины', isUnlocked: false },
  { id: 4,  name: 'Башня Ветров',lat: 18, lon: 60,  links: [3, 5],    continent: 'Астральные Низины', isUnlocked: false },
  { id: 5,  name: 'Лазурный Разлом',lat: -12,lon: 50, links: [6],     continent: 'Астральные Низины', isUnlocked: false },
  { id: 6,  name: 'Кратер Пепла',lat: -30,lon: 95, links: [7, 8],    continent: 'Вулканический Пояс', isUnlocked: false },
  { id: 7,  name: 'Магма-Ривер',lat: -10,lon: 120,links: [6, 8],    continent: 'Вулканический Пояс', isUnlocked: false },
  { id: 8,  name: 'Черные Сопки',lat: 10, lon: 110,links: [9],       continent: 'Вулканический Пояс', isUnlocked: false },
  { id: 9,  name: 'Ледяной Шпиль',lat: 52,lon: 170,links: [10],      continent: 'Замерзшая Пустошь', isUnlocked: false },
  { id: 10, name: 'Хрустальный Грот',lat: 30,lon: -150,links: [11],  continent: 'Замерзшая Пустошь', isUnlocked: false },
  { id: 11, name: 'Мертвый Лед',lat: -20,lon: -140,links: [12],      continent: 'Замерзшая Пустошь', isUnlocked: false },
  { id: 12, name: 'Терминал Входа',lat: -40,lon: -70,links: [13],    continent: 'Цифровое Ядро', isUnlocked: false },
  { id: 13, name: 'Сингулярность Core',lat: 0,lon: 0,links: [],       continent: 'Цифровое Ядро', isUnlocked: false }
];

export const TREE_TEMPLATES = [
  ['   /\\   ', '  /**\\  ', ' /****\\ ', '/******\\', '  ||||  '],
  ['    /\\    ', '   //\\\\   ', '  ///\\\\\\  ', ' ////\\\\\\\\ ', '    ||    ']
];

export const GROUND_STAMPS = [
  '~^~..~~~=~=~..~~~^~...~~~~=~~~..~~~^~..~~~=~=~',
  '#%##%#%%##%%###%%%##%#%%%###%%##%%####%%#%##%#'
];
