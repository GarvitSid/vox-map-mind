import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Mic, Square, Plus, Search, Download, FileText, ImageIcon, LogOut, Sparkles, Trash2, Menu } from "lucide-react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import logoMark from "@/assets/voxnode-mark.png";
import { MindMapCanvas } from "@/components/voxnode/MindMapCanvas";
import { useAuth } from "@/components/voxnode/AuthProvider";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription, SheetHeader } from "@/components/ui/sheet";
import {
  listVoiceNotes, createVoiceNote, deleteVoiceNote,
  getMindMapForNote, createMindMapFromContent, generateMindMapFromTranscript,
  setVoiceNoteAudio,
  type VoiceNoteRow, type MindMapNodeRow, type MindMapEdgeRow,
} from "@/services/voiceNotes";
import { uploadVoiceRecording } from "@/services/audioStorage";
import { signOut } from "@/services/auth";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import type { MindMap } from "@/data/mockData";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard — VoxNode" }] }),
});

type Stage = "idle" | "recording" | "processing" | "ready";

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function fmtDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function toMindMap(noteId: string, nodes: MindMapNodeRow[], edges: MindMapEdgeRow[]): MindMap {
  return {
    noteId,
    nodes: nodes.map((n) => ({ id: n.id, label: n.label, kind: n.kind, x: n.x, y: n.y })),
    edges: edges.map((e) => ({ id: e.id, source: e.source_node_id, target: e.target_node_id })),
  };
}

function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [notes, setNotes] = useState<VoiceNoteRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("ready");
  const [query, setQuery] = useState("");
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [mindMap, setMindMap] = useState<MindMap | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const recordStartRef = useRef<number>(0);
  const speech = useSpeechRecognition();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [authLoading, user, navigate]);

  // Load notes
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoadingNotes(true);
    listVoiceNotes()
      .then((rows) => {
        if (cancelled) return;
        setNotes(rows);
        setActiveId((prev) => prev ?? rows[0]?.id ?? null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load notes"))
      .finally(() => !cancelled && setLoadingNotes(false));
    return () => { cancelled = true; };
  }, [user]);

  // Load active mind map
  useEffect(() => {
    if (!activeId) { setMindMap(null); return; }
    let cancelled = false;
    getMindMapForNote(activeId)
      .then((res) => {
        if (cancelled) return;
        setMindMap(res ? toMindMap(activeId, res.nodes, res.edges) : null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load mind map"));
    return () => { cancelled = true; };
  }, [activeId]);

  const filtered = useMemo(
    () => notes.filter((n) => n.title.toLowerCase().includes(query.toLowerCase())),
    [notes, query],
  );
  const active = notes.find((n) => n.id === activeId) ?? null;

  const startRecording = async () => {
    if (!user) return;
    if (!speech.supported) {
      toast.error("Speech recognition isn't supported here. Try Chrome or Edge on desktop.");
      return;
    }
    setError(null);
    recordStartRef.current = Date.now();
    const ok = await speech.start();
    if (ok) setStage("recording");
  };

  const stopRecording = async () => {
    if (!user) return;
    const { transcript, audioBlob, mimeType } = await speech.stop();
    const duration = Math.max(1, Math.round((Date.now() - recordStartRef.current) / 1000));

    if (!transcript || transcript.length < 2) {
      setStage("ready");
      toast.error("We didn't catch any speech — try again a bit closer to the mic.");
      return;
    }

    setStage("processing");
    try {
      const structured = await generateMindMapFromTranscript(transcript);
      if (structured.degraded) {
        toast.warning("AI was unavailable — showing a quick keyword summary instead.");
      }
      const title = structured.title?.trim() || transcript.split(/\s+/).slice(0, 5).join(" ");
      const preview = transcript.length > 160 ? transcript.slice(0, 157).trimEnd() + "…" : transcript;

      const note = await createVoiceNote({
        user_id: user.id,
        title,
        preview,
        duration_seconds: duration,
      });
      await createMindMapFromContent({
        userId: user.id,
        noteId: note.id,
        title,
        root: structured.root || title,
        ideas: structured.ideas ?? [],
        tasks: structured.tasks ?? [],
      });
      // Upload the original recording (best-effort) and store its path.
      let savedNote = note;
      if (audioBlob && audioBlob.size > 0) {
        try {
          const path = await uploadVoiceRecording({
            userId: user.id, noteId: note.id, blob: audioBlob, mimeType,
          });
          await setVoiceNoteAudio(note.id, path);
          savedNote = { ...note, audio_url: path };
        } catch (e) {
          console.warn("Audio upload failed:", e);
          toast.warning("Saved your note, but couldn't upload the audio file.");
        }
      }
      setNotes((prev) => [savedNote, ...prev]);
      setActiveId(savedNote.id);
      toast.success("Mind map ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save note");
    } finally {
      setStage("ready");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this voice note and its mind map?")) return;
    try {
      await deleteVoiceNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (activeId === id) setActiveId(notes.find((n) => n.id !== id)?.id ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  const handleExportPng = async () => {
    if (!mindMap) {
      toast.error("No mind map to export yet.");
      return;
    }
    const target = canvasRef.current?.querySelector<HTMLElement>(".react-flow__viewport")
      ?? canvasRef.current;
    if (!target) {
      toast.error("Canvas not ready.");
      return;
    }
    try {
      const dataUrl = await toPng(target, {
        backgroundColor: "#0b0b0f",
        pixelRatio: 2,
        cacheBust: true,
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${(active?.title ?? "mindmap").replace(/[^a-z0-9-_]+/gi, "_")}.png`;
      a.click();
      toast.success("PNG exported");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to export PNG");
    }
  };

  const handleExportMarkdown = () => {
    if (!mindMap || !active) {
      toast.error("No mind map to export yet.");
      return;
    }
    const root = mindMap.nodes.find((n) => n.kind === "root") ?? mindMap.nodes[0];
    const childrenOf = (id: string) =>
      mindMap.edges.filter((e) => e.source === id).map((e) => mindMap.nodes.find((n) => n.id === e.target)!).filter(Boolean);
    const lines: string[] = [`# ${active.title}`, ""];
    if (active.preview) lines.push(`> ${active.preview}`, "");
    const walk = (id: string, depth: number) => {
      for (const child of childrenOf(id)) {
        lines.push(`${"  ".repeat(depth)}- ${child.kind === "task" ? "[ ] " : ""}${child.label}`);
        walk(child.id, depth + 1);
      }
    };
    if (root) {
      lines.push(`## ${root.label}`, "");
      walk(root.id, 0);
    }
    const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${active.title.replace(/[^a-z0-9-_]+/gi, "_")}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Markdown exported");
  };

  const handleShare = async () => {
    if (!active) {
      toast.error("Select a note to share.");
      return;
    }
    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    const shareData = {
      title: `VoxNode — ${active.title}`,
      text: active.preview ?? "Check out my VoxNode mind map.",
      url: shareUrl,
    };
    try {
      const nav: Navigator | undefined = typeof navigator !== "undefined" ? navigator : undefined;
      if (nav && typeof nav.share === "function") {
        await nav.share(shareData);
        return;
      }
      await nav?.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard");
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      toast.error("Unable to share");
    }
  };

  if (authLoading || !user) {
    return <div className="grid h-screen place-items-center bg-background text-sm text-muted-foreground">Loading…</div>;
  }

  const sidebarContent = (
    <>
      <Link to="/" className="mb-6 flex items-center gap-2 px-2">
        <img src={logoMark} alt="VoxNode" width={32} height={32} className="h-8 w-8 object-contain" />
        <span className="text-base font-semibold tracking-tight">VoxNode</span>
      </Link>

      <button
        onClick={() => { stage === "recording" ? stopRecording() : startRecording(); setMobileNavOpen(false); }}
        disabled={stage === "processing"}
        className="mb-4 flex items-center justify-center gap-2 rounded-xl bg-gradient-amber px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-glow hover:scale-[1.01] transition-transform disabled:opacity-60"
      >
        {stage === "recording" ? <><Square className="h-4 w-4" /> Stop & save</> : <><Plus className="h-4 w-4" /> New voice note</>}
      </button>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search notes…"
          className="w-full rounded-lg border border-border bg-input/30 py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none"
        />
      </div>

      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70 px-2 mb-2">Recent</div>
      <div className="flex-1 space-y-1 overflow-y-auto">
        {loadingNotes && <div className="px-3 py-2 text-xs text-muted-foreground">Loading…</div>}
        {!loadingNotes && filtered.length === 0 && (
          <div className="px-3 py-2 text-xs text-muted-foreground">No notes yet — tap the mic to start.</div>
        )}
        {filtered.map((n) => {
          const isActive = n.id === activeId;
          return (
            <div
              key={n.id}
              className={`group flex items-start gap-2 rounded-lg px-3 py-2.5 transition-colors ${
                isActive ? "bg-secondary/70" : "hover:bg-secondary/40"
              }`}
            >
              <button onClick={() => { setActiveId(n.id); setMobileNavOpen(false); }} className="min-w-0 flex-1 text-left">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">{n.title}</span>
                  <span className="shrink-0 text-[10px] text-muted-foreground">{fmtDate(n.created_at)}</span>
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <Mic className="h-3 w-3" /> {fmtDuration(n.duration_seconds)}
                  <span className="truncate">· {n.preview}</span>
                </div>
              </button>
              <button onClick={() => handleDelete(n.id)} className="opacity-60 transition-opacity md:opacity-0 md:group-hover:opacity-100" aria-label="Delete note">
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-border/60 pt-3">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-xs font-medium">
            {(user.email ?? "U").charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="max-w-[140px] truncate text-xs font-medium">{user.email}</div>
            <div className="text-[10px] text-muted-foreground">Signed in</div>
          </div>
        </div>
        <button onClick={handleSignOut} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary/60 hover:text-foreground" aria-label="Sign out">
          <LogOut className="h-3.5 w-3.5" /> Log out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="hidden w-72 shrink-0 flex-col border-r border-border/60 bg-card/40 p-4 md:flex">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar drawer */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="flex w-[300px] flex-col bg-card/95 p-4 sm:w-[320px]">
          <SheetHeader className="sr-only">
            <SheetTitle>Notes navigation</SheetTitle>
            <SheetDescription>Browse and open your saved voice notes.</SheetDescription>
          </SheetHeader>
          {sidebarContent}
        </SheetContent>
      </Sheet>

      {/* Main */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex flex-col gap-3 border-b border-border/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card/60 text-foreground"
              aria-label="Open notes"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div>
              <div className="text-xs text-muted-foreground">Voice note</div>
              <h1 className="text-lg font-semibold tracking-tight">{active?.title ?? "No note selected"}</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={handleExportPng} className="glass inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium hover:bg-white/[0.04]">
              <ImageIcon className="h-3.5 w-3.5" /> Export PNG
            </button>
            <button onClick={handleExportMarkdown} className="glass inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium hover:bg-white/[0.04]">
              <FileText className="h-3.5 w-3.5" /> Export Markdown
            </button>
            <button onClick={handleShare} className="inline-flex items-center gap-2 rounded-lg bg-gradient-amber px-3 py-2 text-xs font-medium text-primary-foreground shadow-glow hover:scale-[1.02] transition-transform">
              <Download className="h-3.5 w-3.5" /> Share
            </button>
            <button onClick={handleSignOut} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary/60 hover:text-foreground">
              <LogOut className="h-3.5 w-3.5" /> Log out
            </button>
          </div>
        </div>

        {error && (
          <div className="border-b border-destructive/30 bg-destructive/10 px-6 py-2 text-xs text-destructive">
            {error} <button className="ml-2 underline" onClick={() => setError(null)}>dismiss</button>
          </div>
        )}

        {/* Record stage */}
        <div className="border-b border-border/60 px-6 py-5">
          <div className="glass flex items-center justify-between gap-6 rounded-2xl px-5 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={stage === "recording" ? stopRecording : startRecording}
                disabled={stage === "processing"}
                className={`relative grid h-14 w-14 place-items-center rounded-full transition-all ${
                  stage === "recording"
                    ? "bg-destructive text-destructive-foreground animate-pulse-record"
                    : "bg-gradient-amber text-primary-foreground shadow-glow hover:scale-[1.03]"
                }`}
                aria-label={stage === "recording" ? "Stop recording" : "Start recording"}
              >
                {stage === "recording" ? <Square className="h-5 w-5 fill-current" /> : <Mic className="h-6 w-6" />}
              </button>
              <div>
                <div className="text-sm font-medium">
                  {stage === "idle" && "Tap to start a new note"}
                  {stage === "recording" && (speech.interim ? `“${speech.interim}”` : "Listening…")}
                  {stage === "processing" && "Structuring your thoughts…"}
                  {stage === "ready" && (speech.supported ? "Ready when you are" : "Speech not supported in this browser")}
                </div>
                <div className="text-xs text-muted-foreground">
                  {stage === "recording"
                    ? "Speak naturally — tap the square to stop."
                    : speech.error ?? "Or open an existing note from the sidebar."}
                </div>
              </div>
            </div>

            {/* Live waveform */}
            {stage === "recording" && (
              <div className="flex h-10 items-center gap-[3px]">
                {Array.from({ length: 22 }).map((_, i) => (
                  <span key={i} className="wave-bar w-1 rounded-full bg-primary/80" style={{ animationDelay: `${i * 70}ms`, height: "100%" }} />
                ))}
              </div>
            )}
            {stage === "processing" && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 animate-pulse text-primary" />
                Detecting parent ideas, child concepts, and tasks…
              </div>
            )}
          </div>
        </div>

        {/* Canvas */}
        <div ref={canvasRef} className="relative flex-1 overflow-hidden">
          <div className="pointer-events-none absolute inset-0 opacity-60" style={{ background: "var(--gradient-hero)" }} />
          {stage === "processing" ? (
            <div className="grid h-full place-items-center">
              <div className="text-center">
                <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-gradient-amber shadow-glow">
                  <Sparkles className="h-5 w-5 text-primary-foreground animate-pulse" />
                </div>
                <div className="text-sm font-medium">Building your mind map</div>
                <div className="mt-1 text-xs text-muted-foreground">This usually takes a few seconds.</div>
              </div>
            </div>
          ) : mindMap ? (
            <MindMapCanvas map={mindMap} />
          ) : (
            <div className="grid h-full place-items-center text-center">
              <div>
                <div className="text-sm font-medium">No mind map yet</div>
                <div className="mt-1 text-xs text-muted-foreground">Record a note to see your thoughts as a graph.</div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
