import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { localMessages } from "@/lib/outbox";
import { OfflineComposer } from "@/components/OfflineComposer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/offline")({
  head: () => ({ meta: [
    { title: "Offline drafts — TEFT Repository" }, { name: "description", content: "Private message drafts saved on your device." },
    { property: "og:title", content: "Offline drafts — TEFT Repository" }, { property: "og:description", content: "Your queued TEFT messages." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: Offline,
});
function Offline() {
  const [userId, setUserId] = useState<string | null>(null);
  const [owners, setOwners] = useState<string[]>([]);
  useEffect(() => { let active = true;
    // Local session identifies this device's drafts only; online delivery revalidates identity and RLS.
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session || !active) return;
      const id = data.session.user.id;
      const rows = await localMessages(id);
      if (active) { setUserId(id); setOwners([...new Set([id, ...rows.map((m) => m.ownerId)])]); }
    });
    return () => { active = false; };
  }, []);
  return <main className="mx-auto max-w-3xl px-6 py-10"><div className="flex items-center gap-3"><WifiOff className="size-6 text-primary" /><h1 className="text-3xl text-primary">Offline drafts</h1></div><Button asChild variant="outline" className="my-6"><Link to="/chat">Return to chat</Link></Button>{userId ? owners.map((id, index) => <section key={id} className="mb-6 rounded-md border border-border bg-card"><h2 className="px-4 py-3 text-xl">{id === userId ? "Your TEFT conversation" : `Saved conversation ${index + 1}`}</h2><OfflineComposer userId={userId} ownerId={id} /></section>) : <p className="text-muted-foreground">Sign in while connected before saving offline drafts.</p>}</main>;
}