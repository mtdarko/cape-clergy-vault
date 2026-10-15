import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { StatusBadge, openFile } from "@/components/submission-utils";

export const Route = createFileRoute("/_authenticated/review")({
  head: () => ({ meta: [{ title: "Dean's review — Theological Repository" }, { name: "description", content: "Review clergy submissions." }] }),
  component: Review,
});

function Review() {
  const { data, isLoading } = useQuery({
    queryKey: ["review"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: u.user!.id, _role: "admin" });
      if (!isAdmin) return null;
      const [{ data: subs }, { data: profs }] = await Promise.all([
        supabase.from("submissions").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("id, title, full_name, parish"),
      ]);
      const byId = new Map((profs ?? []).map((p) => [p.id, p]));
      return (subs ?? []).map((s) => ({ ...s, author: byId.get(s.user_id) }));
    },
  });
  const [filter, setFilter] = useState("open");
  if (isLoading) return <main className="mx-auto max-w-5xl px-6 py-12 text-muted-foreground">Loading…</main>;
  if (data === null) return <main className="mx-auto max-w-5xl px-6 py-12">This area is reserved for the Dean of Theological Studies.</main>;
  const items = (data ?? []).filter((s) => filter === "all" || (filter === "open" ? ["submitted", "under_review"].includes(s.status) : s.status === filter));
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-4xl font-semibold text-primary">Dean's review</h1>
      <div className="mt-6 flex flex-wrap gap-2">
        {[["open", "Awaiting review"], ["accepted", "Accepted"], ["returned", "Returned"], ["all", "All"]].map(([k, l]) => (
          <Button key={k} size="sm" variant={filter === k ? "default" : "outline"} onClick={() => setFilter(k)}>{l}</Button>
        ))}
      </div>
      {!items.length && <p className="mt-6 text-sm text-muted-foreground">Nothing here.</p>}
      <ul className="mt-6 space-y-4">{items.map((s) => <ReviewItem key={s.id} s={s} />)}</ul>
    </main>
  );
}

type Item = { id: string; title: string; kind: string; category: string; abstract: string; keywords: string; status: string; dean_notes: string; file_path: string | null; created_at: string; author?: { title: string; full_name: string; parish: string } | undefined };

function ReviewItem({ s }: { s: Item }) {
  const qc = useQueryClient();
  const [notes, setNotes] = useState(s.dean_notes);
  const update = async (status: string) => {
    const { error } = await supabase.from("submissions").update({ status, dean_notes: notes.slice(0, 2000) }).eq("id", s.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Updated");
    qc.invalidateQueries({ queryKey: ["review"] });
  };
  return (
    <li className="rounded-lg border border-border bg-card p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-serif text-xl font-semibold">{s.title}</span>
        <Badge variant="outline">{s.kind}</Badge><StatusBadge status={s.status} />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{s.author ? `${s.author.title} ${s.author.full_name}, ${s.author.parish}` : "Unknown"} · {s.category} · {new Date(s.created_at).toLocaleDateString()}</p>
      <p className="mt-3 whitespace-pre-wrap text-sm">{s.abstract}</p>
      {s.file_path && <Button size="sm" variant="outline" className="mt-3" onClick={() => openFile(s.file_path!)}>Open document</Button>}
      <Textarea className="mt-3" rows={2} placeholder="Note to the author (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={() => update("under_review")}>Mark under review</Button>
        <Button size="sm" onClick={() => update("accepted")}>Accept & share</Button>
        <Button size="sm" variant="destructive" onClick={() => update("returned")}>Return to author</Button>
      </div>
    </li>
  );
}
