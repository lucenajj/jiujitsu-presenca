-- Script para definir o usuário joshua@gmail.com como academy_owner na tabela user_academies
-- Execute este script no SQL Editor do Supabase Dashboard

-- Primeiro, obter o ID do usuário
WITH user_data AS (
  SELECT id 
  FROM auth.users 
  WHERE email = 'joshua@gmail.com'
),
-- Obter a academia associada a este usuário
user_academy AS (
  SELECT id
  FROM academies
  WHERE user_id = (SELECT id FROM user_data)
  LIMIT 1
),
-- Verificar se já existe uma entrada na user_academies
existing_entry AS (
  SELECT id 
  FROM user_academies 
  WHERE 
    user_id = (SELECT id FROM user_data) AND
    academy_id = (SELECT id FROM user_academy)
  LIMIT 1
)
-- Inserir apenas se não existir (ou atualizar o papel se existir)
INSERT INTO user_academies (user_id, academy_id, role)
SELECT 
  user_data.id,
  user_academy.id,
  'academy_owner'
FROM user_data, user_academy
WHERE 
  EXISTS (SELECT 1 FROM user_academy) AND  -- Verificar se o usuário tem academia associada
  NOT EXISTS (SELECT 1 FROM existing_entry)
ON CONFLICT (user_id, academy_id) 
DO UPDATE SET role = 'academy_owner';

-- Verificar se o usuário agora tem o papel de academy_owner
SELECT u.email, a.name as academia, ua.role
FROM user_academies ua
JOIN auth.users u ON ua.user_id = u.id
JOIN academies a ON ua.academy_id = a.id
WHERE u.email = 'joshua@gmail.com'; 