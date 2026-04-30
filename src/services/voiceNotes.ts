import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { layoutMindMap } from "@/lib/mindMapLayout";

export type VoiceNoteRow = Tables<"voice_notes">;
export type MindMapRow = Tables<"mind_maps">;
export type MindMapNodeRow = Tables<"mind_map_nodes">;
export type MindMapEdgeRow = Tables<"mind_map_edges">;

export async function listVoiceNotes(opts: { search?: string; limit?: number } = {}) {
  let q = supabase.from("voice_notes").select("*").order("created_at", { ascending: false });
  if (opts.search?.trim()) q = q.ilike("title", `%${opts.search.trim()}%`);
  if (opts.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function createVoiceNote(values: Omit<TablesInsert<"voice_notes">, "user_id"> & { user_id: string }) {
  const { data, error } = await supabase.from("voice_notes").insert(values).select().single();
  if (error) throw error;
  return data;
}

export async function updateVoiceNote(id: string, values: TablesUpdate<"voice_notes">) {
  const { data, error } = await supabase.from("voice_notes").update(values).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteVoiceNote(id: string) {
  const { error } = await supabase.from("voice_notes").delete().eq("id", id);
  if (error) throw error;
}

/** Loads the most recent mind map for a note, including nodes and edges. */
export async function getMindMapForNote(noteId: string) {
  const { data: maps, error: mapErr } = await supabase
    .from("mind_maps")
    .select("*")
    .eq("note_id", noteId)
    .order("created_at", { ascending: false })
    .limit(1);
  if (mapErr) throw mapErr;
  const map = maps?.[0];
  if (!map) return null;

  const [{ data: nodes, error: nErr }, { data: edges, error: eErr }] = await Promise.all([
    supabase.from("mind_map_nodes").select("*").eq("mind_map_id", map.id),
    supabase.from("mind_map_edges").select("*").eq("mind_map_id", map.id),
  ]);
  if (nErr) throw nErr;
  if (eErr) throw eErr;
  return { map, nodes: nodes ?? [], edges: edges ?? [] };
}

/**
 * Creates a mind map from structured content extracted from a transcript.
 * Lays out idea nodes in an arc above the root and task nodes below it.
 */
export async function createMindMapFromContent(args: {
  userId: string;
  noteId: string;
  title: string;
  root: string;
  ideas: string[];
  tasks: string[];
}) {
  const { data: map, error: mErr } = await supabase
    .from("mind_maps")
    .insert({ user_id: args.userId, note_id: args.noteId, title: args.title })
    .select()
    .single();
  if (mErr) throw mErr;

  // Insert the root node first (without final position — we recompute below).
  const { data: root, error: rErr } = await supabase
    .from("mind_map_nodes")
    .insert({ user_id: args.userId, mind_map_id: map.id, label: args.root, kind: "root", x: 0, y: 0 })
    .select()
    .single();
  if (rErr) throw rErr;

  const childRows = [
    ...args.ideas.map((label) => ({ user_id: args.userId, mind_map_id: map.id, label, kind: "idea" as const, x: 0, y: 0 })),
    ...args.tasks.map((label) => ({ user_id: args.userId, mind_map_id: map.id, label, kind: "task" as const, x: 0, y: 0 })),
  ];

  let children: Array<{ id: string; label: string; kind: "root" | "idea" | "task" }> = [];
  if (childRows.length) {
    const { data, error: cErr } = await supabase.from("mind_map_nodes").insert(childRows).select();
    if (cErr) throw cErr;
    children = (data ?? []).map((c) => ({ id: c.id, label: c.label, kind: c.kind as "root" | "idea" | "task" }));
  }

  // Compute positions with dagre.
  const allNodes = [
    { id: root.id, label: root.label, kind: "root" as const },
    ...children,
  ];
  const allEdges = children.map((c) => ({ source: root.id, target: c.id }));
  const positioned = layoutMindMap(allNodes, allEdges);

  // Persist computed positions in parallel.
  await Promise.all(
    positioned.map((p) =>
      supabase.from("mind_map_nodes").update({ x: p.x, y: p.y }).eq("id", p.id),
    ),
  );

  if (children.length) {
    const edgeRows = children.map((c) => ({
      user_id: args.userId,
      mind_map_id: map.id,
      source_node_id: root.id,
      target_node_id: c.id,
    }));
    const { error: eErr } = await supabase.from("mind_map_edges").insert(edgeRows);
    if (eErr) throw eErr;
  }

  return map;
}

/** Calls the generate-mindmap edge function to turn a transcript into structured content. */
export async function generateMindMapFromTranscript(transcript: string) {
  const { data, error } = await supabase.functions.invoke<{
    title: string;
    root: string;
    ideas: string[];
    tasks: string[];
    degraded?: boolean;
    reason?: string;
  }>("generate-mindmap", { body: { transcript } });
  if (error) throw error;
  if (!data) throw new Error("Empty response from mind map generator");
  return data;
}

/** Updates a single node's label. */
export async function updateNodeLabel(id: string, label: string) {
  const { error } = await supabase.from("mind_map_nodes").update({ label }).eq("id", id);
  if (error) throw error;
}

/** Persists the dragged position of a node. */
export async function updateNodePosition(id: string, x: number, y: number) {
  const { error } = await supabase.from("mind_map_nodes").update({ x, y }).eq("id", id);
  if (error) throw error;
}

/** Deletes a node and any edges referencing it. */
export async function deleteMindMapNode(id: string) {
  // Remove edges first (no FK cascade defined).
  const { error: e1 } = await supabase
    .from("mind_map_edges")
    .delete()
    .or(`source_node_id.eq.${id},target_node_id.eq.${id}`);
  if (e1) throw e1;
  const { error: e2 } = await supabase.from("mind_map_nodes").delete().eq("id", id);
  if (e2) throw e2;
}

/** Adds a child node connected to `parentId`. Returns the new node + edge. */
export async function addChildNode(args: {
  userId: string;
  mindMapId: string;
  parentId: string;
  label: string;
  kind: "idea" | "task";
  x: number;
  y: number;
}) {
  const { data: node, error: nErr } = await supabase
    .from("mind_map_nodes")
    .insert({
      user_id: args.userId,
      mind_map_id: args.mindMapId,
      label: args.label,
      kind: args.kind,
      x: args.x,
      y: args.y,
    })
    .select()
    .single();
  if (nErr) throw nErr;
  const { data: edge, error: eErr } = await supabase
    .from("mind_map_edges")
    .insert({
      user_id: args.userId,
      mind_map_id: args.mindMapId,
      source_node_id: args.parentId,
      target_node_id: node.id,
    })
    .select()
    .single();
  if (eErr) throw eErr;
  return { node, edge };
}

/** Updates the audio_url of a voice note. */
export async function setVoiceNoteAudio(id: string, audio_url: string) {
  const { error } = await supabase.from("voice_notes").update({ audio_url }).eq("id", id);
  if (error) throw error;
}