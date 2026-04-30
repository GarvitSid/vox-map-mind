import { supabase } from "@/integrations/supabase/client";

const BUCKET = "voice-notes";

/** Uploads a recording to the user's folder in the private voice-notes bucket. */
export async function uploadVoiceRecording(args: {
  userId: string;
  noteId: string;
  blob: Blob;
  mimeType: string | null;
}): Promise<string> {
  const ext = (args.mimeType?.includes("mp4") ? "m4a"
    : args.mimeType?.includes("ogg") ? "ogg"
    : "webm");
  const path = `${args.userId}/${args.noteId}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, args.blob, {
    contentType: args.mimeType ?? "audio/webm",
    upsert: true,
  });
  if (error) throw error;
  return path;
}

/** Returns a signed URL for a private recording (valid 1 hour). */
export async function getRecordingUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
  if (error) return null;
  return data?.signedUrl ?? null;
}
