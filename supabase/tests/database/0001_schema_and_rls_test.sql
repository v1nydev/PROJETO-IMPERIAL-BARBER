begin;

create extension if not exists pgtap with schema extensions;

select plan(18);

select has_table('public', 'users', 'users table exists');
select has_table('public', 'services', 'services table exists');
select has_table('public', 'barbers', 'barbers table exists');
select has_table('public', 'clients', 'clients table exists');
select has_table('public', 'appointments', 'appointments table exists');
select has_table(
  'public',
  'barber_availability',
  'barber_availability table exists'
);
select has_table(
  'public',
  'barber_availability_exceptions',
  'barber_availability_exceptions table exists'
);

select has_type('public', 'app_role', 'app_role enum exists');
select has_type(
  'public',
  'appointment_status',
  'appointment_status enum exists'
);
select has_type(
  'public',
  'availability_exception_kind',
  'availability_exception_kind enum exists'
);

select results_eq(
  $$
    select count(*)::bigint
    from pg_catalog.pg_class
    inner join pg_catalog.pg_namespace
      on pg_namespace.oid = pg_class.relnamespace
    where pg_namespace.nspname = 'public'
      and pg_class.relname in (
        'users',
        'services',
        'barbers',
        'clients',
        'appointments',
        'barber_availability',
        'barber_availability_exceptions'
      )
      and pg_class.relrowsecurity
  $$,
  $$ values (7::bigint) $$,
  'RLS is enabled on every application table'
);

select policies_are(
  'public',
  'services',
  array[
    'services_admin_delete',
    'services_admin_insert',
    'services_admin_update',
    'services_anon_read',
    'services_authenticated_read'
  ],
  'services separates anonymous, authenticated and admin access'
);

select policies_are(
  'public',
  'appointments',
  array[
    'appointments_admin_delete',
    'appointments_admin_insert',
    'appointments_admin_update',
    'appointments_authenticated_read'
  ],
  'appointments separates assigned barber read and admin writes'
);

select has_index(
  'public',
  'appointments',
  'appointments_barber_schedule_idx',
  'appointments has the main schedule lookup index'
);

select has_index(
  'public',
  'appointments',
  'appointments_no_barber_overlap',
  'appointments prevents overlapping active slots'
);

select has_index(
  'public',
  'barber_availability',
  'barber_availability_no_overlap',
  'availability prevents overlapping active windows'
);

select col_is_pk(
  'public',
  'appointments',
  'id',
  'appointments.id is the primary key'
);

select has_column(
  'public',
  'barber_availability_exceptions',
  'kind',
  'availability exceptions have a kind'
);

do $$
declare
  application_table_count integer;
  rls_table_count integer;
  application_policy_count integer;
begin
  select count(*)
  into application_table_count
  from pg_catalog.pg_class
  inner join pg_catalog.pg_namespace
    on pg_namespace.oid = pg_class.relnamespace
  where pg_namespace.nspname = 'public'
    and pg_class.relname in (
      'users',
      'services',
      'barbers',
      'clients',
      'appointments',
      'barber_availability',
      'barber_availability_exceptions'
    );

  if application_table_count <> 7 then
    raise exception 'Expected 7 application tables, found %.',
      application_table_count;
  end if;

  select count(*)
  into rls_table_count
  from pg_catalog.pg_class
  inner join pg_catalog.pg_namespace
    on pg_namespace.oid = pg_class.relnamespace
  where pg_namespace.nspname = 'public'
    and pg_class.relname in (
      'users',
      'services',
      'barbers',
      'clients',
      'appointments',
      'barber_availability',
      'barber_availability_exceptions'
    )
    and pg_class.relrowsecurity;

  if rls_table_count <> 7 then
    raise exception 'Expected RLS on 7 application tables, found %.',
      rls_table_count;
  end if;

  select count(*)
  into application_policy_count
  from pg_catalog.pg_policies
  where schemaname = 'public'
    and tablename in (
      'users',
      'services',
      'barbers',
      'clients',
      'appointments',
      'barber_availability',
      'barber_availability_exceptions'
    );

  if application_policy_count <> 30 then
    raise exception 'Expected 30 application policies, found %.',
      application_policy_count;
  end if;

  if to_regprocedure('public.rls_auto_enable()') is not null
    and (
      has_function_privilege(
        'anon',
        'public.rls_auto_enable()',
        'execute'
      )
      or has_function_privilege(
        'authenticated',
        'public.rls_auto_enable()',
        'execute'
      )
    )
  then
    raise exception 'Automatic RLS helper is exposed to application roles.';
  end if;

  if not has_table_privilege('anon', 'public.services', 'select')
    or has_table_privilege('anon', 'public.services', 'insert')
    or not has_table_privilege('anon', 'public.barbers', 'select')
    or has_table_privilege('anon', 'public.clients', 'select')
    or has_table_privilege('anon', 'public.appointments', 'insert')
  then
    raise exception 'Anonymous grants are broader or narrower than expected.';
  end if;

  insert into public.services (
    id,
    name,
    duration_minutes,
    price
  )
  values (
    '00000000-0000-0000-0000-000000000001',
    'Service under test',
    60,
    75
  );

  insert into public.barbers (
    id,
    name,
    slug
  )
  values (
    '00000000-0000-0000-0000-000000000002',
    'Barber under test',
    'barber-under-test'
  );

  insert into public.clients (
    id,
    name,
    phone
  )
  values (
    '00000000-0000-0000-0000-000000000003',
    'Client under test',
    '+5500000000000'
  );

  insert into public.appointments (
    id,
    client_id,
    barber_id,
    service_id,
    appointment_date,
    start_time
  )
  values (
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    date '2099-01-01',
    time '10:00'
  );

  if not exists (
    select 1
    from public.appointments
    where id = '00000000-0000-0000-0000-000000000004'
      and end_time = time '11:00'
      and price = 75
  ) then
    raise exception 'Appointment duration or price snapshot was not prepared.';
  end if;

  begin
    insert into public.appointments (
      id,
      client_id,
      barber_id,
      service_id,
      appointment_date,
      start_time
    )
    values (
      '00000000-0000-0000-0000-000000000005',
      '00000000-0000-0000-0000-000000000003',
      '00000000-0000-0000-0000-000000000002',
      '00000000-0000-0000-0000-000000000001',
      date '2099-01-01',
      time '10:30'
    );

    raise exception 'Overlapping appointment was accepted.';
  exception
    when exclusion_violation then
      null;
  end;
end;
$$;

select * from finish();

rollback;
