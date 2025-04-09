
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-jiujitsu-50 to-jiujitsu-100 p-4">
      <div className="text-center">
        <div className="h-24 w-24 mx-auto bg-jiujitsu-500 rounded-full flex items-center justify-center mb-6">
          <span className="text-white text-5xl font-bold">404</span>
        </div>
        
        <h1 className="text-4xl font-bold text-jiujitsu-700 mb-4">Página não encontrada</h1>
        
        <p className="text-jiujitsu-600 mb-8 max-w-md mx-auto">
          Ops! Parece que você tentou executar um golpe que não existe em nosso sistema.
        </p>
        
        <Link to="/dashboard">
          <Button className="bg-jiujitsu-500 hover:bg-jiujitsu-600">
            Voltar ao início
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
