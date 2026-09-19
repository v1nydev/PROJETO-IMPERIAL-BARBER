begin;

create extension if not exists pgtap with schema extensions;

select plan(6);

select ok(
  to_regprocedure('public.get_public_booking_slots(uuid,uuid,date)') is not null,
  'public slot lookup function exists'
);

select ok(
  to_regprocedure(
    'public.create_public_booking(uuid,uuid,date,time without time zone,text,text,text)'
  ) is not null,
  'public booking creation function exists'
);

select ok(
  has_function_privilege(
    'anon',
    'public.get_public_booking_slots(uuid,uuid,date)',
    'execute'
  ),
  'anonymous visitors can request safe booking slots'
);

select ok(
  has_function_privilege(
    'anon',
    'public.create_public_booking(uuid,uuid,date,time without time zone,text,text,text)',
    'execute'
  ),
  'anonymous visitors can create validated bookings'
);

select ok(
  (
    select bool_and(prosecdef)
    from pg_catalog.pg_proc
    inner join pg_catalog.pg_namespace
      on pg_namespace.oid = pg_proc.pronamespace
    where pg_namespace.nspname = 'public'
      and pg_proc.proname in (
        'get_public_booking_slots',
        'create_public_booking'
      )
  ),
  'public booking functions execute through their restricted definer boundary'
);

select ok(
  not has_table_privilege('anon', 'public.clients', 'select')
  and not has_table_privilege('anon', 'public.appointments', 'select')
  and not has_table_privilege('anon', 'public.appointments', 'insert'),
  'booking RPC does not expose client or appointment tables to anonymous users'
);

select * from finish();

rollback;
