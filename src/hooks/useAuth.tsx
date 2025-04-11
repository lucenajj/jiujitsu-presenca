import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  academy_id?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Função para criar um objeto de usuário a partir da sessão
  const createUserObject = async (session: any): Promise<User> => {
    if (!session?.user) return null as unknown as User;
    
    console.log('Dados da sessão:', session);
    
    // Criar objeto de usuário base - sempre começamos como 'user' regular
    const userObj: User = {
      id: session.user.id,
      email: session.user.email || '',
      name: session.user.email?.split('@')[0] || 'Usuário',
      role: 'user', // Valor padrão
    };
    
    console.log('Verificando papel do usuário:', session.user.id, 'Email:', session.user.email);
    
    // Vamos primeiro verificar se este é um dos usuários administradores conhecidos
    if (session.user.email === 'lucenajj@gmail.com') {
      console.log('Usuário reconhecido como ADMIN pelo email:', session.user.email);
      userObj.role = 'admin';
      return userObj;
    }
    
    // Para todos os outros usuários, buscar o papel na base de dados
    try {
      // Buscar o papel do usuário na tabela user_academies
      const { data: userData, error: userError } = await supabase
        .from('user_academies')
        .select('role, academy_id')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(); // Usando maybeSingle em vez de single para evitar erro se não encontrar
      
      if (!userError && userData) {
        console.log('Role encontrada na base:', userData.role);
        userObj.role = userData.role;
        userObj.academy_id = userData.academy_id;
        console.log('Usuário identificado como:', userObj.role);
        console.log('Academia vinculada:', userData.academy_id);
      } else {
        // Se não encontrar nada, mantém como 'user'
        console.log('Nenhum papel encontrado na base, mantendo como user padrão');
      }
    } catch (error) {
      console.error('Erro ao verificar papel do usuário:', error);
      // Manterá o valor padrão 'user' em caso de erro
    }
    
    // Verificação adicional para debug
    if (userObj.role === 'admin') {
      console.log('ATENÇÃO: Usuário definido como ADMIN:', userObj.email);
    } else {
      console.log('Usuário não é admin, role final:', userObj.role);
    }
    
    // Se não for admin e ainda não tiver academy_id, buscar a academia associada
    if (userObj.role !== 'admin' && !userObj.academy_id) {
      try {
        const { data: academyData, error: academyError } = await supabase
          .from('academies')
          .select('id')
          .eq('user_id', session.user.id)
          .single();
        
        if (!academyError && academyData?.id) {
          userObj.academy_id = academyData.id;
          console.log('Academia vinculada ao usuário:', academyData.id);
        }
      } catch (error) {
        console.error('Erro ao buscar academia do usuário:', error);
      }
    }
    
    return userObj;
  };

  // Verificar se o usuário já está autenticado através da sessão do Supabase
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;
    
    const checkSession = async () => {
      setIsLoading(true);
      
      // Definir um timeout máximo para o carregamento (10 segundos)
      timeoutId = setTimeout(() => {
        if (isMounted) {
          console.log('Timeout de verificação de sessão atingido');
          setIsLoading(false);
        }
      }, 10000);
      
      try {
        console.log('Verificando sessão atual do Supabase...');
        
        // Obter a sessão atual
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro ao verificar sessão:', error);
          return; // Importante: sair da função em caso de erro
        }
        
        if (session) {
          console.log('Sessão encontrada, criando objeto de usuário');
          try {
            const userObject = await createUserObject(session);
            if (isMounted) {
              setUser(userObject);
              console.log('Objeto de usuário definido:', userObject);
            }
          } catch (error) {
            console.error('Erro ao criar objeto de usuário:', error);
          }
        } else {
          console.log('Nenhuma sessão encontrada');
          if (isMounted) {
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
        if (isMounted) {
          setUser(null);
        }
      } finally {
        clearTimeout(timeoutId);
        if (isMounted) {
          setIsLoading(false);
          console.log('Verificação de sessão concluída');
        }
      }
    };
    
    checkSession();
    
    // Configurar o listener de mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Evento de autenticação:', event);
        
        try {
          if (session && event !== 'SIGNED_OUT') {
            // Usuário logado
            console.log('Usuário autenticado, criando objeto de usuário');
            const userObject = await createUserObject(session);
            if (isMounted) {
              setUser(userObject);
            }
          } else {
            // Usuário deslogado
            console.log('Usuário deslogado ou evento de logout');
            if (isMounted) {
              setUser(null);
            }
          }
        } catch (error) {
          console.error('Erro no listener de autenticação:', error);
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      }
    );
    
    // Limpar a subscrição quando o componente for desmontado
    return () => {
      console.log('Cancelando subscrição de autenticação');
      isMounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      console.log('Tentando login com:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Erro no login:', error);
        toast({
          variant: 'destructive',
          title: 'Erro no login',
          description: error.message || 'Email ou senha incorretos.',
        });
        return false;
      }
      
      if (data.user) {
        console.log('Login bem-sucedido:', data.user);
        
        // Criar objeto de usuário com todas as informações
        const userObject = await createUserObject(data);
        setUser(userObject);
        
        toast({
          title: 'Login realizado com sucesso',
          description: `Bem-vindo de volta!`,
        });
        
        navigate('/dashboard');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro no login:', error);
      toast({
        variant: 'destructive',
        title: 'Erro no login',
        description: 'Ocorreu um erro durante o login. Tente novamente.',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Função para logout completo
  const logout = async () => {
    try {
      console.log('Iniciando processo de logout');
      
      // 1. Limpar o estado do usuário antes de qualquer outra operação
      setUser(null);
      
      // 2. Executar o logout no Supabase
      await supabase.auth.signOut();
      
      // 3. Limpar completamente o localStorage (abordagem radical)
      localStorage.clear();
      
      // 4. Mostrar feedback ao usuário
      toast({
        title: 'Logout realizado',
        description: 'Você saiu do sistema com sucesso.',
      });
      
      // 5. Forçar uma recarga completa da página para limpar qualquer estado residual
      // Isso é melhor que usar navigate() pois limpa completamente o estado da aplicação
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
      
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao fazer logout',
        description: 'Ocorreu um erro ao sair do sistema.',
      });
      
      // Mesmo com erro, tentar recarregar a página para tentar limpar o estado
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      isLoading, 
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
