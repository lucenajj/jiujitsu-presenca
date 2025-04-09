import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Edit, Trash2, School } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import AcademyForm from './AcademyForm';

// Tipo para academia
interface Academy {
  id: string;
  name: string;
  owner_name: string;
  cnpj: string;
  email: string;
  phone: string;
  street: string;
  neighborhood: string;
  zip_code: string;
}

interface AcademyListProps {
  onEdit?: (academy: Academy) => void;
}

const AcademyList: React.FC<AcademyListProps> = ({ onEdit }) => {
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [filteredAcademies, setFilteredAcademies] = useState<Academy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [academyToDelete, setAcademyToDelete] = useState<Academy | null>(null);
  const [academyToEdit, setAcademyToEdit] = useState<Academy | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAcademies();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredAcademies(academies);
    } else {
      const filtered = academies.filter(
        academy => 
          academy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          academy.owner_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          academy.cnpj.includes(searchQuery)
      );
      setFilteredAcademies(filtered);
    }
  }, [searchQuery, academies]);

  const fetchAcademies = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('academies')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      setAcademies(data);
      setFilteredAcademies(data);
    } catch (error) {
      console.error('Erro ao buscar academias:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar academias',
        description: 'Não foi possível buscar a lista de academias.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAcademy = async () => {
    if (!academyToDelete) return;
    
    try {
      const { error } = await supabase
        .from('academies')
        .delete()
        .eq('id', academyToDelete.id);

      if (error) throw error;

      // Atualiza a lista após excluir
      setAcademies(academies.filter(a => a.id !== academyToDelete.id));
      toast({
        title: 'Academia excluída',
        description: `A academia ${academyToDelete.name} foi excluída com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao excluir academia:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir academia',
        description: 'Não foi possível excluir a academia. Tente novamente.',
      });
    } finally {
      setAcademyToDelete(null);
    }
  };

  const handleEditClick = (academy: Academy) => {
    if (onEdit) {
      onEdit(academy);
    } else {
      setAcademyToEdit(academy);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold">Academias Cadastradas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Buscar academia..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button 
            onClick={() => fetchAcademies()} 
            variant="outline" 
            className="ml-2"
            disabled={isLoading}
          >
            Atualizar
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-jiujitsu-500"></div>
          </div>
        ) : filteredAcademies.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <School className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p className="text-lg font-medium">Nenhuma academia encontrada</p>
            <p className="text-sm">
              {searchQuery ? 'Tente uma busca diferente' : 'Cadastre sua primeira academia'}
            </p>
          </div>
        ) : (
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome da Academia</TableHead>
                  <TableHead>Proprietário</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAcademies.map((academy) => (
                  <TableRow key={academy.id}>
                    <TableCell className="font-medium">{academy.name}</TableCell>
                    <TableCell>{academy.owner_name}</TableCell>
                    <TableCell>{academy.cnpj}</TableCell>
                    <TableCell>
                      <div>{academy.email}</div>
                      <div className="text-sm text-gray-500">{academy.phone}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          title="Editar academia"
                          onClick={() => handleEditClick(academy)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          title="Excluir academia"
                          onClick={() => setAcademyToDelete(academy)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Dialog de confirmação para exclusão */}
        <AlertDialog 
          open={academyToDelete !== null} 
          onOpenChange={(open) => !open && setAcademyToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso excluirá permanentemente a academia{' '}
                <span className="font-semibold">{academyToDelete?.name}</span> e todos os 
                seus dados associados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteAcademy}
                className="bg-red-500 hover:bg-red-600"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Formulário de edição como modal incorporado */}
        {academyToEdit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-3xl p-4 max-h-[90vh] overflow-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Editar Academia</h2>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setAcademyToEdit(null)}
                >
                  <span className="text-2xl">&times;</span>
                </Button>
              </div>
              <AcademyForm 
                initialData={{
                  ownerName: academyToEdit.owner_name,
                  academyName: academyToEdit.name,
                  cnpj: academyToEdit.cnpj,
                  street: academyToEdit.street,
                  neighborhood: academyToEdit.neighborhood,
                  zipCode: academyToEdit.zip_code,
                  phone: academyToEdit.phone,
                  email: academyToEdit.email,
                }} 
                academyId={academyToEdit.id}
                onSuccess={() => {
                  setAcademyToEdit(null);
                  fetchAcademies();
                }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AcademyList; 