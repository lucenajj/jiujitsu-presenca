import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn, getClassesRequiredForNextBelt, BELT_PROGRESSION } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Student } from '@/lib/mockData';
import { useAcademyRole } from '@/hooks/useAcademyRole';

// Definindo o schema de validação
const formSchema = z.object({
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres' }),
  email: z.string().email({ message: 'Email inválido' }).optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  belt: z.enum(['white', 'blue', 'purple', 'brown', 'black']),
  stripes: z.number().min(0).max(4),
  status: z.enum(['active', 'inactive']),
  registrationDate: z.date({
    required_error: "Selecione uma data de matrícula",
  }),
  classes_per_week: z.number().min(1).max(7).default(3),
  classes_attended: z.number().min(0).default(0),
  last_promotion_date: z.date().optional().default(new Date())
});

type FormData = z.infer<typeof formSchema>;

interface StudentFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  student?: Student; // Opcional para modo de edição
}

const StudentForm: React.FC<StudentFormProps> = ({ open, onClose, onSuccess, student }) => {
  const [isLoading, setIsLoading] = useState(false);
  const isEditMode = !!student;
  
  // Usando o hook centralizado de academyRole
  const { isAdmin, academyId } = useAcademyRole();
  
  console.log('[StudentForm] Rendering with props:', { 
    open, 
    isEditMode, 
    studentId: student?.id,
    studentName: student?.name,
    academyId
  });
  
  // Valores padrão para novo aluno
  const defaultValues: FormData = {
    name: '',
    email: '',
    phone: '',
    belt: 'white',
    stripes: 0,
    status: 'active',
    registrationDate: new Date(),
    classes_per_week: 3,
    classes_attended: 0,
    last_promotion_date: new Date()
  };
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues
  });
  
  // Preencher o formulário com os dados do aluno quando estiver em modo de edição
  // ou limpar o formulário quando estiver no modo de criação
  useEffect(() => {
    if (student) {
      console.log('[StudentForm] Preenchendo formulário com dados do aluno:', student.name);
      // Modo de edição: preencher com dados do aluno
      form.reset({
        name: student.name,
        email: student.email || '',
        phone: student.phone || '',
        belt: student.belt,
        stripes: student.stripes,
        status: student.status,
        registrationDate: student.registrationDate ? new Date(student.registrationDate) : new Date(),
        classes_per_week: student.classes_per_week || 3,
        classes_attended: student.classes_attended || 0,
        last_promotion_date: student.last_promotion_date ? new Date(student.last_promotion_date) : new Date()
      });
    } else if (open) {
      console.log('[StudentForm] Limpando formulário para novo aluno');
      // Modo de criação: limpar formulário
      form.reset(defaultValues);
    }
  }, [student, form, open]);
  
  const isSubmitting = form.formState.isSubmitting;
  
  const onSubmit = async (data: FormData) => {
    try {
      console.log('[StudentForm] Enviando dados:', data);
      
      // Formatar as datas para o formato esperado pelo Supabase (YYYY-MM-DD)
      const formattedRegistrationDate = format(data.registrationDate, 'yyyy-MM-dd');
      const formattedPromotionDate = data.last_promotion_date 
        ? format(data.last_promotion_date, 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd');
      
      // Verificar se o academyId está disponível
      if (!isAdmin && !academyId) {
        throw new Error('Usuário não possui academia vinculada. Contate um administrador.');
      }
      
      if (isEditMode && student) {
        // Atualizando o aluno existente no Supabase
        const updateData = {
          name: data.name,
          email: data.email,
          phone: data.phone,
          belt: data.belt,
          stripes: data.stripes,
          status: data.status,
          registration_date: formattedRegistrationDate,
          classes_per_week: data.classes_per_week,
          classes_attended: data.classes_attended,
          last_promotion_date: formattedPromotionDate,
          // Manter o mesmo academyId para admins, ou usar o academyId do usuário atual
          academy_id: isAdmin ? student.academy_id : academyId
        };
        
        const { error } = await supabase
          .from('students')
          .update(updateData)
          .eq('id', student.id);
        
        if (error) throw error;
        
        toast({
          title: 'Aluno atualizado com sucesso!',
          variant: 'default',
        });
      } else {
        // Inserindo o novo aluno no Supabase com data de registro
        const newStudent = {
          name: data.name,
          email: data.email,
          phone: data.phone,
          belt: data.belt,
          stripes: data.stripes,
          status: data.status,
          registration_date: formattedRegistrationDate,
          classes_per_week: data.classes_per_week,
          classes_attended: data.classes_attended,
          last_promotion_date: formattedPromotionDate,
          academy_id: academyId  // Usar o academyId do hook
        };
        
        const { error } = await supabase
          .from('students')
          .insert(newStudent);
        
        if (error) throw error;
        
        toast({
          title: 'Aluno cadastrado com sucesso!',
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
      console.error(`[StudentForm] Erro ao ${isEditMode ? 'atualizar' : 'cadastrar'} aluno:`, error);
      toast({
        title: `Erro ao ${isEditMode ? 'atualizar' : 'cadastrar'} aluno`,
        description: (error as any).message || 'Por favor, tente novamente mais tarde.',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <Dialog 
      open={open} 
      onOpenChange={(isOpen) => {
        console.log('[StudentForm] Dialog onOpenChange:', { isOpen, currentOpen: open });
        if (!isOpen) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar Aluno' : 'Cadastrar Novo Aluno'}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="email@exemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input placeholder="(00) 00000-0000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="belt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Faixa</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a faixa" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="white">Branca</SelectItem>
                        <SelectItem value="blue">Azul</SelectItem>
                        <SelectItem value="purple">Roxa</SelectItem>
                        <SelectItem value="brown">Marrom</SelectItem>
                        <SelectItem value="black">Preta</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="stripes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Graus</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Graus" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">0</SelectItem>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="registrationDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data de Matrícula</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy", { locale: ptBR })
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="classes_per_week"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aulas por Semana</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Aulas por semana" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">1 aula</SelectItem>
                        <SelectItem value="2">2 aulas</SelectItem>
                        <SelectItem value="3">3 aulas</SelectItem>
                        <SelectItem value="4">4 aulas</SelectItem>
                        <SelectItem value="5">5 aulas</SelectItem>
                        <SelectItem value="6">6 aulas</SelectItem>
                        <SelectItem value="7">7 aulas</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="classes_attended"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aulas Assistidas</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="1"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                    {form.watch('belt') && (
                      <p className="text-xs text-muted-foreground">
                        {getClassesRequiredForNextBelt(form.watch('belt')) ? 
                          `Meta: ${getClassesRequiredForNextBelt(form.watch('belt'))} aulas` : 
                          'Faixa final alcançada'}
                      </p>
                    )}
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="last_promotion_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data da Última Promoção</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy", { locale: ptBR })
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value || undefined}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
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

export default StudentForm;
