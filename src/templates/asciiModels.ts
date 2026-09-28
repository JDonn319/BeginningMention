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
  // 4 СТАРТОВЫХ ПЕРСОНАЖА
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
      { id: 'blast', name: 'ВЫСТРЕЛ БЛАСТЕРА', desc: 'Точный лазерный импульс. Наносит 24 урона.', type: 'dmg', value: 24, cd: 0, vfx: 'laser' },
      { id: 'rocket', name: 'РАКЕТНЫЙ ЗАЛП', desc: 'Тяжелая осколочная ракета. Наносит 48 урона по площади. КД: 3', type: 'dmg', value: 48, cd: 3, vfx: 'rocket' }
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
      { id: 'log', name: 'БРОСОК БРЕВНА', desc: 'Вращающееся дубовое бревно. 28 урона. Голова: критический хит.', type: 'dmg', value: 28, cd: 0, vfx: 'log' },
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
      { id: 'runes', name: 'АТАКА РУНАМИ', desc: 'Веер из 3 парящих рун эфира. Суммарно 22 урона.', type: 'dmg', value: 22, cd: 0, vfx: 'runes' },
      { id: 'revive', name: 'ВОСКРЕШЕНИЕ', desc: 'Воскрешает павшего или лечит союзника на 40% HP. КД: 4', type: 'revive', value: 50, cd: 4, vfx: 'heal' }
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
      { id: 'spear', name: 'БРОСОК КОПЬЯ', desc: 'Урон растет с дистанцией (от 15 в упор до 42 с заднего ряда).', type: 'dmg', value: 32, cd: 0, vfx: 'spear' },
      { id: 'bomb', name: 'ОГНЕННАЯ БОМБА', desc: 'Взрыв зажигательной смеси. 20 урона + горение босса на 2 хода. КД: 3', type: 'dmg', value: 20, cd: 3, vfx: 'bomb' }
    ]
  },

  // 5 ОТКРЫВАЕМЫХ ПЕРСОНАЖЕЙ (UNLOCKABLE)
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
      { id: 'stim', name: 'СТИМУЛЯТОР', desc: 'Лечит на 45 HP и дает ускорение очереди ходов. КД: 3', type: 'heal', value: 45, cd: 3, vfx: 'heal' }
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
      { id: 'stab', name: 'ТЕНЕВОЙ УДАР', desc: 'Удар в уязвимые точки. Высокий шанс крита на 40 урона.', type: 'dmg', value: 28, cd: 0, vfx: 'laser' },
      { id: 'step', name: 'РАЗРЫВ ТЕНИ', desc: 'Наносит 55 урона и уклоняется от следующей атаки. КД: 3', type: 'dmg', value: 55, cd: 3, vfx: 'laser' }
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
      { id: 'smite', name: 'КАРАЮЩИЙ СВЕТ', desc: 'Удар небесной плазмы. 30 урона.', type: 'dmg', value: 30, cd: 0, vfx: 'laser' },
      { id: 'light', name: 'СИЯНИЕ ЗВЕЗДЫ', desc: 'Массовое исцеление всего отряда на 26 HP. КД: 3', type: 'heal', value: 26, cd: 3, vfx: 'heal' }
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
      { id: 'zap', name: 'ТЕКТОНИЧЕСКИЙ РАЗРЯД', desc: 'Электрическая дуга. 28 урона.', type: 'dmg', value: 28, cd: 0, vfx: 'laser' },
      { id: 'emp', name: 'ЭМИ-ИМПУЛЬС', desc: 'Перегружает ядро босса, блокируя его супер-атаки. КД: 4', type: 'curse', value: 1, cd: 4, vfx: 'runes' }
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
      { id: 'cleave', name: 'РАССЕКАЮЩИЙ ВЗМАХ', desc: 'Яростный удар на 42 урона (тратит 6 собственного HP).', type: 'dmg', value: 42, cd: 0, vfx: 'spear' },
      { id: 'frenzy', name: 'КРОВАВЫЙ БУЙСТВО', desc: 'Серия из трех ударов подряд. 3x16 урона. КД: 5', type: 'dmg', value: 48, cd: 5, vfx: 'spear' }
    ]
  }
];

// ========================================================
// 3 БОЛЬШИХ БОССА В РАЗНЫХ 3D-БИОМАХ
// ========================================================

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
    frames: { text: string; color: string }[][];
    skills: { id: string; name: string; desc: string; dmg: number; aoe?: boolean; isUltimate?: boolean }[];
  };
}

export const PLANET_LEVELS: LevelBiome[] = [
  // 1. БИОМ: ПЛОТ НА ВОДЕ + ГИГАНТСКИЙ КРАКЕН С ЩУПАЛЬЦАМИ
  {
    id: 0,
    name: 'АБИССАЛЬНЫЙ ОКЕАН',
    sub: 'СЕКТОР 01 // ПЛОТ',
    biomeType: 'RAFT',
    lat: 10,
    lon: -25,
    links: [1, 2],
    color: '#00fff2',
    story: 'Отряд держит оборону на качающемся плоту. Из пучины поднимается древний спрут.',
    boss: {
      name: 'ГЛУБИННЫЙ КРАКЕН',
      hp: 380,
      color: '#00fff2',
      ping: 8,
      frames: [
        [
          { text: '   (S)    /\\____/\\    (S)   ', color: '#00fff2' },
          { text: '  ((~))  /  O  O  \\  ((~))  ', color: '#38bdf8' },
          { text: '  ((~)) |    vv    | ((~))  ', color: '#0284c7' },
          { text: '   \\~\\   \\  ====  /   /~/   ', color: '#0369a1' },
          { text: '    \\~\\___\\______/___/~/    ', color: '#075985' },
          { text: '   (((((((( КРАКЕН )))))))) ', color: '#0c4a6e' }
        ],
        [
          { text: '  ((~))   /\\____/\\   ((~))  ', color: '#00fff2' },
          { text: '   \\~\\   /  *  *  \\   /~/   ', color: '#38bdf8' },
          { text: '  ((~)) |   (..)   | ((~))  ', color: '#0284c7' },
          { text: '   \\~\\   \\  ~~~~  /   /~/   ', color: '#0369a1' },
          { text: '    \\~\\___\\______/___/~/    ', color: '#075985' },
          { text: '   (((((((( ПУЧИНА )))))))) ', color: '#0c4a6e' }
        ]
      ],
      skills: [
        { id: 'tentacle', name: 'УДАР ЩУПАЛЬЦЕМ', desc: 'Тяжелый удар щупальцем по плоту. 24 физ. урона.', dmg: 24 },
        { id: 'tsunami', name: 'ВОЛНА ЦУНАМИ', desc: 'Окатывает весь плот волной. 16 урона всем бойцам.', dmg: 16, aoe: true },
        { id: 'ink', name: 'КИСЛОТНЫЕ ЧЕРНИЛА', desc: 'Залп токсичных чернил. 32 урона.', dmg: 32 },
        { id: 'maelstrom', name: 'ВОДОВОРОТ БЕЗДНЫ', desc: 'Ультимативный захват плота на 44 урона!', dmg: 44, isUltimate: true }
      ]
    }
  },

  // 2. БИОМ: КРИВАЯ ГОРА + ГОРНЫЙ ВЕЛИКАН С ДУБИНОЙ
  {
    id: 1,
    name: 'ГРОМОВОЙ ПИК',
    sub: 'СЕКТОР 02 // СКАЛЫ',
    biomeType: 'MOUNTAIN',
    lat: 32,
    lon: 45,
    links: [2, 3],
    color: '#fbbf24',
    story: 'Крутой горный склон под грозовыми тучами. Путь преграждает титан с огромной дубиной.',
    boss: {
      name: 'ГОРНЫЙ ВЕЛИКАН',
      hp: 490,
      color: '#f59e0b',
      ping: 14,
      frames: [
        [
          { text: '       /^^^^\\      [=====]  ', color: '#f59e0b' },
          { text: '      | [0][0]|      |###|  ', color: '#fbbf24' },
          { text: '      |  __  |       |###|  ', color: '#f59e0b' },
          { text: '     /|######|\\=====/###/   ', color: '#d97706' },
          { text: '    / |######| \\   /###/    ', color: '#b45309' },
          { text: '      |  ||  |              ', color: '#78350f' },
          { text: '     /==    ==\\             ', color: '#451a03' }
        ],
        [
          { text: '       /^^^^\\               ', color: '#f59e0b' },
          { text: '      | [X][X]|             ', color: '#ef4444' },
          { text: '      |  ==  |              ', color: '#f59e0b' },
          { text: '     /|######|\\             ', color: '#d97706' },
          { text: '    / |######| \\            ', color: '#b45309' },
          { text: '      |  ||  |     [=====]  ', color: '#78350f' },
          { text: '     /==    ==\\====|#####|  ', color: '#fbbf24' }
        ]
      ],
      skills: [
        { id: 'club', name: 'СОКРУШИТЕЛЬНЫЙ ВЗМАХ', desc: 'Удар дубиной о скалу. 28 урона цели.', dmg: 28 },
        { id: 'quake', name: 'ЗЕМЛЕТРЯСЕНИЕ', desc: 'Раскалывает горный хребет. 18 урона всей команде.', dmg: 18, aoe: true },
        { id: 'boulder', name: 'МЕТАНИЕ ВАЛУНА', desc: 'Бросает массивную глыбу в задний ряд на 36 урона.', dmg: 36 },
        { id: 'avalanche', name: 'КАМНЕПАД ВЕЛИКАНА', desc: 'Обрушивает пик горы на 50 урона!', dmg: 50, isUltimate: true }
      ]
    }
  },

  // 3. БИОМ: КРАТЕР + ДРЕВНИЙ ОГНЕДЫШАЩИЙ ДРАКОН
  {
    id: 2,
    name: 'КРАТЕР ЛЕВИАФАНА',
    sub: 'СЕКТОР 03 // ПЕПЕЛ',
    biomeType: 'CRATER',
    lat: -15,
    lon: 60,
    links: [3],
    color: '#ff2a2a',
    story: 'Лавовый разлом. В воздухе парит дракон, чье дыхание обращает скалы в расплавленный шлак.',
    boss: {
      name: 'ОГНЕННЫЙ ДРАКОН',
      hp: 580,
      color: '#ff3b00',
      ping: 7,
      frames: [
        [
          { text: '   /\\             __--~~~~--__             /\\   ', color: '#ff7700' },
          { text: '  //\\\\          /~            ~\\          //\\\\  ', color: '#ff5500' },
          { text: ' /// \\\\       /   (0)      (0)   \\       // \\\\\\ ', color: '#ff2200' },
          { text: ' |||  \\\\____/|        vv        |\\____//  ||| ', color: '#ff3b00' },
          { text: '  \\\\    ==== |       ====       | ====    //  ', color: '#ffaa00' },
          { text: '   \\\\        \\        ~~        /        //   ', color: '#ff7700' },
          { text: '    \\\\________\\________________/________//    ', color: '#b91c1c' }
        ],
        [
          { text: '                 __--~~~~--__                   ', color: '#ff7700' },
          { text: '  \\\\\\\\         /~    (X)  (X)   ~\\         //// ', color: '#ff2200' },
          { text: '   \\\\\\\\______/|       \\__/       |\\______////  ', color: '#ff3b00' },
          { text: '    \\\\  ==== |     <<ПЛАМЯ>>     | ====  //    ', color: '#fef08a' },
          { text: '     \\\\      \\      vvvvvv      /      //     ', color: '#ffaa00' },
          { text: '      \\\\______\\________________/______//      ', color: '#b91c1c' },
          { text: '               (((( ДРАКОН ))))                 ', color: '#7f1d1d' }
        ]
      ],
      skills: [
        { id: 'fire', name: 'ДЫХАНИЕ БЕЗДНЫ', desc: 'Столб пламени по цели на 30 урона.', dmg: 30 },
        { id: 'tail', name: 'УДАР ХВОСТОМ', desc: 'Сметающий удар по отряду на 19 урона.', dmg: 19, aoe: true },
        { id: 'acid', name: 'ПЛЕВОК КИСЛОТОЙ', desc: 'Сжигает броню и наносит 38 урона.', dmg: 38 },
        { id: 'meteor', name: 'МЕТЕОРИТНЫЙ ЗАЛП', desc: 'Дракон обрушивает дождь метеоритов на 52 урона!', dmg: 52, isUltimate: true }
      ]
    }
  },

  // 4. ФИНАЛ: ЦИФРОВОЕ ЯДРО
  {
    id: 3,
    name: 'SOCKET // ЦИФРОВОЕ ЯДРО',
    sub: 'СЕКТОР 04 // ФИНАЛ',
    biomeType: 'CORE',
    lat: 0,
    lon: 120,
    links: [],
    color: '#c084fc',
    story: 'Сердце планеты. Искусственный интеллект SOCKET готов стереть команду из матрицы.',
    boss: {
      name: 'CORE-9 // AI',
      hp: 750,
      color: '#c084fc',
      ping: 5,
      frames: [
        [
          { text: '   .:: SOCKET ::.  ', color: '#c084fc' },
          { text: '   /###########\\   ', color: '#a855f7' },
          { text: '  |  [0]   [0]  |  ', color: '#ffffff' },
          { text: '  |    =====    |  ', color: '#38bdf8' },
          { text: '  | ## CORE-9 ##|  ', color: '#00fff2' },
          { text: '   \\###########/   ', color: '#7c3aed' },
          { text: '    ***********    ', color: '#4c1d95' }
        ],
        [
          { text: '   <!> KERNEL <!>  ', color: '#ff0055' },
          { text: '   /XXXXXXXXXXX\\   ', color: '#ef4444' },
          { text: '  |  [X]   [X]  |  ', color: '#ffffff' },
          { text: '  |   ERROR!!   |  ', color: '#ff2a2a' },
          { text: '  | ## SYSTEM ##|  ', color: '#ff0055' },
          { text: '   \\XXXXXXXXXXX/   ', color: '#991b1b' },
          { text: '    !!!!!!!!!!!    ', color: '#7f1d1d' }
        ]
      ],
      skills: [
        { id: 'ping', name: 'PING FLOOD', desc: 'Залп пакетов данных по всей команде на 22 урона.', dmg: 22, aoe: true },
        { id: 'seg', name: 'SEGMENTATION FAULT', desc: 'Точечное выжигание на 40 урона.', dmg: 40 },
        { id: 'format', name: 'ФОРМАТИРОВАНИЕ ДНК', desc: 'Ультимативное стирание на 60 урона!', dmg: 60, isUltimate: true }
      ]
    }
  }
];
