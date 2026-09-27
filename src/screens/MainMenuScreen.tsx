import React, { useState, useEffect } from 'react';

// Ретро-иконки для кнопок (SVG, чтобы не зависеть от npm-пакетов)
const Icons = {
  NewGame: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2zM12 9l3 3h-2v4h-2v-4H9l3-3z"/>
    </svg>
  ),
  LoadGame: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
    </svg>
  ),
  Settings: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54A.48.48 0 0 0 13.91 2h-3.82c-.24 0-.44.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.47c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.82c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
    </svg>
  ),
  Lock: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
    </svg>
  )
};

// Кадры пламени костра
const FIRE_FRAMES = [
  ["    ( )    ", "   ( * )   ", "  ( ^ * )  ", "  /=====\\  "],
  ["   ( * )   ", "  ( ^ )    ", " ( * ^ )   ", "  /=====\\  "],
  ["   ( ^ )   ", "  ( * ^ )  ", "   ( * )   ", "  /=====\\  "],
];

export const MainMenuScreen: React.FC = () => {
  const [fireFrame, setFireFrame] = useState(0);
  const [hasSaveGame, setHasSaveGame] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // Проверка сохраненной игры (Загрузки активны только если есть сохранение)
  useEffect(() => {
    const save = localStorage.getItem('bm_savegame');
    setHasSaveGame(!!save);
  }, []);

  // Анимация пламени
  useEffect(() => {
    const interval = setInterval(() => {
      setFireFrame((prev) => (prev + 1) % FIRE_FRAMES.length);
    }, 180);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="main-menu-container">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Fira+Code:wght@400;700&display=swap');

        .main-menu-container {
          position: relative;
          width: 100vw;
          height: 100vh;
          background: radial-gradient(circle at 50% 30%, #081126 0%, #030611 70%, #010206 100%);
          overflow: hidden;
          font-family: 'Fira Code', monospace;
          color: #fff;
          user-select: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
        }

        /* Звезды и луна */
        .sky-stars {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image: 
            radial-gradient(1px 1px at 20px 30px, #ffffff, rgba(0,0,0,0)),
            radial-gradient(1.5px 1.5px at 150px 70px, #a5c9eb, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 280px 40px, #ffffff, rgba(0,0,0,0)),
            radial-gradient(2px 2px at 420px 110px, #7dd3fc, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 600px 50px, #ffffff, rgba(0,0,0,0)),
            radial-gradient(1.5px 1.5px at 780px 95px, #c084fc, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 920px 35px, #ffffff, rgba(0,0,0,0));
          background-repeat: repeat;
          background-size: 1000px 300px;
          animation: starsTwinkle 4s ease-in-out infinite alternate;
        }

        @keyframes starsTwinkle {
          0% { opacity: 0.6; }
          100% { opacity: 1; }
        }

        .moon {
          position: absolute;
          top: 8%;
          right: 14%;
          font-size: 11px;
          color: #e0f2fe;
          text-shadow: 0 0 25px #38bdf8, 0 0 50px #0284c7;
          line-height: 1.1;
          pointer-events: none;
        }

        /* Задний лес */
        .forest-layer {
          position: absolute;
          bottom: 22%;
          width: 100%;
          color: #121c38;
          font-size: 13px;
          line-height: 1.1;
          white-space: pre;
          overflow: hidden;
          text-align: center;
          pointer-events: none;
          text-shadow: 0 0 8px rgba(15, 23, 42, 0.8);
        }

        /* Синеватый рельеф земли */
        .ground-layer {
          position: absolute;
          bottom: 0;
          width: 100%;
          height: 25%;
          color: #3b82f6;
          font-size: 14px;
          line-height: 1.15;
          white-space: pre;
          background: linear-gradient(180deg, rgba(8, 20, 50, 0.9) 0%, rgba(3, 7, 18, 0.98) 70%);
          border-top: 1px solid rgba(59, 130, 246, 0.3);
          box-shadow: 0 -10px 30px rgba(30, 58, 138, 0.4);
          text-shadow: 0 0 6px #1d4ed8;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: center;
        }

        /* ДИНАМИЧЕСКИЙ СВЕТ КОСТРА */
        .campfire-light {
          position: absolute;
          bottom: 12%;
          left: 50%;
          transform: translateX(-50%);
          width: 320px;
          height: 180px;
          background: radial-gradient(ellipse at center, rgba(255, 120, 30, 0.35) 0%, rgba(255, 60, 0, 0.12) 45%, transparent 75%);
          pointer-events: none;
          z-index: 5;
          animation: lightFlicker 0.25s infinite alternate ease-in-out;
        }

        @keyframes lightFlicker {
          0% { transform: translateX(-50%) scale(0.96); opacity: 0.8; }
          100% { transform: translateX(-50%) scale(1.05); opacity: 1; }
        }

        /* Сцена у костра */
        .campsite {
          position: absolute;
          bottom: 15%;
          display: flex;
          align-items: flex-end;
          gap: 30px;
          z-index: 10;
        }

        .character {
          font-size: 15px;
          line-height: 1.15;
          text-align: center;
          transition: filter 0.2s;
        }

        .char-left {
          color: #fed7aa;
          text-shadow: 0 0 8px rgba(249, 115, 22, 0.8);
          animation: charBreath 3s infinite ease-in-out;
        }

        .char-right {
          color: #bfdbfe;
          text-shadow: 0 0 8px rgba(96, 165, 250, 0.8);
          animation: charBreath 3.5s infinite ease-in-out 0.5s;
        }

        .char-rear {
          color: #cbd5e1;
          margin-bottom: 10px;
          text-shadow: 0 0 6px rgba(255, 100, 30, 0.5);
          animation: charBreath 4s infinite ease-in-out 1s;
        }

        @keyframes charBreath {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }

        /* Сам костер */
        .campfire {
          color: #f97316;
          font-size: 15px;
          font-weight: bold;
          line-height: 1.15;
          text-align: center;
          text-shadow: 0 0 10px #ea580c, 0 0 20px #ef4444;
          filter: drop-shadow(0 0 15px rgba(234, 88, 12, 0.9));
        }

        .fire-core {
          color: #fef08a;
          text-shadow: 0 0 8px #fef08a;
        }

        /* Искры */
        .spark {
          position: absolute;
          width: 3px;
          height: 3px;
          background: #fde047;
          box-shadow: 0 0 6px #f97316;
          border-radius: 50%;
          animation: riseSpark 1.8s infinite linear;
        }
        .spark-1 { left: 45%; animation-delay: 0.1s; }
        .spark-2 { left: 52%; animation-delay: 0.6s; }
        .spark-3 { left: 48%; animation-delay: 1.1s; }

        @keyframes riseSpark {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-70px) scale(0.2); opacity: 0; }
        }

        /* ЛОГОТИП И МЕНЮ */
        .ui-overlay {
          position: relative;
          z-index: 20;
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: 25px;
          width: 100%;
        }

        .logo-img {
          max-height: 130px;
          max-width: 80%;
          object-fit: contain;
          filter: drop-shadow(0 0 20px rgba(56, 189, 248, 0.45));
          animation: logoFloat 4s ease-in-out infinite;
        }

        .logo-fallback {
          font-family: 'Press Start 2P', monospace;
          font-size: 26px;
          color: #38bdf8;
          text-shadow: 0 0 10px #0284c7, 0 0 25px #0369a1;
          letter-spacing: 2px;
          text-align: center;
          padding: 15px;
          animation: logoFloat 4s ease-in-out infinite;
        }

        @keyframes logoFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }

        /* Кнопки меню: низкие и широкие */
        .menu-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 15px;
        }

        .btn-menu {
          font-family: 'Press Start 2P', monospace;
          font-size: 11px;
          width: 320px;
          height: 44px;
          padding: 0 20px;
          background: rgba(15, 23, 42, 0.75);
          color: #e2e8f0;
          border: 1.5px solid #38bdf8;
          box-shadow: inset 0 0 8px rgba(56, 189, 248, 0.2), 0 0 10px rgba(56, 189, 248, 0.25);
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.15s ease;
          text-transform: uppercase;
        }

        .btn-menu:hover:not(:disabled) {
          background: #38bdf8;
          color: #030712;
          box-shadow: 0 0 20px #38bdf8;
          transform: scale(1.02);
        }

        .btn-menu:active:not(:disabled) {
          transform: scale(0.98);
        }

        .btn-menu:disabled {
          border-color: #334155;
          color: #64748b;
          background: rgba(15, 23, 42, 0.4);
          box-shadow: none;
          cursor: not-allowed;
        }

        /* Предупреждение для вертикального экрана на телефонах */
        .rotate-notice {
          display: none;
        }
        @media (orientation: portrait) {
          .rotate-notice {
            position: fixed;
            inset: 0;
            background: #020617;
            z-index: 999;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            font-family: 'Press Start 2P', monospace;
            font-size: 12px;
            color: #38bdf8;
            text-align: center;
            padding: 20px;
            line-height: 1.8;
          }
        }
      `}</style>

      {/* Оверлей предупреждения повернуть экран */}
      <div className="rotate-notice">
        <div>⟲ ПОВЕРНИТЕ УСТРОЙСТВО</div>
        <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '12px' }}>
          BeginningMention создана для горизонтального режима
        </div>
      </div>

      {/* Небо и звезды */}
      <div className="sky-stars" />

      {/* Луна (ASCII) */}
      <div className="moon">
        {`   .---.
  /     \\
  | (o) |
   \\   /
    '-' `}
      </div>

      {/* Верхняя часть: Логотип и Кнопки */}
      <div className="ui-overlay">
        {!logoError ? (
          <img
            src="/basiclogo.png"
            alt="BeginningMention"
            className="logo-img"
            onError={() => setLogoError(true)}
          />
        ) : (
          <div className="logo-fallback">BEGINNING MENTION</div>
        )}

        <div className="menu-buttons">
          <button
            className="btn-menu"
            onClick={() => alert('Начало новой экспедиции...')}
          >
            <span>Новая игра</span>
            <Icons.NewGame />
          </button>

          <button
            className="btn-menu"
            disabled={!hasSaveGame}
            title={!hasSaveGame ? 'Нет сохранений' : 'Загрузить игру'}
            onClick={() => alert('Загрузка экспедиции...')}
          >
            <span>Загрузки</span>
            {!hasSaveGame ? <Icons.Lock /> : <Icons.LoadGame />}
          </button>

          <button
            className="btn-menu"
            onClick={() => alert('Настройки игры...')}
          >
            <span>Настройки</span>
            <Icons.Settings />
          </button>
        </div>
      </div>

      {/* Задний силуэт леса */}
      <div className="forest-layer">
        {`      /\\                 /\\         /\\                  /\\                /\\
     /  \\    /\\         /  \\       /  \\    /\\          /  \\    /\\        /  \\
    / /\\ \\  /  \\       / /\\ \\     / /\\ \\  /  \\        / /\\ \\  /  \\      / /\\ \\
   / /  \\ \\/ /\\ \\     / /  \\ \\   / /  \\ \\/ /\\ \\      / /  \\ \\/ /\\ \\    / /  \\ \\
  /_/ /\\ \\_\\/  \\ \\   /_/ /\\ \\_\\ /_/ /\\ \\_\\/  \\ \\    /_/ /\\ \\_\\/  \\ \\  /_/ /\\ \\_\\
    ||  ||  |||||       ||  ||     ||  ||  |||||        ||  ||  |||||     ||  ||`}
      </div>

      {/* Динамический свет костра */}
      <div className="campfire-light" />

      {/* Сцена у костра с 3 персонажами */}
      <div className="campsite">
        {/* Персонаж 1 (слева, греет руки у огня) */}
        <div className="character char-left">
          <div>  o  </div>
          <div> /|\_</div>
          <div>_/ \_</div>
        </div>

        {/* Персонаж 2 (сзади, сидит и смотрит вдаль) */}
        <div className="character char-rear">
          <div> o </div>
          <div>(|)</div>
          <div>/ \</div>
        </div>

        {/* Сам костер с анимированными искрами */}
        <div style={{ position: 'relative' }}>
          <div className="spark spark-1" />
          <div className="spark spark-2" />
          <div className="spark spark-3" />
          <div className="campfire">
            {FIRE_FRAMES[fireFrame].map((line, idx) => (
              <div key={idx}>
                {line.split('*').map((seg, i, arr) => (
                  <React.Fragment key={i}>
                    {seg}
                    {i < arr.length - 1 && <span className="fire-core">*</span>}
                  </React.Fragment>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Персонаж 3 (справа, с оружием/посохом) */}
        <div className="character char-right">
          <div>  o  |</div>
          <div>_/|\-|</div>
          <div>_/ \_|</div>
        </div>
      </div>

      {/* Синеватый рельеф земли из символов */}
      <div className="ground-layer">
        <div>{`~^~^..~~~=~=~..~~~^~...~~~~=~~~..~~~^~..~~~=~=~..~~~^~...~~~~=~~~..~~~^~..~~~=~=~..~~~^~...~~~~=~~~`}</div>
        <div>{`#%##%#%%##%%###%%%##%#%%%###%%##%%####%%#%##%#%%##%%###%%%##%#%%%###%%##%%####%%#%##%#%%##%%###%%%`}</div>
        <div>{`####################################################################################################`}</div>
        <div>{`====================================================================================================`}</div>
      </div>
    </div>
  );
};
