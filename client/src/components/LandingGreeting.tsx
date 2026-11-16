export default function LandingGreeting() {
  return (
    <div className="w-full md:w-1/2 h-auto md:h-full flex flex-col justify-between py-2 sm:py-6 md:py-12 items-start text-left">
      <div className="gap-2 flex flex-col items-start">
        <div className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight">
          <span className="bg-gradient-to-r from-gray-300 to-gray-700 bg-clip-text text-transparent">
            Co
          </span>
          <span>Draft</span>
        </div>
        <div className="text-sm sm:text-base md:text-xl text-muted-foreground mt-1 sm:mt-2">
          Instant collaboration. No clutter. Just draft and go.
        </div>
      </div>
      <div className="hidden md:block mt-auto text-xs text-muted-foreground">
        © {new Date().getFullYear()} Indranil Bhattacharya. All Rights Reserved.
      </div>
    </div>
  );
}
