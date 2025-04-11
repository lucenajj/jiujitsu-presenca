import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import StudentForm from '@/components/StudentForm';
import StudentDetails from '@/components/StudentDetails';
import { differenceInMonths } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { calculateBeltProgress } from '@/lib/utils';
import { useAcademyRole } from '@/hooks/useAcademyRole';

interface Student {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  belt: 'white' | 'blue' | 'purple' | 'brown' | 'black';
  stripes: number;
  status: 'active' | 'inactive';
  registrationDate: string;
  classes_attended?: number;
  last_promotion_date?: string;
}

const StudentsList: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  // Usando o novo hook que centraliza a lógica de roles e academias
  const { isAdmin, academyId, loading: roleLoading } = useAcademyRole();
  
  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      
      // Construir query base
      // Definir o tipo any temporariamente para evitar o erro de tipagem profunda
      let query: any = supabase.from('students').select('*');
      
      // Aplicar filtro por academia para usuários não-admin
      if (!isAdmin && academyId) {
        // Usuário possui academia vinculada - mostrar apenas alunos desta academia
        query = query.eq('academy_id', academyId);
      } else if (!isAdmin) {
        // Usuário não é admin e não tem academia vinculada - não mostrar nenhum aluno
        setStudents([]);
        setIsLoading(false);
        return;
      }
      
      // Ordenar por nome
      query = query.order('name', { ascending: true });
      
      // Executar a consulta
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Mapear os dados para o formato esperado pelo componente
      setStudents(data.map(student => ({
        id: student.id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        belt: student.belt,
        stripes: student.stripes,
        status: (student.status === 'active' || student.status === 'inactive') 
          ? student.status 
          : 'inactive', // Valor padrão caso não seja um dos valores esperados
        registrationDate: student.registration_date,
        classes_attended: student.classes_attended || 0,
        last_promotion_date: student.last_promotion_date
      })));
    } catch (error) {
      console.error('Erro ao buscar alunos:', error);
      toast({
        title: 'Erro ao carregar alunos',
        description: 'Não foi possível buscar a lista de alunos.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Refatorado para buscar alunos apenas quando o carregamento do role estiver concluído
  useEffect(() => {
    if (!roleLoading) {
      fetchStudents();
    }
  }, [roleLoading, academyId, isAdmin]);
  
  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Função para mostrar cores diferentes com base na faixa
  const getBeltColor = (belt: string) => {
    switch (belt) {
      case 'white': return 'bg-white border border-gray-300';
      case 'blue': return 'bg-blue-500';
      case 'purple': return 'bg-purple-500';
      case 'brown': return 'bg-[#392620]';
      case 'black': return 'bg-black';
      default: return 'bg-gray-300';
    }
  };
  
  // Função para criar o indicador visual de graus na faixa
  const renderStripes = (stripes: number) => {
    return (
      <div className="flex space-x-1">
        {[...Array(4)].map((_, index) => (
          <div 
            key={index} 
            className={`h-2 w-2 rounded-full ${index < stripes ? 'bg-white' : 'bg-gray-300 bg-opacity-30'}`}
          />
        ))}
      </div>
    );
  };
  
  // Obter o nome da próxima faixa
  const getNextBeltName = (belt: string) => {
    switch (belt) {
      case 'white': return 'Azul';
      case 'blue': return 'Roxa';
      case 'purple': return 'Marrom';
      case 'brown': return 'Preta';
      case 'black': return 'Preta';
      default: return 'próxima';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-jiujitsu-700">Alunos</h1>
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            onClick={fetchStudents}
            className="flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Atualizar
          </Button>
          <Button 
            className="bg-jiujitsu-500 hover:bg-jiujitsu-600"
            onClick={() => setFormOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> Novo Aluno
          </Button>
        </div>
      </div>
      
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          type="text"
          placeholder="Buscar aluno..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>
      
      {isLoading || roleLoading ? (
        <div className="flex justify-center py-10">
          <div className="animate-pulse text-jiujitsu-500">Carregando alunos...</div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.map((student) => {
              const progress = calculateBeltProgress(
                student.belt,
                student.classes_attended,
                student.last_promotion_date,
                student.registrationDate
              );
              const isBlackBelt = student.belt === 'black';
              const nextBelt = getNextBeltName(student.belt);
              
              return (
                <Card 
                  key={student.id} 
                  className="overflow-hidden hover:shadow-md transition-shadow relative cursor-pointer"
                  onClick={() => {
                    setSelectedStudent(student);
                    setDetailsOpen(true);
                  }}
                >
                  <div className={`h-3 ${getBeltColor(student.belt)}`}></div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">{student.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${student.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {student.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    
                    <div className="flex items-center mb-3">
                      <div className={`w-6 h-6 rounded-full mr-2 ${getBeltColor(student.belt)} flex items-center justify-center`}>
                        {renderStripes(student.stripes)}
                      </div>
                      <div>
                        <span className="text-sm capitalize">
                          {student.belt === 'white' ? 'Branca' : 
                           student.belt === 'blue' ? 'Azul' : 
                           student.belt === 'purple' ? 'Roxa' : 
                           student.belt === 'brown' ? 'Marrom' : 'Preta'}
                        </span>
                        {student.stripes > 0 && (
                          <span className="ml-1 text-sm text-gray-500">
                            ({student.stripes} {student.stripes === 1 ? 'grau' : 'graus'})
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-500 mb-2">
                      Desde: {new Date(student.registrationDate).toLocaleDateString('pt-BR')}
                    </div>
                    
                    {!isBlackBelt && student.status === 'active' && (
                      <div className="mt-2 mb-1">
                        <div className="text-xs text-gray-600 mb-1">
                          Progresso para faixa {nextBelt}
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          <Progress value={progress.percent} className="h-2" />
                          <span className="text-xs">{progress.percent}%</span>
                        </div>
                        <div className="text-xs text-gray-600">
                          <span className="font-medium">Faltam {progress.classesRemaining} aulas</span> para graduação
                          <span className="block mt-1 text-gray-500">Aulas assistidas: {student.classes_attended}</span>
                        </div>
                      </div>
                    )}
                    
                    {isBlackBelt && (
                      <div className="mt-2 text-xs text-gray-600">
                        <span className="font-medium">Faixa máxima atingida</span>
                      </div>
                    )}
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation(); // Evita que o clique propague para o card
                        setSelectedStudent(student);
                        setFormOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
          
          {filteredStudents.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">Nenhum aluno encontrado.</p>
            </div>
          )}
        </>
      )}
      
      <StudentForm 
        open={formOpen} 
        onClose={() => {
          setFormOpen(false);
          setSelectedStudent(null);
        }} 
        onSuccess={fetchStudents}
        student={selectedStudent}
      />
      
      <StudentDetails 
        open={detailsOpen}
        onClose={() => {
          setDetailsOpen(false);
          setSelectedStudent(null);
        }}
        student={selectedStudent}
        onEdit={(student) => {
          setDetailsOpen(false);
          setSelectedStudent(student);
          setFormOpen(true);
        }}
      />
    </div>
  );
};

export default StudentsList;
