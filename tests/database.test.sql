-- Run after database-bootstrap.sql and the migration in an isolated PostgreSQL DB.
begin;
insert into auth.users values ('a737b998-b84f-4a8c-9be7-98c14612d323'), ('b737b998-b84f-4a8c-9be7-98c14612d323');
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a737b998-b84f-4a8c-9be7-98c14612d323', true);
do $$
declare result jsonb; first_version bigint; n integer;
begin
  result := public.apply_record_change('journal', 'c737b998-b84f-4a8c-9be7-98c14612d323', '{"text":"Private reflection A"}', false, 0, 'd737b998-b84f-4a8c-9be7-98c14612d323');
  assert result->>'status' = 'accepted', 'Initial mutation must be accepted';
  first_version := (result->'record'->>'version')::bigint;
  result := public.apply_record_change('journal', 'c737b998-b84f-4a8c-9be7-98c14612d323', '{"text":"Private reflection A"}', false, 0, 'd737b998-b84f-4a8c-9be7-98c14612d323');
  assert (result->'record'->>'version')::bigint = first_version, 'Retry must be idempotent';
  result := public.apply_record_change('journal', 'c737b998-b84f-4a8c-9be7-98c14612d323', '{"text":"Old device edit"}', false, 0, 'e737b998-b84f-4a8c-9be7-98c14612d323');
  assert result->>'status' = 'conflict', 'Stale writes must preserve the existing record';
  assert result->'record'->'data'->>'text' = 'Private reflection A';
  result := public.apply_record_change('journal', 'c737b998-b84f-4a8c-9be7-98c14612d323', '{"text":"Private reflection A"}', true, first_version, 'f737b998-b84f-4a8c-9be7-98c14612d323');
  assert (result->'record'->>'deleted')::boolean, 'Deletion must propagate as a tombstone';
  assert (result->'record'->>'version')::bigint > first_version, 'Deletion advances sync cursor';
  begin
    insert into public.user_records(user_id,kind,id,data,mutation_id) values (auth.uid(),'journal',gen_random_uuid(),'{}',gen_random_uuid());
    raise exception 'Direct writes must not be allowed';
  exception when insufficient_privilege then null; end;
  begin
    perform public.apply_record_change('profile', 'b737b998-b84f-4a8c-9be7-98c14612d323', '{}', false, 0, gen_random_uuid());
    raise exception 'A user must not create another user profile';
  exception when raise_exception then assert sqlerrm = 'Invalid profile'; end;
  assert not public.consume_ai_credit(1, 2), 'Requests costing more than the quota must fail';
  assert public.consume_ai_credit(2, 1);
  assert public.consume_ai_credit(2, 1);
  assert not public.consume_ai_credit(2, 1), 'Daily quota must be enforced atomically';
end $$;
select set_config('request.jwt.claim.sub', 'b737b998-b84f-4a8c-9be7-98c14612d323', true);
do $$ begin
  assert (select count(*) from public.user_records) = 0, 'Another account cannot read private records';
  assert public.consume_ai_credit(2, 1), 'AI allowance belongs to each account';
  perform public.apply_record_change('journal', 'c737b998-b84f-4a8c-9be7-98c14612d323', '{"text":"Private reflection B"}', false, 0, gen_random_uuid());
  assert (select count(*) from public.user_records) = 1;
end $$;
select set_config('request.jwt.claim.sub', '', true);
do $$ begin
  begin
    perform public.apply_record_change('journal', gen_random_uuid(), '{}', false, 0, gen_random_uuid());
    raise exception 'Anonymous writes must fail';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
delete from auth.users where id = 'a737b998-b84f-4a8c-9be7-98c14612d323';
do $$ begin
  assert (select count(*) from public.user_records where user_id = 'a737b998-b84f-4a8c-9be7-98c14612d323') = 0, 'Account deletion removes private records';
  assert (select count(*) from public.ai_usage where user_id = 'a737b998-b84f-4a8c-9be7-98c14612d323') = 0, 'Account deletion removes usage data';
end $$;
rollback;
