-- insert new permissions
alter type public.app_permissions add value 'account_profiles.update';
alter type public.app_permissions add value 'account_profiles.delete';
commit;
 
-- grant permissions to the owner role
insert into public.role_permissions(
  role,
  permission)
values
  ('owner', 'account_profiles.update'),
  ('owner', 'account_profiles.delete');

/*
* Table: public.account_profiles
*/
-- public.account_profiles: table for the account profiles
 
CREATE TABLE IF NOT EXISTS public.account_profiles (
  account_id uuid PRIMARY KEY references public.accounts(id) ON DELETE CASCADE,
  beehiiv_api_key text null,
  subscribe_url text null,
  publication_id text null,
  example_tweet text null,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

 
-- revoke permissions on public.account_profiles
revoke all on public.account_profiles from public, service_role;
 
-- grant required permissions on public.account_profiles
grant select, insert, update, delete on public.account_profiles to authenticated;
grant select, insert on public.account_profiles to service_role;
 
-- Indexes
create index ix_account_profiles_account_id on public.account_profiles(account_id);
 
-- RLS
alter table public.account_profiles enable row level security;

-- SELECT(public.account_profiles)
create policy select_account_profiles
  on public.account_profiles
  for select
  to authenticated
  using (
    public.has_role_on_account(account_id)
  );
 
-- DELETE(public.account_profiles)
create policy delete_account_profiles
  on public.account_profiles
  for delete
  to authenticated
  using (
    public.has_permission((select auth.uid()), account_id, 'account_profiles.delete'::app_permissions)
  );

 -- UPDATE(public.account_profiles)
create policy update_account_profiles
  on public.account_profiles
  for update
  to authenticated
  using (
    public.has_permission((select auth.uid()), account_id, 'account_profiles.update'::app_permissions)
  )
  with check (
    public.has_permission((select auth.uid()), account_id, 'account_profiles.update'::app_permissions)
  );

  -- define the RLS policy to insert the account_profiles
create policy insert_account_profiles
  on public.account_profiles
  for insert
  to authenticated
  with check (
    public.has_role_on_account(account_id)
  );