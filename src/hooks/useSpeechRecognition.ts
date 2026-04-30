import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: any) => void) | null;
  onerror: ((e: any) => void) | null;
  onend: (() => void) | null;
};

function getCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export type RecordingResult = { transcript: string; audioBlob: Blob | null; mimeType: string | null };

function pickMime(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
  return candidates.find((m) => MediaRecorder.isTypeSupported(m));
}

export function useSpeechRecognition() {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const finalRef = useRef<string>("");
  const resolveRef = useRef<((transcript: string) => void) | null>(null);
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeRef = useRef<string | null>(null);

  useEffect(() => {
    setSupported(!!getCtor());
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setInterim("");
    finalRef.current = "";
    chunksRef.current = [];
    mimeRef.current = null;
    const Ctor = getCtor();
    if (!Ctor) {
      setError("Speech recognition is not supported in this browser. Try Chrome or Edge.");
      return false;
    }
    // Try to also capture raw audio with MediaRecorder. Speech recognition still works
    // even if this fails (e.g. permission denied in iframe), so treat audio as optional.
    try {
      if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        const mime = pickMime();
        const mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
        mimeRef.current = mr.mimeType || mime || "audio/webm";
        mr.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };
        mr.start(1000); // collect a chunk every second
        mediaRecRef.current = mr;
      }
    } catch (e) {
      // Non-fatal: keep going with transcription only.
      console.warn("Audio capture unavailable:", e);
    }
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = (typeof navigator !== "undefined" && navigator.language) || "en-US";
    rec.onresult = (e: any) => {
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalRef.current += r[0].transcript + " ";
        else interimText += r[0].transcript;
      }
      setInterim(interimText);
    };
    rec.onerror = (e: any) => {
      setError(e?.error === "not-allowed" ? "Microphone permission denied." : `Speech error: ${e?.error ?? "unknown"}`);
    };
    rec.onend = () => {
      setListening(false);
      const transcript = finalRef.current.trim();
      resolveRef.current?.(transcript);
      resolveRef.current = null;
    };
    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start recording");
      return false;
    }
  }, []);

  const stop = useCallback((): Promise<RecordingResult> => {
    const stopAudio = () =>
      new Promise<{ blob: Blob | null; mime: string | null }>((resolve) => {
        const mr = mediaRecRef.current;
        const stream = mediaStreamRef.current;
        const cleanup = () => {
          stream?.getTracks().forEach((t) => t.stop());
          mediaStreamRef.current = null;
          mediaRecRef.current = null;
        };
        if (!mr) { cleanup(); resolve({ blob: null, mime: null }); return; }
        if (mr.state === "inactive") {
          const blob = chunksRef.current.length ? new Blob(chunksRef.current, { type: mimeRef.current ?? "audio/webm" }) : null;
          cleanup();
          resolve({ blob, mime: mimeRef.current });
          return;
        }
        mr.onstop = () => {
          const blob = chunksRef.current.length ? new Blob(chunksRef.current, { type: mimeRef.current ?? "audio/webm" }) : null;
          cleanup();
          resolve({ blob, mime: mimeRef.current });
        };
        try { mr.stop(); } catch { cleanup(); resolve({ blob: null, mime: null }); }
      });

    const stopSpeech = () =>
      new Promise<string>((resolve) => {
        if (!recRef.current) { resolve(finalRef.current.trim()); return; }
        resolveRef.current = resolve;
        try { recRef.current.stop(); } catch { resolve(finalRef.current.trim()); }
      });

    return Promise.all([stopSpeech(), stopAudio()]).then(([transcript, audio]) => ({
      transcript,
      audioBlob: audio.blob,
      mimeType: audio.mime,
    }));
  }, []);

  return { supported, listening, interim, error, start, stop };
}