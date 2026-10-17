import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PopiaNotice } from "@/components/PopiaNotice";
import { POPIA_VERSION, registerSchema } from "@/lib/popia";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Clergy sign in & registration — Theological Repository" },
      { name: "description", content: "Register as clergy and acknowledge POPIA to submit documents to the TEFT." },
      { property: "og:title", content: "Clergy sign in & registration" },
      { property: "og:description", content: "Register and acknowledge POPIA to access the theological repository." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "register">("register");
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ title: "Rev.", full_name: "", parish: "", phone: "", email: "", password: "", popia: false });
  const navigate = useNavigate();
  const set = (k: string, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email: f.email, password: f.password });
        if (error) throw error;
        navigate({ to: "/dashboard" });
      } else {
        const parsed = registerSchema.safeParse(f);
        if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Invalid input"); return; }
        const { popia: _p, email, password, ...meta } = parsed.data;
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin + "/dashboard", data: { ...meta, popia_version: POPIA_VERSION } },
        });
        if (error) throw error;
        if (data.session) navigate({ to: "/dashboard" });
        else toast.success("Registration received. Please check your email to confirm your account.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally { setBusy(false); }
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) { toast.error("Google sign-in failed"); return; }
    if (r.redirected) return;
    navigate({ to: "/dashboard" });
  };

  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <h1 className="text-4xl font-semibold text-primary">{mode === "register" ? "Clergy registration" : "Welcome back"}</h1>
      <p className="mt-2 text-muted-foreground">
        {mode === "register" ? "Register and acknowledge the POPIA notice to gain submission access." : "Sign in to your repository account."}
      </p>
      <form onSubmit={submit} className="mt-8 space-y-4 rounded-lg border border-border bg-card p-6">
        {mode === "register" && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Title</Label>
                <select className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm" value={f.title} onChange={(e) => set("title", e.target.value)}>
                  {["Rev.", "Rev. Canon", "Ven.", "Very Rev.", "Rt Rev.", "Deacon", "Dr", "Other"].map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="col-span-2"><Label>Full name</Label><Input className="mt-1" value={f.full_name} onChange={(e) => set("full_name", e.target.value)} required /></div>
            </div>
            <div><Label>Parish / ministry</Label><Input className="mt-1" value={f.parish} onChange={(e) => set("parish", e.target.value)} required /></div>
            <div><Label>Phone (optional)</Label><Input className="mt-1" value={f.phone} onChange={(e) => set("phone", e.target.value)} /></div>
          </>
        )}
        <div><Label>Email</Label><Input className="mt-1" type="email" value={f.email} onChange={(e) => set("email", e.target.value)} required /></div>
        <div><Label>Password</Label><Input className="mt-1" type="password" value={f.password} onChange={(e) => set("password", e.target.value)} required /></div>
        {mode === "register" && (
          <>
            <PopiaNotice />
            <label className="flex items-start gap-3 text-sm">
              <Checkbox checked={f.popia} onCheckedChange={(v) => set("popia", v === true)} className="mt-0.5" />
              <span>I have read and understood the POPIA notice and consent to the processing of my personal information as described.</span>
            </label>
          </>
        )}
        <Button type="submit" className="w-full" disabled={busy || (mode === "register" && !f.popia)}>
          {mode === "register" ? "Register" : "Sign in"}
        </Button>
        <Button type="button" variant="outline" className="w-full" onClick={google}>Continue with Google</Button>
      </form>
      <button className="mt-4 text-sm text-primary underline" onClick={() => setMode(mode === "register" ? "signin" : "register")}>
        {mode === "register" ? "Already registered? Sign in" : "New here? Register as clergy"}
      </button>
    </main>
  );
}
