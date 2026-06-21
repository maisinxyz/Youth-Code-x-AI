import { create } from "zustand";

import {
  postConnectorIngest,
  type ConnectorName,
  type IngestResponse,
} from "../lib/api";

type ConnectorStatus = "idle" | "ingesting" | "done" | "error";

type ConnectorsState = {
  statuses: Record<ConnectorName, ConnectorStatus>;
  results: Partial<Record<ConnectorName, IngestResponse>>;
  errors: Partial<Record<ConnectorName, string>>;
  ingestConnector: (name: ConnectorName) => Promise<void>;
};

const ALL_CONNECTORS: ConnectorName[] = [
  "slack",
  "notion",
  "drive",
  "confluence",
  "jira",
  "teams",
];

const initialStatuses = Object.fromEntries(
  ALL_CONNECTORS.map((c) => [c, "idle" as ConnectorStatus]),
) as Record<ConnectorName, ConnectorStatus>;

export const useConnectorsStore = create<ConnectorsState>((set) => ({
  statuses: initialStatuses,
  results: {},
  errors: {},
  ingestConnector: async (name) => {
    set((s) => ({ statuses: { ...s.statuses, [name]: "ingesting" } }));
    try {
      const res = await postConnectorIngest(name);
      set((s) => ({
        statuses: { ...s.statuses, [name]: "done" },
        results: { ...s.results, [name]: res },
      }));
    } catch (err) {
      set((s) => ({
        statuses: { ...s.statuses, [name]: "error" },
        errors: { ...s.errors, [name]: (err as Error).message },
      }));
    }
  },
}));
