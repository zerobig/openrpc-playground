export interface OpenRpcDocument {
  openrpc: string;
  info?: { title?: string; version?: string; description?: string };
  servers?: Server[];
  methods?: Method[];
  components?: { schemas?: Record<string, Schema> };
}

export interface Server {
  name?: string;
  url: string;
  description?: string;
}

export interface Method {
  name: string;
  summary?: string;
  description?: string;
  params?: Param[];
  result?: Result;
  errors?: ErrorObject[];
  examples?: MethodExample[];
  deprecated?: boolean;
  paramStructure?: 'by-name' | 'by-position' | 'either';
}

export interface Param {
  name?: string;
  summary?: string;
  description?: string;
  required?: boolean;
  schema?: Schema;
}

export interface Result {
  name?: string;
  summary?: string;
  description?: string;
  schema?: Schema;
}

export interface Schema {
  type?: string;
  $ref?: string;
  summary?: string;
  description?: string;
  properties?: Record<string, Schema>;
  required?: string[];
  items?: Schema;
  enum?: unknown[];
  default?: unknown;
  examples?: unknown[];
}

export interface ErrorObject {
  code: number;
  message: string;
}

export interface MethodExample {
  name?: string;
  summary?: string;
  params?: unknown;
  result?: unknown;
}