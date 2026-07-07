-- ============================================================
-- SEED SCRIPT 1/3: Create 20 fake users + households
-- Run this FIRST in Supabase SQL Editor
-- ============================================================

-- Password for all fake users: MealMap2024!
-- They can log in with their email + this password

INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
VALUES
  ('a0000000-0001-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sarah.mitchell@fakemeal.com', crypt('MealMap2024!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('a0000000-0002-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'carlos.mendoza@fakemeal.com', crypt('MealMap2024!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('a0000000-0003-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'wei.zhang@fakemeal.com', crypt('MealMap2024!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('a0000000-0004-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'priya.patel@fakemeal.com', crypt('MealMap2024!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('a0000000-0005-4000-8000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'yuki.tanaka@fakemeal.com', crypt('MealMap2024!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('a0000000-0006-4000-8000-000000000006', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'maria.garcia@fakemeal.com', crypt('MealMap2024!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('a0000000-0007-4000-8000-000000000007', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'james.wilson@fakemeal.com', crypt('MealMap2024!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('a0000000-0008-4000-8000-000000000008', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'fatima.alhassan@fakemeal.com', crypt('MealMap2024!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('a0000000-0009-4000-8000-000000000009', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'kim.nguyen@fakemeal.com', crypt('MealMap2024!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('a0000000-0010-4000-8000-000000000010', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'luigi.rossi@fakemeal.com', crypt('MealMap2024!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('a0000000-0011-4000-8000-000000000011', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'aisha.johnson@fakemeal.com', crypt('MealMap2024!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('a0000000-0012-4000-8000-000000000012', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'chen.weilin@fakemeal.com', crypt('MealMap2024!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('a0000000-0013-4000-8000-000000000013', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sofia.rodriguez@fakemeal.com', crypt('MealMap2024!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('a0000000-0014-4000-8000-000000000014', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'david.thompson@fakemeal.com', crypt('MealMap2024!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('a0000000-0015-4000-8000-000000000015', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'meiling.wu@fakemeal.com', crypt('MealMap2024!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('a0000000-0016-4000-8000-000000000016', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'hassan.ahmed@fakemeal.com', crypt('MealMap2024!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('a0000000-0017-4000-8000-000000000017', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rachel.kim@fakemeal.com', crypt('MealMap2024!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('a0000000-0018-4000-8000-000000000018', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'pierre.dubois@fakemeal.com', crypt('MealMap2024!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('a0000000-0019-4000-8000-000000000019', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ananya.sharma@fakemeal.com', crypt('MealMap2024!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('a0000000-0020-4000-8000-000000000020', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'tyler.brooks@fakemeal.com', crypt('MealMap2024!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}');

-- The handle_new_user trigger auto-creates profiles. Now create households:
INSERT INTO households (id, name, owner_id) VALUES
  ('b0000000-0001-4000-8000-000000000001', 'Mitchell Kitchen', 'a0000000-0001-4000-8000-000000000001'),
  ('b0000000-0002-4000-8000-000000000002', 'Casa Mendoza', 'a0000000-0002-4000-8000-000000000002'),
  ('b0000000-0003-4000-8000-000000000003', 'Zhang Family', 'a0000000-0003-4000-8000-000000000003'),
  ('b0000000-0004-4000-8000-000000000004', 'Patel Home', 'a0000000-0004-4000-8000-000000000004'),
  ('b0000000-0005-4000-8000-000000000005', 'Tanaka House', 'a0000000-0005-4000-8000-000000000005'),
  ('b0000000-0006-4000-8000-000000000006', 'Garcia Cocina', 'a0000000-0006-4000-8000-000000000006'),
  ('b0000000-0007-4000-8000-000000000007', 'Wilson Home', 'a0000000-0007-4000-8000-000000000007'),
  ('b0000000-0008-4000-8000-000000000008', 'Al-Hassan Kitchen', 'a0000000-0008-4000-8000-000000000008'),
  ('b0000000-0009-4000-8000-000000000009', 'Nguyen Family', 'a0000000-0009-4000-8000-000000000009'),
  ('b0000000-0010-4000-8000-000000000010', 'Rossi Cucina', 'a0000000-0010-4000-8000-000000000010'),
  ('b0000000-0011-4000-8000-000000000011', 'Johnson Kitchen', 'a0000000-0011-4000-8000-000000000011'),
  ('b0000000-0012-4000-8000-000000000012', 'Lin Family', 'a0000000-0012-4000-8000-000000000012'),
  ('b0000000-0013-4000-8000-000000000013', 'Rodriguez Cocina', 'a0000000-0013-4000-8000-000000000013'),
  ('b0000000-0014-4000-8000-000000000014', 'Thompson Home', 'a0000000-0014-4000-8000-000000000014'),
  ('b0000000-0015-4000-8000-000000000015', 'Wu Kitchen', 'a0000000-0015-4000-8000-000000000015'),
  ('b0000000-0016-4000-8000-000000000016', 'Ahmed Family', 'a0000000-0016-4000-8000-000000000016'),
  ('b0000000-0017-4000-8000-000000000017', 'Kim Kitchen', 'a0000000-0017-4000-8000-000000000017'),
  ('b0000000-0018-4000-8000-000000000018', 'Dubois Cuisine', 'a0000000-0018-4000-8000-000000000018'),
  ('b0000000-0019-4000-8000-000000000019', 'Sharma Home', 'a0000000-0019-4000-8000-000000000019'),
  ('b0000000-0020-4000-8000-000000000020', 'Brooks Kitchen', 'a0000000-0020-4000-8000-000000000020');

-- Update profiles with display names, avatars, households, and public status
UPDATE profiles SET display_name = 'Sarah Mitchell',    avatar_url = 'https://i.pravatar.cc/200?u=sarah.mitchell',    household_id = 'b0000000-0001-4000-8000-000000000001', is_public = true WHERE id = 'a0000000-0001-4000-8000-000000000001';
UPDATE profiles SET display_name = 'Carlos Mendoza',    avatar_url = 'https://i.pravatar.cc/200?u=carlos.mendoza',    household_id = 'b0000000-0002-4000-8000-000000000002', is_public = true WHERE id = 'a0000000-0002-4000-8000-000000000002';
UPDATE profiles SET display_name = 'Wei Zhang',         avatar_url = 'https://i.pravatar.cc/200?u=wei.zhang',         household_id = 'b0000000-0003-4000-8000-000000000003', is_public = true WHERE id = 'a0000000-0003-4000-8000-000000000003';
UPDATE profiles SET display_name = 'Priya Patel',       avatar_url = 'https://i.pravatar.cc/200?u=priya.patel',       household_id = 'b0000000-0004-4000-8000-000000000004', is_public = true WHERE id = 'a0000000-0004-4000-8000-000000000004';
UPDATE profiles SET display_name = 'Yuki Tanaka',       avatar_url = 'https://i.pravatar.cc/200?u=yuki.tanaka',       household_id = 'b0000000-0005-4000-8000-000000000005', is_public = true WHERE id = 'a0000000-0005-4000-8000-000000000005';
UPDATE profiles SET display_name = 'Maria Garcia',      avatar_url = 'https://i.pravatar.cc/200?u=maria.garcia',      household_id = 'b0000000-0006-4000-8000-000000000006', is_public = true WHERE id = 'a0000000-0006-4000-8000-000000000006';
UPDATE profiles SET display_name = 'James Wilson',      avatar_url = 'https://i.pravatar.cc/200?u=james.wilson',      household_id = 'b0000000-0007-4000-8000-000000000007', is_public = true WHERE id = 'a0000000-0007-4000-8000-000000000007';
UPDATE profiles SET display_name = 'Fatima Al-Hassan',  avatar_url = 'https://i.pravatar.cc/200?u=fatima.alhassan',   household_id = 'b0000000-0008-4000-8000-000000000008', is_public = true WHERE id = 'a0000000-0008-4000-8000-000000000008';
UPDATE profiles SET display_name = 'Kim Nguyen',        avatar_url = 'https://i.pravatar.cc/200?u=kim.nguyen',        household_id = 'b0000000-0009-4000-8000-000000000009', is_public = true WHERE id = 'a0000000-0009-4000-8000-000000000009';
UPDATE profiles SET display_name = 'Luigi Rossi',       avatar_url = 'https://i.pravatar.cc/200?u=luigi.rossi',       household_id = 'b0000000-0010-4000-8000-000000000010', is_public = true WHERE id = 'a0000000-0010-4000-8000-000000000010';
UPDATE profiles SET display_name = 'Aisha Johnson',     avatar_url = 'https://i.pravatar.cc/200?u=aisha.johnson',     household_id = 'b0000000-0011-4000-8000-000000000011', is_public = true WHERE id = 'a0000000-0011-4000-8000-000000000011';
UPDATE profiles SET display_name = 'Chen Wei Lin',      avatar_url = 'https://i.pravatar.cc/200?u=chen.weilin',       household_id = 'b0000000-0012-4000-8000-000000000012', is_public = true WHERE id = 'a0000000-0012-4000-8000-000000000012';
UPDATE profiles SET display_name = 'Sofia Rodriguez',   avatar_url = 'https://i.pravatar.cc/200?u=sofia.rodriguez',   household_id = 'b0000000-0013-4000-8000-000000000013', is_public = true WHERE id = 'a0000000-0013-4000-8000-000000000013';
UPDATE profiles SET display_name = 'David Thompson',    avatar_url = 'https://i.pravatar.cc/200?u=david.thompson',    household_id = 'b0000000-0014-4000-8000-000000000014', is_public = true WHERE id = 'a0000000-0014-4000-8000-000000000014';
UPDATE profiles SET display_name = 'Mei-Ling Wu',       avatar_url = 'https://i.pravatar.cc/200?u=meiling.wu',        household_id = 'b0000000-0015-4000-8000-000000000015', is_public = true WHERE id = 'a0000000-0015-4000-8000-000000000015';
UPDATE profiles SET display_name = 'Hassan Ahmed',      avatar_url = 'https://i.pravatar.cc/200?u=hassan.ahmed',      household_id = 'b0000000-0016-4000-8000-000000000016', is_public = true WHERE id = 'a0000000-0016-4000-8000-000000000016';
UPDATE profiles SET display_name = 'Rachel Kim',        avatar_url = 'https://i.pravatar.cc/200?u=rachel.kim',        household_id = 'b0000000-0017-4000-8000-000000000017', is_public = true WHERE id = 'a0000000-0017-4000-8000-000000000017';
UPDATE profiles SET display_name = 'Pierre Dubois',     avatar_url = 'https://i.pravatar.cc/200?u=pierre.dubois',     household_id = 'b0000000-0018-4000-8000-000000000018', is_public = true WHERE id = 'a0000000-0018-4000-8000-000000000018';
UPDATE profiles SET display_name = 'Ananya Sharma',     avatar_url = 'https://i.pravatar.cc/200?u=ananya.sharma',     household_id = 'b0000000-0019-4000-8000-000000000019', is_public = true WHERE id = 'a0000000-0019-4000-8000-000000000019';
UPDATE profiles SET display_name = 'Tyler Brooks',      avatar_url = 'https://i.pravatar.cc/200?u=tyler.brooks',      household_id = 'b0000000-0020-4000-8000-000000000020', is_public = true WHERE id = 'a0000000-0020-4000-8000-000000000020';

-- Confirm
SELECT display_name, email, is_public FROM profiles WHERE id::text LIKE 'a0000000-%' ORDER BY display_name;
