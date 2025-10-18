import './index.css';

import { createRoot } from 'react-dom/client';

import { App } from '@/app';

const root = createRoot(document.querySelector('#app') as HTMLElement);

root.render(<App />);
