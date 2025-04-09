import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, ChevronDown, ChevronRight, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Student, Class } from '@/lib/mockData';

interface Attendance {
  id: string;
  classId: string;
  date: string;
  studentIds: string[];
  instructorId: string;
}

const AttendanceList: React.FC = () => {
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [classes, setClasses] = useState<Record<string, Class>>({});
  const [students, setStudents] = useState<Record<string, Student>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Buscar todas as aulas e criar um mapa por ID para referência rápida
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('*');
      
      if (classesError) throw classesError;
      
      const classesMap: Record<string, Class> = {};
      classesData.forEach((cls) => {
        classesMap[cls.id] = {
          id: cls.id,
          name: cls.name,
          dayOfWeek: cls.day_of_week,
          timeStart: cls.time_start,
          timeEnd: cls.time_end,
          level: cls.level,
          instructor: cls.instructor
        };
      });
      
      setClasses(classesMap);
      
      // Buscar todos os alunos e criar um mapa por ID para referência rápida
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*');
      
      if (studentsError) throw studentsError;
      
      const studentsMap: Record<string, Student> = {};
      studentsData.forEach((student) => {
        // Garantir que o status seja um dos valores permitidos
        const status = student.status === 'active' ? 'active' : 'inactive';
        
        studentsMap[student.id] = {
          id: student.id,
          name: student.name,
          email: student.email || '',
          phone: student.phone || '',
          belt: student.belt,
          stripes: student.stripes,
          status: status,
          registrationDate: student.registration_date
        };
      });
      
      setStudents(studentsMap);
      
      // Buscar todos os registros de presença
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('*')
        .order('date', { ascending: false });
      
      if (attendanceError) throw attendanceError;
      
      const formattedAttendance = attendanceData.map(att => ({
        id: att.id,
        classId: att.class_id,
        date: att.date,
        studentIds: att.student_ids || [],
        instructorId: att.created_by
      }));
      
      setAttendanceRecords(formattedAttendance);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar dados',
        description: 'Não foi possível buscar os registros de presença.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Agrupar presenças por data
  const groupedAttendance = attendanceRecords.reduce((acc, attendance) => {
    if (!acc[attendance.date]) {
      acc[attendance.date] = [];
    }
    acc[attendance.date].push(attendance);
    return acc;
  }, {} as Record<string, Attendance[]>);

  // Ordenar datas em ordem decrescente
  const sortedDates = Object.keys(groupedAttendance).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  const getClassInfo = (id: string) => {
    return classes[id] || { name: 'Aula não encontrada', timeStart: '', timeEnd: '' };
  };

  const getStudentsByIds = (ids: string[]) => {
    return ids.filter(id => students[id]).map(id => students[id]);
  };

  const [openDates, setOpenDates] = useState<Record<string, boolean>>({});

  const toggleDate = (date: string) => {
    setOpenDates(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-jiujitsu-700">Registros de Presença</h1>
        <Link to="/classes">
          <Button className="bg-jiujitsu-500 hover:bg-jiujitsu-600">
            Nova Presença
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-pulse text-jiujitsu-500">Carregando registros de presença...</div>
        </div>
      ) : sortedDates.length > 0 ? (
        <div className="space-y-4">
          {sortedDates.map((date) => (
            <Collapsible
              key={date}
              open={openDates[date]}
              onOpenChange={() => toggleDate(date)}
              className="border rounded-lg overflow-hidden"
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-jiujitsu-500" />
                    <span className="font-medium">
                      {format(parseISO(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500 mr-2">
                      {groupedAttendance[date].length} aulas
                    </span>
                    {openDates[date] ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </div>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4 space-y-3">
                  {groupedAttendance[date].map((attendance) => {
                    const classInfo = getClassInfo(attendance.classId);
                    const students = getStudentsByIds(attendance.studentIds);
                    
                    return (
                      <Card key={attendance.id} className="overflow-hidden">
                        <CardHeader className="bg-jiujitsu-50 pb-2">
                          <CardTitle className="text-lg">{classInfo.name}</CardTitle>
                          <CardDescription className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {classInfo.timeStart} - {classInfo.timeEnd}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <div className="flex items-center mb-2">
                            <Users className="h-4 w-4 mr-2 text-gray-500" />
                            <span className="font-medium">{students.length} alunos presentes</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {students.slice(0, 5).map((student) => (
                              <div key={student.id} className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                                {student.name}
                              </div>
                            ))}
                            {students.length > 5 && (
                              <div className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                                +{students.length - 5} mais
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Nenhum registro de presença encontrado.</p>
          <p className="text-sm text-gray-400 mt-1">Visite a página de aulas para registrar presenças.</p>
        </div>
      )}
    </div>
  );
};

export default AttendanceList;
