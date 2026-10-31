import type { Method, OpenRpcDocument, Schema } from './types';
import type { BatchItem } from './state';

export async function fetchDocument(url: string): Promise<OpenRpcDocument> {
  const resp = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!resp.ok) throw new Error(`HTTP ${resp.status} ${resp.statusText}`);
  const doc: unknown = await resp.json();
  if (!doc || typeof doc !== 'object') {
    throw new Error('Некорректный JSON: ожидается объект');
  }
  const d = doc as Record<string, unknown>;
  if (!d.openrpc && !d.methods && !d.components) {
    throw new Error('Документ не похож на OpenRPC (нет openrpc/methods/components)');
  }
  return doc as OpenRpcDocument;
}

export interface RpcCallResult {
  ok: boolean;
  status: number;
  statusText: string;
  ms: number;
  bodyText: string;
  bodyPretty: string;
  rpcError: { code: number; message: string } | null;
  networkError: string | null;
}

async function postJson(
  url: string,
  body: unknown,
  auth?: string,
): Promise<RpcCallResult> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (auth && auth.trim()) headers['Authorization'] = auth.trim();

  const t0 = performance.now();
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const ms = Math.round(performance.now() - t0);
    const text = await resp.text();

    let pretty = text;
    let rpcError: RpcCallResult['rpcError'] = null;
    try {
      const parsed: unknown = JSON.parse(text);
      pretty = JSON.stringify(parsed, null, 2);
      if (Array.isArray(parsed)) {
        // Batch: покажем первую ошибку как индикатор
        const firstErr = parsed.find(
          (it) =>
            it &&
            typeof it === 'object' &&
            'error' in it &&
            (it as { error?: unknown }).error,
        );
        if (firstErr) {
          rpcError = (firstErr as { error: { code: number; message: string } }).error;
        }
      } else if (
        parsed &&
        typeof parsed === 'object' &&
        'error' in parsed &&
        (parsed as { error?: unknown }).error
      ) {
        rpcError = (parsed as { error: { code: number; message: string } }).error;
      }
    } catch {
      /* not JSON */
    }

    return {
      ok: resp.ok,
      status: resp.status,
      statusText: resp.statusText,
      ms,
      bodyText: text,
      bodyPretty: pretty,
      rpcError,
      networkError: null,
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      statusText: 'Network error',
      ms: Math.round(performance.now() - t0),
      bodyText: '',
      bodyPretty: '',
      rpcError: null,
      networkError: (err as Error).message,
    };
  }
}

export function callRpc(
  serverUrl: string,
  method: Method,
  params: unknown,
  auth?: string,
): Promise<RpcCallResult> {
  return postJson(
    serverUrl,
    { jsonrpc: '2.0', id: Date.now(), method: method.name, params },
    auth,
  );
}

export function callBatch(
  serverUrl: string,
  items: BatchItem[],
  auth?: string,
): Promise<RpcCallResult> {
  const payload = items.map((it) => ({
    jsonrpc: '2.0',
    id: it.id,
    method: it.methodName,
    params: it.params,
  }));
  return postJson(serverUrl, payload, auth);
}

export function exampleFromSchema(schema: Schema | undefined): unknown {
  if (!schema || typeof schema !== 'object') return null;
  if (schema.default !== undefined) return schema.default;
  if (Array.isArray(schema.examples) && schema.examples.length) return schema.examples[0];
  if (Array.isArray(schema.enum) && schema.enum.length) return schema.enum[0];
  if (schema.$ref) return null;
  switch (schema.type) {
    case 'string':
      return '';
    case 'number':
    case 'integer':
      return 0;
    case 'boolean':
      return false;
    case 'array':
      return [];
    case 'object': {
      const obj: Record<string, unknown> = {};
      if (schema.properties) {
        for (const [k, v] of Object.entries(schema.properties)) {
          obj[k] = exampleFromSchema(v);
        }
      }
      return obj;
    }
    default:
      return null;
  }
}

export function buildExampleParams(method: Method): unknown {
  const params = method.params ?? [];
  const values = params.map((p) => exampleFromSchema(p.schema));
  if (method.paramStructure === 'by-name') {
    const obj: Record<string, unknown> = {};
    params.forEach((p, i) => {
      if (p.name) obj[p.name] = values[i];
    });
    return obj;
  }
  return values;
}

export function getDefaultServerUrl(doc: OpenRpcDocument | null): string | null {
  const servers = doc?.servers;
  if (Array.isArray(servers) && servers.length && servers[0].url) {
    return servers[0].url.replace(/\/+$/, '');
  }
  return null;
}