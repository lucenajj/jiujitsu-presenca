import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent } from './ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

// Validação com Zod
const academyFormSchema = z.object({
  ownerName: z.string().min(3, { message: 'Nome do proprietário é obrigatório' }),
  academyName: z.string().min(3, { message: 'Nome da academia é obrigatório' }),
  cnpj: z
    .string()
    .min(18, { message: 'CNPJ deve ter 14 dígitos' })
    .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, { message: 'CNPJ inválido (formato: XX.XXX.XXX/XXXX-XX)' }),
  street: z.string().min(3, { message: 'Rua é obrigatória' }),
  neighborhood: z.string().min(2, { message: 'Bairro é obrigatório' }),
  zipCode: z.string().regex(/^\d{5}-\d{3}$/, { message: 'CEP inválido (formato: XXXXX-XXX)' }),
  phone: z
    .string()
    .regex(/^\(\d{2}\)\d{5}-\d{4}$/, { message: 'Telefone inválido (formato: (XX)XXXXX-XXXX)' }),
  email: z.string().email({ message: 'E-mail inválido' }),
  username: z.string().min(4, { message: 'Usuário deve ter pelo menos 4 caracteres' }).optional(),
  password: z.string().min(6, { message: 'Senha deve ter pelo menos 6 caracteres' }).optional(),
});

// Tipo inferido do schema
type AcademyFormValues = z.infer<typeof academyFormSchema>;

interface AcademyFormProps {
  initialData?: Partial<AcademyFormValues>;
  academyId?: string;
  onSuccess?: () => void;
}

const AcademyForm: React.FC<AcademyFormProps> = ({ 
  initialData, 
  academyId,
  onSuccess 
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(Boolean(academyId));
  
  // Valores padrão do formulário, mesclando com os dados iniciais se fornecidos
  const defaultValues: Partial<AcademyFormValues> = {
    ownerName: '',
    academyName: '',
    cnpj: '',
    street: '',
    neighborhood: '',
    zipCode: '',
    phone: '',
    email: '',
    username: '',
    password: '',
    ...initialData
  };

  const form = useForm<AcademyFormValues>({
    resolver: zodResolver(academyFormSchema),
    defaultValues,
  });

  // Atualiza o formulário quando os dados iniciais mudarem
  useEffect(() => {
    if (initialData) {
      Object.entries(initialData).forEach(([key, value]) => {
        if (value) {
          form.setValue(key as keyof AcademyFormValues, value);
        }
      });
    }
  }, [initialData, form]);

  // Função para formatar CNPJ enquanto digita
  const formatCNPJ = (value: string) => {
    // Remove tudo que não é dígito
    const digits = value.replace(/\D/g, '');
    
    // Formata conforme a máscara XX.XXX.XXX/XXXX-XX
    let formatted = '';
    if (digits.length > 0) formatted += digits.substring(0, Math.min(2, digits.length));
    if (digits.length > 2) formatted += '.' + digits.substring(2, Math.min(5, digits.length));
    if (digits.length > 5) formatted += '.' + digits.substring(5, Math.min(8, digits.length));
    if (digits.length > 8) formatted += '/' + digits.substring(8, Math.min(12, digits.length));
    if (digits.length > 12) formatted += '-' + digits.substring(12, Math.min(14, digits.length));
    
    return formatted;
  };

  // Função para formatar CEP enquanto digita
  const formatZipCode = (value: string) => {
    // Remove tudo que não é dígito
    const digits = value.replace(/\D/g, '');
    
    // Formata conforme a máscara XXXXX-XXX
    let formatted = '';
    if (digits.length > 0) formatted += digits.substring(0, Math.min(5, digits.length));
    if (digits.length > 5) formatted += '-' + digits.substring(5, Math.min(8, digits.length));
    
    return formatted;
  };

  // Função para formatar telefone enquanto digita
  const formatPhone = (value: string) => {
    // Remove tudo que não é dígito
    const digits = value.replace(/\D/g, '');
    
    // Formata conforme a máscara (XX)XXXXX-XXXX
    let formatted = '';
    if (digits.length > 0) formatted += '(' + digits.substring(0, Math.min(2, digits.length));
    if (digits.length > 2) formatted += ')' + digits.substring(2, Math.min(7, digits.length));
    if (digits.length > 7) formatted += '-' + digits.substring(7, Math.min(11, digits.length));
    
    return formatted;
  };

  const onSubmit = async (data: AcademyFormValues) => {
    try {
      console.log(isEditing ? 'Atualizando academia:' : 'Iniciando cadastro de academia:', { ...data, password: '***' });
      console.log('Usuário atual:', user);
      
      if (!user) {
        console.error('Erro: Usuário não autenticado');
        throw new Error('Usuário não autenticado');
      }
      
      // Dados comuns para criação ou atualização
      const academyData = {
        owner_name: data.ownerName,
        name: data.academyName,
        cnpj: data.cnpj,
        street: data.street,
        neighborhood: data.neighborhood,
        zip_code: data.zipCode,
        phone: data.phone,
        email: data.email,
      };
      
      let response;
      
      if (isEditing && academyId) {
        // Atualização de academia existente
        console.log('Atualizando academia existente:', academyId);
        response = await supabase
          .from('academies')
          .update({
            ...academyData,
            updated_at: new Date().toISOString()
          })
          .eq('id', academyId)
          .select();
      } else {
        // Criação de nova academia
        console.log('Tentando inserir academia diretamente:', {
          ...academyData,
          user_id: user.id,
          created_by: user.id
        });
        
        response = await supabase
          .from('academies')
          .insert({
            ...academyData,
            user_id: user.id,
            created_by: user.id
          })
          .select();
      }
      
      const { data: responseData, error } = response;
      
      console.log('Resposta do Supabase:', { data: responseData, error });
      
      if (error) {
        console.error(isEditing ? 'Erro ao atualizar academia:' : 'Erro ao inserir academia:', error);
        
        // Se o erro for de permissão, podemos mostrar uma mensagem mais clara
        if (error.message && error.message.includes('permission denied')) {
          throw new Error('Erro de permissão: Verifique se o RLS está configurado corretamente');
        }
        
        throw error;
      }
      
      console.log(isEditing ? 'Academia atualizada com sucesso' : 'Academia cadastrada com sucesso');
      
      toast({
        title: isEditing ? "Academia atualizada com sucesso!" : "Academia cadastrada com sucesso!",
        description: "Os dados foram salvos no sistema.",
      });
      
      // Reseta o formulário para caso de novo cadastro
      if (!isEditing) {
        form.reset(defaultValues);
      }
      
      // Callback de sucesso ou redirecionamento
      if (onSuccess) {
        onSuccess();
      } else if (!isEditing) {
        // Redireciona para o Dashboard após o cadastro bem-sucedido
        navigate('/dashboard');
      }
      
    } catch (error: any) {
      console.error('Erro detalhado ao processar academia:', error);
      
      // Tratamento específico para erros comuns
      let title = isEditing ? "Erro ao atualizar academia" : "Erro ao cadastrar academia";
      let message = "Ocorreu um erro ao salvar os dados. Tente novamente.";
      
      if (error.message) {
        if (error.message.includes('duplicate key')) {
          title = "Dados duplicados";
          if (error.message.includes('cnpj')) {
            message = "Já existe uma academia cadastrada com este CNPJ.";
          } else if (error.message.includes('email')) {
            message = "Já existe um usuário cadastrado com este e-mail.";
          }
        } else if (error.message.includes('permission denied')) {
          title = "Erro de permissão";
          message = "Você não tem permissão para gerenciar academias.";
        } else if (error.message.includes('does not exist')) {
          title = "Erro no banco de dados";
          message = "A tabela de academias não existe. Contate o administrador.";
        }
      }
      
      toast({
        title: title,
        description: message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-lg font-medium mb-4">{isEditing ? 'Editar Academia' : 'Cadastro de Academia'}</h3>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nome do Proprietário */}
              <FormField
                control={form.control}
                name="ownerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Proprietário</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Nome da Academia */}
              <FormField
                control={form.control}
                name="academyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Academia</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da academia" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* CNPJ */}
              <FormField
                control={form.control}
                name="cnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="XX.XXX.XXX/XXXX-XX" 
                        {...field} 
                        value={formatCNPJ(field.value)}
                        maxLength={18}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Telefone */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="(XX)XXXXX-XXXX" 
                        {...field} 
                        value={formatPhone(field.value)}
                        maxLength={14}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="email@exemplo.com" 
                        type="email" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Endereço - Rua */}
              <FormField
                control={form.control}
                name="street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rua</FormLabel>
                    <FormControl>
                      <Input placeholder="Rua e número" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Endereço - Bairro */}
              <FormField
                control={form.control}
                name="neighborhood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bairro</FormLabel>
                    <FormControl>
                      <Input placeholder="Bairro" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Endereço - CEP */}
              <FormField
                control={form.control}
                name="zipCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="XXXXX-XXX" 
                        {...field} 
                        value={formatZipCode(field.value)}
                        maxLength={9}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Os campos de usuário e senha só aparecem em cadastro, não em edição */}
              {!isEditing && (
                <>
                  {/* Usuário */}
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Usuário</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome de usuário" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Senha */}
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Senha" 
                            type="password" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <>
                  <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-current rounded-full"></span>
                  {isEditing ? 'Atualizando...' : 'Cadastrando...'}
                </>
              ) : (
                isEditing ? 'Atualizar Academia' : 'Cadastrar Academia'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default AcademyForm; 