begin;

create or replace function public.get_public_booking_slots(
  p_service_id uuid,
  p_barber_id uuid,
  p_appointment_date date
)
returns table (start_time time without time zone)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  service_duration smallint;
  local_today date := (now() at time zone 'America/Sao_Paulo')::date;
  local_time time := (now() at time zone 'America/Sao_Paulo')::time;
begin
  if p_appointment_date < local_today
    or p_appointment_date > local_today + 30
  then
    return;
  end if;

  select duration_minutes
  into service_duration
  from public.services
  where id = p_service_id
    and active;

  if not found or not exists (
    select 1
    from public.barbers
    where id = p_barber_id
      and active
  ) then
    return;
  end if;

  return query
  select slot_at::time
  from public.barber_availability as availability
  cross join lateral generate_series(
    p_appointment_date + availability.start_time,
    p_appointment_date + availability.end_time
      - make_interval(mins => service_duration),
    interval '30 minutes'
  ) as slot_at
  where availability.barber_id = p_barber_id
    and availability.day_of_week = extract(dow from p_appointment_date)::smallint
    and availability.active
    and (
      p_appointment_date > local_today
      or slot_at::time >= local_time + interval '60 minutes'
    )
    and not exists (
      select 1
      from public.barber_availability_exceptions as exception
      where exception.active
        and exception.exception_date = p_appointment_date
        and (exception.barber_id is null or exception.barber_id = p_barber_id)
        and (
          exception.start_time is null
          or exception.end_time is null
          or tsrange(
            p_appointment_date + exception.start_time,
            p_appointment_date + exception.end_time,
            '[)'
          ) && tsrange(
            slot_at,
            slot_at + make_interval(mins => service_duration),
            '[)'
          )
        )
    )
    and not exists (
      select 1
      from public.appointments as appointment
      where appointment.barber_id = p_barber_id
        and appointment.appointment_date = p_appointment_date
        and appointment.status in ('pending', 'confirmed', 'in_progress')
        and tsrange(
          p_appointment_date + appointment.start_time,
          p_appointment_date + appointment.end_time,
          '[)'
        ) && tsrange(
          slot_at,
          slot_at + make_interval(mins => service_duration),
          '[)'
        )
    )
  order by slot_at;
end;
$$;

create or replace function public.create_public_booking(
  p_service_id uuid,
  p_barber_id uuid,
  p_appointment_date date,
  p_start_time time without time zone,
  p_client_name text,
  p_phone text,
  p_email text default null
)
returns table (appointment_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_name text := btrim(p_client_name);
  normalized_phone text := regexp_replace(p_phone, '[^0-9+]', '', 'g');
  normalized_email text := nullif(lower(btrim(p_email)), '');
  selected_client_id uuid;
  created_appointment_id uuid;
begin
  if length(normalized_name) < 2 or length(normalized_name) > 120 then
    raise exception 'Invalid client name.' using errcode = '22023';
  end if;

  if length(normalized_phone) < 8 or length(normalized_phone) > 20 then
    raise exception 'Invalid client phone.' using errcode = '22023';
  end if;

  if normalized_email is not null and (
    length(normalized_email) > 254
    or normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ) then
    raise exception 'Invalid client email.' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      p_barber_id::text || ':' || p_appointment_date::text,
      0
    )
  );

  if not exists (
    select 1
    from public.get_public_booking_slots(
      p_service_id,
      p_barber_id,
      p_appointment_date
    ) as available_slot
    where available_slot.start_time = p_start_time
  ) then
    raise exception 'Requested booking slot is unavailable.' using errcode = 'P0001';
  end if;

  select id
  into selected_client_id
  from public.clients
  where regexp_replace(phone, '[^0-9+]', '', 'g') = normalized_phone
  order by created_at
  limit 1;

  if selected_client_id is null then
    insert into public.clients (name, phone, email)
    values (normalized_name, normalized_phone, normalized_email)
    returning id into selected_client_id;
  else
    update public.clients
    set name = normalized_name,
        phone = normalized_phone,
        email = coalesce(normalized_email, email)
    where id = selected_client_id;
  end if;

  insert into public.appointments (
    client_id,
    barber_id,
    service_id,
    appointment_date,
    start_time,
    end_time,
    price,
    status,
    notes
  )
  values (
    selected_client_id,
    p_barber_id,
    p_service_id,
    p_appointment_date,
    p_start_time,
    p_start_time + interval '1 minute',
    0,
    'pending',
    'Agendamento realizado pelo site.'
  )
  returning id into created_appointment_id;

  return query select created_appointment_id;
end;
$$;

revoke all on function public.get_public_booking_slots(uuid, uuid, date)
  from public, anon, authenticated;
revoke all on function public.create_public_booking(
  uuid,
  uuid,
  date,
  time without time zone,
  text,
  text,
  text
) from public, anon, authenticated;

grant execute on function public.get_public_booking_slots(uuid, uuid, date)
  to anon, authenticated;
grant execute on function public.create_public_booking(
  uuid,
  uuid,
  date,
  time without time zone,
  text,
  text,
  text
) to anon, authenticated;

comment on function public.get_public_booking_slots(uuid, uuid, date)
  is 'Returns bookable slots without exposing appointments or availability tables.';
comment on function public.create_public_booking(
  uuid,
  uuid,
  date,
  time without time zone,
  text,
  text,
  text
) is 'Creates a validated public booking while keeping client and appointment tables private.';

commit;
