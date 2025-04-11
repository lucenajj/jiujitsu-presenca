-- Habilitar RLS em todas as tabelas
ALTER TABLE academies ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Criar função auxiliar para verificar se o usuário é administrador
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    EXISTS (
      SELECT 1
      FROM auth.users
      WHERE 
        id = auth.uid() AND 
        (raw_user_meta_data->>'role')::text = 'admin'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar função auxiliar para verificar se o usuário possui acesso à academia
CREATE OR REPLACE FUNCTION public.has_academy_access(academy_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    -- Usuário é admin
    is_admin() OR
    -- Usuário é dono da academia
    EXISTS (
      SELECT 1
      FROM academies
      WHERE 
        id = academy_id AND 
        user_id = auth.uid()
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas para tabela ACADEMIES

-- Administradores podem ver todas as academias
CREATE POLICY "Admins podem ver todas as academias"
ON academies
FOR SELECT
USING (is_admin());

-- Usuários podem ver suas próprias academias
CREATE POLICY "Usuários podem ver suas próprias academias"
ON academies
FOR SELECT
USING (user_id = auth.uid());

-- Admins e proprietários podem atualizar academias
CREATE POLICY "Admins e proprietários podem atualizar academias"
ON academies
FOR UPDATE
USING (is_admin() OR user_id = auth.uid());

-- Novos usuários podem criar academias
CREATE POLICY "Usuários autenticados podem inserir academias"
ON academies
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Apenas admins podem deletar academias
CREATE POLICY "Apenas admins podem deletar academias"
ON academies
FOR DELETE
USING (is_admin());

-- Políticas para tabela STUDENTS

-- Administradores podem ver todos os alunos
CREATE POLICY "Admins podem ver todos os alunos"
ON students
FOR SELECT
USING (is_admin());

-- Usuários podem ver apenas alunos de suas academias
CREATE POLICY "Usuários podem ver apenas alunos de suas academias"
ON students
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM academies
    WHERE 
      academies.id = students.academy_id AND 
      academies.user_id = auth.uid()
  )
);

-- Administradores podem criar qualquer aluno
CREATE POLICY "Admins podem inserir qualquer aluno"
ON students
FOR INSERT
WITH CHECK (is_admin());

-- Usuários podem criar alunos apenas em suas academias
CREATE POLICY "Usuários podem inserir alunos apenas em suas academias"
ON students
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM academies
    WHERE 
      academies.id = students.academy_id AND 
      academies.user_id = auth.uid()
  )
);

-- Administradores podem atualizar qualquer aluno
CREATE POLICY "Admins podem atualizar qualquer aluno"
ON students
FOR UPDATE
USING (is_admin());

-- Usuários podem atualizar apenas alunos de suas academias
CREATE POLICY "Usuários podem atualizar apenas alunos de suas academias"
ON students
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM academies
    WHERE 
      academies.id = students.academy_id AND 
      academies.user_id = auth.uid()
  )
);

-- Administradores podem excluir qualquer aluno
CREATE POLICY "Admins podem excluir qualquer aluno"
ON students
FOR DELETE
USING (is_admin());

-- Usuários podem excluir apenas alunos de suas academias
CREATE POLICY "Usuários podem excluir apenas alunos de suas academias"
ON students
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM academies
    WHERE 
      academies.id = students.academy_id AND 
      academies.user_id = auth.uid()
  )
);

-- Políticas para tabela CLASSES

-- Administradores podem ver todas as aulas
CREATE POLICY "Admins podem ver todas as aulas"
ON classes
FOR SELECT
USING (is_admin());

-- Usuários podem ver apenas aulas de suas academias
CREATE POLICY "Usuários podem ver apenas aulas de suas academias"
ON classes
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM academies
    WHERE 
      academies.id = classes.academy_id AND 
      academies.user_id = auth.uid()
  )
);

-- Administradores podem criar qualquer aula
CREATE POLICY "Admins podem inserir qualquer aula"
ON classes
FOR INSERT
WITH CHECK (is_admin());

-- Usuários podem criar aulas apenas em suas academias
CREATE POLICY "Usuários podem inserir aulas apenas em suas academias"
ON classes
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM academies
    WHERE 
      academies.id = classes.academy_id AND 
      academies.user_id = auth.uid()
  )
);

-- Administradores podem atualizar qualquer aula
CREATE POLICY "Admins podem atualizar qualquer aula"
ON classes
FOR UPDATE
USING (is_admin());

-- Usuários podem atualizar apenas aulas de suas academias
CREATE POLICY "Usuários podem atualizar apenas aulas de suas academias"
ON classes
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM academies
    WHERE 
      academies.id = classes.academy_id AND 
      academies.user_id = auth.uid()
  )
);

-- Administradores podem excluir qualquer aula
CREATE POLICY "Admins podem excluir qualquer aula"
ON classes
FOR DELETE
USING (is_admin());

-- Usuários podem excluir apenas aulas de suas academias
CREATE POLICY "Usuários podem excluir apenas aulas de suas academias"
ON classes
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM academies
    WHERE 
      academies.id = classes.academy_id AND 
      academies.user_id = auth.uid()
  )
);

-- Políticas para tabela ATTENDANCE

-- Administradores podem ver todos os registros de presença
CREATE POLICY "Admins podem ver todos os registros de presença"
ON attendance
FOR SELECT
USING (is_admin());

-- Usuários podem ver apenas registros de presença de suas academias
CREATE POLICY "Usuários podem ver apenas registros de presença de suas academias"
ON attendance
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM academies
    WHERE 
      academies.id = attendance.academy_id AND 
      academies.user_id = auth.uid()
  )
);

-- Administradores podem criar qualquer registro de presença
CREATE POLICY "Admins podem inserir qualquer registro de presença"
ON attendance
FOR INSERT
WITH CHECK (is_admin());

-- Usuários podem criar registros de presença apenas em suas academias
CREATE POLICY "Usuários podem inserir registros de presença apenas em suas academias"
ON attendance
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM academies
    WHERE 
      academies.id = attendance.academy_id AND 
      academies.user_id = auth.uid()
  )
);

-- Administradores podem atualizar qualquer registro de presença
CREATE POLICY "Admins podem atualizar qualquer registro de presença"
ON attendance
FOR UPDATE
USING (is_admin());

-- Usuários podem atualizar apenas registros de presença de suas academias
CREATE POLICY "Usuários podem atualizar apenas registros de presença de suas academias"
ON attendance
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM academies
    WHERE 
      academies.id = attendance.academy_id AND 
      academies.user_id = auth.uid()
  )
);

-- Administradores podem excluir qualquer registro de presença
CREATE POLICY "Admins podem excluir qualquer registro de presença"
ON attendance
FOR DELETE
USING (is_admin());

-- Usuários podem excluir apenas registros de presença de suas academias
CREATE POLICY "Usuários podem excluir apenas registros de presença de suas academias"
ON attendance
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM academies
    WHERE 
      academies.id = attendance.academy_id AND 
      academies.user_id = auth.uid()
  )
); 