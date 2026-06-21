import { create } from "zustand";

import { getGraph, type GraphEdge, type GraphNode } from "../lib/api";

type GraphState = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  isLoading: boolean;
  error: string | null;
  fetchGraph: () => Promise<void>;
};

export const useGraphStore = create<GraphState>((set) => ({
  nodes: [],
  edges: [],
  isLoading: false,
  error: null,
  fetchGraph: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await getGraph();
      set({ nodes: res.nodes, edges: res.edges, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: (err as Error).message });
    }
  },
}));
