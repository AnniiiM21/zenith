import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

console.log('🚀 StudyFocus App Starting...');

const container = document.getElementById('root');
if (!container) {
  console.error('❌ Root element not found!');
} else {
  console.log('✅ Root element found, creating React app...');
  const root = createRoot(container);
  root.render(<App />);
  console.log('✅ React app rendered!');
}
