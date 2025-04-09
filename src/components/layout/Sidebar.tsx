import React from 'react';
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
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onMenuItemClick }) => {
  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Calendar, label: 'Aulas', path: '/classes' },
    { icon: Users, label: 'Alunos', path: '/students' },
    { icon: ClipboardCheck, label: 'Presenças', path: '/attendance' },
    { icon: BarChart3, label: 'Relatórios', path: '/reports' },
    { icon: Settings, label: 'Configurações', path: '/settings' },
  ];

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
