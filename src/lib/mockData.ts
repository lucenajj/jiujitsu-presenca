import { format, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Tipos
export interface Student {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  belt: 'white' | 'blue' | 'purple' | 'brown' | 'black';
  stripes: number;
  registrationDate: string;
  status: 'active' | 'inactive';
  classes_attended?: number;
  last_promotion_date?: string;
  classes_per_week?: number;
}

export interface Class {
  id: string;
  name: string;
  dayOfWeek: string[];
  timeStart: string;
  timeEnd: string;
  level: 'all' | 'beginner' | 'intermediate' | 'advanced';
  instructor: string;
}

export interface Attendance {
  id: string;
  classId: string;
  date: string;
  studentIds: string[];
  instructorId: string;
}

// Dados mock (substituídos por arrays vazios para evitar seu uso)
export const mockStudents: Student[] = [];

export const mockClasses: Class[] = [];

// Gerar dados de presença para os últimos 30 dias
export const generateMockAttendance = (): Attendance[] => {
  return [];
};

export const mockAttendance = generateMockAttendance();

// Função para calcular estatísticas de presença
export const calculateAttendanceStats = () => {
  // Retornar dados vazios
  return {
    totalStudents: 0,
    totalClasses: 0,
    totalAttendances: 0,
    averageStudentsPerClass: '0',
    beltAttendance: {}
  };
};
