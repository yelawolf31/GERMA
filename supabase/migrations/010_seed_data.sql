-- ============================================================
-- 010_seed_data.sql
-- DEMO DATA ONLY — replace with real data in production.
-- Credentials (demo only):
--   admin@germa.dz     / Admin123!
--   supervisor@germa.dz / Super123!
-- ============================================================

-- -----------------------------------------------------------
-- Demo auth users (password hashed with bcrypt)
-- -----------------------------------------------------------
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'admin@germa.dz',
    crypt('Admin123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Hani Admin","role":"admin"}',
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'supervisor@germa.dz',
    crypt('Super123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Samir Supervisor","role":"supervisor"}',
    now(), now()
  )
on conflict (id) do nothing;

-- Profiles (the handle_new_user trigger also runs; upsert keeps them in sync)
insert into public.profiles (id, full_name, email, role)
values
  ('00000000-0000-0000-0000-000000000001', 'Hani Admin', 'admin@germa.dz', 'admin'),
  ('00000000-0000-0000-0000-000000000002', 'Samir Supervisor', 'supervisor@germa.dz', 'supervisor')
on conflict (id) do update
  set full_name = excluded.full_name, email = excluded.email, role = excluded.role;

-- -----------------------------------------------------------
-- Demo customers (Oran region, fake data)
-- -----------------------------------------------------------
insert into public.customers (
  id, name, business_type, phone, address, wilaya, commune,
  latitude, longitude, status, notes, created_by
)
values
  ('00000000-0000-0000-0000-000000000101', 'Superette El Amel', 'superette', '0550 11 22 33', 'Rue des Frères Bouadou', 'Oran', 'Bir El Djir', 35.6949, -0.5687, 'active', 'Point de vente principal', '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000102', 'Épicerie Benali', 'epicerie', '0550 22 33 44', 'Bd de l''Indépendance', 'Oran', 'Oran', 35.6987, -0.6297, 'active', null, '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000103', 'Superette Ennasr', 'superette', '0550 33 44 55', 'Cité Ennasr', 'Oran', 'Es Senia', 35.6485, -0.6297, 'active', null, '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000104', 'Point de vente Rahma', 'food_store', '0550 44 55 66', 'Zone commerciale', 'Oran', 'Sidi Chami', 35.6547, -0.5174, 'inactive', 'Contrat suspendu', '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000105', 'Épicerie El Baraka', 'epicerie', '0550 55 66 77', 'Route de la Corniche', 'Oran', 'Aïn El Turk', 35.7442, -0.7629, 'active', null, '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000106', 'Superette Misserghin', 'superette', '0550 66 77 88', 'Centre-ville', 'Oran', 'Misserghin', 35.6169, -0.7318, 'active', null, '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000107', 'Café Le Printemps', 'cafe', '0550 77 88 99', 'Rue de la Mairie', 'Oran', 'Gdyel', 35.7783, -0.4241, 'active', 'Ouvert 7j/7', '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000108', 'Restaurant El Bahia', 'restaurant', '0550 88 99 00', 'Zone industrielle', 'Oran', 'Bethioua', 35.8079, -0.2595, 'active', null, '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000109', 'Superette Arzew', 'superette', '0550 99 00 11', 'Av. de la Fraternité', 'Oran', 'Arzew', 35.8545, -0.3155, 'active', null, '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000110', 'Épicerie Hassi Bounif', 'epicerie', '0550 00 11 22', 'Lotissement El Feth', 'Oran', 'Hassi Bounif', 35.7087, -0.4156, 'active', null, '00000000-0000-0000-0000-000000000002')
on conflict (id) do nothing;

-- -----------------------------------------------------------
-- Demo refrigerators (15)
-- 101 -> broken (red marker), 103 -> maintenance (orange),
-- 105/106 -> broken, 108 -> maintenance, 104 inactive (gray)
-- -----------------------------------------------------------
insert into public.refrigerators (
  id, customer_id, serial_number, model, status, installation_date, notes, created_by
)
values
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000101', 'GERMA-0258', 'G-500L', 'working', '2024-03-10', null, '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000101', 'GERMA-0259', 'G-500L', 'working', '2024-03-10', null, '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000101', 'GERMA-0260', 'G-300L', 'broken', '2024-06-01', 'Compresseur à remplacer', '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000204', '00000000-0000-0000-0000-000000000102', 'GERMA-0261', 'G-500L', 'working', '2024-01-15', null, '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000205', '00000000-0000-0000-0000-000000000103', 'GERMA-0262', 'G-300L', 'needs_maintenance', '2023-11-20', 'Joint de porte usé', '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000206', '00000000-0000-0000-0000-000000000103', 'GERMA-0263', 'G-300L', 'working', '2024-05-05', null, '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000207', '00000000-0000-0000-0000-000000000104', 'GERMA-0264', 'G-500L', 'working', '2023-08-01', null, '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000208', '00000000-0000-0000-0000-000000000105', 'GERMA-0265', 'G-300L', 'working', '2024-02-18', null, '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000209', '00000000-0000-0000-0000-000000000106', 'GERMA-0266', 'G-300L', 'broken', '2023-05-12', 'Panne électrique', '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000210', '00000000-0000-0000-0000-000000000107', 'GERMA-0267', 'G-500L', 'working', '2024-07-01', null, '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000211', '00000000-0000-0000-0000-000000000108', 'GERMA-0268', 'G-500L', 'needs_maintenance', '2024-04-22', 'Vibration anormale', '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000212', '00000000-0000-0000-0000-000000000109', 'GERMA-0269', 'G-300L', 'working', '2023-09-14', null, '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000213', '00000000-0000-0000-0000-000000000109', 'GERMA-0270', 'G-500L', 'working', '2024-01-30', null, '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000214', '00000000-0000-0000-0000-000000000110', 'GERMA-0271', 'G-300L', 'working', '2024-03-25', null, '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000215', '00000000-0000-0000-0000-000000000102', 'GERMA-0272', 'G-300L', 'removed', '2022-06-10', 'Retiré par la société', '00000000-0000-0000-0000-000000000002')
on conflict (id) do nothing;

-- -----------------------------------------------------------
-- Demo visits (20) — spread over the last 14 days
-- -----------------------------------------------------------
insert into public.visits (
  customer_id, supervisor_id, visited_at, refrigerator_condition, cleanliness, notes, latitude, longitude
)
values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000002', now() - interval '2 hours', 'working', 'good', 'Visite de routine', 35.6949, -0.5687),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000002', now() - interval '5 hours', 'needs_maintenance', 'medium', 'Bruit suspect', 35.6949, -0.5687),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000002', now() - interval '1 day', 'working', 'good', null, 35.6987, -0.6297),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000002', now() - interval '1 day', 'broken', 'bad', 'Fuite de gaz', 35.6485, -0.6297),
  ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000002', now() - interval '2 days', 'working', 'good', null, 35.6547, -0.5174),
  ('00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000002', now() - interval '2 days', 'working', 'medium', null, 35.7442, -0.7629),
  ('00000000-0000-0000-0000-000000000106', '00000000-0000-0000-0000-000000000002', now() - interval '3 days', 'broken', 'bad', 'Porte ne ferme pas', 35.6169, -0.7318),
  ('00000000-0000-0000-0000-000000000107', '00000000-0000-0000-0000-000000000002', now() - interval '3 days', 'working', 'good', null, 35.7783, -0.4241),
  ('00000000-0000-0000-0000-000000000108', '00000000-0000-0000-0000-000000000002', now() - interval '4 days', 'needs_maintenance', 'good', null, 35.8079, -0.2595),
  ('00000000-0000-0000-0000-000000000109', '00000000-0000-0000-0000-000000000002', now() - interval '4 days', 'working', 'good', null, 35.8545, -0.3155),
  ('00000000-0000-0000-0000-000000000110', '00000000-0000-0000-0000-000000000002', now() - interval '5 days', 'working', 'medium', null, 35.7087, -0.4156),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000002', now() - interval '6 days', 'working', 'good', null, 35.6949, -0.5687),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000002', now() - interval '7 days', 'working', 'good', null, 35.6987, -0.6297),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000002', now() - interval '8 days', 'working', 'medium', null, 35.6485, -0.6297),
  ('00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000002', now() - interval '9 days', 'working', 'good', null, 35.7442, -0.7629),
  ('00000000-0000-0000-0000-000000000106', '00000000-0000-0000-0000-000000000002', now() - interval '10 days', 'broken', 'bad', null, 35.6169, -0.7318),
  ('00000000-0000-0000-0000-000000000107', '00000000-0000-0000-0000-000000000002', now() - interval '11 days', 'working', 'good', null, 35.7783, -0.4241),
  ('00000000-0000-0000-0000-000000000108', '00000000-0000-0000-0000-000000000002', now() - interval '12 days', 'working', 'good', null, 35.8079, -0.2595),
  ('00000000-0000-0000-0000-000000000109', '00000000-0000-0000-0000-000000000002', now() - interval '13 days', 'working', 'good', null, 35.8545, -0.3155),
  ('00000000-0000-0000-0000-000000000110', '00000000-0000-0000-0000-000000000002', now() - interval '14 days', 'needs_maintenance', 'medium', 'Check thermostat', 35.7087, -0.4156)
on conflict (id) do nothing;

-- -----------------------------------------------------------
-- Demo issues (5)
-- -----------------------------------------------------------
insert into public.issues (
  customer_id, refrigerator_id, reported_by, issue_type, priority, description, status, resolved_at
)
values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000002', 'cooling_problem', 'critical', 'Le compresseur ne démarre plus, la température ne descend pas.', 'open', null),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000205', '00000000-0000-0000-0000-000000000002', 'electrical_problem', 'high', 'Coupures intermittentes de courant.', 'open', null),
  ('00000000-0000-0000-0000-000000000106', '00000000-0000-0000-0000-000000000209', '00000000-0000-0000-0000-000000000002', 'door_problem', 'medium', 'La porte de la vitrine est difficile à fermer.', 'in_progress', null),
  ('00000000-0000-0000-0000-000000000108', null, '00000000-0000-0000-0000-000000000002', 'lighting_problem', 'low', 'L''éclairage interne clignote.', 'resolved', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000208', '00000000-0000-0000-0000-000000000002', 'cleanliness_problem', 'medium', 'Nettoyage requis à l''intérieur de la vitrine.', 'open', null)
on conflict (id) do nothing;

-- -----------------------------------------------------------
-- Demo products (standalone catalog)
-- -----------------------------------------------------------
insert into public.products (name, code, category, is_active)
values
  ('Crème Glacée Vanille', 'CRE-VAN-001', 'glaces', true),
  ('Crème Glacée Chocolat', 'CRE-CHO-002', 'glaces', true),
  ('Bâtonnet Fraise', 'BAT-FRA-003', 'bâtonnets', true),
  ('Pot Familial 1L', 'POT-FAM-004', 'pots', true),
  ('Cornet Pistache', 'COR-PIS-005', 'cornets', true),
  ('Glace à l''eau Citron', 'GLA-CIT-006', 'glaces à l''eau', true)
on conflict (id) do nothing;
