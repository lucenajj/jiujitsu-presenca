# JiuJitsu Presença

Um sistema completo para gerenciamento de academias de Jiu-Jitsu, controle de presença e acompanhamento de alunos.

## Arquitetura do Sistema

O JiuJitsu Presença está construído com uma arquitetura moderna, seguindo o modelo JAMstack:

### Frontend
- **Framework principal**: React 18 com TypeScript
- **Build/Bundler**: Vite
- **Navegação**: React Router para roteamento entre páginas
- **Gerenciamento de estado**: React Query para requisições e cache
- **Interface de usuário**: 
  - Shadcn UI para componentes base
  - Tailwind CSS para estilização
  - Componentes personalizados
- **Recursos responsivos**: Layout adaptativo para desktop e dispositivos móveis

### Backend
- **Serviço**: Supabase (BaaS - Backend as a Service)
- **Autenticação**: Sistema de autenticação do Supabase
- **Segurança**: Políticas RLS (Row Level Security) para controle de acesso
- **API**: REST API do Supabase consumida diretamente pelo frontend

### Banco de Dados
- **Tecnologia**: PostgreSQL (gerenciado pelo Supabase)
- **Tabelas principais**:
  - `academies`: Armazenamento de academias cadastradas
  - `students`: Cadastro de alunos
  - `classes`: Gerenciamento de aulas
  - `attendance`: Registros de presença
  - `users`: Gerenciamento de usuários do sistema

## Funcionalidades Principais

- Sistema de autenticação com login e proteção de rotas
- Dashboard com visão geral das informações
- Gerenciamento de academias (cadastro, edição, remoção)
- Gerenciamento de aulas
- Cadastro e acompanhamento de alunos
- Sistema de registro de presença
- Relatórios e estatísticas
- Interface responsiva para uso em diferentes dispositivos

## Como executar o projeto

```sh
# Passo 1: Clone o repositório
git clone <URL_DO_REPOSITORIO>

# Passo 2: Acesse a pasta do projeto
cd jiu-jitsu-presenca-app

# Passo 3: Instale as dependências
npm install

# Passo 4: Inicie o servidor de desenvolvimento
npm run dev
```

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

## Tecnologias Utilizadas

- React 18
- TypeScript
- Vite
- React Router
- React Query
- Shadcn UI
- Tailwind CSS
- Supabase

## Estrutura de Pastas

```
/src
  /components       # Componentes reutilizáveis
  /hooks            # Custom hooks
  /integrations     # Integrações com serviços externos
  /layout           # Componentes de layout
  /lib              # Bibliotecas e utilitários
  /pages            # Páginas da aplicação
  /styles           # Estilos globais
  /types            # Tipos TypeScript
```

## Contribuição

Para contribuir com o projeto, siga estes passos:

1. Faça um fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## Project info

**URL**: https://lovable.dev/projects/312dec02-c526-41be-9e56-ec08cc0292b4

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/312dec02-c526-41be-9e56-ec08cc0292b4) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with .

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/312dec02-c526-41be-9e56-ec08cc0292b4) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes it is!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
"# jiujitsu-presenca" 
