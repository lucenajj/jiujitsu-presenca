import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Class } from '@/lib/mockData';
import { Plus, Clock, Users, Award, Edit } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import ClassForm from '@/components/ClassForm';

const ClassesGrid: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | undefined>(undefined);
  const { toast } = useToast();

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      // Transformar os dados para o formato esperado pelo componente
      const formattedClasses = data.map(cls => ({
        id: cls.id,
        name: cls.name,
        dayOfWeek: cls.day_of_week,
        timeStart: cls.time_start,
        timeEnd: cls.time_end,
        level: cls.level,
        instructor: cls.instructor
      }));

      setClasses(formattedClasses);
    } catch (error) {
      console.error('Erro ao buscar aulas:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar aulas',
        description: 'Não foi possível buscar a lista de aulas.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getLevelBadgeClass = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-blue-100 text-blue-800';
      case 'advanced':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelLabel = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'Iniciante';
      case 'intermediate':
        return 'Intermediário';
      case 'advanced':
        return 'Avançado';
      default:
        return 'Todos os níveis';
    }
  };

  const openNewClassForm = () => {
    setSelectedClass(undefined);
    setIsFormOpen(true);
  };

  const openEditClassForm = (classItem: Class) => {
    setSelectedClass(classItem);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setSelectedClass(undefined);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-jiujitsu-700">Aulas</h1>
        <Button 
          className="bg-jiujitsu-500 hover:bg-jiujitsu-600"
          onClick={openNewClassForm}
        >
          <Plus className="mr-2 h-4 w-4" /> Nova Aula
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-pulse text-jiujitsu-500">Carregando aulas...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.length > 0 ? (
            classes.map((classItem) => (
              <Card key={classItem.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-2 bg-jiujitsu-500"></div>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{classItem.name}</CardTitle>
                      <CardDescription>
                        {classItem.dayOfWeek.join(', ')}
                      </CardDescription>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={() => openEditClassForm(classItem)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-gray-500" />
                      <span>{classItem.timeStart} - {classItem.timeEnd}</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-gray-500" />
                      <span>{classItem.instructor}</span>
                    </div>
                    <div className="flex items-center">
                      <Award className="h-4 w-4 mr-2 text-gray-500" />
                      <span className={`px-2 py-1 rounded-full text-xs ${getLevelBadgeClass(classItem.level)}`}>
                        {getLevelLabel(classItem.level)}
                      </span>
                    </div>
                    <div className="pt-2">
                      <Link to={`/attendance/record/${classItem.id}`}>
                        <Button variant="outline" className="w-full border-jiujitsu-300 text-jiujitsu-700 hover:bg-jiujitsu-50">
                          Registrar Presença
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">Nenhuma aula encontrada.</p>
              <p className="text-sm text-gray-400 mt-1">Clique em "Nova Aula" para começar a cadastrar.</p>
            </div>
          )}
        </div>
      )}

      <ClassForm 
        open={isFormOpen} 
        onClose={closeForm} 
        onSuccess={fetchClasses}
        classData={selectedClass}
      />
    </div>
  );
};

export default ClassesGrid;
