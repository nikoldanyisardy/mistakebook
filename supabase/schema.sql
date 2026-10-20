-- MistakeBook v2 schema. WIPES existing data.
-- Run in Supabase: Dashboard → SQL Editor → New query → paste → Run.

drop table if exists public.mistakes cascade;
drop table if exists public.courses cascade;

-- Keeps updated_at current on every change.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- courses ----------
create table public.courses (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null default auth.uid()
                         references auth.users (id) on delete cascade,
  name       text        not null
                         check (char_length(trim(name)) between 1 and 80
                                and lower(trim(name)) <> 'other'),
  created_at timestamptz not null default now(),
  unique (id, user_id)   -- lets mistakes check the course belongs to the same user
);

-- No two courses with the same name (ignoring case) for one user.
create unique index courses_user_name_key
  on public.courses (user_id, lower(trim(name)));

-- ---------- mistakes ----------
create table public.mistakes (
  id             uuid        primary key default gen_random_uuid(),
  user_id        uuid        not null default auth.uid()
                             references auth.users (id) on delete cascade,
  question       text        not null
                             check (char_length(trim(question)) between 1 and 500),
  course_id      uuid,       -- null means "Other"
  type           text        not null default 'Other'
                             check (char_length(trim(type)) between 1 and 60),
  is_mcq         boolean     not null default false,
  options        text[],
  correct_answer text        check (char_length(correct_answer) <= 2000),
  explanation    text        check (char_length(explanation) <= 2000),
  streak         integer     not null default 0 check (streak >= 0),
  mastered       boolean     not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  -- A mistake can only point to one of its owner's own courses.
  -- Deleting a course moves its mistakes to "Other" unless the app deletes them first.
  foreign key (course_id, user_id)
    references public.courses (id, user_id)
    on delete set null (course_id),

  -- Multiple choice needs 2 to 6 options.
  check (not is_mcq or (options is not null and cardinality(options) between 2 and 6))
);

create index mistakes_user_created_idx on public.mistakes (user_id, created_at desc);
create index mistakes_course_idx       on public.mistakes (course_id);

create trigger mistakes_set_updated_at
  before update on public.mistakes
  for each row execute function public.set_updated_at();

-- ---------- Row Level Security ----------
alter table public.courses  enable row level security;
alter table public.mistakes enable row level security;

create policy "Users read own courses"   on public.courses for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users add own courses"    on public.courses for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users update own courses" on public.courses for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users delete own courses" on public.courses for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Users read own mistakes"   on public.mistakes for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users add own mistakes"    on public.mistakes for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users update own mistakes" on public.mistakes for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users delete own mistakes" on public.mistakes for delete to authenticated using ((select auth.uid()) = user_id);

-- Logged-out visitors get nothing; logged-in users are still limited by RLS.
revoke all on public.courses, public.mistakes from anon;
grant select, insert, update, delete on public.courses, public.mistakes to authenticated;
