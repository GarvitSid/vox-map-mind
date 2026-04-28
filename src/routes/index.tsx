import { createFileRoute, Link } from "@tanstack/react-router";
import { Mic, Sparkles, GitBranch, Download, ArrowRight, Check, Brain, Zap } from "lucide-react";
import { Header } from "@/components/voxnode/Header";
import { Footer } from "@/components/voxnode/Footer";
import { NeuralBackground } from "@/components/voxnode/NeuralBackground";
import { HeroVisual } from "@/components/voxnode/HeroVisual";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Hero background */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[900px]" style={{ background: "var(--gradient-hero)" }} />
      <Header />

      {/* HERO */}
      <section className="relative">
        <div className="absolute inset-0 -z-0">
          <NeuralBackground />
        </div>
        <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-28 md:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="glass mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" />
              Voice → Structured thought
            </span>
            <h1 className="text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
              Speak your mind.
              <br />
              <span className="text-gradient-amber">See your thoughts.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
              VoxNode turns rambling voice memos into living mind maps. No more audio graveyards — just clear, visual hierarchies of your ideas.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/signup"
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-amber px-6 py-3.5 text-sm font-medium text-primary-foreground shadow-glow transition-transform hover:scale-[1.02]"
              >
                Start Mapping for Free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a href="#how" className="glass rounded-xl px-6 py-3.5 text-sm font-medium hover:bg-white/[0.04]">
                See how it works
              </a>
            </div>
          </div>

          <div className="mx-auto mt-16 max-w-5xl">
            <HeroVisual />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="relative mx-auto max-w-7xl px-6 py-24">
        <div className="mb-16 text-center">
          <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">From voice to visual in 3 steps</h2>
          <p className="mt-3 text-muted-foreground">No editing, no formatting. Just talk.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: Mic, title: "Tap and talk", body: "Hit record and brainstorm out loud — for 30 seconds or 30 minutes." },
            { icon: Brain, title: "We listen + structure", body: "VoxNode transcribes and detects parent ideas, child concepts, and tasks." },
            { icon: GitBranch, title: "Explore the map", body: "Drag, pan, and refine your thinking on an interactive node canvas." },
          ].map((s, i) => (
            <div key={s.title} className="glass relative rounded-2xl p-7">
              <span className="absolute right-5 top-5 text-xs font-mono text-muted-foreground">0{i + 1}</span>
              <div className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-gradient-amber shadow-glow">
                <s.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="relative mx-auto max-w-7xl px-6 py-24">
        <div className="grid gap-6 md:grid-cols-6">
          <div className="glass md:col-span-4 rounded-2xl p-8">
            <Zap className="h-6 w-6 text-primary" />
            <h3 className="mt-4 text-2xl font-semibold tracking-tight">Friction-free thinking</h3>
            <p className="mt-2 max-w-md text-muted-foreground">
              No menus, no formatting taxes. The fastest path between your brain and a structured artifact you can actually use.
            </p>
          </div>
          <div className="glass md:col-span-2 rounded-2xl p-8">
            <Download className="h-6 w-6 text-primary" />
            <h3 className="mt-4 text-2xl font-semibold tracking-tight">One-click export</h3>
            <p className="mt-2 text-sm text-muted-foreground">PNG snapshots or nested Markdown — drop into Notion, Obsidian, or anywhere.</p>
          </div>
          <div className="glass md:col-span-2 rounded-2xl p-8">
            <Brain className="h-6 w-6 text-primary" />
            <h3 className="mt-4 text-2xl font-semibold tracking-tight">Built for ND minds</h3>
            <p className="mt-2 text-sm text-muted-foreground">Thinks in tangents so you can. Non-linear input becomes linear output.</p>
          </div>
          <div className="glass md:col-span-4 rounded-2xl p-8">
            <GitBranch className="h-6 w-6 text-primary" />
            <h3 className="mt-4 text-2xl font-semibold tracking-tight">A canvas, not a transcript</h3>
            <p className="mt-2 max-w-md text-muted-foreground">
              Every memo becomes a draggable node graph. Reshape your thinking without retyping a word.
            </p>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="relative mx-auto max-w-7xl px-6 py-24">
        <div className="mb-14 text-center">
          <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">Simple pricing</h2>
          <p className="mt-3 text-muted-foreground">Start free. Upgrade when your ideas outgrow you.</p>
        </div>
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {[
            { name: "Free", price: "$0", note: "Forever", features: ["10 voice notes / mo", "Up to 3 min per note", "PNG + Markdown export"], cta: "Start free", highlight: false },
            { name: "Pro", price: "$12", note: "per month", features: ["Unlimited notes", "Up to 60 min per note", "Priority transcription", "Custom node themes"], cta: "Go Pro", highlight: true },
            { name: "Team", price: "$28", note: "per seat / mo", features: ["Everything in Pro", "Shared workspaces", "Realtime collaboration", "SSO"], cta: "Contact us", highlight: false },
          ].map((p) => (
            <div
              key={p.name}
              className={`glass relative rounded-2xl p-7 ${p.highlight ? "shadow-glow ring-1 ring-primary/40" : ""}`}
            >
              {p.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-amber px-3 py-1 text-xs font-medium text-primary-foreground">
                  Most popular
                </span>
              )}
              <div className="text-sm text-muted-foreground">{p.name}</div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight">{p.price}</span>
                <span className="text-sm text-muted-foreground">/ {p.note}</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/signup"
                className={`mt-7 block rounded-xl px-4 py-2.5 text-center text-sm font-medium transition-colors ${
                  p.highlight
                    ? "bg-gradient-amber text-primary-foreground shadow-glow"
                    : "bg-secondary text-foreground hover:bg-secondary/70"
                }`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="glass relative overflow-hidden rounded-3xl p-12 text-center shadow-glass">
          <div className="absolute inset-0 -z-10 opacity-50" style={{ background: "var(--gradient-hero)" }} />
          <h2 className="text-4xl font-semibold tracking-tight">Your next idea is one tap away.</h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">Join the thinkers turning voice into structured insight.</p>
          <Link to="/signup" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-gradient-amber px-6 py-3.5 text-sm font-medium text-primary-foreground shadow-glow">
            Start Mapping for Free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
