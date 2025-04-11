# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/spec/v2.0.0.html).

## [1.3.0] - 2025-04-10

### Adicionado
- Implementação de sistema multi-tenant usando a tabela `user_academies`
- Utilização da coluna `role` na tabela `user_academies` para permissões de usuários
- Políticas RLS atualizadas para utilizar a tabela `user_academies`
- Hook de autenticação atualizado para buscar papéis na tabela `user_academies`
- Adicionados novos scripts SQL para gerenciamento de permissões
- Suporte para associação de usuários a múltiplas academias com diferentes papéis

### Corrigido
- Resolvido problema de permissões onde usuários admin não visualizavam todos os dados
- Corrigido o erro "column user_metadata does not exist" nas políticas RLS
- Implementado mecanismo mais robusto de verificação de papéis de usuários

## [1.2.2] - 2025-04-09

### Adicionado
- Implementado sistema de autenticação para academias com acesso individual
- Integração da função create_user_auth do Supabase no cadastro de academias
- Criação automática de usuários para academias durante o cadastro
- Adicionado fallback para usar a API nativa do Supabase quando a função RPC não estiver disponível

### Corrigido
- Resolvido problema onde academias não conseguiam acessar o sistema após cadastro
- Melhorada a validação de usuário e senha no formulário de cadastro de academias
- Aprimorado o tratamento de erros durante o processo de criação de usuários

## [1.2.1] - 2025-04-01

### Adicionado
- Implementada visualização de academias cadastradas na seção de Configurações
- Adicionada funcionalidade de busca para academias por nome, proprietário ou CNPJ
- Implementada edição de academias existentes através de modal
- Adicionada confirmação de exclusão para academias
- Melhorado layout responsivo na seção de Configurações

### Corrigido
- Corrigido comportamento do menu hamburguer em dispositivos móveis (agora fecha após seleção)
- Ajustado layout de botões em Configurações para exibição vertical em dispositivos móveis

## [1.2.0] - 2025-04-01

### Adicionado
- Implementado suporte multi-tenant para aulas
- Adicionada coluna user_id à tabela classes para associar aulas a usuários
- Criadas políticas RLS refinadas para controle de acesso baseado em propriedade
- Sistema de acompanhamento de progresso do aluno entre faixas
- Funcionalidade para registrar aulas por semana e aulas assistidas
- Cálculo automático de metas de aulas para graduação com base na faixa atual
- Acompanhamento de datas de promoção de faixa

## [1.1.1] - 2025-04-01

### Corrigido
- Corrigido erro de violação de política de segurança em nível de linha (RLS) ao cadastrar aulas
- Adicionada política RLS para permitir inserção de aulas por usuários autenticados

## [1.1.0] - 2025-04-01

### Adicionado
- Funcionalidade para editar a data de matrícula dos alunos
- Seletor de calendário para facilitar a escolha de datas
- Integração completa com autenticação Supabase

### Corrigido
- Corrigido erro de segurança de linha (RLS) ao cadastrar alunos no Supabase
- Corrigido problema no schema cache para a coluna 'registration_date'
- Corrigido formulário de alunos para limpar campos ao criar novo aluno
- Resolvido problema de não atualização da interface após edição de aluno

### Melhorado
- Melhorada a manipulação de datas no formulário de alunos
- Aprimorado o fluxo de edição e criação de alunos
- Substituído método de autenticação simulada por autenticação real

## [1.0.0] - 2025-03-31

### Adicionado

- Sistema de autenticação com login e proteção de rotas
- Dashboard principal com visão geral das informações
- Gerenciamento de aulas (ClassesList)
- Gerenciamento de alunos (StudentsList)
- Sistema de registro de presença (AttendanceRecord)
- Listagem de registros de presença (AttendanceList)
- Seção de relatórios (Reports)
- Integração com Supabase para armazenamento de dados
- Interface de usuário moderna com Shadcn UI e Tailwind CSS
- Sistema de notificações com Toaster
- Navegação responsiva
- Suporte para dispositivos móveis

### Tecnologias Utilizadas

- React 18
- TypeScript
- Vite como bundler
- React Router para navegação
- React Query para gerenciamento de estado e requisições
- Shadcn UI para componentes de interface
- Tailwind CSS para estilização
- Supabase como backend

## [Não Lançado]

### Planejado

- Melhorias na visualização de relatórios
- Exportação de dados em diferentes formatos
- Perfil de usuário com configurações personalizáveis
- Tema escuro/claro
- Notificações por email
- Aplicativo móvel nativo