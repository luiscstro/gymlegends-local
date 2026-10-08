import { MotionConfig } from 'motion/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from '@/App';
import { requestPersistentStorage } from '@/lib/data/local-db';
import { AuthProvider } from '@/providers/auth-provider';
import { RoutineProvider } from '@/providers/routine-provider';
import '@/index.css';

// Pede ao navegador para não apagar os dados locais sozinho (ignorado onde não houver suporte)
void requestPersistentStorage();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <AuthProvider>
          <RoutineProvider>
            <App />
          </RoutineProvider>
        </AuthProvider>
      </BrowserRouter>
    </MotionConfig>
  </StrictMode>
);
