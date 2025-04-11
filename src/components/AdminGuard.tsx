import { ReactNode, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAcademyRole } from '@/hooks/useAcademyRole';
import { toast } from '@/hooks/use-toast';

interface AdminGuardProps {
  children: ReactNode;
  fallbackPath?: string;
}

/**
 * Componente de guarda para proteger rotas de administrador
 * Redireciona usuários não-admin para a página especificada
 */
export const AdminGuard = ({ children, fallbackPath = '/dashboard' }: AdminGuardProps) => {
  const { isAdmin, loading } = useAcademyRole();
  
  useEffect(() => {
    if (!loading && !isAdmin) {
      toast({
        title: 'Acesso negado',
        description: 'Você não tem permissão para acessar esta página.',
        variant: 'destructive',
      });
    }
  }, [isAdmin, loading]);

  // Mostrar nada enquanto está carregando
  if (loading) {
    return null;
  }
  
  // Redirecionar para a página principal se não for admin
  if (!isAdmin) {
    return <Navigate to={fallbackPath} replace />;
  }
  
  // Renderizar o conteúdo protegido se for admin
  return <>{children}</>;
}; 