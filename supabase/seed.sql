begin;

insert into public.services (
  id,
  name,
  description,
  duration_minutes,
  price,
  active
)
values
  (
    '10000000-0000-0000-0000-000000000001',
    'Corte Degradê',
    'Degradê personalizado, acabamento e finalização.',
    50,
    75,
    true
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    'Barba',
    'Modelagem, toalha quente, navalha e hidratação.',
    40,
    50,
    true
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    'Corte + Barba',
    'Corte completo combinado com o ritual de barba.',
    75,
    120,
    true
  ),
  (
    '10000000-0000-0000-0000-000000000004',
    'Pigmentação',
    'Pigmentação capilar com preparação e acabamento.',
    90,
    110,
    true
  ),
  (
    '10000000-0000-0000-0000-000000000005',
    'Luzes',
    'Clareamento técnico com tonalização e finalização.',
    120,
    180,
    true
  ),
  (
    '10000000-0000-0000-0000-000000000006',
    'Combo da Casa',
    'Corte, barba e acabamento em uma sessão completa.',
    80,
    140,
    true
  )
on conflict (id) do update
set
  name = excluded.name,
  description = excluded.description,
  duration_minutes = excluded.duration_minutes,
  price = excluded.price,
  active = excluded.active;

insert into public.barbers (
  id,
  name,
  slug,
  specialty,
  bio,
  avatar_url,
  active
)
values
  (
    '20000000-0000-0000-0000-000000000001',
    'Arthur Vinícius',
    'arthur-vinicius',
    'Fade e cortes modernos',
    'Especialista em degradês precisos e acabamento contemporâneo.',
    null,
    true
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    'Daniel Vital',
    'daniel-vital',
    'Cortes clássicos e barba',
    'Combina técnicas clássicas com o ritual tradicional de barba.',
    null,
    true
  ),
  (
    '20000000-0000-0000-0000-000000000003',
    'Rafael Mendes',
    'rafael-mendes',
    'Visagismo e colorimetria',
    'Trabalha forma, textura e cor para resultados personalizados.',
    null,
    true
  )
on conflict (id) do update
set
  name = excluded.name,
  slug = excluded.slug,
  specialty = excluded.specialty,
  bio = excluded.bio,
  avatar_url = excluded.avatar_url,
  active = excluded.active;

insert into public.clients (
  id,
  name,
  phone,
  email
)
values
  (
    '30000000-0000-0000-0000-000000000001',
    'Lucas Almeida',
    '+55 11 90000-0001',
    'lucas.demo@example.com'
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    'Marcos Ferreira',
    '+55 11 90000-0002',
    'marcos.demo@example.com'
  ),
  (
    '30000000-0000-0000-0000-000000000003',
    'Gabriel Costa',
    '+55 11 90000-0003',
    'gabriel.demo@example.com'
  ),
  (
    '30000000-0000-0000-0000-000000000004',
    'Felipe Rocha',
    '+55 11 90000-0004',
    null
  ),
  (
    '30000000-0000-0000-0000-000000000005',
    'Bruno Santos',
    '+55 11 90000-0005',
    'bruno.demo@example.com'
  ),
  (
    '30000000-0000-0000-0000-000000000006',
    'André Lima',
    '+55 11 90000-0006',
    null
  ),
  (
    '30000000-0000-0000-0000-000000000007',
    'Thiago Martins',
    '+55 11 90000-0007',
    'thiago.demo@example.com'
  ),
  (
    '30000000-0000-0000-0000-000000000008',
    'Eduardo Melo',
    '+55 11 90000-0008',
    null
  ),
  (
    '30000000-0000-0000-0000-000000000009',
    'Caio Nunes',
    '+55 11 90000-0009',
    'caio.demo@example.com'
  ),
  (
    '30000000-0000-0000-0000-000000000010',
    'Pedro Henrique',
    '+55 11 90000-0010',
    null
  )
on conflict (id) do update
set
  name = excluded.name,
  phone = excluded.phone,
  email = excluded.email;

delete from public.barber_availability
where barber_id in (
  '20000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000002',
  '20000000-0000-0000-0000-000000000003'
);

insert into public.barber_availability (
  id,
  barber_id,
  day_of_week,
  start_time,
  end_time,
  active
)
select
  (
    '40000000-0000-0000-0000-'
    || lpad(
      (
        barber.position * 10
        + schedule.day_of_week
      )::text,
      12,
      '0'
    )
  )::uuid,
  barber.id,
  schedule.day_of_week,
  time '09:00',
  time '19:00',
  true
from (
  values
    (1, '20000000-0000-0000-0000-000000000001'::uuid),
    (2, '20000000-0000-0000-0000-000000000002'::uuid),
    (3, '20000000-0000-0000-0000-000000000003'::uuid)
) as barber(position, id)
cross join generate_series(1, 6) as schedule(day_of_week);

delete from public.barber_availability_exceptions
where id in (
  '60000000-0000-0000-0000-000000000001',
  '60000000-0000-0000-0000-000000000002'
);

insert into public.barber_availability_exceptions (
  id,
  barber_id,
  exception_date,
  start_time,
  end_time,
  kind,
  reason,
  active
)
values
  (
    '60000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    current_date + 7,
    null,
    null,
    'day_off',
    'Folga de demonstração',
    true
  ),
  (
    '60000000-0000-0000-0000-000000000002',
    null,
    current_date + 14,
    time '12:00',
    time '14:00',
    'blocked',
    'Manutenção programada de demonstração',
    true
  );

delete from public.appointments
where left(id::text, 8) = '50000000';

insert into public.appointments (
  id,
  client_id,
  barber_id,
  service_id,
  appointment_date,
  start_time,
  status,
  notes
)
values
  (
    '50000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    current_date,
    time '09:00',
    'completed',
    'Cliente prefere acabamento natural.'
  ),
  (
    '50000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000003',
    current_date,
    time '09:30',
    'in_progress',
    null
  ),
  (
    '50000000-0000-0000-0000-000000000003',
    '30000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000005',
    current_date,
    time '11:00',
    'confirmed',
    'Teste de mecha antes do serviço.'
  ),
  (
    '50000000-0000-0000-0000-000000000004',
    '30000000-0000-0000-0000-000000000004',
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000006',
    current_date,
    time '14:00',
    'pending',
    null
  ),
  (
    '50000000-0000-0000-0000-000000000005',
    '30000000-0000-0000-0000-000000000005',
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002',
    current_date,
    time '15:30',
    'cancelled',
    'Cancelamento de demonstração.'
  ),
  (
    '50000000-0000-0000-0000-000000000006',
    '30000000-0000-0000-0000-000000000006',
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    current_date - 1,
    time '10:00',
    'completed',
    null
  ),
  (
    '50000000-0000-0000-0000-000000000007',
    '30000000-0000-0000-0000-000000000007',
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002',
    current_date - 1,
    time '11:00',
    'completed',
    null
  ),
  (
    '50000000-0000-0000-0000-000000000008',
    '30000000-0000-0000-0000-000000000008',
    '20000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000004',
    current_date - 1,
    time '14:00',
    'no_show',
    null
  ),
  (
    '50000000-0000-0000-0000-000000000009',
    '30000000-0000-0000-0000-000000000009',
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000003',
    current_date - 3,
    time '16:00',
    'completed',
    null
  ),
  (
    '50000000-0000-0000-0000-000000000010',
    '30000000-0000-0000-0000-000000000010',
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000006',
    current_date - 3,
    time '13:00',
    'cancelled',
    'Cancelamento de demonstração.'
  ),
  (
    '50000000-0000-0000-0000-000000000011',
    '30000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    current_date + 1,
    time '10:30',
    'confirmed',
    null
  ),
  (
    '50000000-0000-0000-0000-000000000012',
    '30000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000005',
    current_date + 1,
    time '13:30',
    'pending',
    null
  ),
  (
    '50000000-0000-0000-0000-000000000013',
    '30000000-0000-0000-0000-000000000005',
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000006',
    current_date + 2,
    time '14:30',
    'pending',
    null
  );

commit;
