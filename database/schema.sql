create table public.administrators (
 user_id uuid primary key references auth.users(id) on delete cascade,
 singleton boolean not null default true unique check (singleton)
);
alter table public.administrators enable row level security;
revoke all on public.administrators from anon, authenticated;
grant select on public.administrators to authenticated;
create policy "Admin can read own membership" on public.administrators for select to authenticated using (user_id = (select auth.uid()));
create table public.cards (
 id uuid primary key default gen_random_uuid(),
 section text not null check (section in ('preparation','workshop','resources','survey')),
 title text not null check (char_length(trim(title)) between 1 and 100),
 url text not null check (char_length(url) <= 2048 and url ~ '^https?://[^[:space:]]+$'),
 description text not null default '' check (char_length(description) <= 500),
 image_path text check (image_path is null or image_path ~ '^cards/[a-f0-9-]+\.webp$'),
 position integer not null default 0 check (position >= 0),
 is_visible boolean not null default true,
 created_at timestamptz not null default now()
);
create index cards_section_position_idx on public.cards(section, position, id);
alter table public.cards enable row level security;
revoke all on public.cards from anon, authenticated;
grant select on public.cards to anon;
grant select,insert,update,delete on public.cards to authenticated;
create policy "Public reads visible cards" on public.cards for select to anon using (is_visible);
create policy "Authenticated reads public or admin cards" on public.cards for select to authenticated using (is_visible or exists(select 1 from public.administrators where user_id=(select auth.uid())));
create policy "Admin inserts cards" on public.cards for insert to authenticated with check (exists(select 1 from public.administrators where user_id=(select auth.uid())));
create policy "Admin updates cards" on public.cards for update to authenticated using (exists(select 1 from public.administrators where user_id=(select auth.uid()))) with check (exists(select 1 from public.administrators where user_id=(select auth.uid())));
create policy "Admin deletes cards" on public.cards for delete to authenticated using (exists(select 1 from public.administrators where user_id=(select auth.uid())));
create function public.reorder_cards(section_name text, ordered_ids uuid[]) returns void
language plpgsql security invoker set search_path = '' as $$
begin
 if not exists(select 1 from public.administrators where user_id=(select auth.uid())) then raise exception 'Unauthorized'; end if;
 if section_name not in ('preparation','workshop','resources','survey') then raise exception 'Invalid section'; end if;
 perform 1 from public.cards where section=section_name for update;
 if cardinality(ordered_ids) <> (select count(*) from public.cards where section=section_name)
 or cardinality(ordered_ids) <> (select count(distinct x) from unnest(ordered_ids) x)
 or exists(select 1 from unnest(ordered_ids) x where not exists(select 1 from public.cards where id=x and section=section_name))
 then raise exception 'Card list changed. Refresh and retry.'; end if;
 update public.cards c set position=(s.ordinality-1)::integer from unnest(ordered_ids) with ordinality s(id,ordinality) where c.id=s.id and c.section=section_name;
end; $$;
revoke all on function public.reorder_cards(text,uuid[]) from public,anon;
grant execute on function public.reorder_cards(text,uuid[]) to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('card-images','card-images',true,5242880,array['image/webp']);
create policy "Admin reads stored images" on storage.objects for select to authenticated using (bucket_id='card-images' and exists(select 1 from public.administrators where user_id=(select auth.uid())));
create policy "Admin uploads stored images" on storage.objects for insert to authenticated with check (bucket_id='card-images' and (storage.foldername(name))[1]='cards' and exists(select 1 from public.administrators where user_id=(select auth.uid())));
create policy "Admin deletes stored images" on storage.objects for delete to authenticated using (bucket_id='card-images' and exists(select 1 from public.administrators where user_id=(select auth.uid())));
