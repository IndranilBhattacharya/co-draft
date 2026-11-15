import { Link } from "@tanstack/react-router";

/** Full-screen notice for not-found / ended / error states. */
export function Message({ title, body }: Readonly<{ title: string; body?: string }>) {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-2 p-4 text-center">
      <h1 className="text-2xl font-semibold">{title}</h1>
      {body && <p className="text-muted-foreground">{body}</p>}
      <Link to="/" className="mt-4 text-sm underline underline-offset-4">
        Back to drafts
      </Link>
    </div>
  );
}
