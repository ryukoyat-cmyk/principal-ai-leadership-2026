alter table public.cards drop constraint cards_section_check;
alter table public.cards add constraint cards_section_check
  check (section in ('preparation', 'workshop', 'resources', 'survey'));

create or replace function public.reorder_cards(section_name text, ordered_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.administrators where user_id = (select auth.uid())
  ) then
    raise exception 'Unauthorized';
  end if;

  if section_name not in ('preparation', 'workshop', 'resources', 'survey') then
    raise exception 'Invalid section';
  end if;

  perform 1 from public.cards where section = section_name for update;

  if cardinality(ordered_ids) <> (select count(*) from public.cards where section = section_name)
    or cardinality(ordered_ids) <> (select count(distinct x) from unnest(ordered_ids) x)
    or exists (
      select 1 from unnest(ordered_ids) x
      where not exists (select 1 from public.cards where id = x and section = section_name)
    )
  then
    raise exception 'Card list changed. Refresh and retry.';
  end if;

  update public.cards c
  set position = (s.ordinality - 1)::integer
  from unnest(ordered_ids) with ordinality s(id, ordinality)
  where c.id = s.id and c.section = section_name;
end;
$$;

revoke all on function public.reorder_cards(text, uuid[]) from public, anon;
grant execute on function public.reorder_cards(text, uuid[]) to authenticated;
