<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Project rules

- Access model lives in RLS: clergy see own submissions; admins (Dean, via user_roles 'admin') see/update all; 'accepted' submissions are readable by any POPIA-consented user. Why: enforcement must not depend on UI.
- POPIA consent is stored on profiles (popia_version, popia_accepted_at) and required by RLS for submissions and storage. Why: Google sign-ups cannot carry consent at creation, so a post-session consent gate on /dashboard covers both paths.
- Files go in private bucket `submissions` under `<user_id>/...`, opened via short-lived signed URLs. Why: no public exposure of unreviewed material.
- Reviewer (admin) role is granted only by server fn `verifyDean`: email must be in service-only `reviewer_invites` and the session must come from a fresh emailed code. Why: proves control of the authorised mailbox.
- All document downloads go through `getDownloadUrl` (RLS re-check + audit). Revocation deletes the role and bans the user 1h to kill sessions. Why: per-request enforcement and traceability.
- `audit_log` is append-only (triggers block update/delete/truncate); alerts are computed from it and carry IDs/counts only. Why: tamper-evidence without leaking confidential content.

- Private chat uses one owner-scoped message stream per clergy account, RLS, current notice consent and live reviewer roles; no client edits or deletions. Why: shared TEFT review access without exposing conversations to other clergy.
- Chat is loaded through authenticated route query options and refreshed while open. Why: keep initial loading and permission rechecks consistent.
- Offline installation uses vite-plugin-pwa generateSW and one guarded registration wrapper; no worker in preview/dev, OAuth and APIs excluded. Why: offline draft access without stale previews or caching private responses.
- Offline drafts/outbox use user-scoped IndexedDB and stable message UUIDs; delivery revalidates the current account and relies on live RLS, with blocked-message retries explicit and local data cleared on sign-out. Why: avoid cross-account delivery and duplicate sends.
- Conversation mute preferences live in RLS-protected per-user rows; future push recipients must be filtered by live roles, consent and mute before delivery. Why: notifications cannot bypass private chat permissions.
