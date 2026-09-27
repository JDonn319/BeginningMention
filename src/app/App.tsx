import React from 'react';
import { BlackScreen } from '../ui/BlackScreen';

export const App: React.FC = () => {
  // В будущем здесь будет инициализация Supabase, Three.js canvas и стейт-менеджер роутов.
  
  return (
    <React.Fragment>
      <BlackScreen />
    </React.Fragment>
  );
};
