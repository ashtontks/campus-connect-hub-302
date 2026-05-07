
-- Roles enum
create type public.user_role as enum ('student', 'employer');

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.user_role not null default 'student',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'student')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Jobs
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  company text not null,
  description text not null,
  category text not null,
  location text not null,
  is_remote boolean not null default false,
  hourly_pay numeric(10,2),
  created_at timestamptz not null default now()
);

alter table public.jobs enable row level security;

create policy "Jobs are viewable by everyone"
  on public.jobs for select using (true);

create policy "Employers can insert own jobs"
  on public.jobs for insert with check (
    auth.uid() = employer_id
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'employer')
  );

create policy "Employers can update own jobs"
  on public.jobs for update using (auth.uid() = employer_id);

create policy "Employers can delete own jobs"
  on public.jobs for delete using (auth.uid() = employer_id);

-- Applications
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  note text not null,
  contact_email text not null,
  contact_phone text,
  created_at timestamptz not null default now(),
  unique (job_id, student_id)
);

alter table public.applications enable row level security;

create policy "Students can view own applications"
  on public.applications for select using (auth.uid() = student_id);

create policy "Employers can view applications to their jobs"
  on public.applications for select using (
    exists (select 1 from public.jobs j where j.id = job_id and j.employer_id = auth.uid())
  );

create policy "Students can create applications"
  on public.applications for insert with check (auth.uid() = student_id);

create policy "Students can delete own applications"
  on public.applications for delete using (auth.uid() = student_id);

-- Saved jobs
create table public.saved_jobs (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (student_id, job_id)
);

alter table public.saved_jobs enable row level security;

create policy "Students view own saved jobs"
  on public.saved_jobs for select using (auth.uid() = student_id);

create policy "Students save jobs"
  on public.saved_jobs for insert with check (auth.uid() = student_id);

create policy "Students unsave jobs"
  on public.saved_jobs for delete using (auth.uid() = student_id);

create index idx_jobs_created_at on public.jobs (created_at desc);
create index idx_jobs_category on public.jobs (category);
create index idx_applications_job on public.applications (job_id);
create index idx_applications_student on public.applications (student_id);
