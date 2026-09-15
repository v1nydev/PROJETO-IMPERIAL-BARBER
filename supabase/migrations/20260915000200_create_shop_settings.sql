begin;

create table public.shop_settings (
  id smallint primary key default 1,
  name text not null,
  phone text not null default '',
  whatsapp text not null default '',
  address text not null default '',
  opening_hours text not null default '',
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shop_settings_singleton check (id = 1),
  constraint shop_settings_name_not_blank check (length(btrim(name)) > 0),
  constraint shop_settings_name_length check (length(name) <= 120),
  constraint shop_settings_phone_length check (length(phone) <= 40),
  constraint shop_settings_whatsapp_length check (length(whatsapp) <= 40),
  constraint shop_settings_address_length check (length(address) <= 500),
  constraint shop_settings_opening_hours_length check (
    length(opening_hours) <= 500
  ),
  constraint shop_settings_description_length check (
    length(description) <= 1000
  )
);

create trigger shop_settings_set_updated_at
before update on public.shop_settings
for each row execute function private.set_updated_at();

alter table public.shop_settings enable row level security;

revoke all on table public.shop_settings from anon, authenticated;
grant select on table public.shop_settings to anon, authenticated;
grant insert, update on table public.shop_settings to authenticated;

create policy shop_settings_public_read
on public.shop_settings
for select
to anon, authenticated
using (true);

create policy shop_settings_admin_insert
on public.shop_settings
for insert
to authenticated
with check ((select private.is_admin()));

create policy shop_settings_admin_update
on public.shop_settings
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

insert into public.shop_settings (
  id,
  name,
  phone,
  whatsapp,
  address,
  opening_hours,
  description
)
values (
  1,
  'Imperial Barber',
  '(11) 3456-2012',
  '(11) 93456-2012',
  'Alameda Imperial, 120 — Jardins, São Paulo/SP',
  'Segunda a sábado, das 9h às 20h.',
  'Barbearia e alfaiataria do gesto. Cortes clássicos, barba à toalha quente e tempo reservado para cuidar de cada detalhe.'
)
on conflict (id) do nothing;

commit;
