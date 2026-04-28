import { useMemo, useCallback } from "react";
import ReactFlow, {
  Background, Controls, useNodesState, useEdgesState,
  type Node, type Edge, type NodeProps, Handle, Position,
} from "reactflow";
import "reactflow/dist/style.css";
import type { MindMap } from "@/data/mockData";

function VoxNode({ data }: NodeProps<{ label: string; kind: "root" | "idea" | "task" }>) {
  const styles =
    data.kind === "root"
      ? "bg-gradient-amber text-primary-foreground border-transparent shadow-glow font-semibold"
      : data.kind === "idea"
        ? "glass-strong text-foreground"
        : "bg-secondary/70 text-foreground border-border";
  return (
    <div className={`rounded-xl border px-4 py-2.5 text-sm transition-transform hover:scale-[1.03] ${styles}`}>
      <Handle type="target" position={Position.Top} className="!h-2 !w-2" />
      <span className="whitespace-nowrap">{data.label}</span>
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2" />
    </div>
  );
}

const nodeTypes = { vox: VoxNode };

export function MindMapCanvas({ map }: { map: MindMap }) {
  const initialNodes: Node[] = useMemo(
    () =>
      map.nodes.map((n) => ({
        id: n.id,
        type: "vox",
        position: { x: n.x, y: n.y },
        data: { label: n.label, kind: n.kind },
      })),
    [map],
  );
  const initialEdges: Edge[] = useMemo(
    () => map.edges.map((e) => ({ id: e.id, source: e.source, target: e.target, animated: true })),
    [map],
  );

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);
  const onInit = useCallback(() => {}, []);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onInit={onInit}
      fitView
      fitViewOptions={{ padding: 0.25 }}
      proOptions={{ hideAttribution: true }}
      className="bg-transparent"
    >
      <Background gap={28} size={1} color="oklch(1 0 0 / 0.06)" />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}
