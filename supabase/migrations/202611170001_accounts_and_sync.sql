-- Apply with `supabase db push` or in the Supabase SQL editor.
-- Passwords and verified email identities are managed by Supabase Auth.
create sequence public.record_version_seq;
create table public.user_records (
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('profile', 'session', 'journal', 'favorite', 'chat')),
  id uuid not null,
  data jsonb not null check (jsonb_typeof(data) = 'object' and octet_length(data::text) <= 64000),
  deleted boolean not null default false,
  version bigint not null default nextval('public.record_version_seq'),
  mutation_id uuid not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, kind, id),
  check (kind <> 'profile' or (id = user_id and not deleted))
);
create index user_records_sync on public.user_records (user_id, version);
alter table public.user_records enable row level security;
create policy "Read only your records" on public.user_records for select to authenticated
  using ((select auth.uid()) = user_id);
revoke all on public.user_records from anon, authenticated;
grant select on public.user_records to authenticated;
revoke all on sequence public.record_version_seq from anon, authenticated;

-- Atomic compare-and-swap prevents one device silently overwriting another.
-- Mutation retries are idempotent. Tombstones propagate offline deletions.
create function public.apply_record_change(
  p_kind text, p_id uuid, p_data jsonb, p_deleted boolean,
  p_base_version bigint, p_mutation_id uuid
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  owner_id uuid := auth.uid();
  existing public.user_records;
  result public.user_records;
begin
  if owner_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if p_kind is null or p_kind not in ('profile', 'session', 'journal', 'favorite', 'chat') or
    p_id is null or p_mutation_id is null or p_base_version is null or p_base_version < 0 or
    p_deleted is null or p_data is null or jsonb_typeof(p_data) <> 'object' or octet_length(p_data::text) > 64000 then
    raise exception 'Invalid record';
  end if;
  if p_kind = 'profile' and (p_id <> owner_id or p_deleted) then raise exception 'Invalid profile'; end if;
  -- Serialize this user's writes so sync versions follow commit order, including
  -- when two devices update different records at the same time.
  perform pg_advisory_xact_lock(hashtextextended(owner_id::text, 0));
  select * into existing from public.user_records where user_id = owner_id and kind = p_kind and id = p_id for update;
  if found then
    if existing.mutation_id = p_mutation_id then
      return jsonb_build_object('status', 'accepted', 'record', to_jsonb(existing) - 'user_id' - 'mutation_id');
    end if;
    if existing.version <> p_base_version then
      return jsonb_build_object('status', 'conflict', 'record', to_jsonb(existing) - 'user_id' - 'mutation_id');
    end if;
  elsif p_base_version <> 0 then raise exception 'Record no longer exists';
  end if;
  insert into public.user_records (user_id, kind, id, data, deleted, mutation_id)
    values (owner_id, p_kind, p_id, p_data, p_deleted, p_mutation_id)
  on conflict (user_id, kind, id) do update set
    data = excluded.data, deleted = excluded.deleted, mutation_id = excluded.mutation_id,
    version = nextval('public.record_version_seq'), updated_at = clock_timestamp()
  returning * into result;
  return jsonb_build_object('status', 'accepted', 'record', to_jsonb(result) - 'user_id' - 'mutation_id');
end;
$$;
revoke all on function public.apply_record_change(text, uuid, jsonb, boolean, bigint, uuid) from public, anon;
grant execute on function public.apply_record_change(text, uuid, jsonb, boolean, bigint, uuid) to authenticated;

create table public.ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null,
  credits integer not null check (credits >= 0),
  primary key (user_id, usage_date)
);
alter table public.ai_usage enable row level security;
revoke all on public.ai_usage from anon, authenticated;
create function public.consume_ai_credit(p_limit integer, p_cost integer default 1)
returns boolean language plpgsql security definer set search_path = '' as $$
declare used integer;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if p_limit is null or p_cost is null or p_limit < 1 or p_limit > 1000 or p_cost < 1 or p_cost > 5 then raise exception 'Invalid quota'; end if;
  if p_cost > p_limit then return false; end if;
  insert into public.ai_usage (user_id, usage_date, credits)
    values (auth.uid(), (now() at time zone 'UTC')::date, p_cost)
  on conflict (user_id, usage_date) do update set credits = public.ai_usage.credits + p_cost
    where public.ai_usage.credits + p_cost <= p_limit
  returning credits into used;
  return used is not null;
end;
$$;
revoke all on function public.consume_ai_credit(integer, integer) from public, anon;
grant execute on function public.consume_ai_credit(integer, integer) to authenticated;
