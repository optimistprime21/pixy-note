import type { AppData } from './types';
import { useStore } from './store';

// Electron dışında (npm run dev:web) tarayıcı localStorage'ına düşer.
const KEY = 'pixy-note-data';

export async function loadData(): Promise<AppData | null> {
  try {
    if (window.pixy) return await window.pixy.load();
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AppData) : null;
  } catch (err) {
    console.error('Veri okunamadı', err);
    return null;
  }
}

function write(data: AppData, sync: boolean) {
  try {
    if (window.pixy) {
      if (sync) window.pixy.saveSync(data);
      else void window.pixy.save(data);
    } else {
      localStorage.setItem(KEY, JSON.stringify(data));
    }
  } catch (err) {
    console.error('Veri kaydedilemedi', err);
  }
}

/** Store'daki her veri değişikliğini kısa bir gecikmeyle diske yazar. */
export function startAutosave() {
  let timer: number | undefined;
  let pending: AppData | null = null;

  useStore.subscribe((s, prev) => {
    if (!s.loaded || s.data === prev.data) return;
    pending = s.data;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      if (pending) write(pending, false);
      pending = null;
    }, 400);
  });

  window.addEventListener('beforeunload', () => {
    if (pending) write(pending, true);
  });
}
