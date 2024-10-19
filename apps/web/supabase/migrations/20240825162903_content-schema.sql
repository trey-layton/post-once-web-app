create type public.content_status as enum ('scheduled', 'posted', 'generated');

-- insert new permissions
alter type public.app_permissions add value 'content.update';
alter type public.app_permissions add value 'content.delete';
commit;
 
-- grant permissions to the owner role
insert into public.role_permissions(
  role,
  permission)
values
  ('owner', 'content.update'),
  ('owner', 'content.delete');

/*
* Table: public.content
*/
-- public.content: table for the account profiles
 
CREATE TABLE IF NOT EXISTS public.content (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  integration_id uuid not null references public.integrations(id) on delete cascade,
  status public.content_status not null default 'generated',
  content_type text not null,
  generated_content jsonb,
  edited_content jsonb,
  posted_url text,
  scheduled_at timestamptz,
  posted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

 
-- revoke permissions on public.content
revoke all on public.content from public, service_role;
 
-- grant required permissions on public.content
grant select, insert, update, delete on public.content to authenticated;
grant select, insert, update on public.content to service_role;
 
-- Indexes
create index ix_content_account_id on public.content(account_id);
 
-- RLS
alter table public.content enable row level security;

-- SELECT(public.content)
create policy select_content
  on public.content
  for select
  to authenticated
  using (
    public.has_role_on_account(account_id)
  );
 
-- DELETE(public.content)
create policy delete_content
  on public.content
  for delete
  to authenticated
  using (
    public.has_permission((select auth.uid()), account_id, 'content.delete'::app_permissions)
  );

 -- UPDATE(public.content)
create policy update_content
  on public.content
  for update
  to authenticated
  using (
    public.has_permission((select auth.uid()), account_id, 'content.update'::app_permissions)
  )
  with check (
    public.has_permission((select auth.uid()), account_id, 'content.update'::app_permissions)
  );

  -- define the RLS policy to insert the content
create policy insert_content
  on public.content
  for insert
  to authenticated
  with check (
    public.has_role_on_account(account_id)
  );