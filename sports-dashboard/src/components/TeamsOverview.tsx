import React from 'react';
import { Cpu, Users, Zap } from 'lucide-react';

interface Squad {
  id: number;
  designation: string;
  operatives: number;
  victories: number;
  defeats: number;
  powerLevel: number;
  status: string;
  specialization: string;
}

interface TeamsOverviewProps {
  expanded?: boolean;
}

const TeamsOverview: React.FC<TeamsOverviewProps> = ({ expanded = false }) => {
  const squads: Squad[] = [
    { id: 1, designation: 'ALPHA NEXUS', operatives: 22, victories: 15, defeats: 7, powerLevel: 4.2, status: 'Active', specialization: 'ASSAULT' },
    { id: 2, designation: 'BETA STORM', operatives: 20, victories: 18, defeats: 4, powerLevel: 4.7, status: 'Active', specialization: 'STEALTH' },
    { id: 3, designation: 'GAMMA VOID', operatives: 24, victories: 12, defeats: 10, powerLevel: 3.8, status: 'Active', specialization: 'DEFENSE' },
    { id: 4, designation: 'DELTA CORE', operatives: 19, victories: 8, defeats: 14, powerLevel: 3.2, status: 'Inactive', specialization: 'SUPPORT' },
    { id: 5, designation: 'EPSILON FLUX', operatives: 21, victories: 14, defeats: 8, powerLevel: 4.0, status: 'Active', specialization: 'HYBRID' },
  ];

  const displaySquads = expanded ? squads : squads.slice(0, 3);

  const getPowerLevelColor = (level: number) => {
    if (level >= 4.5) return 'var(--victory-green)';
    if (level >= 4.0) return 'var(--electric-cyan)';
    if (level >= 3.5) return 'var(--nuclear-orange)';
    return 'var(--warning-red)';
  };

  return (
    <div className="teams-overview">
      <div className="section-header">
        <h3>Squad Command</h3>
        {!expanded && <button className="view-all-btn">Full Intel</button>}
      </div>
      <div className="teams-grid">
        {displaySquads.map((squad, index) => (
          <div key={squad.id} className="team-card" style={{ animationDelay: `${index * 0.15}s` }}>
            <div className="team-header">
              <Cpu size={24} color="var(--electric-cyan)" />
              <h4>{squad.designation}</h4>
              <span className={`team-status ${squad.status.toLowerCase()}`}>
                {squad.status.toUpperCase()}
              </span>
            </div>
            <div className="team-stats">
              <div className="stat-row">
                <Users size={18} color="var(--plasma-purple)" />
                <span>{squad.operatives} OPERATIVES</span>
              </div>
              <div className="stat-row">
                <span style={{ color: 'var(--victory-green)', fontWeight: 700 }}>
                  V: {squad.victories}
                </span>
                <span style={{ color: 'var(--warning-red)', fontWeight: 700 }}>
                  D: {squad.defeats}
                </span>
              </div>
              <div className="stat-row">
                <Zap size={18} color={getPowerLevelColor(squad.powerLevel)} />
                <span style={{ color: getPowerLevelColor(squad.powerLevel), fontWeight: 700 }}>
                  PWR: {squad.powerLevel}/5.0
                </span>
              </div>
              <div className="stat-row">
                <span style={{ 
                  color: 'var(--nuclear-orange)', 
                  fontFamily: 'var(--font-display)', 
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '1px'
                }}>
                  SPEC: {squad.specialization}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamsOverview;