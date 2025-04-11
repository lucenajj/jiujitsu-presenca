# Sistema Multi-Tenant no JiuJitsu Presença

## Visão Geral

O JiuJitsu Presença implementa uma arquitetura multi-tenant baseada em papéis, onde cada "tenant" (academia) tem acesso apenas aos seus próprios dados, enquanto administradores possuem acesso global a todas as informações do sistema. Esta estrutura permite que múltiplas academias utilizem o mesmo sistema simultaneamente, mantendo seus dados isolados entre si.

## Modelo de Usuários e Papéis

### Estrutura de Papéis (Roles)

O sistema divide os usuários em três papéis principais:

1. **Administradores (`admin`)**: 
   - Acesso completo ao sistema
   - Visualização de todos os dados de todas as academias
   - Gerenciamento de usuários e seus papéis
   - Visualização global de métricas e desempenho

2. **Donos de Academia (`academy_owner`)**: 
   - Acesso limitado à própria academia
   - Visualização apenas de seus próprios alunos
   - Visualização apenas de suas próprias aulas
   - Métricas limitadas ao desempenho de sua academia

3. **Membros (`member`)**: 
   - Acesso muito limitado a funções específicas
   - Visualização apenas de dados permitidos pelo dono da academia

### Armazenamento no Banco de Dados

A relação entre usuários e academias é gerenciada através da tabela `user_academies`:

```sql
create table public.user_academies (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  academy_id uuid not null,
  role character varying(50) not null default 'member'::character varying,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint user_academies_pkey primary key (id),
  constraint user_academies_user_id_academy_id_key unique (user_id, academy_id),
  constraint user_academies_academy_id_fkey foreign key (academy_id) references academies (id),
  constraint user_academies_user_id_fkey foreign key (user_id) references auth.users (id)
);
```

Esta estrutura permite:
- Um usuário pertencer a várias academias
- Ter papéis diferentes em cada academia
- Isolamento de dados entre academias

## Implementação do Controle de Acesso

### 1. Autenticação via Supabase

O sistema utiliza o Supabase Auth para gerenciar a autenticação dos usuários:

```typescript
// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

### 2. Hook de Autenticação Personalizado

O hook `useAuth` gerencia o fluxo de autenticação e a obtenção do papel do usuário a partir da tabela `user_academies`:

```typescript
// src/hooks/useAuth.tsx (trecho)
const createUserObject = async (session: any): Promise<User> => {
  if (!session?.user) return null as unknown as User;
  
  // Criar objeto de usuário base
  const userObj: User = {
    id: session.user.id,
    email: session.user.email || '',
    name: session.user.email?.split('@')[0] || 'Usuário',
    role: 'user', // Valor padrão que será substituído
  };
  
  // Buscar o papel do usuário na tabela user_academies
  try {
    const { data, error } = await supabase
      .from('user_academies')
      .select('role')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (!error && data) {
      userObj.role = data.role;
    }
  } catch (error) {
    console.error('Erro na verificação:', error);
  }
  
  // Se não for admin, buscar a academia associada
  if (userObj.role !== 'admin') {
    try {
      const { data: academyData } = await supabase
        .from('academies')
        .select('id')
        .eq('user_id', session.user.id)
        .single();
      
      if (academyData?.id) {
        userObj.academy_id = academyData.id;
      }
    } catch (error) {
      console.error('Erro ao buscar academia do usuário:', error);
    }
  }
  
  return userObj;
};
```

### 3. Row Level Security (RLS) no Supabase

As políticas RLS garantem a segurança em nível de banco de dados, utilizando a tabela `user_academies` para verificar os papéis:

```sql
-- Função para verificar se um usuário é administrador
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

-- Política para academias (exemplo)
CREATE POLICY "Admins podem ver todas as academias"
ON academies
FOR SELECT
USING (is_admin());

-- Política para alunos (exemplo)
CREATE POLICY "Admins podem ver todos os alunos"
ON students
FOR SELECT
USING (is_admin());

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
```

## Fluxo de Cadastro e Associação

O fluxo ideal para cadastro de novas academias e usuários:

1. **Quando um usuário cria uma academia**:
   - Salvar a academia na tabela `academies` com o `user_id` do usuário
   - Inserir um registro na tabela `user_academies` com o papel `academy_owner`

2. **Quando um administrador adiciona um usuário a uma academia**:
   - Inserir um registro na tabela `user_academies` com o papel apropriado

## Boas Práticas para Manutenção

1. **Separação de Responsabilidades**:
   - Verificações de permissão no backend via RLS
   - Verificações de interface no frontend via o hook `useAuth`

2. **Auditoria**:
   - Implementar um sistema de registro de ações para rastrear atividades de usuários

3. **Escalabilidade**:
   - A estrutura atual permite crescimento ilimitado no número de academias
   - Um usuário pode pertencer a múltiplas academias com papéis diferentes

## Diagrama de Relacionamento

```
┌───────────┐     ┌───────────────┐     ┌─────────────┐
│           │     │               │     │             │
│  users    │──┼──│ user_academies│──┼──│  academies  │
│(auth.users)│     │               │     │             │
│           │     │               │     │             │
└───────────┘     └───────────────┘     └─────────────┘
                         │                     │
                         │                     │
                         ▼                     ▼
                  ┌─────────────┐      ┌─────────────┐
                  │             │      │             │
                  │  students   │      │   classes   │
                  │             │      │             │
                  └─────────────┘      └─────────────┘
                         │                     │
                         │                     │
                         └──────────┬──────────┘
                                    │
                                    ▼
                            ┌─────────────┐
                            │             │
                            │ attendance  │
                            │             │
                            └─────────────┘
```

## Conclusão

A implementação multi-tenant do JiuJitsu Presença proporciona:

1. **Segurança dos dados**: Cada academia tem acesso apenas aos seus próprios dados
2. **Visão global para administradores**: Administradores conseguem ver e gerenciar todos os dados
3. **Isolamento entre academias**: Os dados de diferentes academias são isolados entre si
4. **Interface adaptável**: A interface do usuário adapta-se dinamicamente ao papel do usuário logado
5. **Implementação em múltiplas camadas**: A segurança é implementada tanto no frontend quanto no backend (Supabase)

Esta arquitetura permite que a aplicação atenda tanto as necessidades individuais de cada academia quanto as necessidades de gestão global, mantendo a segurança e privacidade dos dados em todos os níveis. 