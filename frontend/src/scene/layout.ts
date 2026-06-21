import * as THREE from "three";
import type { GraphEdge, GraphNode } from "../lib/api";

export type LayoutMap = Map<string, THREE.Vector3>;

const PHI = Math.PI * (Math.sqrt(5) - 1);

export function computeLayout(nodes: GraphNode[], edges: GraphEdge[]): LayoutMap {
  const map: LayoutMap = new Map();
  if (nodes.length === 0) return map;

  // Step 1 — fibonacci sphere initial positions (even distribution)
  nodes.forEach((node, i) => {
    const n = nodes.length;
    const y = 1 - (i / Math.max(n - 1, 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = PHI * i;
    const rad = 3.8 + Math.sin(i * 7.3) * 0.4;
    map.set(node.id, new THREE.Vector3(rad * r * Math.cos(theta), rad * y, rad * r * Math.sin(theta)));
  });

  if (nodes.length <= 1) return map;

  // Step 2 — spring relaxation (50 iterations, visually converges well)
  const REPEL = 6.0;
  const ATTRACT = 0.12;
  const MIN_D = 0.6;
  const MAX_R = 6.0;
  const MIN_R = 1.2;

  const vel = new Map<string, THREE.Vector3>(nodes.map((n) => [n.id, new THREE.Vector3()]));
  const tmp = new THREE.Vector3();

  for (let iter = 0; iter < 50; iter++) {
    vel.forEach((v) => v.set(0, 0, 0));

    // Repulsion between all pairs
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const pi = map.get(nodes[i].id)!;
        const pj = map.get(nodes[j].id)!;
        tmp.subVectors(pi, pj);
        const d = Math.max(tmp.length(), MIN_D);
        const f = REPEL / (d * d);
        tmp.normalize().multiplyScalar(f);
        vel.get(nodes[i].id)!.add(tmp);
        vel.get(nodes[j].id)!.sub(tmp);
      }
    }

    // Attraction along edges
    edges.forEach((e) => {
      const pi = map.get(e.source);
      const pj = map.get(e.target);
      if (!pi || !pj) return;
      tmp.subVectors(pj, pi);
      const d = tmp.length();
      const f = ATTRACT * d * (e.strength ?? 1);
      tmp.normalize().multiplyScalar(f);
      vel.get(e.source)!.add(tmp);
      vel.get(e.target)!.sub(tmp);
    });

    // Integrate + clamp to sphere shell
    nodes.forEach((n) => {
      const p = map.get(n.id)!;
      const v = vel.get(n.id)!;
      p.addScaledVector(v, 0.04);
      v.multiplyScalar(0.82);
      const len = p.length();
      if (len > MAX_R) p.multiplyScalar(MAX_R / len);
      if (len < MIN_R) p.multiplyScalar(MIN_R / len);
    });
  }

  return map;
}

// Demo graph for when backend returns empty (pre-§19 Meridian data)
export function makeDemoGraph(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const types = ["decision", "person", "tech", "project", "open_question"] as const;
  const labels: Record<string, string[]> = {
    decision: ["Auth strategy", "Infra choice", "DB schema", "API versioning", "Deploy cadence", "Mobile-first pivot", "Monorepo ADR"],
    person: ["Alice", "Bob", "Carlos", "Diana", "Eve", "Frank", "Grace", "Hiro"],
    tech: ["React 19", "FastAPI", "PostgreSQL", "Redis", "Three.js", "Tailwind", "Zustand", "Vite"],
    project: ["Engram Core", "Data Pipeline", "Voice Layer", "Brain UI", "Connector SDK"],
    open_question: ["Scalability path?", "GDPR stance?", "Pricing model?", "ML strategy?", "OSS plan?"],
  };
  const nodes: GraphNode[] = [];
  types.forEach((type) => {
    const lbls = labels[type];
    lbls.forEach((label, j) => {
      nodes.push({
        id: `${type}_${j}`,
        label,
        type: type as GraphNode["type"],
        connections: [],
        weight: 0.3 + Math.sin(j * 5.1 + types.indexOf(type)) * 0.35 + 0.35,
      });
    });
  });

  // Edges: connect nodes within types, plus cross-type clusters
  const edges: GraphEdge[] = [];
  const addEdge = (a: string, b: string, s = 1.0) =>
    edges.push({ source: a, target: b, strength: s, relationship_type: "related" });

  // Intra-type edges
  [["decision_0","decision_1"],["decision_1","decision_2"],["decision_2","decision_3"],
   ["decision_0","decision_4"],["person_0","person_1"],["person_1","person_2"],
   ["person_2","person_3"],["person_3","person_4"],["tech_0","tech_1"],
   ["tech_1","tech_2"],["tech_2","tech_3"],["tech_4","tech_5"],["tech_5","tech_6"],
   ["project_0","project_1"],["project_1","project_2"],["project_0","project_3"],
   ["open_question_0","open_question_1"],["open_question_2","open_question_3"]].forEach(([a,b]) => addEdge(a, b, 0.9));

  // Cross-type (give the graph interesting cross-cluster structure)
  [["person_0","decision_0",1.4],["person_1","decision_1",1.2],["person_2","tech_0",1.1],
   ["person_3","project_0",1.3],["tech_0","project_0",0.8],["tech_1","project_1",0.7],
   ["tech_2","project_2",0.8],["decision_0","open_question_0",1.1],["decision_3","open_question_2",0.9],
   ["project_0","open_question_1",0.8],["person_4","tech_3",1.0],["person_5","project_3",0.9],
   ["decision_4","tech_4",0.7],["person_6","decision_5",1.2],["person_7","project_4",1.0]].forEach(([a,b,s]) =>
    addEdge(a as string, b as string, s as number));

  return { nodes, edges };
}
