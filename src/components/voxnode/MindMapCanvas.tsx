import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  Background, Controls, useNodesState, useEdgesState,
  MarkerType,
  type Node, type Edge, type NodeProps, Handle, Position,
  type NodeChange,
} from "reactflow";
import "reactflow/dist/style.css";
import { Plus, Trash2, Pencil, Check } from "lucide-react";
import { toast } from "sonner";
import type { MindMap } from "@/data/mockData";
import {
  updateNodeLabel, updateNodePosition, deleteMindMapNode, addChildNode,
} from "@/services/voiceNotes";

type Kind = "root" | "idea" | "task";
const KIND_LABEL: Record<Kind, string> = { root: "Main topic", idea: "Idea", task: "Next step" };

type VoxData = {
  label: string;
  kind: Kind;
  editing?: boolean;
  onStartEdit: (id: string) => void;
  onCommitEdit: (id: string, label: string) => void;
  onCancelEdit: (id: string) => void;
  onAddChild: (id: string, kind: "idea" | "task") => void;
  onDelete: (id: string) => void;
};

function VoxNode({ id, data }: NodeProps<VoxData>) {
  const [draft, setDraft] = useState(data.label);
  useEffect(() => { setDraft(data.label); }, [data.label, data.editing]);

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
    <div
      className={`group relative min-w-[160px] max-w-[260px] rounded-xl border px-4 py-2.5 text-sm transition-transform ${styles}`}
      onDoubleClick={(e) => { e.stopPropagation(); data.onStartEdit(id); }}
    >
      <Handle type="target" position={Position.Top} className="!h-2 !w-2" />
      <div className={`mb-1 inline-block rounded px-1.5 py-[1px] text-[9px] font-semibold uppercase tracking-wider ${tagStyles}`}>
        {KIND_LABEL[data.kind]}
      </div>

      {data.editing ? (
        <div className="flex items-center gap-1">
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); data.onCommitEdit(id, draft.trim() || data.label); }
              if (e.key === "Escape") { e.preventDefault(); data.onCancelEdit(id); }
            }}
            onBlur={() => data.onCommitEdit(id, draft.trim() || data.label)}
            className="nodrag w-full rounded bg-black/30 px-1.5 py-1 text-sm text-foreground outline-none ring-1 ring-primary/60"
          />
          <button
            className="nodrag rounded p-1 hover:bg-white/10"
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => { e.stopPropagation(); data.onCommitEdit(id, draft.trim() || data.label); }}
            aria-label="Save"
          >
            <Check className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <div className="whitespace-normal leading-snug">{data.label}</div>
      )}

      {/* Action toolbar — appears on hover */}
      <div className="absolute -top-3 right-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          title="Rename"
          onClick={(e) => { e.stopPropagation(); data.onStartEdit(id); }}
          className="nodrag grid h-6 w-6 place-items-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground"
        >
          <Pencil className="h-3 w-3" />
        </button>
        <button
          title="Add idea"
          onClick={(e) => { e.stopPropagation(); data.onAddChild(id, "idea"); }}
          className="nodrag grid h-6 w-6 place-items-center rounded-full border border-primary/40 bg-primary/20 text-primary hover:bg-primary/30"
        >
          <Plus className="h-3 w-3" />
        </button>
        <button
          title="Add next step"
          onClick={(e) => { e.stopPropagation(); data.onAddChild(id, "task"); }}
          className="nodrag grid h-6 w-6 place-items-center rounded-full border border-emerald-400/50 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
        >
          <Plus className="h-3 w-3" />
        </button>
        {data.kind !== "root" && (
          <button
            title="Delete"
            onClick={(e) => { e.stopPropagation(); data.onDelete(id); }}
            className="nodrag grid h-6 w-6 place-items-center rounded-full border border-destructive/40 bg-destructive/20 text-destructive hover:bg-destructive/30"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2" />
    </div>
  );
}

const nodeTypes = { vox: VoxNode };

export function MindMapCanvas({
  map, userId, mindMapId, onChange,
}: {
  map: MindMap;
  userId?: string;
  mindMapId?: string | null;
  onChange?: () => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const persistTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const editable = !!(userId && mindMapId);

  const startEdit = useCallback((id: string) => setEditingId(id), []);
  const cancelEdit = useCallback(() => setEditingId(null), []);

  const commitEdit = useCallback(async (id: string, label: string) => {
    setEditingId(null);
    if (!editable) return;
    try {
      await updateNodeLabel(id, label);
      onChange?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to rename");
    }
  }, [editable, onChange]);

  const handleDelete = useCallback(async (id: string) => {
    if (!editable) return;
    if (!confirm("Delete this node and its connections?")) return;
    try {
      await deleteMindMapNode(id);
      onChange?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete node");
    }
  }, [editable, onChange]);

  const handleAddChild = useCallback(async (parentId: string, kind: "idea" | "task") => {
    if (!editable || !userId || !mindMapId) return;
    const parent = map.nodes.find((n) => n.id === parentId);
    if (!parent) return;
    const x = parent.x + (kind === "idea" ? 220 : 0);
    const y = parent.y + (kind === "idea" ? 0 : 140);
    try {
      await addChildNode({
        userId, mindMapId, parentId,
        label: kind === "idea" ? "New idea" : "New step",
        kind, x, y,
      });
      onChange?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add node");
    }
  }, [editable, userId, mindMapId, map.nodes, onChange]);

  const initialNodes: Node<VoxData>[] = useMemo(
    () =>
      map.nodes.map((n) => ({
        id: n.id,
        type: "vox",
        position: { x: n.x, y: n.y },
        data: {
          label: n.label, kind: n.kind,
          editing: editingId === n.id,
          onStartEdit: startEdit, onCommitEdit: commitEdit, onCancelEdit: cancelEdit,
          onAddChild: handleAddChild, onDelete: handleDelete,
        },
      })),
    // We intentionally do NOT depend on editingId here — it's pushed in via the
    // separate effect below to avoid recreating every node on each keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [map],
  );

  const nodeKind = useMemo(() => {
    const m = new Map<string, Kind>();
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

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  // Reset when underlying map changes
  useEffect(() => { setNodes(initialNodes); }, [initialNodes, setNodes]);

  // Push the editing flag into the live node data without rebuilding everything
  useEffect(() => {
    setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, editing: editingId === n.id } })));
  }, [editingId, setNodes]);

  // Persist drag positions (debounced per node)
  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    onNodesChange(changes);
    if (!editable) return;
    for (const c of changes) {
      if (c.type === "position" && c.position && c.dragging === false) {
        const { id, position } = c;
        const prev = persistTimers.current.get(id);
        if (prev) clearTimeout(prev);
        const t = setTimeout(() => {
          updateNodePosition(id, position.x, position.y).catch((e) =>
            console.warn("persist position failed", e),
          );
          persistTimers.current.delete(id);
        }, 350);
        persistTimers.current.set(id, t);
      }
    }
  }, [onNodesChange, editable]);

  return (
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
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
        {editable && (
          <div className="mt-1 border-t border-border/60 pt-1 text-[9px] text-muted-foreground">
            Double-click a node to rename · hover for actions
          </div>
        )}
      </div>
    </div>
  );
}
