export function LoadingScreen({ message = "Loading CoDraft…" }: Readonly<{ message?: string }>) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-dvh w-full flex flex-col items-center justify-center bg-background text-foreground p-4 select-none"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-xl bg-card border border-border/70 flex items-center justify-center shadow-lg">
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 16H24M8 10H20M8 22H16" stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-2xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-gray-100 via-gray-300 to-gray-500 bg-clip-text text-transparent">Co</span>
            <span className="text-foreground">Draft</span>
          </span>
        </div>

        <div className="w-36 h-1 bg-muted rounded-full overflow-hidden relative">
          <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full w-1/3 animate-[codraft-pulse_1.2s_ease-in-out_infinite]" />
        </div>

        <p className="text-xs text-muted-foreground/80 font-medium">{message}</p>
      </div>

      <style>{`
        @keyframes codraft-pulse {
          0% { left: -35%; width: 30%; }
          50% { left: 35%; width: 45%; }
          100% { left: 100%; width: 30%; }
        }
      `}</style>
    </div>
  );
}
