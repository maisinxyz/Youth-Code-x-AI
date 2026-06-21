import { create } from "zustand";
import { getGraph, type GraphEdge, type GraphNode } from "../lib/api";
import { toast } from "./toast";

type GraphState = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  isLoading: boolean;
  error: string | null;
  activatedNodeIds: Set<string>;
  fetchGraph: () => Promise<void>;
  setActivatedNodes: (ids: string[]) => void;
  clearActivated: () => void;
};

export const useGraphStore = create<GraphState>((set) => ({
  nodes: [],
  edges: [],
  isLoading: false,
  error: null,
  activatedNodeIds: new Set(),

  fetchGraph: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await getGraph();
      set({ nodes: res.nodes, edges: res.edges, isLoading: false });
    } catch (err) {
      const message = (err as Error).message;
      set({ isLoading: false, error: message });
      toast.error(`Graph unavailable — is the backend running? (${message})`);
    }
  },

  setActivatedNodes: (ids) => set({ activatedNodeIds: new Set(ids) }),
  clearActivated: () => set({ activatedNodeIds: new Set() }),
}));
