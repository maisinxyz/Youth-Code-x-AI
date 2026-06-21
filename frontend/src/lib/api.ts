import type { components } from "./api-types";

export type GraphNode = components["schemas"]["GraphNode"];
export type GraphEdge = components["schemas"]["GraphEdge"];
export type GraphResponse = components["schemas"]["GraphResponse"];
export type Source = components["schemas"]["Source"];
export type IngestRequest = components["schemas"]["IngestRequest"];
export type IngestResponse = components["schemas"]["IngestResponse"];
export type QueryRequest = components["schemas"]["QueryRequest"];
export type QueryResponse = components["schemas"]["QueryResponse"];

export type ConnectorName =
  | "slack"
  | "notion"
  | "drive"
  | "confluence"
  | "jira"
  | "teams"
  | "github"
  | "linear"
  | "figma"
  | "asana"
  | "discord"
  | "dropbox"
  | "trello"
  | "gmail";

const BASE_URL = import.meta.env.VITE_API_URL ?? `http://${window.location.hostname}:8000`;

export class ApiError extends Error {
  readonly status: number;
  readonly url: string;
  readonly body: unknown;

  constructor(status: number, url: string, body: unknown) {
    super(`API ${status} on ${url}`);
    this.status = status;
    this.url = url;
    this.body = body;
  }
}

async function request<T>(
  path: string,
  init?: RequestInit & { json?: unknown },
): Promise<T> {
  const method = init?.method ?? "GET";
  const url = `${BASE_URL}${path}`;
  const headers = new Headers(init?.headers);
  let body: BodyInit | undefined;

  if (init?.json !== undefined) {
    headers.set("content-type", "application/json");
    body = JSON.stringify(init.json);
  }

  // Dev logging — logs every request with method, path, status, and timing
  const t0 = import.meta.env.DEV ? performance.now() : 0;

  const res = await fetch(url, { ...init, headers, body });
  const text = await res.text();
  const parsed = text ? safeParse(text) : null;

  if (import.meta.env.DEV) {
    const ms = Math.round(performance.now() - t0);
    const tag = res.ok ? "%c✓" : "%c✗";
    const style = res.ok
      ? "color:#4ade80;font-weight:bold"
      : "color:#f87171;font-weight:bold";
    console.debug(
      `${tag} [API] ${method} ${path} → ${res.status} (${ms}ms)`,
      style,
      parsed ?? "(empty)",
    );
  }

  if (!res.ok) {
    throw new ApiError(res.status, url, parsed);
  }
  return parsed as T;
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export function getHealth(): Promise<{ status: string; service: string }> {
  return request("/health");
}

export function getGraph(): Promise<GraphResponse> {
  return request("/graph");
}

export function postQuery(req: QueryRequest): Promise<QueryResponse> {
  return request("/query", { method: "POST", json: req });
}

export function postIngest(req: IngestRequest): Promise<IngestResponse> {
  return request("/ingest", { method: "POST", json: req });
}

export function postConnectorIngest(
  name: ConnectorName,
): Promise<IngestResponse> {
  return request(`/ingest/connector/${name}`, { method: "POST" });
}
