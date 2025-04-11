import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface UseAcademyRoleReturn {
  userId: string | null;
  userRole: string | null;
  academyId: string | null;
  isAdmin: boolean;
  isAcademyOwner: boolean;
  loading: boolean;
  error: string | null;
}

/**
 * Hook para centralizar a lógica de verificação de papel/role e acesso a academias
 * Inspirado no padrão multi-tenant para garantir isolamento de dados
 */
export const useAcademyRole = (): UseAcademyRoleReturn => {
  const { user } = useAuth();
  const [academyId, setAcademyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Valores derivados do objeto user
  const userId = user?.id || null;
  const userRole = user?.role || null;
  const isAdmin = userRole === 'admin';
  
  // Se o usuário já tiver academia_id nos metadados, usamos esse valor
  const isAcademyOwner = !!academyId && userRole === 'academy_owner';
  
  useEffect(() => {
    const getAcademyId = async () => {
      try {
        setLoading(true);
        
        // Se não houver usuário ou se for admin, não precisamos buscar academia
        if (!userId || isAdmin) {
          setAcademyId(user?.academy_id || null);
          setLoading(false);
          return;
        }
        
        // Se o usuário já tiver academia_id no objeto, usamos esse valor
        if (user?.academy_id) {
          setAcademyId(user.academy_id);
          setLoading(false);
          return;
        }
        
        // Caso contrário, consultamos o banco de dados
        const { data, error } = await supabase
          .from('academies')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();  // Usamos maybeSingle para permitir que não exista academia vinculada
        
        if (error) {
          console.error('Erro ao buscar academia vinculada:', error);
          setError('Falha ao verificar vinculação de academia');
          setAcademyId(null);
        } else {
          setAcademyId(data?.id || null);
        }
      } catch (err) {
        console.error('Erro ao obter academia vinculada:', err);
        setError('Falha ao verificar vinculação de academia');
      } finally {
        setLoading(false);
      }
    };
    
    getAcademyId();
  }, [userId, isAdmin, user?.academy_id]);
  
  return {
    userId,
    userRole,
    academyId,
    isAdmin,
    isAcademyOwner,
    loading,
    error
  };
}; 