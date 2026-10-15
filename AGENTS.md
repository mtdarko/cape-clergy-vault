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
