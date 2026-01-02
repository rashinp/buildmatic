import React, { useState, useEffect } from 'react';
import { Users, Cpu, Zap, TrendingUp } from 'lucide-react';

const StatsCards: React.FC = () => {
  const [animationKey, setAnimationKey] = useState(0);

  const stats = [
    {
      title: 'Active Agents',
      value: '1,247',
      change: '+12% SURGE',
      icon: Users,
      color: 'var(--electric-cyan)',
      bgGradient: 'var(--cyber-gradient)'
    },
    {
      title: 'Squad Units',
      value: '24',
      change: '+3 ONLINE',
      icon: Cpu,
      color: 'var(--plasma-purple)',
      bgGradient: 'var(--plasma-gradient)'
    },
    {
      title: 'Combat Ops',
      value: '48',
      change: '+8% FLUX',
      icon: Zap,
      color: 'var(--nuclear-orange)',
      bgGradient: 'linear-gradient(135deg, var(--nuclear-orange), var(--neon-yellow))'
    },
    {
      title: 'Victory Index',
      value: '87.5%',
      change: '+5.2% GAIN',
      icon: TrendingUp,
      color: 'var(--warning-red)',
      bgGradient: 'linear-gradient(135deg, var(--warning-red), var(--nuclear-orange))'
    }
  ];

  // Counter animation effect
  useEffect(() => {
    const timer = setTimeout(() => setAnimationKey(key => key + 1), 100);
    return () => clearTimeout(timer);
  }, []);

  const CounterDisplay = ({ value }: { value: string }) => {
    const [displayValue, setDisplayValue] = useState('0');

    useEffect(() => {
      const numericValue = parseFloat(value.replace(/[^\d.]/g, ''));
      const suffix = value.replace(/[\d.,]/g, '');
      
      let current = 0;
      const increment = numericValue / 30;
      const timer = setInterval(() => {
        current += increment;
        if (current >= numericValue) {
          setDisplayValue(value);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.floor(current).toLocaleString() + suffix);
        }
      }, 50);

      return () => clearInterval(timer);
    }, [value]);

    return <>{displayValue}</>;
  };

  return (
    <div className="stats-cards">
      {stats.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <div key={index} className="stat-card" style={{ animationDelay: `${index * 0.1}s` }}>
            <div 
              className="stat-icon" 
              style={{ 
                background: stat.bgGradient,
                boxShadow: `0 0 20px ${stat.color}`
              }}
            >
              <IconComponent size={28} color="var(--obsidian)" />
            </div>
            <div className="stat-content">
              <h3>{stat.title}</h3>
              <div className="stat-value">
                <CounterDisplay value={stat.value} />
              </div>
              <div className="stat-change glitch">{stat.change}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsCards;