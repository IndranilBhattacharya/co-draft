import { FileDown, Sparkles, Users } from "lucide-react";

export default function LandingGreeting() {
  return (
    <div className="w-full md:w-1/2 flex flex-col justify-between p-6 sm:p-8 md:p-10 bg-card/60 rounded-2xl sm:rounded-3xl shadow-2xl backdrop-blur-xl border border-border/60 transition-all">
      <div className="flex flex-col items-start gap-4 sm:gap-6 w-full">
        {/* Pulsing Real-time Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.12)] select-none">
          <span className="relative flex size-2 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
          </span>
          Multiplayer drafting • Zero drama
        </div>

        {/* Brand Headline */}
        <div className="relative group">
          <div className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight select-none">
            <span className="bg-gradient-to-r from-gray-100 via-gray-200 to-gray-400 bg-clip-text text-transparent drop-shadow-sm">
              Co
            </span>
            <span className="text-foreground">Draft</span>
          </div>
          {/* Subtle Ambient Brand Glow */}
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-sky-500/10 to-indigo-500/10 blur-xl opacity-60 pointer-events-none -z-10" />
        </div>

        {/* Lead Subtitle */}
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-md">
          Instant live collaboration with zero clutter. Just drop in, write together, and bounce.
        </p>

        {/* Feature Highlights - Clean, Minimal & Premium */}
        <div className="w-full flex flex-col gap-3 pt-3 sm:pt-4 border-t border-border/30 select-none">
          <div className="group flex items-start gap-3 p-2 -mx-2 rounded-xl transition-colors hover:bg-white/[0.03]">
            <div className="size-7 sm:size-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0 group-hover:scale-105 transition-transform mt-0.5">
              <Sparkles className="size-3.5 sm:size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xs font-semibold text-foreground/90">No Sign-Up Nonsense</h3>
              <p className="text-[11px] sm:text-xs text-muted-foreground/80 leading-snug mt-0.5">
                No passwords, no activation emails. Start drafting in one click.
              </p>
            </div>
          </div>

          <div className="group flex items-start gap-3 p-2 -mx-2 rounded-xl transition-colors hover:bg-white/[0.03]">
            <div className="size-7 sm:size-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 transition-transform mt-0.5">
              <Users className="size-3.5 sm:size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xs font-semibold text-foreground/90">Zero Merge Drama</h3>
              <p className="text-[11px] sm:text-xs text-muted-foreground/80 leading-snug mt-0.5">
                Real-time live sync so nobody accidentally overwrites your genius.
              </p>
            </div>
          </div>

          <div className="group flex items-start gap-3 p-2 -mx-2 rounded-xl transition-colors hover:bg-white/[0.03]">
            <div className="size-7 sm:size-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 group-hover:scale-105 transition-transform mt-0.5">
              <FileDown className="size-3.5 sm:size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xs font-semibold text-foreground/90">Instant Crisp PDFs</h3>
              <p className="text-[11px] sm:text-xs text-muted-foreground/80 leading-snug mt-0.5">
                Publication-ready vector exports before your boss can ask for an update.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info & Copyright */}
      <div className="pt-4 mt-4 border-t border-border/30 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground/60 select-none">
        <span className="font-medium tracking-tight">
          © {new Date().getFullYear()} Indranil Bhattacharya
        </span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/40 font-mono">
          Edge Ready • v1.0
        </span>
      </div>
    </div>
  );
}
