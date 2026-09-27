// ========================================================
// БИБЛИОТЕКА МОДЕЛЕЙ И UI (EFFULGENCE BATTLE SYSTEM)
// ========================================================

export interface BattleHero {
  id: string;
  name: string;
  weapon: string;
  hp: number;
  maxHp: number;
  color: string;
  worldX: number;
  worldYOffset: number;
  charHead: string;
  charBody: string;
  charLegs: string;
  initiative: number;
}

export const INITIAL_PARTY: BattleHero[] = [
  {
    id: 'michael',
    name: 'Michael',
    weapon: 'Plasma Grenades 3/5',
    hp: 210,
    maxHp: 210,
    color: '#ff9900',
    worldX: 18,
    worldYOffset: 0,
    charHead: ' o ',
    charBody: '<#>',
    charLegs: '/ \\',
    initiative: 17
  },
  {
    id: 'jane',
    name: 'Jane',
    weapon: 'Pulse SMG 12/20',
    hp: 140,
    maxHp: 140,
    color: '#ff7700',
    worldX: 28,
    worldYOffset: 3,
    charHead: ' o ',
    charBody: '<#\\',
    charLegs: '/ \\',
    initiative: 94
  },
  {
    id: 'sebastian',
    name: 'Sebastian',
    weapon: 'Short Blaster (6/7)',
    hp: 120,
    maxHp: 130,
    color: '#c084fc',
    worldX: 38,
    worldYOffset: -2,
    charHead: ' e ',
    charBody: '|%\\',
    charLegs: '/> ',
    initiative: 106
  },
  {
    id: 'demid',
    name: 'Demid',
    weapon: 'Heavy Railgun 1/1',
    hp: 55,
    maxHp: 140,
    color: '#f97316',
    worldX: 48,
    worldYOffset: 2,
    charHead: ' p ',
    charBody: '/@\\',
    charLegs: 'LL ',
    initiative: 112
  }
];

// ASCII-модель босса "Харпия" с посимвольной цветовой картой
export const HARPY_CRATER_BOSS = [
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
];

// Символьный паттерн почвы из кратера (y, a, p, G, r, +)
export const CRATER_GROUND_SYMBOLS = [
  'y+a*p+G*r+y*a*p+G+r+y*a*p+G*r+y*a*p+G+r+y*a*p+G*r+y*a*p+G+r+y*a*p+G*r+y*a*p+G+r+',
  'G+r+gx+p+  y+a   r+  p+G+r+   +a   G+    p+    y  t   Cr   +p   G+r+a  +p+        ',
  '+a+p+       G+r+a  +p+        y+   p+    +a+p+  y+a*p+G+r+  +a+p y+a*p+G*r+y*a*p+G',
  'r+y+a*p+G*  p+G+r  y+a*p+G*   a+p  y+a*p  +G+  r+y*a*p+G+r  y+a*p +a+p+  G+r+gx+p+'
];
