import { supabase } from "@/integrations/supabase/client";

/**
 * Generic CRUD data-access layer.
 *
 * Lightweight, table-agnostic helpers around the Supabase client. They keep
 * business logic out of components and provide a single place to add caching,
 * logging, or telemetry later.
 *
 * RLS is enforced server-side, so passing the wrong user_id will simply yield
 * an empty result set — never trust the client for authorization.
 */

export type QueryOptions = {
  filters?: Record<string, string | number | boolean | null>;
  orderBy?: { column: string; ascending?: boolean };
  range?: { from: number; to: number };
  select?: string;
};

function log(scope: string, payload: unknown) {
  // eslint-disable-next-line no-console
  if (import.meta.env.DEV) console.debug(`[db:${scope}]`, payload);
}

export async function getAll<T = unknown>(table: string, opts: QueryOptions = {}): Promise<T[]> {
  let q = supabase.from(table).select(opts.select ?? "*");
  if (opts.filters) for (const [k, v] of Object.entries(opts.filters)) q = q.eq(k, v as never);
  if (opts.orderBy) q = q.order(opts.orderBy.column, { ascending: opts.orderBy.ascending ?? true });
  if (opts.range) q = q.range(opts.range.from, opts.range.to);
  const { data, error } = await q;
  if (error) { log(`getAll:${table}`, error); throw error; }
  return (data ?? []) as T[];
}

export async function getById<T = unknown>(table: string, id: string, select = "*"): Promise<T | null> {
  const { data, error } = await supabase.from(table).select(select).eq("id", id).maybeSingle();
  if (error) { log(`getById:${table}`, error); throw error; }
  return (data as T | null) ?? null;
}

export async function createRecord<T = unknown>(table: string, values: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.from(table).insert(values).select().single();
  if (error) { log(`create:${table}`, error); throw error; }
  return data as T;
}

export async function updateRecord<T = unknown>(table: string, id: string, values: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.from(table).update(values).eq("id", id).select().single();
  if (error) { log(`update:${table}`, error); throw error; }
  return data as T;
}

export async function deleteRecord(table: string, id: string): Promise<void> {
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) { log(`delete:${table}`, error); throw error; }
}