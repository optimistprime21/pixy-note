import { create } from 'zustand';

// Electron window.prompt() desteklemiyor; temaya uygun kendi diyalog kutumuz.
type Dialog =
  | { kind: 'text'; title: string; value: string; resolve: (v: string | null) => void }
  | { kind: 'confirm'; title: string; message?: string; resolve: (v: boolean) => void };

export const useUI = create<{ dialog: Dialog | null }>(() => ({ dialog: null }));

export function askText(title: string, value = ''): Promise<string | null> {
  return new Promise((resolve) => useUI.setState({ dialog: { kind: 'text', title, value, resolve } }));
}

export function askConfirm(title: string, message?: string): Promise<boolean> {
  return new Promise((resolve) => useUI.setState({ dialog: { kind: 'confirm', title, message, resolve } }));
}
