import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { registerServiceWorker } from './lib/registerServiceWorker';
import { requestPersistentStorage } from './lib/storage';
import { startAutoSync } from './lib/sync/controller';
import { applyTheme, readTheme } from './lib/theme';
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/features.css';

// An explicit Light/Dark choice; "system" needs no script (CSS media query).
applyTheme(readTheme());

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root not found');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Ask the browser not to evict our data when storage runs low (best effort; the answer is ignored).
void requestPersistentStorage();

registerServiceWorker();

// Optional Google Drive sync: syncs after changes, only while signed in this session (no-op if sync is off).
startAutoSync();
