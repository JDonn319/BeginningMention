// ========================================================
// ДАННЫЕ: 6 СТАРТОВЫХ ГЕРОЕВ И 14 СЕКТОРОВ ПЛАНЕТЫ
// ========================================================

export interface HeroSkill {
  name: string;
  desc: string;
}

export interface StarterHero {
  id: string;
  name: string;
  heroClass: 'Attack' | 'Tank' | 'Support' | 'Healer';
  hp: number;
  armor: number;
  color: string;
  artBreath1: string[];
  artBreath2: string[];
  skills: [HeroSkill, HeroSkill];
}

export const STARTER_HEROES: StarterHero[] = [
  {
    id: 'josef',
    name: 'JOSEF',
    heroClass: 'Attack',
    hp: 120,
    armor: 0,
    color: '#c084fc',
    artBreath1: [
      '    o    ',
      '  /|\\=  ',
      '  / \\   ',
      '  L L   '
    ],
    artBreath2: [
      '    o    ',
      '  (|\\=  ',
      '  / \\   ',
      '  L L   '
    ],
    skills: [
      { name: 'Выстрел Бластера', desc: 'Фокусированный лазерный луч. 22 урона. Голова: 100% крит.' },
      { name: 'Термо-Ракета', desc: 'Залп тяжелой ракетой с осколочным разлетом. 36 урона.' }
    ]
  },
  {
    id: 'michael',
    name: 'MICHAEL',
    heroClass: 'Tank',
    hp: 240,
    armor: 45,
    color: '#3b82f6',
    artBreath1: [
      '    o    ',
      '  /|#||  ',
      '  | |   ',
      '  L L   '
    ],
    artBreath2: [
      '    o    ',
      '  (|#||  ',
      '  | |   ',
      '  L L   '
    ],
    skills: [
      { name: 'Бросок Бревна', desc: 'Вращающееся дубовое бревно. 28 урона. Сбивает цель с ног.' },
      { name: 'Силовой Оплот', desc: 'Устанавливает барьер +50 щита. Провоцирует босса на 2 хода.' }
    ]
  },
  {
    id: 'kyle',
    name: 'KYLE',
    heroClass: 'Support',
    hp: 135,
    armor: 15,
    color: '#22c55e',
    artBreath1: [
      '    o    ',
      '  /|\\*  ',
      '  / \\   ',
      '  L L   '
    ],
    artBreath2: [
      '    o    ',
      '  (|\\*  ',
      '  / \\   ',
      '  L L   '
    ],
    skills: [
      { name: 'Рунный Веер', desc: 'Запуск 3 парящих рун эфира. 24 суммарного урона.' },
      { name: 'Запрет Чар', desc: 'Накладывает печать тишины: босс не может использовать спец-атаки.' }
    ]
  },
  {
    id: 'demid',
    name: 'DEMID',
    heroClass: 'Healer',
    hp: 140,
    armor: 10,
    color: '#80ed99',
    artBreath1: [
      '    p    ',
      '  /E\\   ',
      '  / \\   ',
      '  L L   '
    ],
    artBreath2: [
      '    p    ',
      '  (E\\   ',
      '  / \\   ',
      '  L L   '
    ],
    skills: [
      { name: 'Полевое Лечение', desc: 'Восстанавливает 35 HP выбранному союзнику.' },
      { name: 'Стимулятор Жизни', desc: 'Воскрешает павшего с 40% HP или снимает дебаффы.' }
    ]
  },
  {
    id: 'artemis',
    name: 'ARTEMIS',
    heroClass: 'Attack',
    hp: 130,
    armor: 5,
    color: '#f97316',
    artBreath1: [
      '    o    ',
      '  /|\\-- ',
      '  / \\   ',
      '  L L   '
    ],
    artBreath2: [
      '    o    ',
      '  (|\\-- ',
      '  / \\   ',
      '  L L   '
    ],
    skills: [
      { name: 'Бросок Копья', desc: 'Световое копье. Урон растет от дистанции: от 12 до 40.' },
      { name: 'Зажигательная Смесь', desc: 'Взрыв + горение: наносит 12 урона каждый ход.' }
    ]
  },
  {
    id: 'orion',
    name: 'ORION',
    heroClass: 'Tank',
    hp: 220,
    armor: 30,
    color: '#ffd60a',
    artBreath1: [
      '    +    ',
      '  /O\\   ',
      '  | |   ',
      '  L L   '
    ],
    artBreath2: [
      '    +    ',
      '  (O\\   ',
      '  | |   ',
      '  L L   '
    ],
    skills: [
      { name: 'Солнечный Сокрушитель', desc: 'Мощный выпад клинком света на 30 урона.' },
      { name: 'Аура Защиты', desc: 'Поглощает 30% урона, направленного в союзников.' }
    ]
  }
];

// 14 НОД ПЛАНЕТЫ (1 - ПЕЩЕРА, 2-14 - ЗАКРЫТЫ)
export interface PlanetNode {
  id: number;
  name: string;
  lat: number;
  lon: number;
  links: number[];
  isUnlocked: boolean;
}

export const PLANET_14_NODES: PlanetNode[] = [
  { id: 0,  name: 'Пещера',    lat: 12,  lon: -20, links: [1, 2],    isUnlocked: true },
  { id: 1,  name: 'Сектор 02', lat: 28,  lon: 35,  links: [2, 3],    isUnlocked: false },
  { id: 2,  name: 'Сектор 03', lat: -15, lon: 45,  links: [4],       isUnlocked: false },
  { id: 3,  name: 'Сектор 04', lat: 40,  lon: 90,  links: [5],       isUnlocked: false },
  { id: 4,  name: 'Сектор 05', lat: -10, lon: 110, links: [5, 6],    isUnlocked: false },
  { id: 5,  name: 'Сектор 06', lat: -35, lon: 75,  links: [7],       isUnlocked: false },
  { id: 6,  name: 'Сектор 07', lat: 18,  lon: 160, links: [8],       isUnlocked: false },
  { id: 7,  name: 'Сектор 08', lat: -28, lon: -130,links: [8, 9],    isUnlocked: false },
  { id: 8,  name: 'Сектор 09', lat: 8,   lon: -75, links: [10],      isUnlocked: false },
  { id: 9,  name: 'Сектор 10', lat: -45, lon: -40, links: [11],      isUnlocked: false },
  { id: 10, name: 'Сектор 11', lat: 35,  lon: -110,links: [12],      isUnlocked: false },
  { id: 11, name: 'Сектор 12', lat: -20, lon: 170, links: [12, 13],  isUnlocked: false },
  { id: 12, name: 'Сектор 13', lat: 50,  lon: 10,  links: [13],      isUnlocked: false },
  { id: 13, name: 'Сектор 14', lat: 0,   lon: 0,   links: [],        isUnlocked: false }
];

export const TREE_TEMPLATES = [
  ['   /\\   ', '  /**\\  ', ' /****\\ ', '/******\\', '  ||||  '],
  ['    /\\    ', '   //\\\\   ', '  ///\\\\\\  ', ' ////\\\\\\\\ ', '    ||    ']
];

export const GROUND_STAMPS = [
  '~^~..~~~=~=~..~~~^~...~~~~=~~~..~~~^~..~~~=~=~',
  '#%##%#%%##%%###%%%##%#%%%###%%##%%####%%#%##%#'
];
