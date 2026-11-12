-- GELZ Prospect | Supabase PostgreSQL security-first schema
-- Execute no SQL Editor de um PROJETO SUPABASE dedicado.
-- 1) Desative cadastro público de usuários (Auth > Providers > Email).
-- 2) Crie UM usuário (email indicado em config.js) no dashboard Auth.
-- 3) Insira o UUID dele em prospect_admins (comando no final).
-- 4) Comece com senha TEMPORÁRIA, e force troca antes de habilitar produção.
-- Atenção: a senha 'admin' é fraca e não pode ficar habilitada para operação real.
create extension if not exists pgcrypto;

create table if not exists public.prospect_admins (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username = 'admin'),
  must_change_password boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.prospect_admins enable row level security;
drop policy if exists prospect_admin_select on public.prospect_admins;
create policy prospect_admin_select on public.prospect_admins
  for select to authenticated using (id = (select auth.uid()));
revoke all on public.prospect_admins from anon;
grant select on public.prospect_admins to authenticated;

create or replace function public.prospect_is_active_admin()
returns boolean language sql stable security definer
set search_path = public as $$
  select exists(
    select 1 from public.prospect_admins a
    where a.id = (select auth.uid())
      and a.username = 'admin' and a.must_change_password = false
  );
$$;
revoke all on function public.prospect_is_active_admin() from public;
grant execute on function public.prospect_is_active_admin() to authenticated;

-- A permissão para operar o CRM só é liberada depois da troca da senha no Auth.
-- Nenhuma atualização client-side pode alterar must_change_password.
create or replace function public.prospect_password_rotated()
returns trigger language plpgsql security definer
set search_path = public as $$
begin
  if new.encrypted_password is distinct from old.encrypted_password then
    update public.prospect_admins set must_change_password = false where id = new.id;
  end if;
  return new;
end;
$$;
drop trigger if exists prospect_password_update on auth.users;
create trigger prospect_password_update
after update of encrypted_password on auth.users
for each row execute function public.prospect_password_rotated();

create table if not exists public.prospect_leads (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 company_name text not null check(length(company_name) between 1 and 180),
 place_id text not null default '',
 source_type text not null default 'manual',
 sector text not null default '',
 city text not null default '',
 neighborhood text not null default '',
 cnpj text not null default '',
 cnpj_verified boolean not null default false,
 cnae text not null default '',
 contact_name text not null default '',
 contact_phone text not null default '',
 contact_email text not null default '',
 contact_linkedin_url text not null default '',
 contact_source_url text not null default '',
 website text not null default '',
 opt_in_whatsapp boolean not null default false,
 opt_in_evidence text not null default '',
 stage text not null default 'Descoberto'
   check(stage in ('Descoberto','Em pesquisa','Qualificado','Aguardando autorização','Em conversa','Reunião agendada','Proposta','Convertido','Sem interesse')),
 notes text not null default '',
 next_contact_at date,
 ai_score integer check (ai_score between 0 and 100),
 ai_analysis jsonb,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint prospect_whatsapp_evidence check (
   not opt_in_whatsapp or (length(contact_phone) between 12 and 13 and length(trim(opt_in_evidence)) > 5)
 )
);
create unique index if not exists prospect_leads_cnpj_unique
 on public.prospect_leads(owner_id,cnpj) where cnpj <> '';
create unique index if not exists prospect_leads_place_unique
 on public.prospect_leads(owner_id,place_id) where place_id <> '';
create index if not exists prospect_leads_stage on public.prospect_leads(owner_id,stage);
create index if not exists prospect_leads_created on public.prospect_leads(owner_id,created_at desc);
alter table public.prospect_leads enable row level security;
drop policy if exists prospect_leads_active_admin on public.prospect_leads;
create policy prospect_leads_active_admin on public.prospect_leads
for all to authenticated
using (owner_id = (select auth.uid()) and (select public.prospect_is_active_admin()))
with check (owner_id = (select auth.uid()) and (select public.prospect_is_active_admin()));
revoke all on public.prospect_leads from anon;
grant select,insert,update,delete on public.prospect_leads to authenticated;

create table if not exists public.prospect_tasks (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 lead_id uuid references public.prospect_leads(id) on delete cascade,
 title text not null,
 description text not null default '',
 due_at date,
 completed boolean not null default false,
 created_at timestamptz not null default now()
);
create index if not exists prospect_tasks_due on public.prospect_tasks(owner_id,due_at);
alter table public.prospect_tasks enable row level security;
drop policy if exists prospect_tasks_active_admin on public.prospect_tasks;
create policy prospect_tasks_active_admin on public.prospect_tasks
for all to authenticated
using (owner_id = (select auth.uid()) and (select public.prospect_is_active_admin()))
with check (owner_id = (select auth.uid()) and (select public.prospect_is_active_admin()));
revoke all on public.prospect_tasks from anon;
grant select,insert,update,delete on public.prospect_tasks to authenticated;

create table if not exists public.prospect_events (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 lead_id uuid references public.prospect_leads(id) on delete cascade,
 kind text not null,
 note text not null default '',
 created_at timestamptz not null default now()
);
create index if not exists prospect_events_lead on public.prospect_events(lead_id,created_at desc);
alter table public.prospect_events enable row level security;
drop policy if exists prospect_events_active_admin on public.prospect_events;
create policy prospect_events_active_admin on public.prospect_events
for all to authenticated
using (owner_id = (select auth.uid()) and (select public.prospect_is_active_admin()))
with check (owner_id = (select auth.uid()) and (select public.prospect_is_active_admin()));
revoke all on public.prospect_events from anon;
grant select,insert,update,delete on public.prospect_events to authenticated;

create table if not exists public.prospect_preferences (
 owner_id uuid primary key references auth.users(id) on delete cascade,
 advisor_name text not null default 'Junior Sousa',
 institution text not null default 'Quattro Investimentos',
 signature text not null default 'Assessor de investimentos',
 updated_at timestamptz not null default now()
);
alter table public.prospect_preferences enable row level security;
drop policy if exists prospect_preferences_active_admin on public.prospect_preferences;
create policy prospect_preferences_active_admin on public.prospect_preferences
for all to authenticated
using (owner_id = (select auth.uid()) and (select public.prospect_is_active_admin()))
with check (owner_id = (select auth.uid()) and (select public.prospect_is_active_admin()));
revoke all on public.prospect_preferences from anon;
grant select,insert,update,delete on public.prospect_preferences to authenticated;

-- Após criar a conta 'admin' no Supabase Auth, execute:
-- INSERT INTO public.prospect_admins (id, username, must_change_password)
-- SELECT id, 'admin', true FROM auth.users WHERE email = 'ENDERECO_PRIVADO_DO_ADMIN'
-- ON CONFLICT (id) DO NOTHING;
-- O login público usa o username 'admin' e internamente resolve o email configurado.
-- IMPORTANTE: antes do deploy real use credencial inicial forte gerada ao acaso;
-- a senha admin/admin só pode ser usada em ambiente LOCAL isolado.

-- Upgrade non-destructive if your prospect_leads table already exists.
alter table public.prospect_leads add column if not exists contact_linkedin_url text not null default '';
