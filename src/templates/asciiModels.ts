// ========================================================
// БИБЛИОТЕКА МОДЕЛЕЙ, БИОМОВ И БОССОВ (BEGINNING MENTION)
// ========================================================

export interface HeroSkill {
  id: string;
  name: string;
  desc: string;
  type: 'dmg' | 'shield' | 'heal' | 'buff' | 'curse' | 'revive';
  value: number;
  cd: number;
  vfx: 'laser' | 'rocket' | 'log' | 'shield' | 'runes' | 'spear' | 'bomb' | 'heal';
}

export interface Operator {
  id: string;
  name: string;
  role: string;
  color: string;
  hp: number;
  ping: number;
  unlockedByDefault: boolean;
  weaponName: string;
  weaponArt: string[];
  skills: HeroSkill[];
}

export const ALL_OPERATORS: Operator[] = [
  {
    id: 'josef',
    name: 'JOSEF',
    role: 'ШТУРМОВИК',
    color: '#c084fc',
    hp: 120,
    ping: 12,
    unlockedByDefault: true,
    weaponName: 'Неоновый Бластер MK-2',
    weaponArt: [' o ', '/|\\=', 'L L'],
    skills: [
      { id: 'blast', name: 'ВЫСТРЕЛ БЛАСТЕРА', desc: 'Точный лазерный импульс. 24 урона.', type: 'dmg', value: 24, cd: 0, vfx: 'laser' },
      { id: 'rocket', name: 'РАКЕТНЫЙ ЗАЛП', desc: 'Тяжелая осколочная ракета. 48 урона. КД: 3', type: 'dmg', value: 48, cd: 3, vfx: 'rocket' }
    ]
  },
  {
    id: 'michael',
    name: 'MICHAEL',
    role: 'ТАНК-ЗАЩИТНИК',
    color: '#3b82f6',
    hp: 240,
    ping: 18,
    unlockedByDefault: true,
    weaponName: 'Титановое Бревно и Силовой Щит',
    weaponArt: [' o ', '/|#||', 'L L'],
    skills: [
      { id: 'log', name: 'БРОСОК БРЕВНА', desc: 'Вращающееся дубовое бревно. 28 урона. Крит по голове.', type: 'dmg', value: 28, cd: 0, vfx: 'log' },
      { id: 'wall', name: 'СИЛОВОЙ БАРЬЕР', desc: 'Устанавливает барьер +45 щита всему отряду. КД: 2', type: 'shield', value: 45, cd: 2, vfx: 'shield' }
    ]
  },
  {
    id: 'kyle',
    name: 'KYLE',
    role: 'РУННЫЙ МИСТИК',
    color: '#22c55e',
    hp: 135,
    ping: 15,
    unlockedByDefault: true,
    weaponName: 'Рунный Катализатор Эфира',
    weaponArt: [' o ', '/|\\*', 'L L'],
    skills: [
      { id: 'runes', name: 'АТАКА РУНАМИ', desc: 'Веер из 3 парящих рун эфира. 22 урона.', type: 'dmg', value: 22, cd: 0, vfx: 'runes' },
      { id: 'revive', name: 'ВОСКРЕШЕНИЕ', desc: 'Воскрешает павшего или лечит на 40% HP. КД: 4', type: 'revive', value: 50, cd: 4, vfx: 'heal' }
    ]
  },
  {
    id: 'artemis',
    name: 'ARTEMIS',
    role: 'СНАЙПЕР-КОПЕЙЩИК',
    color: '#f97316',
    hp: 130,
    ping: 10,
    unlockedByDefault: true,
    weaponName: 'Световое Копье Дальнего Боя',
    weaponArt: [' o ', '/|\\--', 'L L'],
    skills: [
      { id: 'spear', name: 'БРОСОК КОПЬЯ', desc: 'Урон растет от дистанции (от 15 в упор до 42 издали).', type: 'dmg', value: 32, cd: 0, vfx: 'spear' },
      { id: 'bomb', name: 'ОГНЕННАЯ БОМБА', desc: 'Взрыв зажигательной смеси. 20 урона + горение. КД: 3', type: 'dmg', value: 20, cd: 3, vfx: 'bomb' }
    ]
  },
  {
    id: 'demid',
    name: 'DEMID',
    role: 'ПОЛЕВОЙ ХИРУРГ',
    color: '#80ed99',
    hp: 145,
    ping: 14,
    unlockedByDefault: false,
    weaponName: 'Медицинский Нано-Инжектор',
    weaponArt: [' p ', '/E\\', ' LL'],
    skills: [
      { id: 'mend', name: 'БИНТОВАНИЕ', desc: 'Восстанавливает 30 HP выбранному бойцу.', type: 'heal', value: 30, cd: 0, vfx: 'heal' },
      { id: 'stim', name: 'СТИМУЛЯТОР', desc: 'Лечит на 45 HP и ускоряет ход. КД: 3', type: 'heal', value: 45, cd: 3, vfx: 'heal' }
    ]
  },
  {
    id: 'nyx',
    name: 'NYX',
    role: 'ФАНТОМ-АССАСИН',
    color: '#ff006e',
    hp: 115,
    ping: 7,
    unlockedByDefault: false,
    weaponName: 'Фазовые Клинки Бездны',
    weaponArt: [' * ', '/N\\', '/ \\'],
    skills: [
      { id: 'stab', name: 'ТЕНЕВОЙ УДАР', desc: 'Высокий шанс крита. 28 урона.', type: 'dmg', value: 28, cd: 0, vfx: 'laser' },
      { id: 'step', name: 'РАЗРЫВ ТЕНИ', desc: 'Наносит 55 урона и дает уклонение. КД: 3', type: 'dmg', value: 55, cd: 3, vfx: 'laser' }
    ]
  },
  {
    id: 'orion',
    name: 'ORION',
    role: 'СОЛНЕЧНЫЙ ПАЛАДИН',
    color: '#ffd60a',
    hp: 180,
    ping: 20,
    unlockedByDefault: false,
    weaponName: 'Клинок Звездного Света',
    weaponArt: [' + ', '/O\\', '/ \\'],
    skills: [
      { id: 'smite', name: 'КАРАЮЩИЙ СВЕТ', desc: 'Удар небесной плазмы на 30 урона.', type: 'dmg', value: 30, cd: 0, vfx: 'laser' },
      { id: 'light', name: 'СИЯНИЕ ЗВЕЗДЫ', desc: 'Массовое исцеление отряда на 26 HP. КД: 3', type: 'heal', value: 26, cd: 3, vfx: 'heal' }
    ]
  },
  {
    id: 'vera',
    name: 'VERA',
    role: 'КИБЕР-ИНЖЕНЕР',
    color: '#4cc9f0',
    hp: 130,
    ping: 11,
    unlockedByDefault: false,
    weaponName: 'Дуговой Разрядник Тесла',
    weaponArt: [' o ', '[V]', '/ \\'],
    skills: [
      { id: 'zap', name: 'ТЕКТОНИЧЕСКИЙ РАЗРЯД', desc: 'Электрическая дуга на 28 урона.', type: 'dmg', value: 28, cd: 0, vfx: 'laser' },
      { id: 'emp', name: 'ЭМИ-ИМПУЛЬС', desc: 'Перегружает ядро босса на 1 ход. КД: 4', type: 'curse', value: 1, cd: 4, vfx: 'runes' }
    ]
  },
  {
    id: 'kael',
    name: 'KAEL',
    role: 'БЕРСЕРК КРОВИ',
    color: '#e63946',
    hp: 175,
    ping: 13,
    unlockedByDefault: false,
    weaponName: 'Двуручная Цепная Секира',
    weaponArt: [' @ ', '<K>', '/ \\'],
    skills: [
      { id: 'cleave', name: 'РАССЕКАЮЩИЙ ВЗМАХ', desc: 'Яростный удар на 42 урона (-6 HP себе).', type: 'dmg', value: 42, cd: 0, vfx: 'spear' },
      { id: 'frenzy', name: 'КРОВАВОЕ БУЙСТВО', desc: 'Серия ударов на 48 урона. КД: 5', type: 'dmg', value: 48, cd: 5, vfx: 'spear' }
    ]
  }
];

export interface LevelBiome {
  id: number;
  name: string;
  sub: string;
  biomeType: 'RAFT' | 'MOUNTAIN' | 'CRATER' | 'CORE';
  lat: number;
  lon: number;
  links: number[];
  color: string;
  story: string;
  boss: {
    name: string;
    hp: number;
    color: string;
    ping: number;
    skills: { id: string; name: string; desc: string; dmg: number; aoe?: boolean }[];
  };
}

export const PLANET_LEVELS: LevelBiome[] = [
  // 1. БИОМ: ПЛОТ НА ВОДЕ + ГЛУБИННЫЙ ЛЕВИАФАН-КРАКЕН
  {
    id: 0,
    name: 'АБИССАЛЬНЫЙ ОКЕАН',
    sub: 'СЕКТОР 01 // ПЛОТ',
    biomeType: 'RAFT',
    lat: 12,
    lon: -20,
    links: [1, 2],
    color: '#00fff2',
    story: 'Плот раскачивают океанские волны. Из пучины встает титан глубин.',
    boss: {
      name: 'ЛЕВИАФАН КРАКЕН',
      hp: 380,
      color: '#00fff2',
      ping: 16,
      skills: [
        { id: 'tentacle', name: 'УДАР ЩУПАЛЬЦЕМ', desc: 'Сокрушительный удар щупальца о настил плота.', dmg: 24 },
        { id: 'tsunami', name: 'ВОЛНА ЦУНАМИ', desc: 'Водяной вал окатывает весь отряд.', dmg: 16, aoe: true },
        { id: 'ink', name: 'ТОКСИЧНЫЙ ЗАЛП', desc: 'Залп едких чернил Бездны.', dmg: 32 }
      ]
    }
  },
  // 2. БИОМ: ГОРНЫЙ СКЛОН + ГОРНЫЙ ВЕЛИКАН
  {
    id: 1,
    name: 'ГРОМОВОЙ ПИК',
    sub: 'СЕКТОР 02 // СКАЛЫ',
    biomeType: 'MOUNTAIN',
    lat: 28,
    lon: 40,
    links: [2, 3],
    color: '#fbbf24',
    story: 'Крутой утес на краю пропасти. Путь преграждает каменный исполин.',
    boss: {
      name: 'ГОРНЫЙ ВЕЛИКАН',
      hp: 490,
      color: '#f59e0b',
      ping: 20,
      skills: [
        { id: 'club', name: 'УДАР ДУБИНОЙ', desc: 'Мощный удар дубиной о скалу.', dmg: 28 },
        { id: 'quake', name: 'ОБВАЛ СКАЛЫ', desc: 'Камнепад по всему отряду.', dmg: 18, aoe: true },
        { id: 'boulder', name: 'БРОСОК ВАЛУНА', desc: 'Метание огромной глыбы.', dmg: 36 }
      ]
    }
  },
  // 3. БИОМ: ВУЛКАНИЧЕСКИЙ КРАТЕР + ДРЕВНИЙ ДРАКОН
  {
    id: 2,
    name: 'КРАТЕР ПЕПЛА',
    sub: 'СЕКТОР 03 // ЛАВА',
    biomeType: 'CRATER',
    lat: -18,
    lon: 55,
    links: [3],
    color: '#ff3b00',
    story: 'Лавовое жерло кратера. В воздухе парит первородный дракон.',
    boss: {
      name: 'ОГНЕННЫЙ ДРАКОН',
      hp: 580,
      color: '#ff3b00',
      ping: 11,
      skills: [
        { id: 'fire', name: 'ДЫХАНИЕ БЕЗДНЫ', desc: 'Поток расплавленного пламени.', dmg: 32 },
        { id: 'tail', name: 'ВЗМАХ КРЫЛЬЕВ', desc: 'Ударная волна жара по отряду.', dmg: 20, aoe: true },
        { id: 'acid', name: 'РАСПЛАВЛЕННЫЙ ЗАЛП', desc: 'Плевок лавовым сгустком.', dmg: 40 }
      ]
    }
  },
  // 4. ЦИФРОВОЕ ЯДРО
  {
    id: 3,
    name: 'SOCKET // ЯДРО',
    sub: 'СЕКТОР 04 // ФИНАЛ',
    biomeType: 'CORE',
    lat: 5,
    lon: -80,
    links: [],
    color: '#c084fc',
    story: 'Сердце планеты. Искусственный интеллект ядра.',
    boss: {
      name: 'CORE-9 // AI',
      hp: 750,
      color: '#c084fc',
      ping: 8,
      skills: [
        { id: 'ping', name: 'PING FLOOD', desc: 'Залп пакетов данных по отряду.', dmg: 22, aoe: true },
        { id: 'seg', name: 'SEGFAULT', desc: 'Точечное выжигание кода бойца.', dmg: 42 }
      ]
    }
  }
];

export const TREE_TEMPLATES = [
  ['   /\\   ', '  /**\\  ', ' /****\\ ', '/******\\', '  ||||  '],
  ['    /\\    ', '   //\\\\   ', '  ///\\\\\\  ', ' ////\\\\\\\\ ', '    ||    ']
];

export const GROUND_STAMPS = [
  '~^~..~~~=~=~..~~~^~...~~~~=~~~..~~~^~..~~~=~=~',
  '#%##%#%%##%%###%%%##%#%%%###%%##%%####%%#%##%#'
];
