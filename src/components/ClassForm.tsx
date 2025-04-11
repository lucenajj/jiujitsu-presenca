import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Class } from '@/lib/mockData';
import { useAuth } from '@/hooks/useAuth';
import { useAcademyRole } from '@/hooks/useAcademyRole';
import { Database } from '@/integrations/supabase/types';

// Esquema de validação
const formSchema = z.object({
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres' }),
  dayOfWeek: z.array(z.string()).min(1, { message: 'Selecione pelo menos um dia da semana' }),
  timeStart: z.string().min(1, { message: 'Horário de início é obrigatório' }),
  timeEnd: z.string().min(1, { message: 'Horário de término é obrigatório' }),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'all']),
  instructor: z.string().min(3, { message: 'Nome do instrutor é obrigatório' }),
  academyId: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ClassFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  classData?: Class;
}

const weekDays = [
  { value: 'monday', label: 'Segunda-feira' },
  { value: 'tuesday', label: 'Terça-feira' },
  { value: 'wednesday', label: 'Quarta-feira' },
  { value: 'thursday', label: 'Quinta-feira' },
  { value: 'friday', label: 'Sexta-feira' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' }
];

const ClassForm: React.FC<ClassFormProps> = ({ open, onClose, onSuccess, classData }) => {
  const isEditMode = !!classData;
  const { user } = useAuth();
  const { academyId, isAdmin } = useAcademyRole();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [academies, setAcademies] = useState<{id: string; name: string}[]>([]);
  const [selectedAcademyId, setSelectedAcademyId] = useState<string | null>(null);
  
  const defaultValues = {
    name: '',
    dayOfWeek: [],
    timeStart: '',
    timeEnd: '',
    level: 'beginner' as const,
    instructor: '',
    academyId: '',
  };
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues
  });
  
  useEffect(() => {
    const fetchAcademies = async () => {
      if (isAdmin) {
        try {
          const { data, error } = await supabase
            .from('academies')
            .select('id, name')
            .order('name');
            
          if (error) {
            console.error('Erro ao buscar academias:', error);
            return;
          }
          
          if (data && data.length > 0) {
            setAcademies(data);
            
            if (!selectedAcademyId && !isEditMode) {
              setSelectedAcademyId(data[0].id);
              form.setValue('academyId', data[0].id);
            }
          }
        } catch (error) {
          console.error('Erro ao buscar academias:', error);
        }
      }
    };
    
    fetchAcademies();
  }, [isAdmin, form, isEditMode, selectedAcademyId]);
  
  useEffect(() => {
    if (classData) {
      form.reset({
        name: classData.name,
        dayOfWeek: classData.dayOfWeek,
        timeStart: classData.timeStart,
        timeEnd: classData.timeEnd,
        level: classData.level,
        instructor: classData.instructor,
        academyId: classData.academyId || '',
      });
      
      if (classData.academyId) {
        setSelectedAcademyId(classData.academyId);
      }
    } else if (open) {
      const newDefaults = { ...defaultValues };
      if (isAdmin && selectedAcademyId) {
        newDefaults.academyId = selectedAcademyId;
      }
      form.reset(newDefaults);
    }
  }, [classData, form, open, isAdmin, selectedAcademyId]);
  
  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      
      if (!user?.id) {
        throw new Error('Usuário não identificado. Por favor, faça login novamente.');
      }
      
      let finalAcademyId: string | null = null;
      
      if (isAdmin) {
        finalAcademyId = data.academyId || selectedAcademyId;
        console.log('Admin está usando a academia selecionada:', finalAcademyId);
      } else {
        finalAcademyId = academyId;
        console.log('Usuário normal usando sua academia vinculada:', finalAcademyId);
      }
      
      if (!finalAcademyId) {
        throw new Error('Nenhuma academia selecionada. Por favor, selecione uma academia válida.');
      }
      
      console.log('Valores para cadastro de aula:', {
        userId: user.id,
        academyId: finalAcademyId,
        isAdmin: isAdmin
      });
      
      const typedDayOfWeek = data.dayOfWeek as unknown as Database["public"]["Enums"]["weekday"][];
      
      const formattedClass = {
        name: data.name,
        instructor: data.instructor,
        day_of_week: typedDayOfWeek,
        time_start: data.timeStart,
        time_end: data.timeEnd,
        level: data.level,
        user_id: user.id,
        academy_id: finalAcademyId,
      };
      
      console.log('Salvando aula com dados:', formattedClass);
      
      if (isEditMode) {
        const { error } = await supabase
          .from('classes')
          .update(formattedClass)
          .eq('id', classData.id);
        
        if (error) {
          console.error('Erro ao atualizar aula:', error);
          throw error;
        }
        
        toast({
          title: 'Aula atualizada',
          description: 'A aula foi atualizada com sucesso.',
        });
      } else {
        const { error } = await supabase
          .from('classes')
          .insert(formattedClass);
        
        if (error) {
          console.error('Erro ao inserir aula:', error);
          throw error;
        }
        
        toast({
          title: 'Aula criada',
          description: 'A aula foi criada com sucesso.',
        });
      }
      
      form.reset(defaultValues);
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar aula:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: `Ocorreu um erro ao salvar a aula: ${(error as any).message || 'Tente novamente.'}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar Aula' : 'Nova Aula'}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {isAdmin && (
              <FormField
                control={form.control}
                name="academyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Academia</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedAcademyId(value);
                      }}
                      defaultValue={field.value || selectedAcademyId || ''}
                      value={field.value || selectedAcademyId || ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma academia" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {academies.map((academy) => (
                          <SelectItem key={academy.id} value={academy.id}>
                            {academy.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Aula</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome da aula" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="instructor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instrutor</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do instrutor" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="dayOfWeek"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dias da Semana</FormLabel>
                  <FormControl>
                    <MultiSelect
                      selected={field.value}
                      options={weekDays}
                      onChange={field.onChange}
                      placeholder="Selecione os dias"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="timeStart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário de Início</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="timeEnd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário de Término</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nível</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o nível" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="beginner">Iniciante</SelectItem>
                      <SelectItem value="intermediate">Intermediário</SelectItem>
                      <SelectItem value="advanced">Avançado</SelectItem>
                      <SelectItem value="all">Todos os níveis</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : isEditMode ? 'Atualizar' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ClassForm; 