import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { Student, Class } from '@/lib/mockData';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, Save, Search, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

const AttendanceRecord: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [classInfo, setClassInfo] = useState<Class | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [attendanceList, setAttendanceList] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const formattedDate = format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const dayName = format(selectedDate, 'EEEE', { locale: ptBR });
  const isoDate = format(selectedDate, 'yyyy-MM-dd');
  
  // Carregar a aula e verificar se já existe registro de presença para a data selecionada
  useEffect(() => {
    const fetchClassAndAttendance = async () => {
      if (!classId) return;
      
      setIsLoading(true);
      try {
        // Buscar informações da aula
        const { data: classData, error: classError } = await supabase
          .from('classes')
          .select('*')
          .eq('id', classId)
          .single();
        
        if (classError) throw classError;
        
        if (!classData) {
          toast({
            variant: 'destructive',
            title: 'Aula não encontrada',
            description: 'A aula solicitada não foi encontrada.',
          });
          navigate('/classes');
          return;
        }
        
        // Converter dados para o formato esperado pelo componente
        const formattedClass = {
          id: classData.id,
          name: classData.name,
          dayOfWeek: classData.day_of_week,
          timeStart: classData.time_start,
          timeEnd: classData.time_end,
          level: classData.level,
          instructor: classData.instructor
        };
        
        setClassInfo(formattedClass);
        
        // Verificar se já existe registro de presença para a data selecionada
        const { data: attendanceData, error: attendanceError } = await supabase
          .from('attendance')
          .select('*')
          .eq('class_id', classId)
          .eq('date', isoDate)
          .single();
        
        if (attendanceError && attendanceError.code !== 'PGRST116') { // PGRST116 é "não encontrado", isso é esperado
          throw attendanceError;
        }
        
        // Se já existir presença para a data selecionada, carregar as presenças
        if (attendanceData) {
          setAttendanceList(attendanceData.student_ids || []);
          toast({
            title: 'Presença já registrada',
            description: `Já existe um registro de presença para esta aula em ${formattedDate}. Você pode modificá-lo.`,
          });
        } else {
          // Limpar lista de presenças ao mudar de data
          setAttendanceList([]);
        }
        
        // Buscar alunos
        await fetchStudents();
      } catch (error) {
        console.error('Erro ao carregar informações:', error);
        toast({
          variant: 'destructive',
          title: 'Erro ao carregar dados',
          description: 'Não foi possível carregar as informações necessárias.',
        });
        navigate('/classes');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchClassAndAttendance();
  }, [classId, navigate, toast, isoDate]);
  
  // Buscar alunos do banco de dados
  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('status', 'active')
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      const formattedStudents = data.map(student => ({
        id: student.id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        belt: student.belt,
        stripes: student.stripes,
        status: student.status === 'active' ? 'active' : 'inactive',
        registrationDate: student.registration_date,
        classes_per_week: student.classes_per_week || 3,
        classes_attended: student.classes_attended || 0,
        last_promotion_date: student.last_promotion_date
      })) as Student[];
      
      setStudents(formattedStudents);
      setFilteredStudents(formattedStudents);
    } catch (error) {
      console.error('Erro ao buscar alunos:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar alunos',
        description: 'Não foi possível buscar a lista de alunos.',
      });
    }
  };
  
  // Filtrar alunos com base no termo de pesquisa
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(student => 
        student.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStudents(filtered);
    }
  }, [searchTerm, students]);
  
  const handleCheckStudent = (studentId: string, checked: boolean) => {
    if (checked) {
      setAttendanceList(prev => [...prev, studentId]);
    } else {
      setAttendanceList(prev => prev.filter(id => id !== studentId));
    }
  };
  
  const handleSubmit = async () => {
    if (!classInfo || !user) return;
    
    setIsSubmitting(true);
    
    try {
      console.log('Iniciando registro de presença para a data:', isoDate);
      
      // Obter o academy_id do usuário logado
      const academyId = user.academy_id;
      
      // Verificar se já existe registro para atualizar ou criar novo
      const { data: existingAttendance, error: checkError } = await supabase
        .from('attendance')
        .select('id, student_ids')
        .eq('class_id', classId)
        .eq('date', isoDate)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }
      
      let result;
      
      // Identificar alunos que foram adicionados ou removidos da lista
      const previousStudentIds = existingAttendance?.student_ids || [];
      const newStudentIds = attendanceList;
      
      // Alunos que estão recebendo presença pela primeira vez nesta aula/data
      const addedStudents = newStudentIds.filter(id => !previousStudentIds.includes(id));
      
      // Alunos que estão sendo removidos da lista de presença
      const removedStudents = previousStudentIds.filter(id => !newStudentIds.includes(id));
      
      console.log('Alunos adicionados:', addedStudents);
      console.log('Alunos removidos:', removedStudents);
      
      // Atualizar ou criar o registro de presença
      if (existingAttendance) {
        // Atualizar registro existente
        result = await supabase
          .from('attendance')
          .update({
            student_ids: attendanceList,
            created_by: user.id,
            academy_id: academyId
          })
          .eq('id', existingAttendance.id);
      } else {
        // Criar novo registro
        result = await supabase
          .from('attendance')
          .insert({
            class_id: classInfo.id,
            date: isoDate,
            student_ids: attendanceList,
            created_by: user.id,
            academy_id: academyId
          });
      }
      
      if (result.error) throw result.error;
      
      // Atualizar a contagem de aulas para os alunos adicionados (SOMENTE os novos)
      if (addedStudents.length > 0) {
        console.log('Incrementando contagem de aulas para alunos adicionados');
        
        // Buscar os dados atuais dos alunos
        const { data: addedStudentsData, error: addedError } = await supabase
          .from('students')
          .select('id, classes_attended')
          .in('id', addedStudents);
        
        if (addedError) throw addedError;
        
        // Incrementar a contagem para cada aluno
        for (const student of addedStudentsData) {
          const currentCount = student.classes_attended || 0;
          const newCount = currentCount + 1;
          
          console.log(`Atualizando aluno ${student.id}: ${currentCount} -> ${newCount} aulas`);
          
          const { error: updateError } = await supabase
            .from('students')
            .update({ classes_attended: newCount })
            .eq('id', student.id);
            
          if (updateError) {
            console.error(`Erro ao atualizar aluno ${student.id}:`, updateError);
          }
        }
      }
      
      // Decrementar a contagem para alunos removidos da lista
      if (removedStudents.length > 0) {
        console.log('Decrementando contagem de aulas para alunos removidos');
        
        // Buscar os dados atuais dos alunos removidos
        const { data: removedStudentsData, error: removedError } = await supabase
          .from('students')
          .select('id, classes_attended')
          .in('id', removedStudents);
        
        if (removedError) throw removedError;
        
        // Decrementar a contagem para cada aluno (sem ficar negativo)
        for (const student of removedStudentsData) {
          const currentCount = student.classes_attended || 0;
          const newCount = Math.max(currentCount - 1, 0);
          
          console.log(`Atualizando aluno ${student.id}: ${currentCount} -> ${newCount} aulas`);
          
          const { error: updateError } = await supabase
            .from('students')
            .update({ classes_attended: newCount })
            .eq('id', student.id);
            
          if (updateError) {
            console.error(`Erro ao atualizar aluno ${student.id}:`, updateError);
          }
        }
      }
      
      toast({
        title: 'Presença registrada',
        description: `Presença registrada com sucesso para ${formattedDate}.`,
      });
      
      navigate('/classes');
    } catch (error) {
      console.error('Erro ao salvar presença:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o registro de presença.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSelectAll = () => {
    if (attendanceList.length === filteredStudents.length) {
      // Se todos estão selecionados, desmarca todos
      setAttendanceList([]);
    } else {
      // Seleciona todos os alunos filtrados
      setAttendanceList(filteredStudents.map(student => student.id));
    }
  };
  
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

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Carregando...</div>;
  }
  
  if (!classInfo) {
    return <div className="flex justify-center items-center h-64">Aula não encontrada</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/classes')}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <h1 className="text-2xl font-bold">Registro de Presença</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{classInfo?.name}</CardTitle>
          <div className="flex flex-row gap-2 mt-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal border-dashed border-jiujitsu-500",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {formattedDate} ({dayName})
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <div className="text-sm text-gray-500 flex items-center">
              {classInfo?.timeStart} - {classInfo?.timeEnd}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Buscar aluno..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button 
              variant="outline" 
              onClick={handleSelectAll}
              className="ml-2"
            >
              {attendanceList.length === filteredStudents.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
            </Button>
          </div>
          
          <div className="border rounded-md">
            <div className="grid grid-cols-1 divide-y">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <div 
                    key={student.id} 
                    className="flex items-center p-3 hover:bg-gray-50"
                  >
                    <Checkbox
                      id={`student-${student.id}`}
                      checked={attendanceList.includes(student.id)}
                      onCheckedChange={(checked) => 
                        handleCheckStudent(student.id, checked as boolean)
                      }
                      className="mr-3"
                    />
                    <div className="flex items-center justify-between flex-1">
                      <label 
                        htmlFor={`student-${student.id}`}
                        className="flex items-center cursor-pointer flex-1"
                      >
                        <span>{student.name}</span>
                      </label>
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full mr-1 ${getBeltColor(student.belt)}`}></div>
                        <span className="text-sm capitalize">{student.belt}</span>
                        {student.stripes > 0 && (
                          <span className="ml-2 px-1.5 py-0.5 bg-gray-100 rounded-full text-xs">
                            {student.stripes} {student.stripes === 1 ? 'grau' : 'graus'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">
                  Nenhum aluno encontrado.
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div>
            <span className="text-sm text-gray-500">
              {attendanceList.length} de {students.length} alunos selecionados
            </span>
          </div>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="bg-jiujitsu-500 hover:bg-jiujitsu-600"
          >
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Salvando...' : 'Salvar Presenças'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AttendanceRecord;
