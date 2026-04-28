// Audio waveform morphing into geometric nodes
export function HeroVisual() {
  const bars = Array.from({ length: 26 });
  return (
    <div className="glass relative flex h-[340px] w-full items-center justify-between overflow-hidden rounded-3xl p-8 shadow-glass">
      {/* Waveform left */}
      <div className="flex h-full w-2/5 items-center gap-[3px]">
        {bars.map((_, i) => (
          <span
            key={i}
            className="wave-bar w-1.5 flex-1 rounded-full bg-gradient-amber"
            style={{
              animationDelay: `${i * 60}ms`,
              opacity: 0.3 + (i / bars.length) * 0.7,
            }}
          />
        ))}
      </div>

      {/* Morph arrow */}
      <svg className="h-24 w-24 shrink-0 text-primary/60" viewBox="0 0 100 100" fill="none">
        <path d="M10 50 H80 M65 35 L80 50 L65 65" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>

      {/* Node graph right */}
      <svg viewBox="0 0 240 240" className="h-full w-2/5">
        <defs>
          <radialGradient id="nodeg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="oklch(0.82 0.16 75)" />
            <stop offset="100%" stopColor="oklch(0.55 0.12 50)" />
          </radialGradient>
        </defs>
        <line x1="120" y1="120" x2="50" y2="60" stroke="oklch(0.78 0.13 70 / 0.5)" />
        <line x1="120" y1="120" x2="200" y2="60" stroke="oklch(0.78 0.13 70 / 0.5)" />
        <line x1="120" y1="120" x2="60" y2="190" stroke="oklch(0.78 0.13 70 / 0.5)" />
        <line x1="120" y1="120" x2="190" y2="200" stroke="oklch(0.78 0.13 70 / 0.5)" />
        <line x1="50" y1="60" x2="20" y2="120" stroke="oklch(0.78 0.13 70 / 0.3)" />
        <circle cx="120" cy="120" r="22" fill="url(#nodeg)" className="animate-float" />
        <circle cx="50" cy="60" r="13" fill="url(#nodeg)" opacity="0.9" />
        <circle cx="200" cy="60" r="13" fill="url(#nodeg)" opacity="0.9" />
        <circle cx="60" cy="190" r="11" fill="url(#nodeg)" opacity="0.85" />
        <circle cx="190" cy="200" r="14" fill="url(#nodeg)" opacity="0.9" />
        <circle cx="20" cy="120" r="8" fill="url(#nodeg)" opacity="0.7" />
      </svg>
    </div>
  );
}
