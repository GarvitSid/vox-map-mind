import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

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
 * Creates a starter mind map with a root node for a given voice note.
 * In the real product this is where AI-derived structure gets persisted.
 */
export async function createStarterMindMap(args: { userId: string; noteId: string; title: string }) {
  const { data: map, error: mErr } = await supabase
    .from("mind_maps")
    .insert({ user_id: args.userId, note_id: args.noteId, title: args.title })
    .select()
    .single();
  if (mErr) throw mErr;

  const { data: root, error: rErr } = await supabase
    .from("mind_map_nodes")
    .insert({ user_id: args.userId, mind_map_id: map.id, label: args.title, kind: "root", x: 0, y: 0 })
    .select()
    .single();
  if (rErr) throw rErr;

  const branches = [
    { label: "Idea 1", kind: "idea" as const, x: -260, y: -120 },
    { label: "Idea 2", kind: "idea" as const, x: 260, y: -120 },
    { label: "Next step", kind: "task" as const, x: 0, y: 180 },
  ];
  const { data: children, error: cErr } = await supabase
    .from("mind_map_nodes")
    .insert(branches.map((b) => ({ user_id: args.userId, mind_map_id: map.id, ...b })))
    .select();
  if (cErr) throw cErr;

  const edgeRows = (children ?? []).map((c) => ({
    user_id: args.userId,
    mind_map_id: map.id,
    source_node_id: root.id,
    target_node_id: c.id,
  }));
  if (edgeRows.length) {
    const { error: eErr } = await supabase.from("mind_map_edges").insert(edgeRows);
    if (eErr) throw eErr;
  }

  return map;
}