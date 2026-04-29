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

  const { data: root, error: rErr } = await supabase
    .from("mind_map_nodes")
    .insert({ user_id: args.userId, mind_map_id: map.id, label: args.root, kind: "root", x: 0, y: 0 })
    .select()
    .single();
  if (rErr) throw rErr;

  // Position ideas in an arc above the root, tasks in a row below.
  const ideaCount = args.ideas.length;
  const ideaRows = args.ideas.map((label, i) => {
    const spread = Math.max(ideaCount - 1, 1);
    const x = ideaCount === 1 ? 0 : -320 + (640 / spread) * i;
    const y = -160 - (i % 2) * 40;
    return { user_id: args.userId, mind_map_id: map.id, label, kind: "idea" as const, x, y };
  });
  const taskRows = args.tasks.map((label, i) => {
    const taskCount = args.tasks.length;
    const spread = Math.max(taskCount - 1, 1);
    const x = taskCount === 1 ? 0 : -260 + (520 / spread) * i;
    return { user_id: args.userId, mind_map_id: map.id, label, kind: "task" as const, x, y: 200 };
  });

  const allRows = [...ideaRows, ...taskRows];
  if (allRows.length === 0) return map;

  const { data: children, error: cErr } = await supabase
    .from("mind_map_nodes")
    .insert(allRows)
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

/** Calls the generate-mindmap edge function to turn a transcript into structured content. */
export async function generateMindMapFromTranscript(transcript: string) {
  const { data, error } = await supabase.functions.invoke<{
    title: string;
    root: string;
    ideas: string[];
    tasks: string[];
  }>("generate-mindmap", { body: { transcript } });
  if (error) throw error;
  if (!data) throw new Error("Empty response from mind map generator");
  return data;
}