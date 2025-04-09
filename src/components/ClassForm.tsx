import React, { useEffect } from 'react';
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
import { Database } from '@/integrations/supabase/types';

// Esquema de validação
const formSchema = z.object({
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres' }),
  dayOfWeek: z.array(z.string()).min(1, { message: 'Selecione pelo menos um dia da semana' }),
  timeStart: z.string().min(1, { message: 'Horário de início é obrigatório' }),
  timeEnd: z.string().min(1, { message: 'Horário de término é obrigatório' }),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'all']),
  instructor: z.string().min(3, { message: 'Nome do instrutor é obrigatório' }),
});

type FormData = z.infer<typeof formSchema>;

interface ClassFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  classData?: Class; // Opcional para modo de edição
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
  
  // Valores padrão para nova aula
  const defaultValues = {
    name: '',
    dayOfWeek: [],
    timeStart: '',
    timeEnd: '',
    level: 'beginner' as const,
    instructor: '',
  };
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues
  });
  
  // Preencher o formulário com os dados da aula quando estiver em modo de edição
  useEffect(() => {
    if (classData) {
      // Modo de edição: preencher com dados da aula
      form.reset({
        name: classData.name,
        dayOfWeek: classData.dayOfWeek,
        timeStart: classData.timeStart,
        timeEnd: classData.timeEnd,
        level: classData.level,
        instructor: classData.instructor
      });
    } else if (open) {
      // Modo de criação: limpar formulário
      form.reset(defaultValues);
    }
  }, [classData, form, open]);
  
  const isSubmitting = form.formState.isSubmitting;
  
  const onSubmit = async (data: FormData) => {
    try {
      if (isEditMode && classData) {
        // Atualizando a aula existente no Supabase
        const { error } = await supabase
          .from('classes')
          .update({
            name: data.name,
            day_of_week: data.dayOfWeek as unknown as Database["public"]["Enums"]["weekday"][],
            time_start: data.timeStart,
            time_end: data.timeEnd,
            level: data.level,
            instructor: data.instructor
          })
          .eq('id', classData.id);
        
        if (error) throw error;
        
        toast({
          title: 'Aula atualizada com sucesso!',
          variant: 'default',
        });
      } else {
        // Inserindo a nova aula no Supabase
        const { error } = await supabase
          .from('classes')
          .insert({
            name: data.name,
            day_of_week: data.dayOfWeek as unknown as Database["public"]["Enums"]["weekday"][],
            time_start: data.timeStart,
            time_end: data.timeEnd,
            level: data.level,
            instructor: data.instructor,
            user_id: user?.id
          });
        
        if (error) {
          console.error('Erro detalhado:', error);
          throw error;
        }
        
        toast({
          title: 'Aula cadastrada com sucesso!',
          variant: 'default',
        });
      }
      
      form.reset();
      
      // Chamar onSuccess antes de fechar o modal para garantir que os dados sejam recarregados
      if (onSuccess) {
        await onSuccess();
      }
      
      onClose();
    } catch (error) {
      console.error(`Erro ao ${isEditMode ? 'atualizar' : 'cadastrar'} aula:`, error);
      toast({
        title: `Erro ao ${isEditMode ? 'atualizar' : 'cadastrar'} aula`,
        description: (error as any).message || 'Por favor, tente novamente mais tarde.',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) onClose();
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar Aula' : 'Cadastrar Nova Aula'}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Aula</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Fundamentos, Avançado, etc." {...field} />
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
                      options={weekDays}
                      selected={field.value}
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
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting}
                className="bg-jiujitsu-500 hover:bg-jiujitsu-600"
              >
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