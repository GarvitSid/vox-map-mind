
-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- VOICE NOTES
CREATE TABLE public.voice_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled note',
  preview TEXT NOT NULL DEFAULT '',
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  audio_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX voice_notes_user_id_idx ON public.voice_notes(user_id, created_at DESC);
ALTER TABLE public.voice_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "voice_notes_select_own" ON public.voice_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "voice_notes_insert_own" ON public.voice_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "voice_notes_update_own" ON public.voice_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "voice_notes_delete_own" ON public.voice_notes FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER voice_notes_set_updated_at BEFORE UPDATE ON public.voice_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- MIND MAPS
CREATE TABLE public.mind_maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note_id UUID NOT NULL REFERENCES public.voice_notes(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled map',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX mind_maps_user_id_idx ON public.mind_maps(user_id, created_at DESC);
CREATE INDEX mind_maps_note_id_idx ON public.mind_maps(note_id);
ALTER TABLE public.mind_maps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mind_maps_select_own" ON public.mind_maps FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "mind_maps_insert_own" ON public.mind_maps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "mind_maps_update_own" ON public.mind_maps FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "mind_maps_delete_own" ON public.mind_maps FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER mind_maps_set_updated_at BEFORE UPDATE ON public.mind_maps
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- NODE KIND ENUM
CREATE TYPE public.node_kind AS ENUM ('root', 'idea', 'task');

-- MIND MAP NODES
CREATE TABLE public.mind_map_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mind_map_id UUID NOT NULL REFERENCES public.mind_maps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  kind public.node_kind NOT NULL DEFAULT 'idea',
  x DOUBLE PRECISION NOT NULL DEFAULT 0,
  y DOUBLE PRECISION NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX mind_map_nodes_map_idx ON public.mind_map_nodes(mind_map_id);
ALTER TABLE public.mind_map_nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nodes_select_own" ON public.mind_map_nodes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "nodes_insert_own" ON public.mind_map_nodes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "nodes_update_own" ON public.mind_map_nodes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "nodes_delete_own" ON public.mind_map_nodes FOR DELETE USING (auth.uid() = user_id);

-- MIND MAP EDGES
CREATE TABLE public.mind_map_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mind_map_id UUID NOT NULL REFERENCES public.mind_maps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_node_id UUID NOT NULL REFERENCES public.mind_map_nodes(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES public.mind_map_nodes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX mind_map_edges_map_idx ON public.mind_map_edges(mind_map_id);
ALTER TABLE public.mind_map_edges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "edges_select_own" ON public.mind_map_edges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "edges_insert_own" ON public.mind_map_edges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "edges_update_own" ON public.mind_map_edges FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "edges_delete_own" ON public.mind_map_edges FOR DELETE USING (auth.uid() = user_id);
