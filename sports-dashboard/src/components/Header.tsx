import React, { useState, useEffect } from 'react';
import { Search, Bell, User, Zap, Shield } from 'lucide-react';

const Header: React.FC = () => {
  const [notifications, setNotifications] = useState(3);

  // Create floating data particles effect
  useEffect(() => {
    const createParticle = () => {
      const particle = document.createElement('div');
      particle.className = 'data-particle';
      particle.style.top = Math.random() * 100 + 'vh';
      particle.style.left = '-10px';
      particle.style.animationDelay = Math.random() * 2 + 's';
      document.body.appendChild(particle);

      setTimeout(() => {
        if (document.body.contains(particle)) {
          document.body.removeChild(particle);
        }
      }, 3000);
    };

    const interval = setInterval(createParticle, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="header">
      <div className="header-left">
        <h1 className="glitch">NEXUS COMMAND</h1>
      </div>
      <div className="header-center">
        <div className="search-bar">
          <Search size={22} />
          <input type="text" placeholder="SCAN: PLAYERS // TEAMS // INTEL" />
        </div>
      </div>
      <div className="header-right">
        <button className="icon-button" style={{ position: 'relative' }}>
          <Zap size={22} />
        </button>
        <button className="icon-button" style={{ position: 'relative' }}>
          <Bell size={22} />
          {notifications > 0 && (
            <span style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              background: 'var(--warning-red)',
              color: 'white',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              fontSize: '0.7rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-display)',
              fontWeight: 700
            }}>
              {notifications}
            </span>
          )}
        </button>
        <button className="icon-button">
          <Shield size={22} />
        </button>
      </div>
    </header>
  );
};

export default Header;