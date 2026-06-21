import * as THREE from "three";
import type { GraphEdge, GraphNode } from "../lib/api";

export type LayoutMap = Map<string, THREE.Vector3>;

const PHI = Math.PI * (Math.sqrt(5) - 1);
const DEG = Math.PI / 180;

// 6 connector sectors arranged evenly around the sphere
const SECTOR_CENTERS: Record<string, THREE.Vector3> = {
  slack:       sphericalToVec(0   * DEG,  20 * DEG, 4.2),
  notion:      sphericalToVec(60  * DEG, -15 * DEG, 4.2),
  drive:       sphericalToVec(120 * DEG,  25 * DEG, 4.2),
  confluence:  sphericalToVec(180 * DEG, -10 * DEG, 4.2),
  jira:        sphericalToVec(240 * DEG,  15 * DEG, 4.2),
  teams:       sphericalToVec(300 * DEG, -20 * DEG, 4.2),
};

function sphericalToVec(azimuth: number, elevation: number, radius: number): THREE.Vector3 {
  const cosEl = Math.cos(elevation);
  return new THREE.Vector3(
    radius * cosEl * Math.cos(azimuth),
    radius * Math.sin(elevation),
    radius * cosEl * Math.sin(azimuth),
  );
}

export function computeLayout(nodes: GraphNode[], edges: GraphEdge[]): LayoutMap {
  const map: LayoutMap = new Map();
  if (nodes.length === 0) return map;

  // Group nodes by source_type
  const groups: Record<string, GraphNode[]> = {};
  const unknown: GraphNode[] = [];
  for (const node of nodes) {
    const src = node.source_type ?? "";
    if (src && SECTOR_CENTERS[src]) {
      (groups[src] ??= []).push(node);
    } else {
      unknown.push(node);
    }
  }

  // If no nodes have source_type, fall back to fibonacci sphere
  const hasSourceData = Object.keys(groups).length > 0;
  if (!hasSourceData) {
    return fibonacciLayout(nodes, edges);
  }

  // Place each group in its sector using a mini fibonacci sphere around the sector center
  for (const [src, groupNodes] of Object.entries(groups)) {
    const center = SECTOR_CENTERS[src];
    const spread = 1.6; // radius of the mini-sphere for this cluster
    groupNodes.forEach((node, i) => {
      const n = groupNodes.length;
      const y = 1 - (i / Math.max(n - 1, 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = PHI * i;
      const offset = new THREE.Vector3(
        spread * r * Math.cos(theta),
        spread * y * 0.8,
        spread * r * Math.sin(theta),
      );
      map.set(node.id, center.clone().add(offset));
    });
  }

  // Unknown-source nodes fill center sphere
  unknown.forEach((node, i) => {
    const n = Math.max(unknown.length, 1);
    const y = 1 - (i / Math.max(n - 1, 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = PHI * i;
    const rad = 1.5;
    map.set(node.id, new THREE.Vector3(rad * r * Math.cos(theta), rad * y, rad * r * Math.sin(theta)));
  });

  // Spring relaxation — intra-cluster repulsion + edge attraction
  const REPEL = 3.0;
  const ATTRACT = 0.08;
  const MIN_D = 0.5;
  const vel = new Map<string, THREE.Vector3>(nodes.map((n) => [n.id, new THREE.Vector3()]));
  const tmp = new THREE.Vector3();

  for (let iter = 0; iter < 40; iter++) {
    vel.forEach((v) => v.set(0, 0, 0));

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const pi = map.get(nodes[i].id)!;
        const pj = map.get(nodes[j].id)!;
        tmp.subVectors(pi, pj);
        const d = Math.max(tmp.length(), MIN_D);
        // Stronger repulsion within same cluster, weaker across clusters
        const sameSrc = (nodes[i].source_type ?? "") === (nodes[j].source_type ?? "");
        const f = (sameSrc ? REPEL : REPEL * 0.4) / (d * d);
        tmp.normalize().multiplyScalar(f);
        vel.get(nodes[i].id)!.add(tmp);
        vel.get(nodes[j].id)!.sub(tmp);
      }
    }

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

    // Cluster anchoring — pull each node back toward its sector center
    nodes.forEach((node) => {
      const src = node.source_type ?? "";
      const center = SECTOR_CENTERS[src];
      if (!center) return;
      const p = map.get(node.id)!;
      tmp.subVectors(center, p);
      vel.get(node.id)!.addScaledVector(tmp, 0.06);
    });

    nodes.forEach((n) => {
      const p = map.get(n.id)!;
      const v = vel.get(n.id)!;
      p.addScaledVector(v, 0.04);
      v.multiplyScalar(0.82);
      // Clamp to reasonable range
      const len = p.length();
      if (len > 7) p.multiplyScalar(7 / len);
      if (len < 0.5) p.multiplyScalar(0.5 / len);
    });
  }

  return map;
}

function fibonacciLayout(nodes: GraphNode[], edges: GraphEdge[]): LayoutMap {
  const map: LayoutMap = new Map();
  nodes.forEach((node, i) => {
    const n = nodes.length;
    const y = 1 - (i / Math.max(n - 1, 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = PHI * i;
    const rad = 3.8 + Math.sin(i * 7.3) * 0.4;
    map.set(node.id, new THREE.Vector3(rad * r * Math.cos(theta), rad * y, rad * r * Math.sin(theta)));
  });

  if (nodes.length <= 1) return map;

  const REPEL = 6.0;
  const ATTRACT = 0.12;
  const MIN_D = 0.6;
  const MAX_R = 6.0;
  const MIN_R = 1.2;
  const vel = new Map<string, THREE.Vector3>(nodes.map((n) => [n.id, new THREE.Vector3()]));
  const tmp = new THREE.Vector3();

  for (let iter = 0; iter < 50; iter++) {
    vel.forEach((v) => v.set(0, 0, 0));
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const pi = map.get(nodes[i].id)!;
        const pj = map.get(nodes[j].id)!;
        tmp.subVectors(pi, pj);
        const d = Math.max(tmp.length(), MIN_D);
        tmp.normalize().multiplyScalar(REPEL / (d * d));
        vel.get(nodes[i].id)!.add(tmp);
        vel.get(nodes[j].id)!.sub(tmp);
      }
    }
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

// Demo graph — only shown when backend is unreachable (no source_type, uses fibonacci layout)
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

  const edges: GraphEdge[] = [];
  const addEdge = (a: string, b: string, s = 1.0) =>
    edges.push({ source: a, target: b, strength: s, relationship_type: "related" });

  [["decision_0","decision_1"],["decision_1","decision_2"],["decision_2","decision_3"],
   ["decision_0","decision_4"],["person_0","person_1"],["person_1","person_2"],
   ["person_2","person_3"],["person_3","person_4"],["tech_0","tech_1"],
   ["tech_1","tech_2"],["tech_2","tech_3"],["tech_4","tech_5"],["tech_5","tech_6"],
   ["project_0","project_1"],["project_1","project_2"],["project_0","project_3"],
   ["open_question_0","open_question_1"],["open_question_2","open_question_3"]].forEach(([a,b]) => addEdge(a, b, 0.9));

  [["person_0","decision_0",1.4],["person_1","decision_1",1.2],["person_2","tech_0",1.1],
   ["person_3","project_0",1.3],["tech_0","project_0",0.8],["tech_1","project_1",0.7],
   ["tech_2","project_2",0.8],["decision_0","open_question_0",1.1],["decision_3","open_question_2",0.9],
   ["project_0","open_question_1",0.8],["person_4","tech_3",1.0],["person_5","project_3",0.9],
   ["decision_4","tech_4",0.7],["person_6","decision_5",1.2],["person_7","project_4",1.0]].forEach(([a,b,s]) =>
    addEdge(a as string, b as string, s as number));

  return { nodes, edges };
}
