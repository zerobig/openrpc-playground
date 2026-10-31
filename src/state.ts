import type { OpenRpcDocument, Method, Schema } from './types';

export type FlatItem =
  | { id: string; kind: 'method'; name: string; group: string; data: Method }
  | { id: string; kind: 'type'; name: string; group: string; data: Schema };

export interface AppState {
  doc: OpenRpcDocument | null;
  items: FlatItem[];
  activeId: string | null;
  /** Черновики параметров per-method */
  drafts: Map<string, string>;
  /** Выбранный URL сервера per-method */
  servers: Map<string, string>;
}

export const state: AppState = {
  doc: null,
  items: [],
  activeId: null,
  drafts: new Map(),
  servers: new Map(),
};