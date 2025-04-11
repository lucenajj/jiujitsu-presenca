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
  const { user, isLoading: authLoading } = useAuth();
  const [academyId, setAcademyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Valores derivados do objeto user - cálculo simples e direto
  const userId = user?.id || null;
  const userRole = user?.role || null;
  const isAdmin = userRole === 'admin';
  const isAcademyOwner = !!academyId && userRole === 'academy_owner';
  
  // Efeito simplificado para carregar academy_id
  useEffect(() => {
    // Versão simplificada e segura da função getAcademyId
    const getAcademyId = async () => {
      try {
        // Limpar o timeout após 5 segundos para evitar carregamento infinito
        const timeoutId = setTimeout(() => {
          console.log('Timeout de verificação de academia atingido');
          setLoading(false);
        }, 5000);
        
        // Definir loading
        setLoading(true);
        
        // Verificar condições simples e rápidas primeiro
        if (!user || authLoading) {
          console.log('Hook useAcademyRole: usuário não está pronto ou autenticação ainda carregando');
          setAcademyId(null);
          setLoading(false);
          clearTimeout(timeoutId);
          return;
        }
        
        if (isAdmin) {
          console.log('Hook useAcademyRole: usuário é admin, não precisa de academyId');
          setAcademyId(null);
          setLoading(false);
          clearTimeout(timeoutId);
          return;
        }
        
        if (user.academy_id) {
          console.log('Hook useAcademyRole: academy_id encontrado no objeto user', user.academy_id);
          setAcademyId(user.academy_id);
          setLoading(false);
          clearTimeout(timeoutId);
          return;
        }
        
        // Somente executar a busca no banco se realmente necessário
        console.log('Hook useAcademyRole: consultando academia para o user_id', userId);
        
        const { data, error } = await supabase
          .from('academies')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();
          
        if (error) {
          console.error('Hook useAcademyRole: erro ao buscar academia:', error);
          setError('Erro ao buscar academia vinculada');
          setAcademyId(null);
        } else {
          console.log('Hook useAcademyRole: resultado da busca de academia:', data);
          setAcademyId(data?.id || null);
        }
        
        // Garantir que o loading seja finalizado
        setLoading(false);
        clearTimeout(timeoutId);
      } catch (err) {
        console.error('Hook useAcademyRole: exceção ao buscar academia:', err);
        setError('Erro ao buscar academia vinculada');
        setAcademyId(null);
        setLoading(false);
      }
    };
    
    getAcademyId();
  }, [user, userId, isAdmin, authLoading]);
  
  return {
    userId,
    userRole,
    academyId,
    isAdmin,
    isAcademyOwner,
    loading: loading || authLoading,
    error
  };
}; 