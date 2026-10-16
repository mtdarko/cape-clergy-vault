import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isFreshOtp } from "./reviewer-rules";

type Ctx = { supabase: any; userId: string };

async function assertAdmin(ctx: Ctx) {
  const { data } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

export const verifyDean = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const claims = context.claims as any;
    const email = String(claims.email ?? "").toLowerCase();
    if (!email) throw new Error("No email on account");
    if (!isFreshOtp(claims.amr, Date.now() / 1000)) throw new Error("Please confirm the emailed code first (within 10 minutes).");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: u } = await supabaseAdmin.auth.admin.getUserById(context.userId);
    if (!u.user?.email_confirmed_at) throw new Error("Email address is not confirmed.");
    const { data: inv } = await supabaseAdmin.from("reviewer_invites").select("*").eq("email", email).maybeSingle();
    if (!inv || inv.used_by) throw new Error("This account has not been authorised as a reviewer.");
    await supabaseAdmin.from("user_roles").upsert({ user_id: context.userId, role: "admin" }, { onConflict: "user_id,role" });
    await supabaseAdmin.from("reviewer_invites").update({ used_by: context.userId, used_at: new Date().toISOString() }).eq("email", email);
    return { ok: true };
  });

export const listReviewers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: roles }, { data: invites }] = await Promise.all([
      supabaseAdmin.from("user_roles").select("user_id").eq("role", "admin"),
      supabaseAdmin.from("reviewer_invites").select("email, used_by").is("used_by", null),
    ]);
    const active = await Promise.all((roles ?? []).map(async (r) => {
      const { data } = await supabaseAdmin.auth.admin.getUserById(r.user_id);
      return { userId: r.user_id, email: data.user?.email ?? "unknown" };
    }));
    return { active, pending: (invites ?? []).map((i) => i.email) };
  });

export const inviteReviewer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { email: string }) => ({ email: String(i.email).trim().toLowerCase().slice(0, 255) }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email)) throw new Error("Invalid email");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("reviewer_invites").upsert({ email: data.email, used_by: null, used_at: null });
    return { ok: true };
  });

export const revokeReviewer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { userId?: string; email?: string }) => i)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.email) await supabaseAdmin.from("reviewer_invites").delete().eq("email", data.email.toLowerCase());
    if (data.userId) {
      if (data.userId === context.userId) throw new Error("Ask another reviewer to revoke your access.");
      // Role removal takes effect on the very next request: every policy checks the role live.
      await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId).eq("role", "admin");
      const { data: u } = await supabaseAdmin.auth.admin.getUserById(data.userId);
      if (u.user?.email) await supabaseAdmin.from("reviewer_invites").delete().eq("email", u.user.email.toLowerCase());
      // End all sessions: a temporary ban revokes refresh tokens and outlasts current access tokens.
      await supabaseAdmin.auth.admin.updateUserById(data.userId, { ban_duration: "1h" });
    }
    return { ok: true };
  });
