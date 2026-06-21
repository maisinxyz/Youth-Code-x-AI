import { create } from "zustand";

import { postQuery, type QueryResponse } from "../lib/api";
import { toast } from "./toast";

type QueryState = {
  lastResponse: QueryResponse | null;
  sessionId: string | null;
  isPending: boolean;
  error: string | null;
  sendQuery: (query: string) => Promise<void>;
  reset: () => void;
};

export const useQueryStore = create<QueryState>((set, get) => ({
  lastResponse: null,
  sessionId: null,
  isPending: false,
  error: null,
  sendQuery: async (query) => {
    set({ isPending: true, error: null });
    try {
      const res = await postQuery({ query, session_id: get().sessionId });
      set({
        lastResponse: res,
        sessionId: res.session_id,
        isPending: false,
      });
    } catch (err) {
      const message = (err as Error).message;
      set({ isPending: false, error: message });
      toast.error(`Query failed: ${message}`);
    }
  },
  reset: () => set({ lastResponse: null, sessionId: null, error: null }),
}));
