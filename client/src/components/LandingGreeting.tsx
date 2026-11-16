export default function LandingGreeting() {
  return (
    <div className="w-full md:w-1/2 h-auto md:h-full flex flex-col justify-between py-2 sm:py-6 md:py-12 items-start text-left">
      <div className="gap-2.5 sm:gap-3 flex flex-col items-start w-full">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-xs">
          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Real-time collaborative drafting
        </div>
        <div className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight">
          <span className="bg-gradient-to-r from-gray-100 via-gray-300 to-gray-500 bg-clip-text text-transparent">
            Co
          </span>
          <span className="text-foreground">Draft</span>
        </div>
        <div className="text-sm sm:text-base md:text-xl text-muted-foreground leading-relaxed max-w-md">
          Instant peer collaboration. Zero clutter. Just draft and go.
        </div>
      </div>
      <div className="hidden md:block mt-auto text-xs text-muted-foreground/70">
        © {new Date().getFullYear()} Indranil Bhattacharya. All Rights Reserved.
      </div>
    </div>
  );
}
