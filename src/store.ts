import { create } from 'zustand';
import type { AppData, Board, Note, Season, Settings, View } from './types';
import { createSampleData } from './sample';

export const uid = () => crypto.randomUUID();

export const defaultSettings: Settings = { season: 'auto', sound: true, effects: true };

const emptyData: AppData = {
  version: 1,
  notes: [],
  boards: [],
  settings: defaultSettings,
  lastView: null,
};

interface State {
  loaded: boolean;
  data: AppData;
  view: View;
  init: (saved: AppData | null) => void;
  open: (view: View) => void;
  createNote: (title?: string) => string;
  updateNote: (id: string, patch: Partial<Omit<Note, 'id'>>) => void;
  deleteNote: (id: string) => void;
  createBoard: (title?: string) => string;
  updateBoard: (id: string, patch: Partial<Omit<Board, 'id'>>) => void;
  deleteBoard: (id: string) => void;
  setSettings: (patch: Partial<Settings>) => void;
}

function migrate(d: Partial<AppData>): AppData {
  return {
    version: 1,
    notes: d.notes ?? [],
    boards: d.boards ?? [],
    settings: { ...defaultSettings, ...d.settings },
    lastView: d.lastView ?? null,
  };
}

function viewExists(data: AppData, view: View) {
  if (!view) return false;
  const list = view.kind === 'note' ? data.notes : data.boards;
  return list.some((x) => x.id === view.id);
}

export const useStore = create<State>((set) => {
  const patchData = (fn: (d: AppData) => Partial<AppData>) =>
    set((s) => ({ data: { ...s.data, ...fn(s.data) } }));

  return {
    loaded: false,
    data: emptyData,
    view: null,

    init: (saved) => {
      const data = saved ? migrate(saved) : createSampleData();
      set({ data, loaded: true, view: viewExists(data, data.lastView) ? data.lastView : null });
    },

    open: (view) => {
      set({ view });
      patchData(() => ({ lastView: view }));
    },

    createNote: (title = 'Yeni not') => {
      const t = Date.now();
      const note: Note = { id: uid(), title, content: null, text: '', createdAt: t, updatedAt: t };
      patchData((d) => ({ notes: [note, ...d.notes] }));
      return note.id;
    },

    updateNote: (id, patch) =>
      patchData((d) => ({
        notes: d.notes.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n)),
      })),

    deleteNote: (id) => {
      set((s) => (s.view?.id === id ? { view: null } : {}));
      patchData((d) => ({
        notes: d.notes.filter((n) => n.id !== id),
        // Bu nota bağlı düğümler boşa düşer ama silinmez
        boards: d.boards.map((b) =>
          b.nodes.some((n) => n.data.noteId === id)
            ? {
                ...b,
                nodes: b.nodes.map((n) =>
                  n.data.noteId === id ? { ...n, data: { ...n.data, noteId: null } } : n,
                ),
              }
            : b,
        ),
      }));
    },

    createBoard: (title = 'Yeni tarla') => {
      const t = Date.now();
      const board: Board = { id: uid(), title, nodes: [], edges: [], createdAt: t, updatedAt: t };
      patchData((d) => ({ boards: [board, ...d.boards] }));
      return board.id;
    },

    updateBoard: (id, patch) =>
      patchData((d) => ({
        boards: d.boards.map((b) => (b.id === id ? { ...b, ...patch, updatedAt: Date.now() } : b)),
      })),

    deleteBoard: (id) => {
      set((s) => (s.view?.id === id ? { view: null } : {}));
      patchData((d) => ({ boards: d.boards.filter((b) => b.id !== id) }));
    },

    setSettings: (patch) => patchData((d) => ({ settings: { ...d.settings, ...patch } })),
  };
});

export function seasonFromDate(date = new Date()): Season {
  const m = date.getMonth();
  if (m >= 2 && m <= 4) return 'spring';
  if (m >= 5 && m <= 7) return 'summer';
  if (m >= 8 && m <= 10) return 'fall';
  return 'winter';
}

export function useSeason(): Season {
  const s = useStore((st) => st.data.settings.season);
  return s === 'auto' ? seasonFromDate() : s;
}
