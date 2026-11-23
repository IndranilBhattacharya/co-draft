import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { CircleHelp } from "lucide-react";

export default function RegistrationHeader() {
  return (
    <article className="flex flex-col items-start w-full">
      <header className="w-full flex items-center justify-between gap-2">
        <h2 className="text-base sm:text-lg font-semibold tracking-tight text-foreground">
          You're <span className="font-bold text-foreground">Unique</span>. So Is Your{" "}
          <span className="font-bold text-foreground">Registration</span>.
        </h2>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="Why is registration unique?"
              className="text-muted-foreground/60 hover:text-foreground transition-colors p-1 shrink-0 rounded-lg hover:bg-white/5 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <CircleHelp className="size-4.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            align="end"
            sideOffset={8}
            className="max-w-xs"
          >
            <p>
              Zero passwords to remember. Your session is quietly tied to this browser—just grab a handle, pick an avatar, and start drafting.
            </p>
          </TooltipContent>
        </Tooltip>
      </header>
      <p className="text-muted-foreground text-xs mt-0.5">
        Pick your avatar, choose your name, and you're done.
      </p>
    </article>
  );
}
