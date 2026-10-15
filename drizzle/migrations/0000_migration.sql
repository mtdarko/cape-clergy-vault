create type public.app_role as enum ('admin','clergy');
create table public.user_roles (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade not null, role app_role not null, unique(user_id, role));
grant select on public.user_roles to authenticated; grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create or replace function public.has_role(_user_id uuid, _role app_role) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.user_roles where user_id=_user_id and role=_role) $$;
create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  title text not null default '',
  parish text not null default '',
  phone text not null default '',
  popia_version text,
  popia_accepted_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated; grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own profile insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles (id, full_name, title, parish, phone, popia_version, popia_accepted_at)
  values (new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'title',''),
    coalesce(new.raw_user_meta_data->>'parish',''),
    coalesce(new.raw_user_meta_data->>'phone',''),
    nullif(new.raw_user_meta_data->>'popia_version',''),
    case when new.raw_user_meta_data->>'popia_version' is not null then now() else null end)
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'clergy') on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.has_popia_consent(_uid uuid) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.profiles where id=_uid and popia_accepted_at is not null) $$;

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  kind text not null default 'document' check (kind in ('document','idea')),
  title text not null,
  category text not null default 'General',
  abstract text not null default '',
  keywords text not null default '',
  file_path text,
  file_name text,
  status text not null default 'submitted' check (status in ('submitted','under_review','accepted','returned')),
  dean_notes text not null default '',
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.submissions to authenticated; grant all on public.submissions to service_role;
alter table public.submissions enable row level security;
create policy "read own or admin or accepted" on public.submissions for select to authenticated using ((user_id = auth.uid() or public.has_role(auth.uid(),'admin') or status='accepted') and public.has_popia_consent(auth.uid()));
create policy "insert own with consent" on public.submissions for insert to authenticated with check (user_id = auth.uid() and public.has_popia_consent(auth.uid()) and status='submitted');
create policy "admin update" on public.submissions for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "delete own pending" on public.submissions for delete to authenticated using (user_id = auth.uid() and status='submitted');

create policy "upload own folder" on storage.objects for insert to authenticated with check (bucket_id='submissions' and (storage.foldername(name))[1] = auth.uid()::text and public.has_popia_consent(auth.uid()));
create policy "read own or admin or accepted files" on storage.objects for select to authenticated using (bucket_id='submissions' and public.has_popia_consent(auth.uid()) and ((storage.foldername(name))[1] = auth.uid()::text or public.has_role(auth.uid(),'admin') or exists(select 1 from public.submissions s where s.file_path = name and s.status='accepted')));
create policy "delete own files" on storage.objects for delete to authenticated using (bucket_id='submissions' and (storage.foldername(name))[1] = auth.uid()::text);