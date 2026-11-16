import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
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
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              type="button"
              aria-label="Why is registration unique?"
              className="text-muted-foreground hover:text-foreground transition-colors p-1 shrink-0 rounded-md cursor-pointer"
            >
              <CircleHelp className="size-4.5" />
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs text-xs bg-popover/95 border border-border/60 shadow-xl">
              <p>
                No passwords. Your session lives in a secure cookie on this
                device. All that's left is personalization.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </header>
      <p className="text-muted-foreground text-xs sm:text-sm mt-1">
        Pick your avatar, choose your name, and you're done.
      </p>
    </article>
  );
}
