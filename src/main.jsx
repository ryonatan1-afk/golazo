import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// window.storage polyfill:
//   shared=false  → localStorage (personal state: step, agent, stakes, etc.)
//   shared=true   → /api/kv backed by Neon Postgres (leagues, members, shared seed)
window.storage = {
  get: async (key, shared) => {
    if (!shared) {
      const v = localStorage.getItem(key);
      return v != null ? { value: v } : null;
    }
    const res = await fetch(`/api/kv?key=${encodeURIComponent(key)}`);
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return res.json();
  },
  set: async (key, value, shared) => {
    if (!shared) { localStorage.setItem(key, value); return; }
    await fetch('/api/kv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    });
  },
  delete: async (key) => { localStorage.removeItem(key); },
  list: async (prefix, shared) => {
    if (!shared) {
      return { keys: Object.keys(localStorage).filter(k => k.startsWith(prefix)) };
    }
    const res = await fetch(`/api/kv?prefix=${encodeURIComponent(prefix)}`);
    if (!res.ok) return { keys: [] };
    return res.json();
  },
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
