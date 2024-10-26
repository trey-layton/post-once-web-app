create table if not exists public.onboarding (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid references public.accounts(id) not null unique,
  data jsonb default '{}',
  completed boolean default false,
  created_at timestamp with time zone default current_timestamp,
  updated_at timestamp with time zone default current_timestamp
);
 
revoke all on public.onboarding from public, service_role;
 
grant select, update, insert on public.onboarding to authenticated;
grant select, delete on public.onboarding to service_role;
 
alter table onboarding enable row level security;
 
create policy read_onboarding
    on public.onboarding
    for select
    to authenticated
    using (account_id = (select auth.uid()));
 
create policy insert_onboarding
    on public.onboarding
    for insert
    to authenticated
    with check (account_id = (select auth.uid()));
 
create policy update_onboarding
    on public.onboarding
    for update
    to authenticated
    using (account_id = (select auth.uid()))
    with check (account_id = (select auth.uid()));