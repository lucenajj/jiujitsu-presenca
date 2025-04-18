import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, ClipboardCheck, Award } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';

// Definir interfaces para os dados
interface DashboardStats {
  activeStudents: number;
  classCount: number;
  totalAttendances: number;
  averageStudentsPerClass: string;
  beltDistribution: Record<string, number>;
}

interface Class {
  id: string;
  name: string;
  day_of_week: string[];
  time_start: string;
  time_end: string;
  level: string;
  instructor: string;
  academyId?: string;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    activeStudents: 0,
    classCount: 0,
    totalAttendances: 0,
    averageStudentsPerClass: '0',
    beltDistribution: {}
  });
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      console.log('Buscando dados com user ID:', user.id);
      
      // Verificação direta de todas as aulas no banco
      supabase.from('classes').select('*').then(({data, error}) => {
        console.log('TODAS as aulas no banco:', data);
        if (error) console.error('Erro na verificação:', error);
      });
      
      fetchDashboardData();
    }
  }, [user?.id]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      console.log('Iniciando busca de dados para o Dashboard...');
      
      // Verificar se o usuário é um administrador ou uma academia
      const isAdmin = user?.role === 'admin';
      let academyId = null;
      
      // Se não for admin, busca a academia vinculada ao usuário
      if (!isAdmin) {
        const { data: academyData, error: academyError } = await supabase
          .from('academies')
          .select('id')
          .eq('user_id', user?.id)
          .single();
        
        if (academyError) {
          console.error('Erro ao buscar academia do usuário:', academyError);
          throw academyError;
        }
        
        academyId = academyData?.id;
        console.log('ID da academia do usuário atual:', academyId);
      }
      
      // Buscar contagem de alunos ativos
      let studentsQuery = supabase
        .from('students')
        .select('id, belt')
        .eq('status', 'active');
      
      // Se não for admin e tiver um academyId, filtra por academia
      if (!isAdmin && academyId) {
        studentsQuery = studentsQuery.eq('academy_id', academyId);
      }
      
      const { data: studentsData, error: studentsError } = await studentsQuery;
      
      if (studentsError) {
        console.error('Erro ao buscar alunos:', studentsError);
        throw studentsError;
      }
      console.log('Alunos ativos:', studentsData);
      
      // Calcular distribuição por faixas
      const beltDistribution: Record<string, number> = {};
      studentsData.forEach(student => {
        beltDistribution[student.belt] = (beltDistribution[student.belt] || 0) + 1;
      });
      console.log('Distribuição por faixas:', beltDistribution);
      
      // Buscar aulas
      console.log('Buscando aulas do Supabase com academy_id:', academyId);
      let classesQuery = supabase.from('classes').select('*');
      
      // Se tivermos academy_id e não for admin, filtre por academy_id
      if (academyId && !isAdmin) {
        console.log('Aplicando filtro de academy_id para classes:', academyId);
        classesQuery = classesQuery.eq('academy_id', academyId);
      } else {
        console.log('Não aplicando filtro de academy_id. Admin:', isAdmin, 'academyId:', academyId);
      }
      
      const { data: classesData, error: classesError } = await classesQuery;
      
      if (classesError) {
        console.error('Erro ao buscar aulas:', classesError);
        throw classesError;
      }
      console.log('TODAS as aulas no banco:', classesData);
      
      // Buscar presenças dos últimos 30 dias
      const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
      
      let attendanceQuery = supabase
        .from('attendance')
        .select('id, student_ids, class_id')
        .gte('date', thirtyDaysAgo);
      
      // Se não for admin e tiver classes filtradas, busca presenças apenas dessas aulas
      if (!isAdmin && classesData) {
        const classIds = classesData.map(c => c.id);
        if (classIds.length > 0) {
          attendanceQuery = attendanceQuery.in('class_id', classIds);
        }
      }
      
      const { data: attendanceData, error: attendanceError } = await attendanceQuery;
      
      if (attendanceError) {
        console.error('Erro ao buscar presenças:', attendanceError);
        throw attendanceError;
      }
      console.log('Registros de presença:', attendanceData);
      
      // Calcular total de presenças
      const totalAttendances = attendanceData.reduce((sum, att) => 
        sum + (att.student_ids?.length || 0), 0);
      
      // Calcular média de alunos por aula
      const totalAttendanceRecords = attendanceData.length;
      const averageStudentsPerClass = totalAttendanceRecords > 0 
        ? (totalAttendances / totalAttendanceRecords).toFixed(1) 
        : '0';
      
      console.log('Definindo estatísticas:', {
        activeStudents: studentsData.length,
        classCount: classesData.length,
        totalAttendances,
        averageStudentsPerClass
      });
      
      setStats({
        activeStudents: studentsData.length,
        classCount: classesData.length,
        totalAttendances,
        averageStudentsPerClass,
        beltDistribution
      });
      
      // Ordenar aulas por dia da semana para exibição
      const filteredClasses = (classesData || []).filter(c => 
        c.name !== 'Fundamentos' && 
        c.name !== 'Avançado' && 
        c.name !== 'Open Mat'
      );
      console.log('Classes após filtragem:', filteredClasses);
      setClasses(filteredClasses);
      console.log('Classes definidas no estado:', filteredClasses);
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
      
      // Em caso de erro, garantir que não há dados mockados
      setClasses([]);
      setStats({
        activeStudents: 0,
        classCount: 0,
        totalAttendances: 0,
        averageStudentsPerClass: '0',
        beltDistribution: {}
      });
    } finally {
      setIsLoading(false);
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

  // Mapear níveis de aula para exibição em português
  const getLevelDisplay = (level: string) => {
    switch (level) {
      case 'beginner': return 'Iniciante';
      case 'intermediate': return 'Intermediário';
      case 'advanced': return 'Avançado';
      case 'all': return 'Todos';
      default: return level;
    }
  };

  // Adicionar este componente isolado dentro do arquivo
  const RealClassesList = () => {
    const { user } = useAuth();
    const [realClasses, setRealClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
      async function fetchClasses() {
        if (!user?.id) return;
        
        try {
          console.log('RealClassesList: Buscando aulas para o usuário:', user.id);
          
          // Verificar se o usuário é admin
          const isAdmin = user.role === 'admin';
          let academyId = null;
          
          // Se não for admin, busca a academia vinculada ao usuário
          if (!isAdmin) {
            const { data: academyData, error: academyError } = await supabase
              .from('academies')
              .select('id')
              .eq('user_id', user.id)
              .single();
            
            if (academyError) {
              console.error('RealClassesList: Erro ao buscar academia do usuário:', academyError);
              setLoading(false);
              return;
            }
            
            academyId = academyData?.id;
            console.log('RealClassesList: ID da academia do usuário:', academyId);
          }
          
          // Buscar aulas filtradas pelo academy_id
          let query = supabase.from('classes').select('*');
          
          if (!isAdmin && academyId) {
            console.log('RealClassesList: Aplicando filtro de academy_id:', academyId);
            query = query.eq('academy_id', academyId);
          } else {
            console.log('RealClassesList: Não aplicando filtro. Admin:', isAdmin, 'academyId:', academyId);
          }
            
          const { data, error } = await query;
            
          if (error) {
            console.error('RealClassesList: Erro ao buscar aulas:', error);
            return;
          }
          
          console.log('RealClassesList: Aulas encontradas:', data);
          setRealClasses(data || []);
        } catch (e) {
          console.error('RealClassesList: Exceção:', e);
        } finally {
          setLoading(false);
        }
      }
      
      fetchClasses();
    }, [user?.id]);
    
    if (loading) {
      return <div className="text-center py-4">Carregando aulas...</div>;
    }
    
    return (
      <div className="space-y-4">
        {realClasses.length > 0 ? (
          realClasses.map((classItem) => (
            <div key={classItem.id} className="flex justify-between items-center p-3 bg-white border rounded-lg shadow-sm">
              <div>
                <h3 className="font-medium">{classItem.name}</h3>
                <p className="text-sm text-gray-500">
                  {classItem.day_of_week.join(', ')} • {classItem.time_start} - {classItem.time_end}
                </p>
              </div>
              <div className="bg-jiujitsu-100 text-jiujitsu-700 px-3 py-1 rounded-full text-xs font-medium">
                {getLevelDisplay(classItem.level)}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Nenhuma aula cadastrada.</p>
          </div>
        )}
      </div>
    );
  };

  // Componente para exibir últimas presenças registradas
  const RecentAttendanceList = () => {
    const { user } = useAuth();
    const [recentAttendance, setRecentAttendance] = useState<any[]>([]);
    const [classesMap, setClassesMap] = useState<Record<string, any>>({});
    const [studentsMap, setStudentsMap] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
      async function fetchRecentAttendance() {
        if (!user?.id) return;
        
        try {
          console.log('RecentAttendanceList: Buscando registros de presença');
          
          // Verificar se o usuário é um administrador ou uma academia
          const isAdmin = user?.role === 'admin';
          let academyId = null;
          
          // Se não for admin, busca a academia vinculada ao usuário
          if (!isAdmin) {
            const { data: academyData, error: academyError } = await supabase
              .from('academies')
              .select('id')
              .eq('user_id', user.id)
              .single();
            
            if (academyError) {
              console.error('Erro ao buscar academia do usuário:', academyError);
              setLoading(false);
              return;
            }
            
            academyId = academyData?.id;
            console.log('ID da academia do usuário atual:', academyId);
          }
          
          // Buscar classes primeiro para referência
          let classesQuery = supabase.from('classes').select('*');
          
          // Se não for admin, filtrar por academy_id
          if (!isAdmin && academyId) {
            console.log('RecentAttendanceList: Aplicando filtro de academy_id para classes:', academyId);
            classesQuery = classesQuery.eq('academy_id', academyId);
          } else {
            console.log('RecentAttendanceList: Não aplicando filtro de classes. Admin:', isAdmin, 'academyId:', academyId);
          }
            
          const { data: classesData, error: classesError } = await classesQuery;
            
          if (classesError) {
            console.error('RecentAttendanceList: Erro ao buscar classes:', classesError);
            setLoading(false);
            return;
          }
          
          // Criar mapa de classes para referência rápida
          const classesMapData: Record<string, any> = {};
          classesData.forEach(cls => {
            classesMapData[cls.id] = cls;
          });
          setClassesMap(classesMapData);
          
          // Buscar alunos para referência
          let studentsQuery = supabase.from('students').select('*');
          
          // Se não for admin e tiver academyId, filtrar por academia
          if (!isAdmin && academyId) {
            studentsQuery = studentsQuery.eq('academy_id', academyId);
          }
            
          const { data: studentsData, error: studentsError } = await studentsQuery;
            
          if (studentsError) {
            console.error('RecentAttendanceList: Erro ao buscar alunos:', studentsError);
            setLoading(false);
            return;
          }
          
          // Criar mapa de alunos para referência rápida
          const studentsMapData: Record<string, any> = {};
          studentsData.forEach(student => {
            studentsMapData[student.id] = student;
          });
          setStudentsMap(studentsMapData);
          
          // Buscar registros de presença
          let attendanceQuery = supabase
            .from('attendance')
            .select('*')
            .order('date', { ascending: false })
            .limit(5);
          
          // Se não for admin e tiver academy_id, filtrar por academia
          if (!isAdmin && academyId) {
            attendanceQuery = attendanceQuery.eq('academy_id', academyId);
          }
          // Se não for admin e tiver classes filtradas, buscar apenas essas presenças
          else if (!isAdmin && classesData) {
            const classIds = classesData.map(c => c.id);
            if (classIds.length > 0) {
              attendanceQuery = attendanceQuery.in('class_id', classIds);
            } else {
              // Se não houver classes, retornar lista vazia
              setRecentAttendance([]);
              setLoading(false);
              return;
            }
          }
          
          const { data: attendanceData, error: attendanceError } = await attendanceQuery;
          
          if (attendanceError) {
            console.error('RecentAttendanceList: Erro ao buscar presenças:', attendanceError);
            setLoading(false);
            return;
          }
          
          console.log('RecentAttendanceList: Presenças encontradas:', attendanceData);
          setRecentAttendance(attendanceData || []);
        } catch (e) {
          console.error('RecentAttendanceList: Exceção ao buscar dados:', e);
        } finally {
          setLoading(false);
        }
      }
      
      fetchRecentAttendance();
    }, [user?.id]);
    
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return format(date, 'dd/MM/yyyy');
    };
    
    if (loading) {
      return <div className="text-center py-4">Carregando registros de presença...</div>;
    }
    
    return (
      <div className="space-y-4">
        {recentAttendance.length > 0 ? (
          recentAttendance.map((attendance) => {
            const classInfo = classesMap[attendance.class_id] || { name: 'Aula não encontrada' };
            const studentCount = attendance.student_ids?.length || 0;
            
            return (
              <div key={attendance.id} className="flex flex-col p-3 bg-white border rounded-lg shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h3 className="font-medium">{classInfo.name}</h3>
                    <p className="text-sm text-gray-500">
                      {formatDate(attendance.date)} • {classInfo.time_start} - {classInfo.time_end}
                    </p>
                  </div>
                  <div className="bg-jiujitsu-100 text-jiujitsu-700 px-3 py-1 rounded-full text-xs font-medium">
                    {studentCount} {studentCount === 1 ? 'aluno' : 'alunos'}
                  </div>
                </div>
                
                {studentCount > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {attendance.student_ids.slice(0, 3).map((studentId: string) => {
                      const student = studentsMap[studentId];
                      return student ? (
                        <span key={studentId} className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                          {student.name}
                        </span>
                      ) : null;
                    })}
                    
                    {studentCount > 3 && (
                      <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                        +{studentCount - 3} mais
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-4 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Nenhum registro de presença encontrado.</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-jiujitsu-700">Dashboard</h1>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-pulse text-jiujitsu-500">Carregando dados...</div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Alunos Ativos</CardTitle>
                <Users className="h-4 w-4 text-jiujitsu-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeStudents}</div>
                <p className="text-xs text-muted-foreground">
                  Total de alunos matriculados
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Aulas</CardTitle>
                <Calendar className="h-4 w-4 text-jiujitsu-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.classCount}</div>
                <p className="text-xs text-muted-foreground">
                  Turmas disponíveis
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Presenças</CardTitle>
                <ClipboardCheck className="h-4 w-4 text-jiujitsu-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalAttendances}</div>
                <p className="text-xs text-muted-foreground">
                  Nos últimos 30 dias
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Média por Aula</CardTitle>
                <Award className="h-4 w-4 text-jiujitsu-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.averageStudentsPerClass}</div>
                <p className="text-xs text-muted-foreground">
                  Alunos por aula
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Aulas recentes e próximas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Últimas Presenças Registradas</CardTitle>
                <CardDescription>Registros de presença mais recentes</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentAttendanceList />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Aulas</CardTitle>
                <CardDescription>Suas aulas cadastradas</CardDescription>
              </CardHeader>
              <CardContent>
                <RealClassesList />
              </CardContent>
            </Card>
          </div>

          {/* Distribuição por faixas */}
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Faixas</CardTitle>
                <CardDescription>Alunos ativos por nível de graduação</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(stats.beltDistribution).map(([belt, count]) => {
                    const percentage = stats.activeStudents > 0
                      ? Math.round((count / stats.activeStudents) * 100)
                      : 0;
                    
                    return (
                      <div key={belt} className="space-y-1">
                        <div className="flex justify-between">
                          <div className="flex items-center">
                            <div className={`w-4 h-4 rounded-full mr-2 ${getBeltColor(belt)}`}></div>
                            <span className="capitalize">
                              {belt === 'white' ? 'Branca' : 
                               belt === 'blue' ? 'Azul' : 
                               belt === 'purple' ? 'Roxa' : 
                               belt === 'brown' ? 'Marrom' : 'Preta'}
                            </span>
                          </div>
                          <span>{count} alunos</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`${getBeltColor(belt)} h-2 rounded-full`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;