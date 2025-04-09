import React from 'react';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/hooks/useAuth';
import { LogOut, Menu, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="bg-jiujitsu-500 text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          {isAuthenticated && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleSidebar}
              className="mr-2 text-white hover:bg-jiujitsu-600"
            >
              <Menu size={24} />
            </Button>
          )}
          <Link to="/" className="flex items-center">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center">
                <span className="text-jiujitsu-500 font-bold text-xl">JJ</span>
              </div>
              <span className="ml-2 text-xl font-bold">JiuJitsu Presença</span>
            </div>
          </Link>
        </div>
        {isAuthenticated && (
          <div className="flex items-center gap-2">
            <span className="hidden md:inline text-sm text-white/90">Olá, {user?.name || 'Usuário'}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-jiujitsu-600 rounded-full">
                  <User size={18} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="px-2 pt-1 pb-2">
                  <p className="text-sm font-medium">{user?.name || 'Usuário'}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive focus:bg-destructive/10">
                  <LogOut size={16} className="mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
      <div className="flex">
        <div className="belt-stripe bg-white"></div>
        <div className="belt-stripe bg-blue-500"></div>
      </div>
    </header>
  );
};

export default Header;
