import sys
sys.path.insert(0, ".")
from app.services import store

nodes = store.all_nodes()
edges = store.all_edges()

print(f"Total nodes: {len(nodes)}")
print(f"Total edges: {len(edges)}")

from collections import defaultdict
adj = defaultdict(list)
for e in edges:
    adj[e.source].append(e)
    adj[e.target].append(e)

filtered_edges = set()
for node_id, node_edges in adj.items():
    # Sort by strength desc
    node_edges.sort(key=lambda x: x.strength, reverse=True)
    # Keep top 3
    for e in node_edges[:3]:
        filtered_edges.add(e)

print(f"Filtered edges (top 3 per node): {len(filtered_edges)}")

filtered_edges_2 = set()
for node_id, node_edges in adj.items():
    node_edges.sort(key=lambda x: x.strength, reverse=True)
    # Keep top 2
    for e in node_edges[:2]:
        filtered_edges_2.add(e)

print(f"Filtered edges (top 2 per node): {len(filtered_edges_2)}")
