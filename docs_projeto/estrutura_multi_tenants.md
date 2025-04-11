# Estrutura Multi-Tenant no AppLajes

## Visão Geral

O AppLajes implementa uma arquitetura multi-tenant baseada em papéis, onde cada "tenant" (vendedor) tem acesso apenas aos seus próprios dados, enquanto administradores possuem acesso global a todas as informações do sistema. Esta estrutura permite que múltiplos vendedores utilizem o mesmo sistema simultaneamente, mantendo seus dados isolados entre si, enquanto a administração consegue ter uma visão completa de todas as operações.

## Modelo de Usuários e Papéis

### Estrutura de Papéis (Roles)

O sistema divide os usuários em dois papéis principais:

1. **Administradores (`admin`)**: 
   - Acesso completo ao sistema
   - Visualização de todos os dados de todos os vendedores
   - Gerenciamento de usuários e seus papéis
   - Visualização global de métricas e desempenho

2. **Vendedores (`seller`)**: 
   - Acesso limitado aos próprios dados
   - Visualização apenas de seus próprios clientes
   - Visualização apenas de seus próprios cálculos/orçamentos
   - Métricas limitadas ao seu próprio desempenho

### Armazenamento no Banco de Dados

A tabela `users` contém os dados dos usuários e seus respectivos papéis:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'seller')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

O campo `role` armazena o papel do usuário e é utilizado em todo o sistema para determinar os níveis de acesso.

## Implementação do Controle de Acesso

### 1. Autenticação via Supabase

O sistema utiliza o Supabase Auth para gerenciar a autenticação dos usuários:

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uvfqlotohxyfrospqfzb.supabase.co';
const supabaseKey = '...';

export const supabase = createClient(supabaseUrl, supabaseKey);
```

No componente principal da aplicação (`App.tsx`), verificamos a sessão do usuário e atualizamos o estado global quando há mudança no estado de autenticação:

```typescript
// src/App.tsx
useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session);
  });

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    setSession(session);
  });

  return () => subscription.unsubscribe();
}, []);
```

### 2. Proteção de Rotas para Usuários Autenticados

O sistema implementa um mecanismo de proteção de rotas, redirecionando usuários não autenticados para a página de login e restringindo o acesso baseado no papel:

```typescript
// src/App.tsx
function App() {
  const [session, setSession] = useState<Session | null>(null);

  // ... código de verificação de sessão ...

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        {!session ? (
          // Login page para usuários não autenticados
          <Routes>
            <Route path="*" element={<LoginPage />} />
          </Routes>
        ) : (
          // App com navegação para usuários autenticados
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            <Navigation />
            <Box component="main" sx={{ flex: 1, overflowY: 'auto' }}>
              <Routes>
                <Route path="/login" element={<Navigate to="/" />} />
                <Route path="/" element={<HomePage />} />
                <Route path="/calculations" element={<CalculationsPage />} />
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/products" element={<ProductsPage />} />
                
                {/* Rota de admin protegida com renderização condicional */}
                <Route 
                  path="/users" 
                  element={
                    <AdminRouteGuard>
                      <UsersPage />
                    </AdminRouteGuard>
                  } 
                />
                
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Box>
          </Box>
        )}
      </Router>
    </ThemeProvider>
  );
}
```

### 3. Componente de Guarda para Rotas de Administrador

O sistema implementa um componente de guarda para proteger rotas que só devem ser acessíveis a administradores:

```typescript
// src/components/AdminRouteGuard.tsx
import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CircularProgress, Box } from '@mui/material';

interface AdminRouteGuardProps {
  children: ReactNode;
}

export const AdminRouteGuard = ({ children }: AdminRouteGuardProps) => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }
        
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
          
        if (error) throw error;
        
        setIsAdmin(data?.role === 'admin');
      } catch (err) {
        console.error('Error checking admin status:', err);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkAdminStatus();
  }, []);
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!isAdmin) {
    return <Navigate to="/" />;
  }
  
  return <>{children}</>;
};
```

### 4. Verificação e Armazenamento do Papel do Usuário

Quando um usuário faz login, o sistema busca seu papel (admin ou seller) no banco de dados:

```typescript
// Exemplo de código em páginas como Home.tsx, Calculations.tsx
useEffect(() => {
  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUser(user.id);
      
      // Buscar dados do usuário incluindo a role
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
        
      if (!error && data) {
        setUserData(data);
      }
    }
  };
  
  getCurrentUser();
}, []);
```

### 5. Filtragem de Dados Baseada em Papel

#### Para Vendedores

Os vendedores têm acesso apenas aos dados vinculados ao seu ID de usuário. Isso é implementado através de condições nas consultas:

```typescript
// Exemplo na página de Clientes (Customers.tsx)
// Filtrar clientes por vendedor se não for admin
const isAdmin = userData?.role === 'admin';

const customersQuery = isAdmin 
  ? supabase.from('customers').select('*')
  : supabase.from('customers').select('*').eq('user_id', currentUser);
  
const { data, error } = await customersQuery;
```

Exemplo completo de implementação na página de clientes:

```typescript
// Trecho de src/pages/Customers.tsx
useEffect(() => {
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      
      // Verificar se o usuário está autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Usuário não autenticado');
        setLoading(false);
        return;
      }
      
      // Verificar a role do usuário atual
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
        
      if (userError) {
        console.error('Erro ao buscar dados do usuário:', userError);
        setLoading(false);
        return;
      }
      
      // Construir a query com base na role do usuário
      let query = supabase.from('customers').select('*');
      
      // Se não for admin, filtrar apenas os clientes deste vendedor
      if (userData?.role !== 'admin') {
        query = query.eq('user_id', user.id);
      }
      
      // Executar a query
      const { data, error } = await query;
      
      if (error) throw error;
      
      setCustomers(data || []);
      setLoading(false);
    } catch (err) {
      console.error('Erro ao buscar clientes:', err);
      setError('Falha ao carregar clientes');
      setLoading(false);
    }
  };
  
  fetchCustomers();
}, []);
```

#### Para Administradores

Os administradores recebem acesso a todos os dados sem filtro por usuário:

```typescript
// Exemplo na página de Cálculos (Calculations.tsx)
// Buscar cálculos filtrados por usuário se não for admin
const calculationsQuery = isAdmin
  ? supabase.from('calculations').select('*').order('created_at', { ascending: false })
  : supabase.from('calculations').select('*').eq('user_id', currentUser).order('created_at', { ascending: false });
  
const calculationsResponse = await calculationsQuery;
```

### 6. Criação e Gerenciamento de Usuários

A página de Usuários (acessível apenas para administradores) permite criar e gerenciar vendedores:

```typescript
// Trecho de src/pages/Users.tsx
const handleCreateUser = async (data: UserFormData) => {
  try {
    setCreatingUser(true);
    
    // 1. Criar o usuário no sistema de autenticação do Supabase
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true
    });
    
    if (authError) throw authError;
    
    // 2. Inserir dados adicionais na tabela personalizada 'users'
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: data.email,
        name: data.name,
        role: 'seller' // Definir papel como vendedor por padrão
      });
      
    if (userError) throw userError;
    
    // 3. Atualizar a lista de usuários
    fetchUsers();
    
    // 4. Fechar o modal e limpar o formulário
    setOpenCreateDialog(false);
    reset();
    
    setSnackbarMessage('Usuário criado com sucesso');
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
  } catch (err) {
    console.error('Erro ao criar usuário:', err);
    setSnackbarMessage('Falha ao criar usuário');
    setSnackbarSeverity('error');
    setSnackbarOpen(true);
  } finally {
    setCreatingUser(false);
  }
};
```

### 7. Hook Personalizado para Controle de Acesso

Para reutilizar a lógica de verificação de papel em vários componentes, implementamos um hook personalizado:

```typescript
// src/hooks/useUserRole.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useUserRole = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const getUserRole = async () => {
      try {
        setLoading(true);
        
        // Obter usuário atual
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setLoading(false);
          return;
        }
        
        setUserId(user.id);
        
        // Buscar role do usuário
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
          
        if (error) throw error;
        
        setUserRole(data?.role || null);
        setIsAdmin(data?.role === 'admin');
      } catch (err) {
        console.error('Erro ao obter papel do usuário:', err);
        setError('Falha ao verificar permissões de usuário');
      } finally {
        setLoading(false);
      }
    };
    
    getUserRole();
  }, []);
  
  return { userId, userRole, isAdmin, loading, error };
};
```

Uso do hook em componentes:

```typescript
// Exemplo de uso em qualquer componente
import { useUserRole } from '../hooks/useUserRole';

const SomeComponent = () => {
  const { userId, userRole, isAdmin, loading } = useUserRole();
  
  if (loading) return <CircularProgress />;
  
  return (
    <div>
      {isAdmin ? (
        <AdminView />
      ) : (
        <SellerView userId={userId} />
      )}
    </div>
  );
};
```

### 8. Row Level Security (RLS) no Supabase

Para garantir a segurança em nível de banco de dados, o sistema utiliza as políticas de Row Level Security do Supabase. As políticas são definidas nas migrações do banco de dados:

```sql
-- supabase/migrations/20240301_create_rls_policies.sql

-- Habilitar RLS nas tabelas
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;

-- Política para tabela customers
CREATE POLICY "Vendedores podem ver apenas seus próprios clientes"
ON customers
FOR SELECT
USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

CREATE POLICY "Vendedores podem inserir apenas seus próprios clientes"
ON customers
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
);

CREATE POLICY "Vendedores podem atualizar apenas seus próprios clientes"
ON customers
FOR UPDATE
USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

CREATE POLICY "Vendedores podem excluir apenas seus próprios clientes"
ON customers
FOR DELETE
USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- Políticas semelhantes para outras tabelas (calculations, houses, areas)
-- ...
```

## Interface Adaptável por Papel

### Dashboard Adaptável

O dashboard principal (`Home.tsx`) adapta-se ao papel do usuário:

```typescript
// Exemplo em Home.tsx
// Renderização condicional baseada no papel
return (
  <Box>
    <Typography variant="h5">Dashboard</Typography>
    
    {/* Filtro de Vendedor - Visível apenas para Administradores */}
    {userData?.role === 'admin' && (
      <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
        <InputLabel>Vendedor</InputLabel>
        <Select
          value={selectedSeller || "all"}
          onChange={handleSellerChange}
          label="Vendedor"
        >
          <MenuItem value="all">Todos</MenuItem>
          {sellers.map(seller => (
            <MenuItem key={seller.id} value={seller.id}>{seller.name}</MenuItem>
          ))}
        </Select>
      </FormControl>
    )}
    
    {/* Cards e gráficos com dados filtrados */}
    <Grid container spacing={3}>
      {/* ... componentes do dashboard ... */}
    </Grid>
  </Box>
);
```

### Navegação Condicionada por Papel

O componente de navegação (`Navigation.tsx`) exibe opções diferentes com base no papel do usuário:

```typescript
// src/components/Navigation.tsx
import { useState, useEffect } from 'react';
import { 
  AppBar, Toolbar, Typography, Button, IconButton, 
  Menu, MenuItem, Divider, Box, Avatar 
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AccountCircle } from '@mui/icons-material';

export const Navigation = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [userData, setUserData] = useState<{name?: string, role?: string}>({});
  
  useEffect(() => {
    const getUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data } = await supabase
          .from('users')
          .select('name, role')
          .eq('id', user.id)
          .single();
          
        if (data) {
          setUserData(data);
        }
      }
    };
    
    getUserData();
  }, []);
  
  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };
  
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          AppLajes
        </Typography>
        
        <Button component={Link} to="/" color="inherit">
          Dashboard
        </Button>
        
        <Button component={Link} to="/customers" color="inherit">
          Clientes
        </Button>
        
        <Button component={Link} to="/calculations" color="inherit">
          Orçamentos
        </Button>
        
        <Button component={Link} to="/products" color="inherit">
          Produtos
        </Button>
        
        {/* Menu de Usuários - Visível apenas para Administradores */}
        {userData?.role === 'admin' && (
          <Button component={Link} to="/users" color="inherit">
            Usuários
          </Button>
        )}
        
        <IconButton
          size="large"
          onClick={handleMenu}
          color="inherit"
        >
          <AccountCircle />
        </IconButton>
        
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
        >
          <MenuItem disabled>
            {userData?.name || 'Usuário'} ({userData?.role === 'admin' ? 'Admin' : 'Vendedor'})
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>Sair</MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};
```

## Fluxo de Dados Segmentado

### 1. Vinculação de Clientes a Vendedores

Quando um vendedor cria um cliente, o sistema automaticamente vincula esse cliente ao ID do vendedor:

```typescript
// Exemplo de criação de cliente em src/pages/Customers.tsx
const handleCreateCustomer = async (data) => {
  try {
    setCreatingCustomer(true);
    
    // Obter ID do usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuário não autenticado');
    }
    
    // Adicionar o user_id ao objeto de dados do cliente
    const customerData = {
      ...data,
      user_id: user.id  // Vincula o cliente ao vendedor atual
    };
    
    // Inserir o cliente no banco de dados
    const { data: newCustomer, error } = await supabase
      .from('customers')
      .insert(customerData)
      .select()
      .single();
      
    if (error) throw error;
    
    // Atualizar a lista de clientes com o novo cliente
    setCustomers(prevCustomers => [...prevCustomers, newCustomer]);
    
    // Fechar o modal e limpar o formulário
    setOpenCreateDialog(false);
    reset();
    
    // Exibir mensagem de sucesso
    setSnackbarMessage('Cliente criado com sucesso');
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
  } catch (err) {
    console.error('Erro ao criar cliente:', err);
    setSnackbarMessage('Falha ao criar cliente');
    setSnackbarSeverity('error');
    setSnackbarOpen(true);
  } finally {
    setCreatingCustomer(false);
  }
};
```

### 2. Vinculação de Cálculos a Vendedores

Similarmente, os cálculos e orçamentos são automaticamente vinculados ao vendedor que os criou:

```typescript
// Exemplo de criação de cálculo em src/pages/Calculations.tsx
const handleCreateCalculation = async (calculationData) => {
  try {
    setSubmitting(true);
    
    // Obter ID do usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuário não autenticado');
    }
    
    // Adicionar o user_id ao objeto de dados do cálculo
    const finalCalculationData = {
      ...calculationData,
      user_id: user.id,  // Vincula o cálculo ao vendedor atual
      created_at: new Date().toISOString()
    };
    
    // Inserir o cálculo no banco de dados
    const { data: newCalculation, error } = await supabase
      .from('calculations')
      .insert(finalCalculationData)
      .select()
      .single();
      
    if (error) throw error;
    
    // Atualizar resultados ou estado conforme necessário
    setResult(newCalculation);
    setActiveStep(3); // Avançar para a próxima etapa
    
    // Exibir mensagem de sucesso
    setSnackbarMessage('Cálculo realizado com sucesso');
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
  } catch (err) {
    console.error('Erro ao criar cálculo:', err);
    setSnackbarMessage('Falha ao realizar cálculo');
    setSnackbarSeverity('error');
    setSnackbarOpen(true);
  } finally {
    setSubmitting(false);
  }
};
```

## Métricas e Análises Segmentadas

O sistema de métricas e análises também é segmentado por papel:

```typescript
// Cálculo de métricas no Dashboard
const calculateMetrics = async () => {
  const isAdmin = userData?.role === 'admin';
  const sellerId = selectedSeller || (isAdmin ? null : currentUser);
  
  // Base query para cálculos
  let calculationsQuery = supabase
    .from('calculations')
    .select('*')
    .gte('created_at', startDateISO)
    .lte('created_at', endDateISO);
  
  // Adicionar filtro por vendedor se necessário
  if (sellerId && sellerId !== 'all') {
    calculationsQuery = calculationsQuery.eq('user_id', sellerId);
  } else if (!isAdmin) {
    // Se não for admin, filtrar apenas pelos próprios cálculos
    calculationsQuery = calculationsQuery.eq('user_id', currentUser);
  }
  
  const { data: calculations } = await calculationsQuery;
  
  // ... cálculos de métricas baseados nos dados filtrados ...
};
```

Implementação completa do filtro de vendedores no Dashboard:

```typescript
// Trecho de src/pages/Home.tsx
// Função para buscar vendedores (visível apenas para admins)
const fetchSellers = async () => {
  try {
    // Verificar se o usuário é admin antes de buscar vendedores
    if (userData?.role !== 'admin') return;
    
    const { data, error } = await supabase
      .from('users')
      .select('id, name')
      .eq('role', 'seller');
      
    if (error) throw error;
    
    setSellers(data || []);
  } catch (err) {
    console.error('Erro ao buscar vendedores:', err);
  }
};

// Handler para mudança de vendedor selecionado
const handleSellerChange = (event) => {
  const sellerId = event.target.value;
  setSelectedSeller(sellerId === 'all' ? null : sellerId);
  
  // Recalcular métricas com base no vendedor selecionado
  calculateDashboardMetrics(selectedPeriod, sellerId === 'all' ? null : sellerId);
};

// Função para calcular métricas com filtros aplicados
const calculateDashboardMetrics = async (period, sellerFilter = null) => {
  try {
    setLoadingMetrics(true);
    
    // Determinar datas de início/fim com base no período
    const { startDate, endDate } = calculateDateRange(period);
    
    // Determinar o ID do vendedor a ser usado no filtro
    const isAdmin = userData?.role === 'admin';
    const sellerId = sellerFilter || (isAdmin ? null : currentUser);
    
    // Construir a query base
    let query = supabase
      .from('calculations')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());
      
    // Adicionar filtro por vendedor se necessário
    if (sellerId) {
      query = query.eq('user_id', sellerId);
    } else if (!isAdmin) {
      // Se não for admin e não tiver filtro, mostrar apenas os próprios cálculos
      query = query.eq('user_id', currentUser);
    }
    
    // Executar a query
    const { data: calculations, error } = await query;
    
    if (error) throw error;
    
    // Calcular métricas
    const totalSales = calculations.reduce((sum, calc) => sum + calc.total_cost, 0);
    const avgTicket = calculations.length > 0 ? totalSales / calculations.length : 0;
    
    // Buscar número de clientes do vendedor ou total (para admins)
    let clientsQuery = supabase.from('customers').select('id', { count: 'exact' });
    
    if (sellerId) {
      clientsQuery = clientsQuery.eq('user_id', sellerId);
    } else if (!isAdmin) {
      clientsQuery = clientsQuery.eq('user_id', currentUser);
    }
    
    const { count: clientCount, error: clientError } = await clientsQuery;
    
    if (clientError) throw clientError;
    
    // Atualizar estado das métricas
    setMetrics({
      totalSales,
      avgTicket,
      clientCount: clientCount || 0,
      calculationCount: calculations.length
    });
    
    // Carregar dados para o gráfico com os mesmos filtros
    loadChartData(startDate, endDate, sellerId);
  } catch (err) {
    console.error('Erro ao calcular métricas:', err);
  } finally {
    setLoadingMetrics(false);
  }
};
```

## Sistema de Registro (Logging) e Auditoria

Para monitorar as atividades dos usuários e facilitar a auditoria, o sistema implementa logs de ações críticas:

```typescript
// src/utils/auditLogger.ts
import { supabase } from '../lib/supabase';

type ActionType = 'create' | 'update' | 'delete' | 'login' | 'logout';
type EntityType = 'customer' | 'calculation' | 'product' | 'user' | 'system';

interface AuditLogData {
  user_id: string;
  action: ActionType;
  entity_type: EntityType;
  entity_id?: string;
  details?: any;
}

export const logUserAction = async (data: AuditLogData) => {
  try {
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        ...data,
        timestamp: new Date().toISOString()
      });
      
    if (error) {
      console.error('Erro ao registrar log de auditoria:', error);
    }
  } catch (err) {
    console.error('Erro ao registrar ação do usuário:', err);
  }
};
```

Exemplo de uso nos componentes:

```typescript
// Uso ao criar um cliente
import { logUserAction } from '../utils/auditLogger';

// Dentro da função de criar cliente
const { data: newCustomer, error } = await supabase
  .from('customers')
  .insert(customerData)
  .select()
  .single();
  
if (!error) {
  // Registrar ação no log de auditoria
  await logUserAction({
    user_id: user.id,
    action: 'create',
    entity_type: 'customer',
    entity_id: newCustomer.id,
    details: { name: newCustomer.name }
  });
}
```

## Conclusão

A implementação multi-tenant do AppLajes proporciona:

1. **Segurança dos dados**: Cada vendedor tem acesso apenas aos seus próprios dados
2. **Visão global para administradores**: Administradores conseguem ver e gerenciar todos os dados
3. **Isolamento entre vendedores**: Os dados de diferentes vendedores são isolados entre si
4. **Interface adaptável**: A interface do usuário adapta-se dinamicamente ao papel do usuário logado
5. **Implementação em múltiplas camadas**: A segurança é implementada tanto no frontend quanto no backend (Supabase)

Esta arquitetura permite que a aplicação atenda tanto as necessidades individuais de cada vendedor quanto as necessidades de gestão global da empresa, mantendo a segurança e privacidade dos dados em todos os níveis. 