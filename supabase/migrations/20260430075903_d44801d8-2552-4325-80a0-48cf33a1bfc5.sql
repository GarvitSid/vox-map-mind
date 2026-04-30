-- Create private bucket for user voice note audio recordings
INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-notes', 'voice-notes', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies: users can only access files inside a folder named with their own user id
CREATE POLICY "voice_notes_select_own"
ON storage.objects FOR SELECT
USING (bucket_id = 'voice-notes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "voice_notes_insert_own"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'voice-notes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "voice_notes_update_own"
ON storage.objects FOR UPDATE
USING (bucket_id = 'voice-notes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "voice_notes_delete_own"
ON storage.objects FOR DELETE
USING (bucket_id = 'voice-notes' AND auth.uid()::text = (storage.foldername(name))[1]);