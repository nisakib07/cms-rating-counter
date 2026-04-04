-- ============================================
-- Create Default Admin Users
-- Run this in Supabase SQL Editor
-- ============================================

-- Admin 1: nadiatul.sakib@gmail.com
INSERT INTO auth.users (
  instance_id, id, aud, role, email,
  encrypted_password, email_confirmed_at,
  created_at, updated_at, confirmation_token,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated', 'authenticated',
  'nadiatul.sakib@gmail.com',
  crypt('123456', gen_salt('bf')),
  now(), now(), now(), '',
  '{"provider":"email","providers":["email"]}',
  '{}', false
);

-- Create identity for Admin 1
INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id,
  last_sign_in_at, created_at, updated_at
)
SELECT
  gen_random_uuid(),
  id,
  json_build_object('sub', id::text, 'email', email)::jsonb,
  'email',
  id::text,
  now(), now(), now()
FROM auth.users
WHERE email = 'nadiatul.sakib@gmail.com';

-- Admin 2: officialbillal103@gmail.com
INSERT INTO auth.users (
  instance_id, id, aud, role, email,
  encrypted_password, email_confirmed_at,
  created_at, updated_at, confirmation_token,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated', 'authenticated',
  'officialbillal103@gmail.com',
  crypt('123456', gen_salt('bf')),
  now(), now(), now(), '',
  '{"provider":"email","providers":["email"]}',
  '{}', false
);

-- Create identity for Admin 2
INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id,
  last_sign_in_at, created_at, updated_at
)
SELECT
  gen_random_uuid(),
  id,
  json_build_object('sub', id::text, 'email', email)::jsonb,
  'email',
  id::text,
  now(), now(), now()
FROM auth.users
WHERE email = 'officialbillal103@gmail.com';
