import type { JSONContent } from '@tiptap/react';
import type { Edge, Node, Viewport } from '@xyflow/react';

export type Season = 'spring' | 'summer' | 'fall' | 'winter';
export type TaskStatus = 'seed' | 'sprout' | 'harvest';
export type FlowNodeType = 'start' | 'task' | 'decision' | 'note' | 'end';

export type FlowData = {
  label?: string;
  status?: TaskStatus;
  noteId?: string | null;
};

export type PixyNode = Node<FlowData, FlowNodeType>;
export type PixyEdge = Edge;

export interface Note {
  id: string;
  title: string;
  content: JSONContent | null;
  /** Arama için düz metin kopyası */
  text: string;
  createdAt: number;
  updatedAt: number;
}

export interface Board {
  id: string;
  title: string;
  nodes: PixyNode[];
  edges: PixyEdge[];
  viewport?: Viewport;
  createdAt: number;
  updatedAt: number;
}

export interface Settings {
  season: Season | 'auto';
  sound: boolean;
  effects: boolean;
}

export type View = { kind: 'note' | 'board'; id: string } | null;

export interface AppData {
  version: 1;
  notes: Note[];
  boards: Board[];
  settings: Settings;
  lastView: View;
}

declare global {
  interface Window {
    pixy?: {
      load: () => Promise<AppData | null>;
      save: (data: AppData) => Promise<boolean>;
      saveSync: (data: AppData) => boolean;
    };
  }
}
