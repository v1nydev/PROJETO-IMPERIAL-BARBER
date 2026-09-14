begin;

do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable()
      from public, anon, authenticated;
  end if;
end;
$$;

drop policy users_self_read on public.users;
drop policy users_admin_all on public.users;
drop policy services_public_read on public.services;
drop policy services_admin_all on public.services;
drop policy barbers_public_read on public.barbers;
drop policy barbers_self_read on public.barbers;
drop policy barbers_admin_all on public.barbers;
drop policy clients_admin_all on public.clients;
drop policy appointments_admin_all on public.appointments;
drop policy appointments_barber_read on public.appointments;
drop policy barber_availability_admin_all on public.barber_availability;
drop policy barber_availability_self_read on public.barber_availability;
drop policy barber_exceptions_admin_all
  on public.barber_availability_exceptions;
drop policy barber_exceptions_self_read
  on public.barber_availability_exceptions;

create policy users_authenticated_read
on public.users
for select
to authenticated
using (
  id = (select auth.uid())
  or (select private.is_admin())
);

create policy users_admin_insert
on public.users
for insert
to authenticated
with check ((select private.is_admin()));

create policy users_admin_update
on public.users
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy users_admin_delete
on public.users
for delete
to authenticated
using ((select private.is_admin()));

create policy services_anon_read
on public.services
for select
to anon
using (active);

create policy services_authenticated_read
on public.services
for select
to authenticated
using (
  active
  or (select private.is_admin())
);

create policy services_admin_insert
on public.services
for insert
to authenticated
with check ((select private.is_admin()));

create policy services_admin_update
on public.services
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy services_admin_delete
on public.services
for delete
to authenticated
using ((select private.is_admin()));

create policy barbers_anon_read
on public.barbers
for select
to anon
using (active);

create policy barbers_authenticated_read
on public.barbers
for select
to authenticated
using (
  active
  or user_id = (select auth.uid())
  or (select private.is_admin())
);

create policy barbers_admin_insert
on public.barbers
for insert
to authenticated
with check ((select private.is_admin()));

create policy barbers_admin_update
on public.barbers
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy barbers_admin_delete
on public.barbers
for delete
to authenticated
using ((select private.is_admin()));

create policy clients_admin_read
on public.clients
for select
to authenticated
using ((select private.is_admin()));

create policy clients_admin_insert
on public.clients
for insert
to authenticated
with check ((select private.is_admin()));

create policy clients_admin_update
on public.clients
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy clients_admin_delete
on public.clients
for delete
to authenticated
using ((select private.is_admin()));

create policy appointments_authenticated_read
on public.appointments
for select
to authenticated
using (
  barber_id = (select private.current_barber_id())
  or (select private.is_admin())
);

create policy appointments_admin_insert
on public.appointments
for insert
to authenticated
with check ((select private.is_admin()));

create policy appointments_admin_update
on public.appointments
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy appointments_admin_delete
on public.appointments
for delete
to authenticated
using ((select private.is_admin()));

create policy barber_availability_authenticated_read
on public.barber_availability
for select
to authenticated
using (
  barber_id = (select private.current_barber_id())
  or (select private.is_admin())
);

create policy barber_availability_admin_insert
on public.barber_availability
for insert
to authenticated
with check ((select private.is_admin()));

create policy barber_availability_admin_update
on public.barber_availability
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy barber_availability_admin_delete
on public.barber_availability
for delete
to authenticated
using ((select private.is_admin()));

create policy barber_exceptions_authenticated_read
on public.barber_availability_exceptions
for select
to authenticated
using (
  barber_id is null
  or barber_id = (select private.current_barber_id())
  or (select private.is_admin())
);

create policy barber_exceptions_admin_insert
on public.barber_availability_exceptions
for insert
to authenticated
with check ((select private.is_admin()));

create policy barber_exceptions_admin_update
on public.barber_availability_exceptions
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy barber_exceptions_admin_delete
on public.barber_availability_exceptions
for delete
to authenticated
using ((select private.is_admin()));

commit;
