import dagre from "dagre";

export type LayoutNode = { id: string; label: string; kind: "root" | "idea" | "task" };
export type LayoutEdge = { source: string; target: string };
export type Positioned = { id: string; x: number; y: number };

const NODE_W = 200;
const NODE_H = 70;

/**
 * Lays out a mind map with dagre. Returns absolute (x, y) for each node id,
 * centered around (0, 0) so the existing React Flow viewport math still works.
 */
export function layoutMindMap(nodes: LayoutNode[], edges: LayoutEdge[]): Positioned[] {
  if (nodes.length === 0) return [];
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "TB", ranksep: 90, nodesep: 50, marginx: 20, marginy: 20 });
  g.setDefaultEdgeLabel(() => ({}));
  for (const n of nodes) g.setNode(n.id, { width: NODE_W, height: NODE_H });
  for (const e of edges) g.setEdge(e.source, e.target);
  dagre.layout(g);
  // Center the graph around origin
  const positions = nodes.map((n) => {
    const p = g.node(n.id);
    return { id: n.id, x: p.x, y: p.y };
  });
  const xs = positions.map((p) => p.x);
  const ys = positions.map((p) => p.y);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  return positions.map((p) => ({ id: p.id, x: p.x - cx, y: p.y - cy }));
}
