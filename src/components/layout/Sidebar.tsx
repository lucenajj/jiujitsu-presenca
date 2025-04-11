import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Calendar, 
  ClipboardCheck, 
  BarChart3,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onMenuItemClick?: () => void;
  isAdmin?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onMenuItemClick, isAdmin = false }) => {
  // Debug para entender por que continua aparecendo mesmo para não-admin
  useEffect(() => {
    console.log('Sidebar - isAdmin recebido:', isAdmin);
    
    // Tentar identificar possíveis fatores que possam estar causando o problema
    if (isAdmin) {
      console.log('AVISO: Menu de configurações será mostrado');
    } else {
      console.log('INFO: Menu de configurações NÃO será mostrado');
    }
  }, [isAdmin]);

  // Itens de menu que todos os usuários podem ver
  const baseMenuItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Calendar, label: 'Aulas', path: '/classes' },
    { icon: Users, label: 'Alunos', path: '/students' },
    { icon: ClipboardCheck, label: 'Presenças', path: '/attendance' },
    { icon: BarChart3, label: 'Relatórios', path: '/reports' },
  ];
  
  // Verificação estrita: só adiciona o item de configurações se isAdmin for exatamente true
  // (não apenas truthy, mas exatamente igual a true)
  const menuItems = isAdmin === true 
    ? [...baseMenuItems, { icon: Settings, label: 'Configurações', path: '/settings' }]
    : baseMenuItems;

  return (
    <div className={cn(
      "fixed left-0 top-0 h-full bg-jiujitsu-500 text-white w-64 pt-20 shadow-lg transition-transform duration-300 ease-in-out transform z-10",
      isOpen ? "translate-x-0" : "-translate-x-full",
      "md:translate-x-0", // Always show on medium screens and up
    )}>
      <div className="flex flex-col h-full">
        <div className="flex-grow">
          <ul className="py-4">
            {menuItems.map((item, index) => (
              <li key={index} className="px-4 py-2">
                <NavLink 
                  to={item.path}
                  className={({ isActive }) => cn(
                    "flex items-center py-2 px-4 rounded-md hover:bg-jiujitsu-600 transition-colors",
                    isActive ? "bg-jiujitsu-400 font-medium" : ""
                  )}
                  onClick={() => {
                    if (window.innerWidth < 768 && onMenuItemClick) {
                      onMenuItemClick();
                    }
                  }}
                >
                  <item.icon size={20} className="mr-3" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
        <div className="px-4 py-4 text-center text-xs text-jiujitsu-200">
          <p>JiuJitsu Presença v1.0</p>
          <p>© 2023 Sua Academia</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
