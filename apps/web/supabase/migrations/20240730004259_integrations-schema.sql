-- insert new permissions
alter type public.app_permissions add value 'integrations.update';
alter type public.app_permissions add value 'integrations.delete';
commit;
 
-- grant permissions to the owner role
insert into public.role_permissions(
  role,
  permission)
values
  ('owner', 'integrations.update'),
  ('owner', 'integrations.delete');

/*
* Table: public.integrations
*/
-- public.integrations: table for the integrations
create type public.integration_provider as enum ('linkedin', 'twitter', 'threads');
 
create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  provider public.integration_provider not null,
  access_token text not null,
  refresh_token text,
  expires_in int,
  username text,
  avatar text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- add unique constraint
alter table integrations
add constraint unique_account_provider_username unique (account_id, provider, username);
 
-- revoke permissions on public.integrations
revoke all on public.integrations from public, service_role;
 
-- grant required permissions on public.integrations
grant select, insert, update, delete on public.integrations to authenticated;
grant select, insert, update on public.integrations to service_role;
 
-- Indexes
create index ix_integrations_account_id on public.integrations(account_id);
 
-- RLS
alter table public.integrations enable row level security;

-- SELECT(public.integrations)
create policy select_integrations
  on public.integrations
  for select
  to authenticated
  using (
    public.has_role_on_account(account_id)
  );
 
-- DELETE(public.integrations)
create policy delete_integrations
  on public.integrations
  for delete
  to authenticated
  using (
    public.has_permission((select auth.uid()), account_id, 'integrations.delete'::app_permissions)
  );

 -- UPDATE(public.integrations)
create policy update_integrations
  on public.integrations
  for update
  to authenticated
  using (
    public.has_permission((select auth.uid()), account_id, 'integrations.update'::app_permissions)
  )
  with check (
    public.has_permission((select auth.uid()), account_id, 'integrations.update'::app_permissions)
  );