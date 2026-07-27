-- ============================================================
-- heartbeat.sql — houdt het Supabase-project wakker
--
-- Gratis Supabase-projecten worden gepauzeerd na circa 7 dagen zonder
-- activiteit. De GitHub Action .github/workflows/heartbeat.yml roept
-- elke dag public.heartbeat_ping() aan. Dat is een echte
-- database-schrijfactie en zet die klok dus terug op nul.
--
-- EENMALIG uitvoeren in de Supabase SQL-editor. Opnieuw draaien mag:
-- dit script is idempotent.
-- ============================================================

create table if not exists public.heartbeat (
  id           smallint primary key default 1,
  laatste_ping timestamptz not null default now(),
  aantal       bigint      not null default 0,
  constraint heartbeat_een_rij check (id = 1)
);

insert into public.heartbeat (id) values (1) on conflict (id) do nothing;

-- De tabel zelf is voor niemand rechtstreeks benaderbaar: RLS staat aan
-- zonder policies en de grants zijn ingetrokken. Alleen de functie
-- hieronder (security definer) komt erbij. Met de publieke sleutel kun je
-- dus niets anders dan de teller ophogen.
alter table public.heartbeat enable row level security;
revoke all on table public.heartbeat from anon, authenticated;

create or replace function public.heartbeat_ping()
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tijd timestamptz;
begin
  update public.heartbeat
     set laatste_ping = now(),
         aantal       = aantal + 1
   where id = 1
  returning laatste_ping into v_tijd;
  return v_tijd;
end;
$$;

revoke all on function public.heartbeat_ping() from public;
grant execute on function public.heartbeat_ping() to anon;

-- PostgREST z'n schema-cache verversen zodat /rest/v1/rpc/heartbeat_ping
-- meteen bestaat (normaal gebeurt dit vanzelf, dit is de zekerheid).
notify pgrst, 'reload schema';

-- Controleren wanneer de laatste ping binnenkwam:
--   select * from public.heartbeat;
