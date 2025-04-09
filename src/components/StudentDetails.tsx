import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Edit, User } from 'lucide-react';
import StudentForm from './StudentForm';
import { Student } from '@/lib/mockData';
import { getBeltProgressPercentage, getClassesRequiredForNextBelt, getNextBelt } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { calculateBeltProgress } from '@/lib/utils';

interface StudentDetailsProps {
  student: Student | null;
  open: boolean;
  onClose: () => void;
  onEdit: (student: Student) => void;
}

const StudentDetails: React.FC<StudentDetailsProps> = ({ student, open, onClose, onEdit }) => {
  const [editMode, setEditMode] = useState(false);
  
  if (!student) return null;
  
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
  
  // Função para traduzir o nome da faixa
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
  
  // Função para criar o indicador visual de graus na faixa
  const renderStripes = (stripes: number) => {
    return (
      <div className="flex space-x-1">
        {[...Array(4)].map((_, index) => (
          <div 
            key={index} 
            className={`h-2 w-2 rounded-full ${index < stripes ? 'bg-white' : 'bg-gray-300 bg-opacity-30'}`}
          />
        ))}
      </div>
    );
  };
  
  // Função para obter o nome da próxima faixa
  const getNextBeltName = (belt: string) => {
    const nextBelt = getNextBelt(belt);
    return nextBelt ? getBeltName(nextBelt) : null;
  };
  
  if (editMode) {
    return (
      <StudentForm 
        open={open} 
        onClose={() => {
          setEditMode(false);
          onClose();
        }}
        student={student}
        onSuccess={() => {
          setEditMode(false);
          onClose();
        }}
      />
    );
  }
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) onClose();
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Detalhes do Aluno
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">{student.name}</h2>
            <span className={`px-2 py-1 text-xs rounded-full ${student.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {student.status === 'active' ? 'Ativo' : 'Inativo'}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-full ${getBeltColor(student.belt)} flex items-center justify-center`}>
              {renderStripes(student.stripes)}
            </div>
            <div>
              <span className="font-medium capitalize">
                {getBeltName(student.belt)}
              </span>
              {student.stripes > 0 && (
                <span className="ml-1 text-gray-500">
                  ({student.stripes} {student.stripes === 1 ? 'grau' : 'graus'})
                </span>
              )}
            </div>
          </div>
          
          {/* Seção de Progresso */}
          {student.status === 'active' && student.belt !== 'black' && (
            <div className="mt-4">
              {(() => {
                const progress = calculateBeltProgress(
                  student.belt, 
                  student.classes_attended || 0, 
                  student.last_promotion_date,
                  student.registrationDate
                );
                const requiredClasses = getClassesRequiredForNextBelt(student.belt) || 0;
                
                return (
                  <>
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-sm font-medium">Progresso para {getNextBeltName(student.belt)}</p>
                      <p className="text-sm text-gray-500">
                        {student.classes_attended || 0} / {requiredClasses} aulas
                      </p>
                    </div>
                    <Progress 
                      value={progress.percent} 
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Aulas por semana: {student.classes_per_week || 3}</span>
                      <span>
                        {progress.percent}% completo
                      </span>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <p className="text-sm text-gray-500">Data de Matrícula</p>
              <p>{new Date(student.registrationDate).toLocaleDateString('pt-BR')}</p>
            </div>
            
            {student.last_promotion_date && (
              <div>
                <p className="text-sm text-gray-500">Última Promoção</p>
                <p>{new Date(student.last_promotion_date).toLocaleDateString('pt-BR')}</p>
              </div>
            )}
            
            {student.email && (
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="truncate">{student.email}</p>
              </div>
            )}
            
            {student.phone && (
              <div>
                <p className="text-sm text-gray-500">Telefone</p>
                <p>{student.phone}</p>
              </div>
            )}
            
            <div>
              <p className="text-sm text-gray-500">Aulas Assistidas</p>
              <p>{student.classes_attended || 0}</p>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
          >
            Fechar
          </Button>
          <Button 
            className="bg-jiujitsu-500 hover:bg-jiujitsu-600"
            onClick={() => setEditMode(true)}
          >
            <Edit className="h-4 w-4 mr-2" /> Editar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StudentDetails;