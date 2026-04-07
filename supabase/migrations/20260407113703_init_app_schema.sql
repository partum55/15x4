create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
	new."updatedAt" = timezone('utc', now());
	return new;
end;
$$;

create table if not exists public."User" (
	id uuid primary key default gen_random_uuid(),
	name text not null,
	email text not null unique,
	"passwordHash" text not null,
	status text not null default 'pending_email' check (status in ('pending_email', 'pending_approval', 'approved')),
	role text not null default 'user' check (role in ('user', 'admin')),
	"emailToken" text,
	"createdAt" timestamptz not null default timezone('utc', now()),
	"updatedAt" timestamptz not null default timezone('utc', now())
);

create unique index if not exists "User_emailToken_key"
	on public."User" ("emailToken")
	where "emailToken" is not null;

create index if not exists "User_createdAt_idx"
	on public."User" ("createdAt" desc);

create table if not exists public."Lecture" (
	id uuid primary key default gen_random_uuid(),
	category text not null,
	"categoryColor" text not null check ("categoryColor" in ('orange', 'green', 'blue', 'red')),
	author text not null,
	image text not null,
	title text not null,
	summary text not null,
	duration text,
	"videoUrl" text,
	"authorBio" text,
	"eventCity" text,
	"eventDate" text,
	"eventPhotosUrl" text,
	sources text,
	"socialLinks" text,
	"isPublic" boolean not null default false,
	"userId" uuid references public."User" (id) on delete set null,
	"createdAt" timestamptz not null default timezone('utc', now()),
	"updatedAt" timestamptz not null default timezone('utc', now())
);

create index if not exists "Lecture_userId_idx"
	on public."Lecture" ("userId");

create index if not exists "Lecture_createdAt_idx"
	on public."Lecture" ("createdAt" desc);

create table if not exists public."Event" (
	id uuid primary key default gen_random_uuid(),
	city text not null,
	date text not null,
	location text not null,
	time text not null,
	image text not null,
	"registrationUrl" text,
	"isPublic" boolean not null default false,
	"userId" uuid references public."User" (id) on delete set null,
	"createdAt" timestamptz not null default timezone('utc', now()),
	"updatedAt" timestamptz not null default timezone('utc', now())
);

create index if not exists "Event_userId_idx"
	on public."Event" ("userId");

create index if not exists "Event_createdAt_idx"
	on public."Event" ("createdAt" desc);

create table if not exists public."EventLecture" (
	id uuid primary key default gen_random_uuid(),
	title text not null,
	author text not null,
	category text not null,
	"categoryColor" text not null check ("categoryColor" in ('orange', 'green', 'blue', 'red')),
	image text not null,
	summary text not null,
	"lectureId" uuid references public."Lecture" (id) on delete set null,
	"eventId" uuid not null references public."Event" (id) on delete cascade,
	"createdAt" timestamptz not null default timezone('utc', now()),
	"updatedAt" timestamptz not null default timezone('utc', now())
);

create index if not exists "EventLecture_eventId_idx"
	on public."EventLecture" ("eventId");

create index if not exists "EventLecture_lectureId_idx"
	on public."EventLecture" ("lectureId");

create table if not exists public.todos (
	id uuid primary key default gen_random_uuid(),
	name text not null,
	created_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists set_updated_at_user on public."User";
create trigger set_updated_at_user
before update on public."User"
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_lecture on public."Lecture";
create trigger set_updated_at_lecture
before update on public."Lecture"
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_event on public."Event";
create trigger set_updated_at_event
before update on public."Event"
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_event_lecture on public."EventLecture";
create trigger set_updated_at_event_lecture
before update on public."EventLecture"
for each row execute function public.set_updated_at();

alter table public."User" enable row level security;
alter table public."Lecture" enable row level security;
alter table public."Event" enable row level security;
alter table public."EventLecture" enable row level security;
alter table public.todos enable row level security;

drop policy if exists "Read todos" on public.todos;
create policy "Read todos"
on public.todos
for select
to anon, authenticated
using (true);
