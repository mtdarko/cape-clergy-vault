import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const [email, setEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      setEmail(data.user?.email ?? null);
      if (data.user) {
        const { data: r } = await supabase.rpc("has_role", { _user_id: data.user.id, _role: "admin" });
        setIsAdmin(!!r);
      } else setIsAdmin(false);
    };
    load();
    const { data: sub } = supabase.auth.onAuthStateChange((e) => {
      if (e === "SIGNED_IN" || e === "SIGNED_OUT" || e === "USER_UPDATED") load();
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <Link to="/" className="flex items-center gap-3">
          <span className="font-serif text-3xl leading-none text-primary">✠</span>
          <span className="min-w-0 leading-tight">
            <span className="block font-serif text-lg font-semibold">TEFT Repository</span>
            <span className="block text-xs text-muted-foreground">Theological Education Formation and Training</span>
          </span>
        </Link>
        <nav className="flex flex-wrap items-center gap-1 text-sm">
          {email ? (
            <>
              <Link to="/dashboard" className="rounded px-3 py-2 hover:bg-accent" activeProps={{ className: "bg-accent" }}>My submissions</Link>
              <Link to="/repository" className="rounded px-3 py-2 hover:bg-accent" activeProps={{ className: "bg-accent" }}>Repository</Link>
              <Link to="/chat" className="rounded px-3 py-2 hover:bg-accent" activeProps={{ className: "bg-accent" }}>Chat</Link>
              {!isAdmin && <Link to="/verify-reviewer" className="rounded px-3 py-2 text-muted-foreground hover:bg-accent">Reviewer access</Link>}
              {isAdmin && <Link to="/review" className="rounded px-3 py-2 hover:bg-accent" activeProps={{ className: "bg-accent" }}>Dean's review</Link>}
              <Button variant="outline" size="sm" className="ml-2" onClick={signOut}>Sign out</Button>
            </>
          ) : (
            <Button asChild size="sm"><Link to="/auth">Sign in / Register</Link></Button>
          )}
        </nav>
      </div>
    </header>
  );
}
