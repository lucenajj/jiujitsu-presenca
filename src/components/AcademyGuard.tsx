import { ReactNode, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAcademyRole } from '@/hooks/useAcademyRole';
import { toast } from '@/hooks/use-toast';

interface AcademyGuardProps {
  children: ReactNode;
  fallbackPath?: string;
}

/**
 * Componente de guarda para proteger rotas que requerem academia vinculada
 * Admins podem acessar qualquer página
 * Usuários com academia vinculada podem acessar estas páginas
 * Outros usuários são redirecionados
 */
export const AcademyGuard = ({ children, fallbackPath = '/dashboard' }: AcademyGuardProps) => {
  const { isAdmin, academyId, loading } = useAcademyRole();
  
  useEffect(() => {
    if (!loading && !isAdmin && !academyId) {
      toast({
        title: 'Acesso negado',
        description: 'Você não tem uma academia vinculada para acessar esta página.',
        variant: 'destructive',
      });
    }
  }, [isAdmin, academyId, loading]);

  // Mostrar nada enquanto está carregando
  if (loading) {
    return null;
  }
  
  // Permitir acesso para admins mesmo sem academia vinculada
  if (isAdmin) {
    return <>{children}</>;
  }
  
  // Verificar se o usuário regular tem academia vinculada
  if (!academyId) {
    return <Navigate to={fallbackPath} replace />;
  }
  
  // Renderizar o conteúdo protegido
  return <>{children}</>;
}; 