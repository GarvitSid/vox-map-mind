import { useMemo, useCallback } from "react";
import ReactFlow, {
  Background, Controls, useNodesState, useEdgesState,
  MarkerType,
  type Node, type Edge, type NodeProps, Handle, Position,
} from "reactflow";
import "reactflow/dist/style.css";
import type { MindMap } from "@/data/mockData";

const KIND_LABEL: Record<"root" | "idea" | "task", string> = {
  root: "Main topic",
  idea: "Idea",
  task: "Next step",
};

function VoxNode({ data }: NodeProps<{ label: string; kind: "root" | "idea" | "task" }>) {
  const styles =
    data.kind === "root"
      ? "bg-gradient-amber text-primary-foreground border-transparent shadow-glow font-semibold"
      : data.kind === "idea"
        ? "glass-strong text-foreground border-primary/30"
        : "bg-emerald-500/15 text-foreground border-emerald-400/40";
  const tagStyles =
    data.kind === "root"
      ? "bg-black/20 text-primary-foreground/90"
      : data.kind === "idea"
        ? "bg-primary/20 text-primary"
        : "bg-emerald-500/25 text-emerald-200";
  return (
    <div className={`min-w-[140px] max-w-[260px] rounded-xl border px-4 py-2.5 text-sm transition-transform hover:scale-[1.03] ${styles}`}>
      <Handle type="target" position={Position.Top} className="!h-2 !w-2" />
      <div className={`mb-1 inline-block rounded px-1.5 py-[1px] text-[9px] font-semibold uppercase tracking-wider ${tagStyles}`}>
        {KIND_LABEL[data.kind]}
      </div>
      <div className="whitespace-normal leading-snug">{data.label}</div>
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
  const nodeKind = useMemo(() => {
    const m = new Map<string, "root" | "idea" | "task">();
    for (const n of map.nodes) m.set(n.id, n.kind);
    return m;
  }, [map]);
  const initialEdges: Edge[] = useMemo(
    () =>
      map.edges.map((e) => {
        const targetKind = nodeKind.get(e.target);
        const isTask = targetKind === "task";
        const color = isTask ? "rgb(52 211 153)" : "rgb(245 158 11)";
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          animated: true,
          label: isTask ? "next step" : "idea",
          labelStyle: { fill: color, fontSize: 10, fontWeight: 600 },
          labelBgStyle: { fill: "rgba(15,15,20,0.85)" },
          labelBgPadding: [4, 2] as [number, number],
          labelBgBorderRadius: 4,
          style: { stroke: color, strokeWidth: 1.5 },
          markerEnd: { type: MarkerType.ArrowClosed, color },
        };
      }),
    [map, nodeKind],
  );

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);
  const onInit = useCallback(() => {}, []);

  return (
    <div className="relative h-full w-full">
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
      {/* Legend */}
      <div className="pointer-events-none absolute right-3 top-3 flex flex-col gap-1 rounded-lg border border-border/60 bg-card/80 px-3 py-2 text-[10px] backdrop-blur">
        <div className="mb-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Legend</div>
        <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-gradient-amber" /> Main topic</div>
        <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm border border-primary/40 bg-primary/20" /> Idea</div>
        <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm border border-emerald-400/50 bg-emerald-500/25" /> Next step</div>
      </div>
    </div>
  );
}
