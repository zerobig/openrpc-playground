import type { OpenRpcDocument, Method, Schema } from './types';

export type FlatItem =
  | { id: string; kind: 'method'; name: string; group: string; data: Method }
  | { id: string; kind: 'type'; name: string; group: string; data: Schema };

export interface BatchItem {
  id: number;
  methodName: string;
  params: unknown;
  serverUrl: string;
  auth: string;
}

export interface AppState {
  doc: OpenRpcDocument | null;
  items: FlatItem[];
  activeId: string | null;
  drafts: Map<string, string>;
  servers: Map<string, string>;
  auths: Map<string, string>;
  batch: BatchItem[];
}

export const state: AppState = {
  doc: null,
  items: [],
  activeId: null,
  drafts: new Map(),
  servers: new Map(),
  auths: new Map(),
  batch: [],
};