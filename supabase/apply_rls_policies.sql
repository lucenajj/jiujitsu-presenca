-- Script para aplicar as políticas RLS atualizadas
-- Execute este script no SQL Editor do Supabase Dashboard

-- Atualizar a função is_admin para usar a tabela user_academies
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    EXISTS (
      SELECT 1
      FROM user_academies
      WHERE 
        user_id = auth.uid() AND 
        role = 'admin'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificar se a função foi atualizada corretamente
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'is_admin' 
AND routine_schema = 'public'; 