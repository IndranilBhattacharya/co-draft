// /register: pick an avatar and a name, and you're in. The server answers by setting
// the session cookie, so there is nothing to store on our side.
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Dices } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { Avatar } from "@/components/Avatar";
import LandingGreeting from "@/components/LandingGreeting";
import RegistrationHeader from "@/components/RegistrationHeader";
import { BackgroundBeams } from "@/components/ui/BackgroundBeams";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { auth, meQuery } from "@/lib/rest";

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
    const user = await context.queryClient.ensureQueryData(meQuery).catch(() => null);
    if (user) throw redirect({ to: "/" });
  },
  component: RegisterPage,
});

function RegisterPage() {
  const { redirect: next } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
  const avatar = useWatch({ control, name: "avatar" });

  const signUp = useMutation({
    mutationFn: auth.register,
    onSuccess: (user) => {
      queryClient.setQueryData(meQuery.queryKey, user); // skip a refetch of /me
      void navigate({ href: next ?? "/" });
    },
  });

  return (
    <main className="relative min-h-dvh w-full overflow-y-auto md:overflow-hidden flex items-center justify-center p-4 sm:p-6 md:p-8">
      <BackgroundBeams />
      <div className="z-10 relative flex flex-col md:flex-row items-center justify-center gap-6 sm:gap-8 md:gap-12 w-full max-w-6xl my-auto py-6 md:py-0">
        <LandingGreeting />

        <form
          onSubmit={handleSubmit((data) => signUp.mutate(data))}
          className="p-6 sm:p-8 md:p-10 w-full max-w-lg md:max-w-none md:w-1/2 flex flex-col bg-card/60 rounded-2xl sm:rounded-3xl shadow-2xl backdrop-blur-xl border border-border/60"
        >
          <RegistrationHeader />

          <div className="w-full sm:w-4/5 md:w-full lg:w-4/5 flex flex-col mx-auto items-center justify-center py-6 sm:py-8">
            <section className="gap-4 flex items-center justify-center">
              <div className="relative">
                <Avatar
                  seed={avatar}
                  className="size-16 sm:size-20 rounded-full ring-2 ring-primary/40 shadow-2xl shrink-0"
                />
              </div>
              <Button
                size="sm"
                type="button"
                variant="outline"
                onClick={() => setValue("avatar", crypto.randomUUID())}
                className="gap-1.5 h-9 px-3 text-xs font-medium border-border/80 hover:bg-accent hover:text-foreground"
              >
                <Dices className="size-4" /> Reroll
              </Button>
            </section>

            <section className="mt-6 sm:mt-8 w-full">
              <Input
                autoFocus
                type="text"
                id="userName"
                {...register("name")}
                placeholder="What Should We Call You?"
                className="h-11 sm:h-12 text-sm sm:text-base rounded-xl bg-background/60 border-border/80 focus:border-primary/80 transition-colors"
              />
              {errors.name && (
                <p className="mt-2 text-start text-xs text-red-400 font-medium">{errors.name.message}</p>
              )}
            </section>

            <Button
              className="mt-4 w-full h-11 sm:h-12 text-sm sm:text-base font-semibold rounded-xl shadow-lg transition-all"
              disabled={signUp.isPending}
            >
              {signUp.isPending ? "Setting you up…" : "Let's Go"}
            </Button>
            {signUp.error && (
              <p className="mt-2 text-start text-xs text-red-400 font-medium">{signUp.error.message}</p>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}
