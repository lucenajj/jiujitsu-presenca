-- Script para definir a role 'admin' para o usuário lucenajj@gmail.com
-- Execute este script no SQL Editor do Supabase Dashboard

-- Atualizar os metadados do usuário para incluir a role 'admin'
UPDATE auth.users
SET raw_user_meta_data = 
  CASE 
    WHEN raw_user_meta_data IS NULL THEN 
      jsonb_build_object('role', 'admin')
    ELSE 
      raw_user_meta_data || jsonb_build_object('role', 'admin')
  END
WHERE email = 'lucenajj@gmail.com';

-- Verificar se a atualização foi bem-sucedida
SELECT id, email, raw_user_meta_data->>'role' as role
FROM auth.users
WHERE email = 'lucenajj@gmail.com'; 