import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { format, differenceInMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { calculateBeltProgress } from '@/lib/utils';

// Interface para os dados do aluno
interface Student {
  id: string;
  name: string;
  belt: string;
  stripes: number;
  status: string;
  classes_attended: number;
  classes_per_week: number;
  last_promotion_date: string;
  registrationDate?: string;
}

// Interface para registros de presença
interface Attendance {
  id: string;
  class_id: string;
  date: string;
  student_ids: string[];
}

const Reports: React.FC = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Buscar dados reais do Supabase
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        // Buscar alunos ativos
        const { data: studentsData, error: studentsError } = await supabase
          .from('students')
          .select('*')
          .eq('status', 'active');
        
        if (studentsError) throw studentsError;
        
        // Buscar registros de presença (últimos 30 dias)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const dateString = format(thirtyDaysAgo, 'yyyy-MM-dd');
        
        const { data: attendanceData, error: attendanceError } = await supabase
          .from('attendance')
          .select('*')
          .gte('date', dateString);
        
        if (attendanceError) throw attendanceError;
        
        setStudents(studentsData);
        setAttendanceRecords(attendanceData);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [user]);
  
  // Cores para as faixas
  const getBeltColor = (belt: string) => {
    switch (belt) {
      case 'white': return '#E2E8F0';
      case 'blue': return '#4299E1';
      case 'purple': return '#9F7AEA';
      case 'brown': return '#392620';
      case 'black': return '#1A202C';
      default: return '#A0AEC0';
    }
  };
  
  // Tradução das faixas para português
  const getBeltName = (belt: string) => {
    switch (belt) {
      case 'white': return 'Branca';
      case 'blue': return 'Azul';
      case 'purple': return 'Roxa';
      case 'brown': return 'Marrom';
      case 'black': return 'Preta';
      default: return belt;
    }
  };
  
  // Calcular frequência por dia da semana com dados reais
  const calculateWeekdayAttendance = () => {
    const weekdayAttendance: Record<string, number> = {};
    
    attendanceRecords.forEach(attendance => {
      const date = new Date(attendance.date);
      const weekday = format(date, 'EEEE', { locale: ptBR });
      const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
      
      weekdayAttendance[capitalizedWeekday] = (weekdayAttendance[capitalizedWeekday] || 0) + (attendance.student_ids?.length || 0);
    });
    
    return Object.entries(weekdayAttendance).map(([name, value]) => ({ name, value }));
  };
  
  // Ordenar alunos por faixa e número de presenças
  const sortedStudents = [...students].sort((a, b) => {
    // Primeiro por faixa em ordem: branca, azul, roxa, marrom, preta
    const beltOrder = { 'white': 0, 'blue': 1, 'purple': 2, 'brown': 3, 'black': 4 };
    const beltDiff = beltOrder[a.belt as keyof typeof beltOrder] - beltOrder[b.belt as keyof typeof beltOrder];
    
    if (beltDiff !== 0) return beltDiff;
    
    // Depois por número de presenças (decrescente)
    return (b.classes_attended || 0) - (a.classes_attended || 0);
  });
  
  // Calcular top 10 alunos por frequência
  const topStudentsByAttendance = [...students]
    .sort((a, b) => (b.classes_attended || 0) - (a.classes_attended || 0))
    .slice(0, 10)
    .map(student => ({
      name: student.name,
      count: student.classes_attended || 0,
      belt: student.belt
    }));
  
  const weekdayData = calculateWeekdayAttendance();

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Carregando relatórios...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-jiujitsu-700">Relatórios</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progresso para Graduação por Aluno */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Progresso para Graduação</CardTitle>
            <CardDescription>Nome do aluno, presenças e tempo restante para nova graduação</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Faixa</TableHead>
                    <TableHead>Presenças</TableHead>
                    <TableHead className="text-right">Progresso</TableHead>
                    <TableHead className="text-right">Tempo Restante</TableHead>
                    <TableHead className="text-right">Aulas Restantes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedStudents.map(student => {
                    const progress = calculateBeltProgress(
                      student.belt,
                      student.classes_attended || 0,
                      student.last_promotion_date,
                      student.registrationDate
                    );
                    
                    // Se for faixa preta, mostrar "Graduação Máxima"
                    const isBlackBelt = student.belt === 'black';
                    
                    return (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <div className={`w-4 h-4 rounded-full mr-2`} style={{ backgroundColor: getBeltColor(student.belt) }}></div>
                            <span>{getBeltName(student.belt)}</span>
                            {student.stripes > 0 && (
                              <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                                {student.stripes} {student.stripes === 1 ? 'grau' : 'graus'}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{student.classes_attended || 0}</TableCell>
                        <TableCell className="text-right">
                          {isBlackBelt ? (
                            <span className="text-sm text-gray-500">Graduação Máxima</span>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              <Progress value={progress.percent} className="w-24" />
                              <span className="text-sm">{progress.percent}%</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {isBlackBelt ? (
                            "-"
                          ) : (
                            `${progress.timeRemaining} meses`
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {isBlackBelt ? (
                            "-"
                          ) : (
                            `${progress.classesRemaining} aulas`
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        
        {/* Frequência por dia da semana */}
        <Card>
          <CardHeader>
            <CardTitle>Frequência por Dia da Semana</CardTitle>
            <CardDescription>Total de presenças nos últimos 30 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekdayData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#1A365D" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Top 10 alunos por frequência */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Alunos por Frequência</CardTitle>
            <CardDescription>Alunos com maior número de presenças</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topStudentsByAttendance}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="count" name="Presenças">
                    {topStudentsByAttendance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBeltColor(entry.belt)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
