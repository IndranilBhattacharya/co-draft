// /register: pick an avatar and a name, and you're in. The server answers by setting
// the session cookie, so there is nothing to store on our side.
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Dices } from "lucide-react";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { Avatar } from "@/components/Avatar";
import RegistrationHeader from "@/components/RegistrationHeader";
import { BackgroundBeams } from "@/components/ui/BackgroundBeams";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { auth, isLocallyAuthenticated, meQuery, warmupBackend } from "@/lib/rest";

const formSchema = z.object({
  avatar: z.string().min(1, "Avatar is required"),
  name: z.string().trim().min(3, "Username must be at least 3 characters").max(32),
});

// ?redirect=/join/abc brings people back to where they were headed.
// Only same-site paths ("/x", never "//evil.com") to avoid an open redirect.
const searchSchema = z.object({
  redirect: z.string().regex(/^\/(?!\/)/).optional().catch(undefined),
});

export const Route = createFileRoute("/register")({
  validateSearch: searchSchema,
  beforeLoad: async ({ context }) => {
    // Only query server for existing session if the browser recorded a local login.
    // Skips 50s cold-start delays on sleeping backends for first-time visitors!
    if (isLocallyAuthenticated()) {
      const user = await context.queryClient.ensureQueryData(meQuery).catch(() => null);
      if (user) throw redirect({ to: "/" });
    }
  },
  pendingComponent: () => <LoadingScreen message="Loading registration…" />,
  component: RegisterPage,
});

function RegisterPage() {
  const { redirect: next } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Silently wake up sleeping backend services in the background while user fills form
  useEffect(() => {
    warmupBackend();
  }, []);

  const {
    control,
    setValue,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { avatar: crypto.randomUUID(), name: "" },
  });
  const avatar = useWatch({ control, name: "avatar" }) ?? "default-avatar";

  const signUp = useMutation({
    mutationFn: auth.register,
    onSuccess: (user) => {
      queryClient.setQueryData(meQuery.queryKey, user); // skip a refetch of /me
      void navigate({ href: next ?? "/" });
    },
  });

  return (
    <main className="relative h-dvh min-h-dvh w-full overflow-y-auto flex flex-col items-center justify-center px-4 py-2 sm:py-4">
      <BackgroundBeams />

      <div className="z-10 relative flex flex-col items-center justify-center w-full max-w-md my-auto">
        {/* Brand Headline - Hero Sizing & Crisp Visual Hierarchy */}
        <div className="flex flex-col items-center text-center mb-3 sm:mb-4 select-none">
          <div className="relative inline-block">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-gray-100 via-gray-200 to-gray-400 bg-clip-text text-transparent drop-shadow-sm">
                Co
              </span>
              <span className="text-foreground">Draft</span>
            </h1>
            {/* Subtle Ambient Brand Glow */}
            <div className="absolute -inset-x-8 -inset-y-3 rounded-full bg-gradient-to-r from-sky-500/15 via-indigo-500/10 to-purple-500/15 blur-2xl opacity-70 pointer-events-none -z-10" />
          </div>
          <p className="mt-1 sm:mt-1.5 text-xs sm:text-sm text-muted-foreground/80 font-normal tracking-wide max-w-sm">
            Instant peer collaboration. Zero clutter. Just draft and go.
          </p>
        </div>

        {/* Polished Centered Registration Card */}
        <form
          onSubmit={handleSubmit((data) => signUp.mutate(data))}
          className="p-5 sm:p-6 md:p-7 w-full flex flex-col justify-between bg-card/60 rounded-2xl sm:rounded-3xl shadow-2xl backdrop-blur-xl border border-border/60 transition-all"
        >
          <div>
            <RegistrationHeader />

            <div className="w-full flex flex-col items-center justify-center pt-3.5 sm:pt-4 pb-1">
              <section className="gap-3.5 flex items-center justify-center">
                <div className="relative">
                  <Avatar
                    seed={avatar}
                    className="size-14 sm:size-16 rounded-full ring-2 ring-primary/40 shadow-2xl shrink-0"
                  />
                </div>
                <Button
                  size="sm"
                  type="button"
                  variant="outline"
                  onClick={() => setValue("avatar", crypto.randomUUID())}
                  className="gap-1.5 h-8 sm:h-8.5 px-3 text-xs font-medium border-border/80 hover:bg-accent hover:text-foreground cursor-pointer rounded-xl transition-colors"
                >
                  <Dices className="size-3.5 sm:size-4" /> Reroll
                </Button>
              </section>

              <section className="mt-3.5 sm:mt-4 w-full">
                <Input
                  autoFocus
                  type="text"
                  id="userName"
                  {...register("name")}
                  placeholder="What Should We Call You?"
                  className="h-10 sm:h-11 text-sm rounded-xl bg-background/60 border-border/80 focus:border-primary/80 transition-colors"
                />
                {errors.name && (
                  <p className="mt-1.5 text-start text-xs text-red-400 font-medium">{errors.name.message}</p>
                )}
              </section>

              <Button
                className="mt-3 w-full h-10 sm:h-11 text-sm font-semibold rounded-xl shadow-lg transition-all cursor-pointer"
                disabled={signUp.isPending}
              >
                {signUp.isPending ? "Setting you up…" : "Let's Go"}
              </Button>
              {signUp.error && (
                <p className="mt-1.5 text-start text-xs text-red-400 font-medium">{signUp.error.message}</p>
              )}
            </div>
          </div>

          <div className="pt-2.5 mt-1 border-t border-border/30 text-center">
            <span className="text-[11px] text-muted-foreground/60">
              Session securely tied to this browser • No password required
            </span>
          </div>
        </form>

        {/* Global Footer Attribution */}
        <div className="mt-3 sm:mt-4 text-center select-none">
          <p className="text-[10px] sm:text-[11px] text-muted-foreground/50">
            © {new Date().getFullYear()} Indranil Bhattacharya • <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/40">Edge Ready v1.0</span>
          </p>
        </div>
      </div>
    </main>
  );
}
