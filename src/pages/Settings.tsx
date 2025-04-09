import React, { useState } from 'react';
import { 
  ChevronRight, 
  School, 
  Settings as SettingsIcon,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import AcademyForm from '@/components/AcademyForm';
import AcademyList from '@/components/AcademyList';
import { cn } from '@/lib/utils';

const Settings: React.FC = () => {
  const [isAcademiesOpen, setIsAcademiesOpen] = useState(false);
  const [isAcademyFormOpen, setIsAcademyFormOpen] = useState(false);
  const [showAcademyList, setShowAcademyList] = useState(false);

  const toggleAcademies = () => {
    setIsAcademiesOpen(!isAcademiesOpen);
    // Se fechar a seção de academias, também fecha os sub-componentes
    if (isAcademiesOpen) {
      setIsAcademyFormOpen(false);
      setShowAcademyList(false);
    }
  };

  const toggleAcademyForm = () => {
    setIsAcademyFormOpen(!isAcademyFormOpen);
    // Se abrir o formulário, fecha a lista
    if (!isAcademyFormOpen) {
      setShowAcademyList(false);
    }
  };

  const toggleAcademyList = () => {
    setShowAcademyList(!showAcademyList);
    // Se abrir a lista, fecha o formulário
    if (!showAcademyList) {
      setIsAcademyFormOpen(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <div className="flex items-center mb-6">
        <SettingsIcon className="h-6 w-6 mr-2 text-jiujitsu-500" />
        <h1 className="text-2xl font-bold text-gray-800">Configurações</h1>
      </div>

      <div className="space-y-4">
        {/* Seção de Academias */}
        <Card>
          <CardHeader 
            className={cn(
              "cursor-pointer hover:bg-gray-50 transition-colors",
              isAcademiesOpen && 'border-b'
            )}
            onClick={toggleAcademies}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <School className="h-5 w-5 mr-2 text-jiujitsu-500" />
                <div>
                  <CardTitle>Academias</CardTitle>
                  <CardDescription>Gerenciar cadastro de academias</CardDescription>
                </div>
              </div>
              <ChevronRight 
                className={cn(
                  "h-5 w-5 transition-transform",
                  isAcademiesOpen && 'rotate-90'
                )} 
              />
            </div>
          </CardHeader>
          
          {isAcademiesOpen && (
            <CardContent className="pt-4">
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:space-x-2 space-y-2 md:space-y-0">
                  <Button 
                    variant="outline" 
                    className="justify-start text-left"
                    onClick={toggleAcademyList}
                  >
                    <School className="h-4 w-4 mr-2" />
                    Listar Academias
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="justify-start text-left"
                    onClick={toggleAcademyForm}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Cadastrar Nova Academia
                  </Button>
                </div>
                
                {/* Lista de academias */}
                <div className={cn("mt-4", !showAcademyList && 'hidden')}>
                  <AcademyList />
                </div>
                
                {/* Formulário de cadastro que é mostrado/ocultado de acordo com o estado */}
                <div className={cn("mt-4 border rounded-md p-4 bg-gray-50", 
                  !isAcademyFormOpen && 'hidden')}>
                  <AcademyForm />
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Outras seções de configurações podem ser adicionadas aqui */}
      </div>
    </div>
  );
};

export default Settings; 