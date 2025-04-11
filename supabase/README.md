# Configuração Multi-Tenant no Supabase

Este diretório contém os scripts necessários para configurar a arquitetura multi-tenant no Supabase para o JiuJitsu Presença.

## Políticas de Row Level Security (RLS)

As políticas de RLS garantem que os dados sejam isolados adequadamente entre academias diferentes, mesmo no nível do banco de dados.

### Como Aplicar

1. Acesse o **SQL Editor** no Supabase Dashboard.
2. Copie e cole o conteúdo do arquivo `migrations/20240825_rls_policies.sql`.
3. Execute o script.
4. Em seguida, aplique as políticas específicas para a tabela `user_academies` com o arquivo `add_user_academies_policies.sql`.

## Sistema de Papéis (Roles)

### Papéis do Sistema

- **admin**: Acesso global a todos os dados
- **academy_owner**: Acesso apenas aos dados da sua própria academia
- **member**: Membro com acesso limitado a uma academia específica

### Como Configurar Papel de Usuário

Ao invés de usar as metadatas do usuário, o sistema agora utiliza a tabela `user_academies` para gerenciar papéis:

1. Use o arquivo `set_admin_user.sql` para definir um usuário como admin:

```sql
-- Exemplo para configurar um usuário como admin
WITH user_data AS (
  SELECT id 
  FROM auth.users 
  WHERE email = 'admin@exemplo.com'
)
INSERT INTO user_academies (user_id, academy_id, role)
SELECT 
  user_data.id,
  (SELECT id FROM academies LIMIT 1),
  'admin'
FROM user_data
ON CONFLICT (user_id, academy_id) 
DO UPDATE SET role = 'admin';
```

## Estrutura de Tabelas

### user_academies

Esta tabela gerencia a relação entre usuários e academias, permitindo que um usuário tenha diferentes papéis em diferentes academias:

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

### academies

A tabela principal para armazenar as academias:

```sql
create table public.academies (
  id uuid not null default gen_random_uuid(),
  owner_name character varying(255) not null,
  name character varying(255) not null,
  cnpj character varying(18) not null,
  street character varying(255) not null,
  neighborhood character varying(255) not null,
  zip_code character varying(9) not null,
  phone character varying(15) not null,
  email character varying(255) not null,
  user_id uuid null,
  created_by uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint academies_pkey primary key (id),
  constraint academies_cnpj_key unique (cnpj),
  constraint academies_email_key unique (email),
  constraint academies_created_by_fkey foreign key (created_by) references auth.users (id),
  constraint academies_user_id_fkey foreign key (user_id) references auth.users (id)
);
```

## Vinculação de Academia a Usuário

Quando uma nova academia é criada, dois passos devem acontecer:

1. Definir o `user_id` na tabela `academies`:

```sql
UPDATE academies
SET user_id = 'id-do-usuário'
WHERE id = 'id-da-academia';
```

2. Inserir um registro na tabela `user_academies`:

```sql
INSERT INTO user_academies (user_id, academy_id, role)
VALUES ('id-do-usuário', 'id-da-academia', 'academy_owner');
```

## Verificação da Implementação

Para verificar se a implementação está funcionando corretamente:

1. Crie pelo menos dois usuários com papéis diferentes.
2. Crie pelo menos duas academias, cada uma vinculada a um usuário diferente.
3. Cadastre alunos em ambas as academias.
4. Faça login com cada usuário para verificar se eles só veem seus próprios dados.
5. Faça login como admin para verificar se é possível ver todos os dados.

## Troubleshooting

### Problemas comuns:

1. **Usuário não vê nenhum dado**: Verifique se existe uma academia vinculada ao `user_id` deste usuário na tabela `academies` E se há um registro correspondente na tabela `user_academies`.

2. **Usuário vê dados de outra academia**: Verifique se as políticas RLS foram aplicadas corretamente.

3. **Erro "column user_metadata does not exist"**: Certifique-se de que está usando a versão atualizada das políticas RLS que verifica a tabela `user_academies` em vez de `user_metadata`.

4. **Para adicionar automaticamente registros a `user_academies` ao criar academias**: Implemente um trigger no banco de dados ou adicione a lógica no código da aplicação. 