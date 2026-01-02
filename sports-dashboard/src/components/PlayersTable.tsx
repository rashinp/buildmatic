import React from 'react';

interface Agent {
  id: number;
  codename: string;
  squad: string;
  rank: string;
  level: number;
  efficiency: string;
  status: string;
}

interface PlayersTableProps {
  expanded?: boolean;
}

const PlayersTable: React.FC<PlayersTableProps> = ({ expanded = false }) => {
  const agents: Agent[] = [
    { id: 1, codename: 'NEXUS-001', squad: 'ALPHA', rank: 'STRIKER', level: 24, efficiency: '89%', status: 'Active' },
    { id: 2, codename: 'PHANTOM-X7', squad: 'BETA', rank: 'SUPPORT', level: 26, efficiency: '92%', status: 'Active' },
    { id: 3, codename: 'CIPHER-09', squad: 'GAMMA', rank: 'SHIELD', level: 23, efficiency: '87%', status: 'Active' },
    { id: 4, codename: 'GUARDIAN-5', squad: 'ALPHA', rank: 'CORE', level: 28, efficiency: '94%', status: 'Active' },
    { id: 5, codename: 'VORTEX-12', squad: 'BETA', rank: 'STRIKER', level: 22, efficiency: '85%', status: 'Injured' },
    { id: 6, codename: 'STORM-44', squad: 'GAMMA', rank: 'SUPPORT', level: 25, efficiency: '91%', status: 'Active' },
  ];

  const displayAgents = expanded ? agents : agents.slice(0, 4);

  return (
    <div className="players-table-container">
      <div className="table-header">
        <h3>Active Agents</h3>
        {!expanded && <button className="view-all-btn">Full Roster</button>}
      </div>
      <div className="table-wrapper">
        <table className="players-table">
          <thead>
            <tr>
              <th>CODENAME</th>
              <th>SQUAD</th>
              <th>RANK</th>
              <th>LVL</th>
              <th>EFFICIENCY</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {displayAgents.map((agent, index) => (
              <tr key={agent.id} style={{ animationDelay: `${index * 0.1}s` }}>
                <td style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--electric-cyan)' }}>
                  {agent.codename}
                </td>
                <td>{agent.squad}</td>
                <td>{agent.rank}</td>
                <td>{agent.level}</td>
                <td style={{ color: 'var(--victory-green)', fontWeight: 700 }}>{agent.efficiency}</td>
                <td>
                  <span className={`status-badge ${agent.status.toLowerCase()}`}>
                    {agent.status.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PlayersTable;