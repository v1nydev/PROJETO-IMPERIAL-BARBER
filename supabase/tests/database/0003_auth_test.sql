begin;

create extension if not exists pgtap with schema extensions;

select plan(5);

select ok(
  to_regprocedure('private.handle_new_auth_user()') is not null,
  'auth profile trigger function exists'
);

select ok(
  to_regprocedure('private.assign_app_role(text,public.app_role)') is not null,
  'restricted role assignment function exists'
);

select has_trigger(
  'auth',
  'users',
  'auth_users_create_profile',
  'auth user creation provisions an application profile'
);

select ok(
  not has_function_privilege(
    'anon',
    'private.assign_app_role(text,public.app_role)',
    'execute'
  ),
  'anonymous users cannot assign application roles'
);

select ok(
  not has_function_privilege(
    'authenticated',
    'private.assign_app_role(text,public.app_role)',
    'execute'
  ),
  'authenticated users cannot assign application roles'
);

select * from finish();

rollback;
