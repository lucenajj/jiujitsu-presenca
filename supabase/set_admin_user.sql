-- Script para definir o usuário lucenajj@gmail.com como admin na tabela user_academies
-- Execute este script no SQL Editor do Supabase Dashboard

-- Primeiro, obter o ID do usuário
WITH user_data AS (
  SELECT id 
  FROM auth.users 
  WHERE email = 'lucenajj@gmail.com'
)
-- Verificar se já existe uma entrada na user_academies
, existing_entry AS (
  SELECT id 
  FROM user_academies 
  WHERE user_id = (SELECT id FROM user_data)
  LIMIT 1
)
-- Inserir apenas se não existir (ou atualizar o papel se existir)
INSERT INTO user_academies (user_id, academy_id, role)
SELECT 
  user_data.id,
  -- Usar a primeira academia disponível ou null se nenhuma
  (SELECT id FROM academies LIMIT 1),
  'admin'
FROM user_data
WHERE NOT EXISTS (SELECT 1 FROM existing_entry)
ON CONFLICT (user_id, academy_id) 
DO UPDATE SET role = 'admin';

-- Verificar se o usuário agora tem o papel de admin
SELECT u.email, ua.role
FROM user_academies ua
JOIN auth.users u ON ua.user_id = u.id
WHERE u.email = 'lucenajj@gmail.com'; 