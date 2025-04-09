import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
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
  const createUserObject = (session: any): User => {
    if (!session?.user) return null as unknown as User;
    
    console.log('Dados da sessão:', session);
    console.log('User metadata:', session.user.user_metadata);
    
    // Obtendo o papel/role do usuário a partir dos metadados
    let userRole = 'user'; // Valor padrão
    
    if (session.user.user_metadata && session.user.user_metadata.role) {
      userRole = session.user.user_metadata.role;
    }
    
    // Verificar também no raw_user_meta_data caso seja necessário
    if (session.user.app_metadata && session.user.app_metadata.role) {
      userRole = session.user.app_metadata.role;
    }
    
    console.log('Role identificada:', userRole);
    
    return {
      id: session.user.id,
      email: session.user.email || '',
      name: session.user.email?.split('@')[0] || 'Usuário',
      role: userRole,
    };
  };

  // Verificar se o usuário já está autenticado através da sessão do Supabase
  useEffect(() => {
    const checkSession = async () => {
      setIsLoading(true);
      
      try {
        // Obter a sessão atual
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (session) {
          const userObject = createUserObject(session);
          setUser(userObject);
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSession();
    
    // Configurar o listener de mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          // Usuário logado
          const userObject = createUserObject(session);
          setUser(userObject);
        } else {
          // Usuário deslogado
          setUser(null);
        }
        
        setIsLoading(false);
      }
    );
    
    // Limpar a subscrição quando o componente for desmontado
    return () => {
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
        
        // Atualizar os metadados do usuário para incluir a role (para testes)
        try {
          const { error: updateError } = await supabase.auth.updateUser({
            data: { role: 'admin' }
          });
          
          if (updateError) {
            console.error('Erro ao atualizar metadados do usuário:', updateError);
          } else {
            console.log('Metadados do usuário atualizados com sucesso');
          }
        } catch (updateError) {
          console.error('Exceção ao atualizar metadados:', updateError);
        }
        
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

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      navigate('/');
      toast({
        title: 'Logout realizado',
        description: 'Você saiu do sistema com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao fazer logout',
        description: 'Ocorreu um erro ao sair do sistema.',
      });
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
