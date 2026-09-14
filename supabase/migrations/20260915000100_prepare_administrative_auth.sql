begin;

create function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, role, active)
  values (new.id, 'barber', true)
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger auth_users_create_profile
after insert on auth.users
for each row execute function private.handle_new_auth_user();

create function private.assign_app_role(
  target_email text,
  target_role public.app_role
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_user_id uuid;
begin
  select id
  into target_user_id
  from auth.users
  where pg_catalog.lower(email) = pg_catalog.lower(pg_catalog.btrim(target_email))
  limit 1;

  if target_user_id is null then
    raise exception 'Auth user was not found.'
      using errcode = 'P0002';
  end if;

  insert into public.users (id, role, active)
  values (target_user_id, target_role, true)
  on conflict (id) do update
  set
    role = excluded.role,
    active = true;

  return target_user_id;
end;
$$;

insert into public.users (id, role, active)
select id, 'barber', true
from auth.users
on conflict (id) do nothing;

revoke all on function private.handle_new_auth_user() from public;
revoke all on function private.assign_app_role(text, public.app_role)
  from public, anon, authenticated;

commit;
