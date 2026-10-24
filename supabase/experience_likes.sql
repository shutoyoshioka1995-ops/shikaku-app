create table if not exists public.experience_likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  experience_id uuid not null,
  created_at timestamptz default now(),
  unique (user_id, experience_id)
);

alter table public.experience_likes enable row level security;

create policy "read own likes"
  on public.experience_likes for select
  using (auth.uid() = user_id);

create policy "insert own likes"
  on public.experience_likes for insert
  with check (auth.uid() = user_id);
