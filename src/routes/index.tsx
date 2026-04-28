import { createFileRoute, Link } from "@tanstack/react-router";
import { Mic, Sparkles, GitBranch, Download, ArrowRight, Check, Brain, Zap } from "lucide-react";
import { Header } from "@/components/voxnode/Header";
import { Footer } from "@/components/voxnode/Footer";
import { NeuralBackground } from "@/components/voxnode/NeuralBackground";

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
        {/* Ambient amber glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/3 -z-0 h-[520px] w-[820px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-[120px]"
          style={{ background: "radial-gradient(closest-side, oklch(0.78 0.15 65 / 0.55), transparent)" }}
        />
        <div className="relative mx-auto grid min-h-[88vh] max-w-7xl grid-cols-12 items-center gap-6 px-6 pb-24 pt-16 md:pt-24">
          {/* Left: waveform */}
          <div className="col-span-12 hidden h-[260px] items-center justify-center md:col-span-3 md:flex lg:col-span-2">
            <HeroWaveform />
          </div>

          {/* Center: headline + CTA */}
          <div className="col-span-12 flex flex-col items-center text-center md:col-span-6 lg:col-span-8">
            <span className="glass mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" />
              Voice → Structured thought
            </span>
            <h1 className="text-balance text-4xl font-semibold leading-[1.04] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Visualizing thought:
              <br />
              <span className="text-gradient-amber">the neural canvas</span>
              <br />
              for your ideas
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground md:text-lg">
              The modern SaaS platform transforming spoken inputs into actionable mental models.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/signup"
                className="group inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-gradient-amber px-7 py-3.5 text-sm font-medium text-primary-foreground shadow-glow transition-transform hover:scale-[1.02]"
              >
                Start Mapping for Free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a href="#how" className="glass rounded-xl px-6 py-3.5 text-sm font-medium hover:bg-white/[0.04]">
                See how it works
              </a>
            </div>

            {/* Mobile-only compact visuals */}
            <div className="mt-12 grid w-full grid-cols-2 gap-4 md:hidden">
              <div className="glass flex h-32 items-center justify-center rounded-2xl p-3">
                <HeroWaveform />
              </div>
              <div className="glass flex h-32 items-center justify-center rounded-2xl p-3">
                <HeroNodes />
              </div>
            </div>
          </div>

          {/* Right: node graph */}
          <div className="col-span-12 hidden h-[320px] items-center justify-center md:col-span-3 md:flex lg:col-span-2">
            <HeroNodes />
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

function HeroWaveform() {
  const bars = Array.from({ length: 34 });
  return (
    <div className="flex h-full w-full items-center justify-center gap-[3px]">
      {bars.map((_, i) => {
        const center = Math.abs(i - bars.length / 2) / (bars.length / 2);
        const base = 1 - center * 0.85;
        return (
          <span
            key={i}
            className="wave-bar w-[3px] rounded-full bg-gradient-amber"
            style={{
              height: `${20 + base * 180}px`,
              animationDelay: `${i * 55}ms`,
              opacity: 0.45 + base * 0.55,
            }}
          />
        );
      })}
    </div>
  );
}

function HeroNodes() {
  return (
    <svg viewBox="0 0 260 320" className="h-full w-full" aria-hidden>
      <defs>
        <radialGradient id="heroNode" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="oklch(0.85 0.16 75)" />
          <stop offset="100%" stopColor="oklch(0.5 0.12 50)" />
        </radialGradient>
      </defs>
      <g stroke="oklch(0.78 0.13 70 / 0.45)" strokeWidth="1">
        <line x1="130" y1="160" x2="40" y2="60" />
        <line x1="130" y1="160" x2="220" y2="55" />
        <line x1="130" y1="160" x2="35" y2="250" />
        <line x1="130" y1="160" x2="225" y2="270" />
        <line x1="130" y1="160" x2="130" y2="40" />
        <line x1="40" y1="60" x2="35" y2="250" />
        <line x1="220" y1="55" x2="225" y2="270" />
      </g>
      <circle cx="130" cy="160" r="20" fill="url(#heroNode)" className="animate-float" />
      <circle cx="40" cy="60" r="11" fill="url(#heroNode)" opacity="0.95" />
      <circle cx="220" cy="55" r="13" fill="url(#heroNode)" opacity="0.9" />
      <circle cx="35" cy="250" r="9" fill="url(#heroNode)" opacity="0.85" />
      <circle cx="225" cy="270" r="14" fill="url(#heroNode)" opacity="0.95" />
      <circle cx="130" cy="40" r="8" fill="url(#heroNode)" opacity="0.8" />
    </svg>
  );
}
