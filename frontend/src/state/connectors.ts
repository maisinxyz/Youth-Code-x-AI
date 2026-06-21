import { create } from "zustand";

import {
  postConnectorIngest,
  type ConnectorName,
  type IngestResponse,
} from "../lib/api";
import { toast } from "./toast";

type ConnectorStatus = "idle" | "ingesting" | "done" | "error";

// The original 6 connectors that are "connected" by default
const DEFAULT_CONNECTED: ConnectorName[] = [
  "slack",
  "notion",
  "drive",
  "confluence",
  "jira",
  "teams",
];

// All 14 connectors
const ALL_CONNECTORS: ConnectorName[] = [
  "slack",
  "notion",
  "drive",
  "confluence",
  "jira",
  "teams",
  "github",
  "linear",
  "figma",
  "asana",
  "discord",
  "dropbox",
  "trello",
  "gmail",
];

type ConnectorsState = {
  statuses: Record<ConnectorName, ConnectorStatus>;
  results: Partial<Record<ConnectorName, IngestResponse>>;
  errors: Partial<Record<ConnectorName, string>>;
  /** Which connectors the user has toggled ON (selected/connected) */
  connected: Set<ConnectorName>;
  /** Toggle a connector's connected state on/off */
  toggleConnector: (name: ConnectorName) => void;
  /** Set the connected set directly */
  setConnected: (connectors: Set<ConnectorName>) => void;
  ingestConnector: (name: ConnectorName) => Promise<void>;
};

const initialStatuses = Object.fromEntries(
  ALL_CONNECTORS.map((c) => [c, "idle" as ConnectorStatus]),
) as Record<ConnectorName, ConnectorStatus>;

const initialConnected = new Set<ConnectorName>(DEFAULT_CONNECTED);

export const useConnectorsStore = create<ConnectorsState>((set) => ({
  statuses: initialStatuses,
  results: {},
  errors: {},
  connected: initialConnected,
  toggleConnector: (name) => {
    set((s) => {
      const next = new Set(s.connected);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return { connected: next };
    });
  },
  setConnected: (connectors) => set({ connected: connectors }),
  ingestConnector: async (name) => {
    set((s) => ({ statuses: { ...s.statuses, [name]: "ingesting" } }));
    try {
      const res = await postConnectorIngest(name);
      set((s) => ({
        statuses: { ...s.statuses, [name]: "done" },
        results: { ...s.results, [name]: res },
      }));
    } catch (err) {
      const message = (err as Error).message;
      set((s) => ({
        statuses: { ...s.statuses, [name]: "error" },
        errors: { ...s.errors, [name]: message },
      }));
      toast.error(`Failed to connect ${name}: ${message}`);
    }
  },
}));
