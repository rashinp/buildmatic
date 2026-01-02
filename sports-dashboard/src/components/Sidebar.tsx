import React from 'react';
import { Target, Users, Cpu, Zap, Activity, Shield } from 'lucide-react';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Command', icon: Target },
    { id: 'players', label: 'Assets', icon: Users },
    { id: 'teams', label: 'Squads', icon: Cpu },
    { id: 'matches', label: 'Ops', icon: Zap },
    { id: 'analytics', label: 'Intel', icon: Activity },
    { id: 'settings', label: 'Config', icon: Shield },
  ];

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <button
              key={item.id}
              className={`nav-item ${activeView === item.id ? 'active' : ''}`}
              onClick={() => setActiveView(item.id)}
            >
              <IconComponent size={22} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;