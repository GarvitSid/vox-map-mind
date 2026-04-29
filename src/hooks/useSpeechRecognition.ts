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

export function useSpeechRecognition() {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const finalRef = useRef<string>("");
  const resolveRef = useRef<((transcript: string) => void) | null>(null);

  useEffect(() => {
    setSupported(!!getCtor());
  }, []);

  const start = useCallback(() => {
    setError(null);
    setInterim("");
    finalRef.current = "";
    const Ctor = getCtor();
    if (!Ctor) {
      setError("Speech recognition is not supported in this browser. Try Chrome or Edge.");
      return false;
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

  const stop = useCallback((): Promise<string> => {
    return new Promise((resolve) => {
      if (!recRef.current) {
        resolve(finalRef.current.trim());
        return;
      }
      resolveRef.current = resolve;
      try { recRef.current.stop(); } catch { resolve(finalRef.current.trim()); }
    });
  }, []);

  return { supported, listening, interim, error, start, stop };
}