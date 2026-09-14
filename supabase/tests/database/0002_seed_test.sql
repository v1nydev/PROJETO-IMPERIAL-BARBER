begin;

create extension if not exists pgtap with schema extensions;

select plan(9);

select is(
  (
    select count(*)::integer
    from public.services
    where left(id::text, 8) = '10000000'
  ),
  6,
  'seed has six services'
);

select is(
  (
    select count(*)::integer
    from public.barbers
    where left(id::text, 8) = '20000000'
  ),
  3,
  'seed has three barbers'
);

select is(
  (
    select count(*)::integer
    from public.clients
    where left(id::text, 8) = '30000000'
  ),
  10,
  'seed has ten synthetic clients'
);

select is(
  (
    select count(*)::integer
    from public.appointments
    where left(id::text, 8) = '50000000'
  ),
  13,
  'seed has thirteen appointments'
);

select set_eq(
  $$
    select distinct status::text
    from public.appointments
    where left(id::text, 8) = '50000000'
  $$,
  $$
    values
      ('pending'),
      ('confirmed'),
      ('in_progress'),
      ('completed'),
      ('cancelled'),
      ('no_show')
  $$,
  'seed covers every appointment status'
);

select is(
  (
    select count(*)::integer
    from public.appointments
    where left(id::text, 8) = '50000000'
      and appointment_date = current_date
  ),
  5,
  'seed has five appointments for today'
);

select is(
  (
    select count(*)::integer
    from public.barber_availability
    where left(id::text, 8) = '40000000'
  ),
  18,
  'seed has Monday to Saturday availability for every barber'
);

select is(
  (
    select count(*)::integer
    from public.barber_availability_exceptions
    where left(id::text, 8) = '60000000'
  ),
  2,
  'seed has two availability exceptions'
);

select ok(
  not exists (
    select 1
    from public.clients
    where left(id::text, 8) = '30000000'
      and email is not null
      and lower(email) not like '%@example.com'
  ),
  'seed client emails use the reserved example.com domain'
);

select * from finish();

rollback;
