import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/pixelify-sans/400.css';
import '@fontsource/pixelify-sans/600.css';
import '@xyflow/react/dist/style.css';
import './styles/theme.css';
import './styles/app.css';
import App from './App';
import { useStore } from './store';
import { loadData, startAutosave } from './persist';

loadData().then((saved) => {
  useStore.getState().init(saved);
  startAutosave();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
