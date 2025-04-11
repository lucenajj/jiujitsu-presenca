# Implementação Multi-Tenant no JiuJitsu Presença

Este documento detalha a implementação do sistema multi-tenant no aplicativo JiuJitsu Presença, permitindo que múltiplas academias utilizem o mesmo sistema mantendo seus dados isolados entre si.

## Visão Geral da Arquitetura Multi-Tenant

O sistema JiuJitsu Presença adota uma arquitetura multi-tenant baseada em papéis, onde:

1. Cada academia é um "tenant" (inquilino) no sistema
2. Os dados são segmentados por academia
3. Usuários administradores têm acesso global
4. Usuários comuns têm acesso apenas aos dados da academia à qual estão vinculados

## Principais Componentes da Implementação

### 1. Sistema de Papéis (Roles)

O sistema define dois papéis principais:

- **Admin**: Acesso completo a todos os dados de todas as academias
- **Academy Owner**: Acesso apenas aos dados da academia vinculada ao usuário

Os papéis são armazenados nos metadados do usuário no Supabase Auth:

```json
{
  "role": "admin"
}
```

### 2. Hook Centralizado - useAcademyRole

Implementamos um hook customizado que centraliza toda a lógica de verificação de papéis e acesso à academia:

```typescript
// src/hooks/useAcademyRole.tsx
export const useAcademyRole = () => {
  // Retorna userId, userRole, academyId, isAdmin, isAcademyOwner, loading, error
};
```

Este hook é responsável por:
- Determinar o papel do usuário atual
- Identificar a academia vinculada ao usuário
- Fornecer flags de controle de acesso (isAdmin, isAcademyOwner)
- Gerenciar estados de carregamento e erro

### 3. Políticas de Row Level Security (RLS)

Implementamos políticas de segurança no nível do banco de dados usando Row Level Security do Supabase:

- **Função is_admin()**: Verifica se o usuário atual é um administrador
- **Função has_academy_access()**: Verifica se o usuário tem acesso a uma academia específica

Políticas específicas para cada tabela:
- **academies**: Controla quem pode ver, criar, editar e excluir academias
- **students**: Garante que usuários vejam apenas alunos de suas academias
- **classes**: Restringe acesso às aulas por academia
- **attendance**: Limita registros de presença por academia

### 4. Componentes de Guarda para Rotas

Implementamos dois componentes de guarda para proteger rotas sensíveis:

- **AdminGuard**: Permite acesso apenas a usuários com papel de administrador
- **AcademyGuard**: Permite acesso a administradores e usuários com academia vinculada

Exemplo de uso:

```jsx
<Route 
  path="/admin/settings" 
  element={
    <AdminGuard>
      <SettingsPage />
    </AdminGuard>
  }
/>
```

### 5. Adaptação dos Componentes Existentes

Os componentes que exibem ou manipulam dados foram adaptados para usar o hook `useAcademyRole`:

- **StudentsList**: Filtra alunos com base na academia do usuário
- **StudentForm**: Associa automaticamente novos alunos à academia do usuário
- Outros componentes seguem padrão similar

## Fluxo de Dados Segmentado

### Criação de Dados

Quando um usuário cria um novo registro (aluno, aula, etc.), o sistema:

1. Obtém a `academyId` do usuário atual via `useAcademyRole`
2. Vincula automaticamente o registro à academia do usuário
3. As políticas RLS garantem que usuários só possam criar dados em suas próprias academias

### Leitura de Dados

Ao buscar dados, o sistema:

1. Para administradores: Busca todos os dados sem filtro
2. Para usuários comuns: Filtra dados pelo `academyId` do usuário
3. As políticas RLS validam o acesso no nível do banco de dados, garantindo segurança adicional

## Processo de Migração para Multi-Tenant

A migração para o sistema multi-tenant envolveu as seguintes etapas:

1. Adição da coluna `academy_id` em todas as tabelas relevantes
2. Implementação das políticas de RLS no Supabase
3. Criação do hook `useAcademyRole` para centralizar a lógica
4. Adaptação dos componentes para usar o novo hook
5. Criação dos componentes de guarda para proteger rotas
6. Vinculação dos usuários existentes às suas respectivas academias

## Gerenciamento de Usuários e Academias

### Usuários Administradores

Usuários administradores são criados definindo o papel "admin" nos metadados do usuário. Eles têm acesso a todas as academias e podem:

- Ver todos os alunos, aulas e registros de presença
- Adicionar, editar e excluir dados de qualquer academia
- Acessar áreas administrativas protegidas

### Usuários de Academia

Cada academia tem um usuário proprietário. Para vincular um usuário a uma academia:

1. Definir o papel do usuário como "academy_owner" nos metadados
2. Atualizar o campo `user_id` na tabela `academies` para o ID do usuário

## Recomendações Adicionais

### Monitoramento e Auditoria

Para melhorar a segurança e rastreabilidade, recomenda-se implementar:

- Logs de auditoria para ações críticas (criação, edição, exclusão)
- Monitoramento de tentativas de acesso não autorizado
- Relatórios periódicos de atividade por academia

### Considerações de Performance

Para sistemas com muitas academias, considere:

- Implementar caching para consultas frequentes
- Otimizar consultas que filtram por `academy_id`
- Implementar paginação para listas grandes de dados

## Troubleshooting

### Problemas Comuns

1. **Usuário não consegue ver dados**: Verificar se o usuário tem uma academia vinculada corretamente.
2. **Permissões inconsistentes**: Verificar se o papel do usuário está definido corretamente nos metadados.
3. **Problemas de tipagem**: Para erros "Type instantiation is excessively deep", use tipagem `any` temporariamente nas consultas Supabase.

## Conclusão

A implementação multi-tenant no JiuJitsu Presença segue as melhores práticas de segurança e isolamento de dados, garantindo que:

1. Cada academia tenha acesso apenas aos seus próprios dados
2. Administradores possam ter uma visão global do sistema
3. A segurança seja implementada em múltiplas camadas (aplicação e banco de dados)
4. O sistema seja escalável para um número crescente de academias 