# Documentação do Projeto: JiuJitsu Presença

## Visão Geral do Sistema

O **JiuJitsu Presença** é um sistema completo para o gerenciamento de academias de Jiu-Jitsu, focado no controle de presença e acompanhamento de alunos. Desenvolvido com tecnologias modernas, o sistema oferece uma interface responsiva e intuitiva que se adapta a diferentes dispositivos, seja desktop ou móvel.

O sistema permite o gerenciamento completo do ecossistema de uma academia de Jiu-Jitsu, incluindo cadastro de academias, alunos, aulas, controle de presença e geração de relatórios para acompanhamento do desempenho e evolução dos alunos.

## Arquitetura do Sistema

### Frontend
- **Framework principal**: React 18 com TypeScript
- **Build/Bundler**: Vite
- **Navegação**: React Router (v6) para roteamento entre páginas
- **Gerenciamento de estado e requisições**: React Query (@tanstack/react-query)
- **Interface de usuário**: 
  - Shadcn UI como base de componentes
  - Tailwind CSS para estilização e responsividade
  - Componentes personalizados para necessidades específicas do sistema
- **Recursos responsivos**: Layout adaptativo para desktop e dispositivos móveis
- **Formulários**: React Hook Form com validação utilizando Zod

### Backend
- **Serviço**: Supabase (BaaS - Backend as a Service)
- **Autenticação**: Sistema de autenticação completo do Supabase
- **Segurança**: Políticas RLS (Row Level Security) para controle de acesso a dados
- **API**: REST API do Supabase consumida diretamente pelo frontend
- **Funções**: Funções SQL personalizadas para operações específicas

### Banco de Dados
- **Tecnologia**: PostgreSQL (gerenciado pelo Supabase)
- **Tabelas principais**:
  - `academies`: Armazenamento de academias cadastradas (informações como nome, endereço, contato)
  - `students`: Cadastro de alunos (nome, faixa, graduação, status, contato)
  - `classes`: Gerenciamento de aulas (horários, dias da semana, instrutor, nível)
  - `attendance`: Registros de presença dos alunos nas aulas
  - `users`: Gerenciamento de usuários do sistema
- **Enums**:
  - `belt_level`: Níveis de faixa (white, blue, purple, brown, black)
  - `class_level`: Níveis de aula (beginner, intermediate, advanced, all)
  - `weekday`: Dias da semana (monday, tuesday, wednesday, thursday, friday, saturday, sunday)

## Funcionalidades Principais

### Sistema de Autenticação
- Login e registro de usuários
- Proteção de rotas para acesso apenas a usuários autenticados
- Gerenciamento de perfis de usuário

### Dashboard
- Visão geral das informações da academia
- Estatísticas de presença
- Gráficos e indicadores de desempenho
- Resumo de atividades recentes

### Gerenciamento de Academias
- Cadastro de academias com informações completas (nome, CNPJ, endereço, etc.)
- Edição e atualização de dados
- Listagem de academias cadastradas

### Gerenciamento de Alunos
- Cadastro completo de alunos
- Acompanhamento de graduação (faixas e graus)
- Histórico de frequência
- Detalhes do aluno
- Status de atividade

### Gerenciamento de Aulas
- Cadastro de aulas com horários
- Definição de dias da semana
- Níveis de dificuldade
- Instrutores responsáveis

### Sistema de Registro de Presença
- Chamada digital para aulas
- Registro de presença por aluno
- Histórico de presenças
- Relatórios de frequência

### Relatórios e Estatísticas
- Relatórios de frequência
- Estatísticas de crescimento
- Análise de desempenho
- Exportação de dados

## Tecnologias e Bibliotecas Utilizadas

### Core
- React 18
- TypeScript
- Vite

### UI/UX
- Tailwind CSS
- Shadcn UI (baseado em componentes Radix UI)
- Lucide React (ícones)
- Tailwind Merge e Class Variance Authority (utilitários CSS)
- React Day Picker (calendários)
- Embla Carousel (carrosséis)
- Sonner (notificações toast)

### Gerenciamento de Estado e API
- React Query (@tanstack/react-query)
- Supabase JS Client

### Formulários e Validação
- React Hook Form
- Zod (validação de esquemas)

### Gráficos e Visualização de Dados
- Recharts (biblioteca de gráficos)

### Data e Tempo
- Date-fns (manipulação de datas)

### Roteamento
- React Router DOM (v6)

## Estrutura de Pastas e Arquivos

```
/src
  /components        # Componentes reutilizáveis
    /ui              # Componentes de UI básicos (Shadcn)
    /layout          # Componentes de layout (Header, Sidebar, etc.)
    AcademyForm.tsx  # Formulário de cadastro/edição de academias
    AcademyList.tsx  # Listagem de academias
    StudentForm.tsx  # Formulário de cadastro/edição de alunos
    StudentDetails.tsx # Detalhes do aluno
    ClassForm.tsx    # Formulário de cadastro/edição de aulas
  
  /hooks             # Custom hooks do React
  
  /integrations      # Integrações com serviços externos
    /supabase        # Integração com Supabase
      client.ts      # Cliente Supabase configurado
      types.ts       # Tipos e interfaces do banco de dados
  
  /lib               # Bibliotecas e utilitários
    supabase.ts      # Configuração do Supabase
    utils.ts         # Funções utilitárias gerais
    mockData.ts      # Dados para desenvolvimento/testes
  
  /pages             # Páginas da aplicação
    Dashboard.tsx    # Página inicial com dashboard
    Settings.tsx     # Configurações do sistema
    StudentsList.tsx # Listagem de alunos
    ClassesList.tsx  # Listagem de aulas
    AttendanceRecord.tsx # Registro de presença
    AttendanceList.tsx # Histórico de presenças
    Reports.tsx      # Relatórios e estatísticas
    Login.tsx        # Página de login
    Index.tsx        # Página inicial pública
    NotFound.tsx     # Página 404
  
  App.tsx            # Componente principal e configuração de rotas
  main.tsx           # Ponto de entrada da aplicação
  index.css          # Estilos globais
```

## Modelos de Dados

### Academia (Academy)
```typescript
{
  id: string
  owner_name: string
  name: string
  cnpj: string
  street: string
  neighborhood: string
  zip_code: string
  phone: string
  email: string
  user_id: string | null
  created_by: string | null
  created_at: string | null
  updated_at: string | null
}
```

### Aluno (Student)
```typescript
{
  id: string
  name: string
  belt: "white" | "blue" | "purple" | "brown" | "black"
  stripes: number
  email: string | null
  phone: string | null
  registration_date: string | null
  status: string
  created_at: string | null
  updated_at: string | null
  classes_per_week: number
  classes_attended: number
  last_promotion_date: string
}
```

### Aula (Class)
```typescript
{
  id: string
  name: string
  instructor: string
  time_start: string
  time_end: string
  day_of_week: ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[]
  level: "beginner" | "intermediate" | "advanced" | "all"
  user_id: string | null
  created_at: string | null
  updated_at: string | null
}
```

### Presença (Attendance)
```typescript
{
  id: string
  class_id: string
  date: string
  student_ids: string[]
  created_by: string | null
  created_at: string | null
}
```

## Como Executar o Projeto

1. Clone o repositório: `git clone <URL_DO_REPOSITORIO>`
2. Acesse a pasta do projeto: `cd jiu-jitsu-presenca-app`
3. Instale as dependências: `npm install`
4. Configure as variáveis de ambiente (ver abaixo)
5. Inicie o servidor de desenvolvimento: `npm run dev`

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

## Comandos Disponíveis

```
npm run dev         # Inicia o servidor de desenvolvimento
npm run build       # Compila o projeto para produção
npm run build:dev   # Compila o projeto para ambiente de desenvolvimento
npm run lint        # Executa o linter para verificar problemas de código
npm run preview     # Visualiza a versão de produção localmente
```

## Fluxo de Trabalho para Desenvolvimento

1. **Configuração inicial**:
   - Instale as dependências com `npm install`
   - Configure o Supabase com as credenciais corretas
   - Verifique se a conexão com o banco de dados está funcionando

2. **Desenvolvimento de novas funcionalidades**:
   - Crie novos componentes na pasta `components`
   - Adicione novas páginas na pasta `pages`
   - Implemente os hooks necessários em `hooks`
   - Mantenha os utilitários em `lib/utils.ts`

3. **Testes**:
   - Teste manualmente a interface e funcionalidades
   - Verifique a responsividade em diferentes dispositivos
   - Valide os fluxos de usuário completos

4. **Deploy**:
   - Execute `npm run build` para gerar os arquivos de produção
   - Faça o deploy dos arquivos da pasta `dist` para o servidor desejado

## Boas Práticas

1. **Padrões de Código**:
   - Use TypeScript para tudo, garantindo tipagem adequada
   - Siga o padrão de componentização de React
   - Utilize React Query para gerenciar estados de servidor
   - Mantenha componentes pequenos e com responsabilidade única

2. **Estilização**:
   - Use exclusivamente Tailwind CSS para estilização
   - Aproveite os componentes Shadcn UI como base
   - Mantenha a consistência visual com o design system estabelecido

3. **Performance**:
   - Implemente memoização quando necessário
   - Utilize React Query para caching de dados
   - Siga as boas práticas de performance do React

## Contribuição

Para contribuir com o projeto, siga estes passos:

1. Faça um fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## Informações Adicionais

Para mais informações sobre o projeto, visite o [Lovable Project](https://lovable.dev/projects/312dec02-c526-41be-9e56-ec08cc0292b4). 