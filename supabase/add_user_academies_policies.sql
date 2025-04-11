-- Script para adicionar políticas RLS à tabela user_academies
-- Execute este script no SQL Editor do Supabase Dashboard

-- Habilitar RLS para a tabela user_academies
ALTER TABLE user_academies ENABLE ROW LEVEL SECURITY;

-- Admins podem ver todos os registros
CREATE POLICY "Admins podem ver todos os user_academies"
ON user_academies
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM user_academies
    WHERE 
      user_id = auth.uid() AND 
      role = 'admin'
  )
);

-- Usuários podem ver seus próprios registros
CREATE POLICY "Usuários podem ver seus próprios user_academies"
ON user_academies
FOR SELECT
USING (user_id = auth.uid());

-- Admins podem inserir novos registros
CREATE POLICY "Admins podem inserir user_academies"
ON user_academies
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM user_academies
    WHERE 
      user_id = auth.uid() AND 
      role = 'admin'
  )
);

-- Admins podem atualizar registros
CREATE POLICY "Admins podem atualizar user_academies"
ON user_academies
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM user_academies
    WHERE 
      user_id = auth.uid() AND 
      role = 'admin'
  )
);

-- Admins podem excluir registros
CREATE POLICY "Admins podem excluir user_academies"
ON user_academies
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM user_academies
    WHERE 
      user_id = auth.uid() AND 
      role = 'admin'
  )
); 