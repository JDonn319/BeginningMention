import React from 'react';

// Стили экрана ожидания
const styles = {
  container: {
    width: '100vw',
    height: '100vh',
    backgroundColor: '#000000',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#444444',
    fontFamily: 'monospace',
    fontSize: '12px',
    userSelect: 'none',
  } as React.CSSProperties
};

// Экран: BlackScreen
export const BlackScreen: React.FC = () => {
  return (
    <div style={styles.container}>
      <span>Initializing BeginningMention...</span>
    </div>
  );
};

// Главное приложение
export const App: React.FC = () => {
  return <BlackScreen />;
};
