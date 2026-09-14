begin;

create extension if not exists btree_gist with schema extensions;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create type public.app_role as enum (
  'admin',
  'barber'
);

create type public.appointment_status as enum (
  'pending',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'no_show'
);

create type public.availability_exception_kind as enum (
  'day_off',
  'holiday',
  'blocked',
  'unavailable'
);

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  duration_minutes smallint not null,
  price numeric(10, 2) not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint services_name_not_blank check (length(btrim(name)) > 0),
  constraint services_duration_valid check (
    duration_minutes > 0
    and duration_minutes <= 480
  ),
  constraint services_price_non_negative check (price >= 0)
);

create table public.barbers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.users (id) on delete set null,
  name text not null,
  slug text not null unique,
  specialty text not null default '',
  bio text not null default '',
  avatar_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint barbers_name_not_blank check (length(btrim(name)) > 0),
  constraint barbers_slug_format check (
    slug = lower(slug)
    and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  constraint barbers_avatar_url_not_blank check (
    avatar_url is null
    or length(btrim(avatar_url)) > 0
  )
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clients_name_not_blank check (length(btrim(name)) > 0),
  constraint clients_phone_not_blank check (length(btrim(phone)) > 0),
  constraint clients_email_not_blank check (
    email is null
    or length(btrim(email)) > 0
  )
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete restrict,
  barber_id uuid not null references public.barbers (id) on delete restrict,
  service_id uuid not null references public.services (id) on delete restrict,
  appointment_date date not null,
  start_time time without time zone not null,
  end_time time without time zone not null,
  price numeric(10, 2) not null,
  status public.appointment_status not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointments_time_order check (end_time > start_time),
  constraint appointments_price_non_negative check (price >= 0),
  constraint appointments_notes_length check (
    notes is null
    or length(notes) <= 1000
  )
);

create table public.barber_availability (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid not null references public.barbers (id) on delete cascade,
  day_of_week smallint not null,
  start_time time without time zone not null,
  end_time time without time zone not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint barber_availability_day_valid check (
    day_of_week between 0 and 6
  ),
  constraint barber_availability_time_order check (end_time > start_time),
  constraint barber_availability_unique_window unique (
    barber_id,
    day_of_week,
    start_time,
    end_time
  )
);

create table public.barber_availability_exceptions (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid references public.barbers (id) on delete cascade,
  exception_date date not null,
  start_time time without time zone,
  end_time time without time zone,
  kind public.availability_exception_kind not null,
  reason text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint barber_exceptions_time_pair check (
    (
      start_time is null
      and end_time is null
    )
    or (
      start_time is not null
      and end_time is not null
      and end_time > start_time
    )
  ),
  constraint barber_exceptions_reason_length check (
    reason is null
    or length(reason) <= 500
  )
);

alter table public.appointments
  add constraint appointments_no_barber_overlap
  exclude using gist (
    barber_id with =,
    tsrange(
      appointment_date + start_time,
      appointment_date + end_time,
      '[)'
    ) with &&
  )
  where (
    status in (
      'pending',
      'confirmed',
      'in_progress'
    )
  );

alter table public.barber_availability
  add constraint barber_availability_no_overlap
  exclude using gist (
    barber_id with =,
    day_of_week with =,
    tsrange(
      date '2000-01-03' + start_time,
      date '2000-01-03' + end_time,
      '[)'
    ) with &&
  )
  where (active);

create index services_active_name_idx
  on public.services (active, name);

create index barbers_active_name_idx
  on public.barbers (active, name);

create index clients_phone_idx
  on public.clients (phone);

create index clients_email_idx
  on public.clients (lower(email))
  where email is not null;

create index appointments_date_start_idx
  on public.appointments (appointment_date, start_time);

create index appointments_barber_schedule_idx
  on public.appointments (barber_id, appointment_date, start_time);

create index appointments_client_history_idx
  on public.appointments (client_id, appointment_date desc);

create index appointments_status_date_idx
  on public.appointments (status, appointment_date);

create index appointments_service_date_idx
  on public.appointments (service_id, appointment_date);

create index barber_availability_lookup_idx
  on public.barber_availability (barber_id, day_of_week)
  where active;

create index barber_exceptions_lookup_idx
  on public.barber_availability_exceptions (barber_id, exception_date)
  where active;

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create function private.prepare_appointment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_service public.services%rowtype;
  selected_barber public.barbers%rowtype;
begin
  select *
  into selected_service
  from public.services
  where id = new.service_id;

  if not found then
    raise exception 'Service does not exist.'
      using errcode = '23503';
  end if;

  select *
  into selected_barber
  from public.barbers
  where id = new.barber_id;

  if not found then
    raise exception 'Barber does not exist.'
      using errcode = '23503';
  end if;

  if not selected_service.active then
    raise exception 'Inactive services cannot receive new appointments.'
      using errcode = '23514';
  end if;

  if not selected_barber.active then
    raise exception 'Inactive barbers cannot receive new appointments.'
      using errcode = '23514';
  end if;

  new.end_time :=
    new.start_time
    + make_interval(mins => selected_service.duration_minutes);

  if tg_op = 'INSERT' then
    new.price := selected_service.price;
  elsif new.service_id is distinct from old.service_id then
    new.price := selected_service.price;
  end if;

  return new;
end;
$$;

create trigger users_set_updated_at
before update on public.users
for each row execute function private.set_updated_at();

create trigger services_set_updated_at
before update on public.services
for each row execute function private.set_updated_at();

create trigger barbers_set_updated_at
before update on public.barbers
for each row execute function private.set_updated_at();

create trigger clients_set_updated_at
before update on public.clients
for each row execute function private.set_updated_at();

create trigger appointments_set_updated_at
before update on public.appointments
for each row execute function private.set_updated_at();

create trigger appointments_prepare
before insert or update of service_id, barber_id, start_time, end_time
on public.appointments
for each row execute function private.prepare_appointment();

create trigger barber_availability_set_updated_at
before update on public.barber_availability
for each row execute function private.set_updated_at();

create trigger barber_exceptions_set_updated_at
before update on public.barber_availability_exceptions
for each row execute function private.set_updated_at();

create function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.users
    where id = (select auth.uid())
      and role = 'admin'
      and active
  );
$$;

create function private.current_barber_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select barbers.id
  from public.barbers
  inner join public.users
    on users.id = barbers.user_id
  where users.id = (select auth.uid())
    and users.role = 'barber'
    and users.active
    and barbers.active
  limit 1;
$$;

revoke all on function private.set_updated_at() from public;
revoke all on function private.prepare_appointment() from public;
revoke all on function private.is_admin() from public;
revoke all on function private.current_barber_id() from public;

grant execute on function private.is_admin() to authenticated;
grant execute on function private.current_barber_id() to authenticated;

alter table public.users enable row level security;
alter table public.services enable row level security;
alter table public.barbers enable row level security;
alter table public.clients enable row level security;
alter table public.appointments enable row level security;
alter table public.barber_availability enable row level security;
alter table public.barber_availability_exceptions enable row level security;

revoke all on table public.users from anon, authenticated;
revoke all on table public.services from anon, authenticated;
revoke all on table public.barbers from anon, authenticated;
revoke all on table public.clients from anon, authenticated;
revoke all on table public.appointments from anon, authenticated;
revoke all on table public.barber_availability from anon, authenticated;
revoke all on table public.barber_availability_exceptions from anon, authenticated;

grant usage on type public.app_role to authenticated;
grant usage on type public.appointment_status to authenticated;
grant usage on type public.availability_exception_kind to authenticated;

grant select on table public.services to anon;
grant select on table public.barbers to anon;

grant select, insert, update, delete on table public.users to authenticated;
grant select, insert, update, delete on table public.services to authenticated;
grant select, insert, update, delete on table public.barbers to authenticated;
grant select, insert, update, delete on table public.clients to authenticated;
grant select, insert, update, delete on table public.appointments to authenticated;
grant select, insert, update, delete on table public.barber_availability to authenticated;
grant select, insert, update, delete
  on table public.barber_availability_exceptions
  to authenticated;

create policy users_self_read
on public.users
for select
to authenticated
using (id = (select auth.uid()));

create policy users_admin_all
on public.users
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy services_public_read
on public.services
for select
to anon, authenticated
using (active);

create policy services_admin_all
on public.services
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy barbers_public_read
on public.barbers
for select
to anon, authenticated
using (active);

create policy barbers_self_read
on public.barbers
for select
to authenticated
using (user_id = (select auth.uid()));

create policy barbers_admin_all
on public.barbers
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy clients_admin_all
on public.clients
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy appointments_admin_all
on public.appointments
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy appointments_barber_read
on public.appointments
for select
to authenticated
using (barber_id = (select private.current_barber_id()));

create policy barber_availability_admin_all
on public.barber_availability
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy barber_availability_self_read
on public.barber_availability
for select
to authenticated
using (barber_id = (select private.current_barber_id()));

create policy barber_exceptions_admin_all
on public.barber_availability_exceptions
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy barber_exceptions_self_read
on public.barber_availability_exceptions
for select
to authenticated
using (
  barber_id is null
  or barber_id = (select private.current_barber_id())
);

commit;
