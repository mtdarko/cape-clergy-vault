import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { openFile } from "@/components/submission-utils";

export const Route = createFileRoute("/_authenticated/repository")({
  head: () => ({ meta: [{ title: "Repository — Theological Repository" }, { name: "description", content: "Accepted theological works shared among clergy." }] }),
  component: Repository,
});

function Repository() {
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["accepted"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data: p } = await supabase.from("profiles").select("popia_accepted_at").eq("id", u.user!.id).maybeSingle();
      if (!p?.popia_accepted_at) return null;
      const { data } = await supabase.from("submissions").select("*").eq("status", "accepted").order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  if (data === null) return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p>Please <Link to="/dashboard" className="text-primary underline">complete your registration and POPIA acknowledgement</Link> to browse the repository.</p>
    </main>
  );
  const items = (data ?? []).filter((s) => !q || `${s.title} ${s.abstract} ${s.keywords} ${s.category}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-4xl font-semibold text-primary">The Repository</h1>
      <p className="mt-1 text-muted-foreground">Works accepted by the Dean of Theological Studies for sharing among clergy.</p>
      <Input className="mt-6 max-w-md" placeholder="Search titles, keywords, categories…" value={q} onChange={(e) => setQ(e.target.value)} />
      {isLoading && <p className="mt-6 text-muted-foreground">Loading…</p>}
      {!isLoading && !items.length && <p className="mt-6 text-sm text-muted-foreground">No accepted works yet.</p>}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {items.map((s) => (
          <article key={s.id} className="rounded-lg border border-border bg-card p-5">
            <div className="flex gap-2"><Badge variant="outline">{s.category}</Badge><Badge variant="secondary">{s.kind}</Badge></div>
            <h2 className="mt-2 text-xl font-semibold">{s.title}</h2>
            <p className="mt-2 line-clamp-4 text-sm text-muted-foreground">{s.abstract}</p>
            {s.keywords && <p className="mt-2 text-xs text-muted-foreground">Keywords: {s.keywords}</p>}
            {s.file_path && <Button size="sm" variant="outline" className="mt-3" onClick={() => openFile(s.id)}>Read document</Button>}
          </article>
        ))}
      </div>
    </main>
  );
}
