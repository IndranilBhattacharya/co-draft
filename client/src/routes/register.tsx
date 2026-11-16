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
    <main className="relative h-screen w-full overflow-hidden flex items-center justify-center">
      <BackgroundBeams />
      <div className="z-10 absolute inset-y-[2.5vh] inset-x-[5vw] flex items-center text-center">
        <LandingGreeting />

        <form
          onSubmit={handleSubmit((data) => signUp.mutate(data))}
          className="p-8 w-1/2 h-full flex flex-col bg-foreground/5 rounded-3xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur-sm border-b border-white/10"
        >
          <RegistrationHeader />

          <div className="w-1/2 flex flex-col m-auto items-center justify-center">
            <section className="gap-4 flex items-center">
              <Avatar
                seed={avatar}
                className="w-[5vw] aspect-square border border-muted-foreground/50 rounded-full shadow-2xl"
              />
              <Button
                size="sm"
                type="button"
                variant="secondary"
                onClick={() => setValue("avatar", crypto.randomUUID())}
              >
                <Dices /> Reroll
              </Button>
            </section>

            <section className="mt-8 w-full">
              <Input
                autoFocus
                type="text"
                id="userName"
                {...register("name")}
                placeholder="What Should We Call You?"
              />
              {errors.name && (
                <p className="mt-2 text-start text-xs text-red-400">{errors.name.message}</p>
              )}
            </section>
            <Button className="mt-4 w-full" disabled={signUp.isPending}>
              {signUp.isPending ? "Setting you up…" : "Let's Go"}
            </Button>
            {signUp.error && (
              <p className="mt-2 text-start text-xs text-red-400">{signUp.error.message}</p>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}
