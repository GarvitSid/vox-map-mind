import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Mic, Square, Plus, Search, Download, FileText, ImageIcon, Waves, Settings, LogOut, Sparkles } from "lucide-react";
import { mockNotes, mockMindMap, type VoiceNote } from "@/data/mockData";
import { MindMapCanvas } from "@/components/voxnode/MindMapCanvas";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard — VoxNode" }] }),
});

type Stage = "idle" | "recording" | "processing" | "ready";

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function Dashboard() {
  const [notes] = useState<VoiceNote[]>(mockNotes);
  const [activeId, setActiveId] = useState<string>(mockNotes[0].id);
  const [stage, setStage] = useState<Stage>("ready");
  const [query, setQuery] = useState("");

  const filtered = notes.filter((n) => n.title.toLowerCase().includes(query.toLowerCase()));
  const active = notes.find((n) => n.id === activeId) ?? notes[0];

  const startRecording = () => {
    setStage("recording");
    setTimeout(() => {
      setStage("processing");
      setTimeout(() => setStage("ready"), 1600);
    }, 2400);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="hidden w-72 shrink-0 flex-col border-r border-border/60 bg-card/40 p-4 md:flex">
        <Link to="/" className="mb-6 flex items-center gap-2 px-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-amber shadow-glow">
            <Waves className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-base font-semibold tracking-tight">VoxNode</span>
        </Link>

        <button className="mb-4 flex items-center justify-center gap-2 rounded-xl bg-gradient-amber px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-glow hover:scale-[1.01] transition-transform">
          <Plus className="h-4 w-4" /> New voice note
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
          {filtered.map((n) => {
            const isActive = n.id === activeId;
            return (
              <button
                key={n.id}
                onClick={() => setActiveId(n.id)}
                className={`group w-full rounded-lg px-3 py-2.5 text-left transition-colors ${
                  isActive ? "bg-secondary/70" : "hover:bg-secondary/40"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">{n.title}</span>
                  <span className="shrink-0 text-[10px] text-muted-foreground">{fmtDate(n.createdAt)}</span>
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <Mic className="h-3 w-3" /> {n.duration}
                  <span className="truncate">· {n.preview}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-xs font-medium">A</div>
            <div>
              <div className="text-xs font-medium">Ada L.</div>
              <div className="text-[10px] text-muted-foreground">Pro plan</div>
            </div>
          </div>
          <div className="flex gap-1">
            <button className="rounded-md p-1.5 hover:bg-secondary/60"><Settings className="h-4 w-4 text-muted-foreground" /></button>
            <Link to="/" className="rounded-md p-1.5 hover:bg-secondary/60"><LogOut className="h-4 w-4 text-muted-foreground" /></Link>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <div>
            <div className="text-xs text-muted-foreground">Voice note</div>
            <h1 className="text-lg font-semibold tracking-tight">{active.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="glass inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium hover:bg-white/[0.04]">
              <ImageIcon className="h-3.5 w-3.5" /> Export PNG
            </button>
            <button className="glass inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium hover:bg-white/[0.04]">
              <FileText className="h-3.5 w-3.5" /> Export Markdown
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg bg-gradient-amber px-3 py-2 text-xs font-medium text-primary-foreground shadow-glow">
              <Download className="h-3.5 w-3.5" /> Share
            </button>
          </div>
        </div>

        {/* Record stage */}
        <div className="border-b border-border/60 px-6 py-5">
          <div className="glass flex items-center justify-between gap-6 rounded-2xl px-5 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={stage === "recording" ? () => setStage("processing") : startRecording}
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
                  {stage === "recording" && "Listening…"}
                  {stage === "processing" && "Structuring your thoughts…"}
                  {stage === "ready" && "Ready when you are"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {stage === "recording" ? "Speak naturally — we'll handle the structure." : "Or open an existing note from the sidebar."}
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
        <div className="relative flex-1 overflow-hidden">
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
          ) : (
            <MindMapCanvas map={mockMindMap} />
          )}
        </div>
      </main>
    </div>
  );
}
